"""
Venture Forest: Harmonic Enrichment

Enriches the current forest snapshot with fresh data from the Harmonic API
(https://api.harmonic.ai). For each company in the snapshot:

1. Look up by website domain (every snapshot company has a website). The
   returned record must also pass a name-similarity check, because a domain
   can be owned by a different company than the one in the snapshot.
2. If the domain route fails, fall back to keyword search by name and accept
   only a near-exact name match.
3. Only high-confidence matches overwrite snapshot fields. Everything else
   is written to data/enrichment-unmatched.json for manual review.

For matched companies the script updates: total funding, last round type,
amount, and date, headcount (plus derived display and bucket), website,
one-line description, and the investor list. Field conflicts are resolved
in Harmonic's favor and logged to data/enrichment-conflicts.json.

Because tree height encodes funding, the script recomputes tree_height,
trunk_radius, and visual_importance_score in placements using the same
formulas as packages/layout-engine/src/radial-placement.ts, so the visual
encoding stays honest after enrichment. Positions are not moved.

Plan limitations (verified against the live API):
- No per-round data (funding_rounds comes back empty), so the snapshot's
  funding_rounds list is left untouched.
- No investor detail endpoint, so investor type is classified heuristically
  from the investor name.

Usage:
    python scripts/enrich_from_harmonic.py

Requires HARMONIC_API_KEY in .env at the repo root. Stdlib only.
"""

import json
import math
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from difflib import SequenceMatcher

# python.org macOS builds ship without a wired-up CA bundle; prefer certifi,
# fall back to the system LibreSSL bundle
def make_ssl_context():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        if os.path.exists("/etc/ssl/cert.pem"):
            return ssl.create_default_context(cafile="/etc/ssl/cert.pem")
        return ssl.create_default_context()


SSL_CONTEXT = make_ssl_context()

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
SNAPSHOT_PATH = os.path.join(ROOT, "apps", "web", "public", "data", "demo-snapshot.json")
SNAPSHOTS_DIR = os.path.join(ROOT, "data", "snapshots")
UNMATCHED_PATH = os.path.join(ROOT, "data", "enrichment-unmatched.json")
CONFLICTS_PATH = os.path.join(ROOT, "data", "enrichment-conflicts.json")

API_BASE = "https://api.harmonic.ai"
REQUEST_DELAY_S = 0.3
MAX_SEARCH_CANDIDATES = 10
MAX_INVESTORS_PER_COMPANY = 12

# Confidence thresholds. Domain ownership is a strong signal but not proof
# (someone else can own a fictional company's domain), so the name must
# agree as well. The search route has no domain signal, so it demands a
# near-exact name.
DOMAIN_ROUTE_NAME_SIM = 0.85
SEARCH_ROUTE_NAME_SIM = 0.92

ROUND_TYPE_MAP = {
    "PRE_SEED": "pre_seed",
    "SEED": "seed",
    "SERIES_A": "series_a",
    "SERIES_B": "series_b",
    "SERIES_C": "series_c",
    "SERIES_D": "series_d",
    "SERIES_E": "series_e",
    "SERIES_F": "series_f",
    "SERIES_G": "series_g",
    "SERIES_H": "series_h",
    "ANGEL": "pre_seed",
    "GRANT": "grant",
    "DEBT_FINANCING": "debt",
    "DEBT": "debt",
    "CONVERTIBLE_NOTE": "debt",
    "PRIVATE_EQUITY": "growth",
    "GROWTH": "growth",
    "CORPORATE_ROUND": "growth",
    "IPO": "ipo",
}

HEADCOUNT_BUCKETS = [
    (1, 10, "1-10"),
    (11, 50, "11-50"),
    (51, 200, "51-200"),
    (201, 500, "201-500"),
    (501, 1000, "501-1000"),
    (1001, 5000, "1001-5000"),
    (5001, None, "5001+"),
]


def load_api_key():
    env_path = os.path.join(ROOT, ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("HARMONIC_API_KEY="):
                    return line.split("=", 1)[1].strip()
    return os.environ.get("HARMONIC_API_KEY")


API_KEY = load_api_key()


def api_request(method, path, query=None, body=None):
    url = f"{API_BASE}{path}"
    if query:
        url += "?" + urllib.parse.urlencode(query)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", API_KEY)
    req.add_header("accept", "application/json")
    if data is not None:
        req.add_header("content-type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code in (404, 422):
            return None
        if e.code == 429:
            time.sleep(5)
            return api_request(method, path, query, body)
        raise


def normalize_name(name):
    n = name.lower()
    n = re.sub(r"\b(inc|llc|ltd|corp|co|labs|hq|technologies|technology)\b", "", n)
    n = re.sub(r"[^a-z0-9]+", "", n)
    return n


def name_similarity(a, b):
    na, nb = normalize_name(a), normalize_name(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    return SequenceMatcher(None, na, nb).ratio()


def best_name_similarity(snapshot_name, harmonic_record):
    candidates = [harmonic_record.get("name") or ""]
    candidates += harmonic_record.get("name_aliases") or []
    legal = harmonic_record.get("legal_name")
    if legal:
        candidates.append(legal)
    return max(name_similarity(snapshot_name, c) for c in candidates if c) if any(candidates) else 0.0


def extract_domain(url):
    if not url:
        return None
    netloc = urllib.parse.urlparse(url if "//" in url else f"https://{url}").netloc
    return netloc.removeprefix("www.").lower() or None


def domains_match(snapshot_domain, harmonic_record):
    if not snapshot_domain:
        return False
    website = harmonic_record.get("website") or {}
    h_domain = (website.get("domain") or "").removeprefix("www.").lower()
    aliases = [a.removeprefix("www.").lower() for a in (harmonic_record.get("website_domain_aliases") or [])]
    return snapshot_domain == h_domain or snapshot_domain in aliases


def find_match(company):
    """Returns (harmonic_record, confidence_detail) or (None, reason)."""
    snapshot_domain = extract_domain(company.get("website"))
    demotion = None

    # Route 1: enrich by website domain. Domain ownership plus an agreeing
    # name is the strongest identity signal available.
    if snapshot_domain:
        record = api_request("POST", "/companies", query={"website_url": snapshot_domain})
        time.sleep(REQUEST_DELAY_S)
        if record and isinstance(record, dict) and record.get("name"):
            sim = best_name_similarity(company["name"], record)
            if domains_match(snapshot_domain, record) and sim >= DOMAIN_ROUTE_NAME_SIM:
                return record, f"domain match + name similarity {sim:.2f}"
            if domains_match(snapshot_domain, record):
                # The domain belongs to someone else (or a parked page);
                # remember why, but still try the search route
                demotion = (
                    f"domain {snapshot_domain} resolves to '{record.get('name')}' "
                    f"(name similarity {sim:.2f} below {DOMAIN_ROUTE_NAME_SIM})"
                )

    # Route 2: keyword search by name. A bare name match is NOT identity:
    # unrelated companies share names. Require a near-exact name AND no
    # domain disagreement (if both sides have a domain, they must match).
    found = api_request("POST", "/search/companies_by_keywords", body={"keywords": company["name"]})
    time.sleep(REQUEST_DELAY_S)
    urns = (found or {}).get("results") or []
    if urns:
        batch = api_request("POST", "/companies/batchGet", body={"urns": urns[:MAX_SEARCH_CANDIDATES]})
        time.sleep(REQUEST_DELAY_S)
        best, best_sim = None, 0.0
        for record in batch or []:
            if not record or not record.get("name"):
                continue
            sim = best_name_similarity(company["name"], record)
            if sim > best_sim:
                best, best_sim = record, sim
        if best and best_sim >= SEARCH_ROUTE_NAME_SIM:
            candidate_domain = ((best.get("website") or {}).get("domain") or "").removeprefix("www.").lower()
            if snapshot_domain and candidate_domain and not domains_match(snapshot_domain, best):
                return None, (
                    f"name collision: '{best.get('name')}' matches by name "
                    f"({best_sim:.2f}) but its domain {candidate_domain} differs from {snapshot_domain}"
                )
            return best, f"search route, name similarity {best_sim:.2f}"
        if best:
            return None, demotion or (
                f"best search candidate '{best.get('name')}' similarity {best_sim:.2f} below {SEARCH_ROUTE_NAME_SIM}"
            )

    return None, demotion or "no candidates from domain or search routes"


def headcount_fields(headcount):
    if not headcount or headcount <= 0:
        return {}
    for lo, hi, label in HEADCOUNT_BUCKETS:
        if hi is None or headcount <= hi:
            if headcount >= lo or hi is None:
                # min/max carry the exact known value (Harmonic reports a
                # point estimate); the bucket label keeps range semantics
                # for filters. Trunk thickness reads min/max, so storing
                # bucket bounds here would quantize every trunk to seven
                # widths.
                return {
                    "headcount_min": headcount,
                    "headcount_max": headcount,
                    "headcount_display": f"~{headcount:,}",
                    "headcount_bucket": label,
                }
    return {}


def classify_investor(name):
    n = name.lower()
    if any(k in n for k in ("angel", "individual")):
        return "angel"
    if any(k in n for k in ("accelerator", "y combinator", "techstars", "500 global", "500 startups")):
        return "accelerator"
    if any(k in n for k in ("google", "microsoft", "nvidia", "salesforce", "intel", "samsung", "amazon", "qualcomm", "corporate", "cisco", "sap ", "oracle")):
        return "corporate"
    if any(k in n for k in ("government", "in-q-tel", "national", "ministry", "agency")):
        return "government"
    return "vc"


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def map_round_type(harmonic_type):
    if not harmonic_type:
        return None
    return ROUND_TYPE_MAP.get(harmonic_type, "unknown")


# Visual encoding, mirrored from packages/layout-engine/src/radial-placement.ts.
# Height = funding on a CUBE-ROOT scale: a log curve compressed 69% of the
# dataset (the $100M-$5B band) into a 3-unit height band; cube root spreads
# it across 3-14 with emergent giants above. Trunk = headcount (sqrt scale),
# matching the legend. Applied to EVERY company so the forest sits on one
# consistent scale.
def tree_height_for_funding(funding):
    if not funding or funding <= 0:
        return 1.2
    return max(1.2, min(38, 0.0066 * funding ** (1 / 3)))


def headcount_mid(company):
    lo, hi = company.get("headcount_min"), company.get("headcount_max")
    if lo is not None and hi is not None:
        return (lo + hi) / 2
    return lo if lo is not None else hi


def trunk_radius_for_headcount(company, sector_medians, global_median):
    mid = headcount_mid(company)
    if mid is None:
        mid = sector_medians.get(company.get("sector")) or global_median or 200
    return max(0.12, min(1.7, 0.013 * math.sqrt(mid)))


def headcount_medians(companies):
    by_sector = {}
    all_mids = []
    for c in companies:
        mid = headcount_mid(c)
        if mid is not None:
            by_sector.setdefault(c.get("sector"), []).append(mid)
            all_mids.append(mid)

    def median(values):
        if not values:
            return None
        s = sorted(values)
        return s[len(s) // 2]

    return {k: median(v) for k, v in by_sector.items()}, median(all_mids)


def visual_importance(funding):
    return min(1.0, math.log10(funding) / 11.3) if funding and funding > 0 else 0.1


def one_line(text, limit=180):
    if not text:
        return None
    line = " ".join(text.split())
    return line if len(line) <= limit else line[: limit - 1].rsplit(" ", 1)[0] + "…"


def main():
    if not API_KEY:
        print("HARMONIC_API_KEY not found in .env or environment.", file=sys.stderr)
        sys.exit(1)

    with open(SNAPSHOT_PATH) as f:
        snapshot = json.load(f)

    companies = snapshot["companies"]
    investors_by_slug = {inv["slug"]: inv for inv in snapshot["investors"]}
    placements_by_company = {p["company_id"]: p for p in snapshot["placements"]}
    edges = snapshot["edges"]

    matched, enriched, unmatched, conflicts = [], [], [], []
    next_inv_id = 1

    def get_or_create_investor(name):
        nonlocal next_inv_id
        slug = slugify(name)
        if slug in investors_by_slug:
            return investors_by_slug[slug]
        while f"i-h{next_inv_id:03d}" in {i["id"] for i in snapshot["investors"]}:
            next_inv_id += 1
        inv = {
            "id": f"i-h{next_inv_id:03d}",
            "slug": slug,
            "name": name,
            "type": classify_investor(name),
            "website": None,
            "description": None,
            "location": None,
            "external_source_url": None,
        }
        next_inv_id += 1
        snapshot["investors"].append(inv)
        investors_by_slug[slug] = inv
        return inv

    for i, company in enumerate(companies, 1):
        print(f"[{i}/{len(companies)}] {company['name']} ... ", end="", flush=True)
        try:
            record, detail = find_match(company)
        except Exception as e:
            print(f"ERROR ({e})")
            unmatched.append({"id": company["id"], "name": company["name"], "reason": f"request error: {e}"})
            continue

        if not record:
            print(f"unmatched ({detail})")
            unmatched.append({"id": company["id"], "name": company["name"], "reason": detail})
            continue

        matched.append(company["id"])
        funding = record.get("funding") or {}
        updates = {}

        total = funding.get("funding_total")
        if total and total > 0:
            updates["total_funding_usd"] = int(total)

        last_type = map_round_type(funding.get("last_funding_type"))
        if last_type:
            updates["latest_round_type"] = last_type
        last_at = funding.get("last_funding_at")
        if last_at:
            updates["latest_round_date"] = last_at[:10]
        last_total = funding.get("last_funding_total")
        if last_total and last_total > 0:
            updates["latest_round_amount_usd"] = int(last_total)

        updates.update(headcount_fields(record.get("headcount")))

        website = (record.get("website") or {}).get("url")
        if website:
            updates["website"] = website

        description = one_line(record.get("short_description") or record.get("description"))
        if description:
            updates["description"] = description

        # Apply with conflict logging; Harmonic wins but reviewers can audit
        changed = False
        for field, new_value in updates.items():
            old_value = company.get(field)
            if old_value not in (None, "", [], {}) and old_value != new_value:
                conflicts.append({
                    "company_id": company["id"],
                    "company_name": company["name"],
                    "field": field,
                    "snapshot_value": old_value,
                    "harmonic_value": new_value,
                })
            if old_value != new_value:
                company[field] = new_value
                changed = True

        # Replace investor edges with Harmonic's list (names only on this
        # plan; type is a documented heuristic from the name)
        h_investors = (funding.get("investors") or [])[:MAX_INVESTORS_PER_COMPANY]
        if h_investors:
            edges[:] = [e for e in edges if e["company_id"] != company["id"]]
            for h_inv in h_investors:
                inv = get_or_create_investor(h_inv["name"])
                edges.append({
                    "company_id": company["id"],
                    "investor_id": inv["id"],
                    "edge_strength": 0.6,
                    "role": "participant",
                    "source": "harmonic",
                })
            changed = True

        if changed:
            enriched.append(company["id"])
        print(f"matched ({detail}), {len(updates)} fields, {len(h_investors)} investors")

    # Drop investors that no longer back anyone (replaced fictional funds)
    referenced = {e["investor_id"] for e in edges}
    snapshot["investors"] = [inv for inv in snapshot["investors"] if inv["id"] in referenced]

    # Recompute the visual encoding for every company on one consistent
    # scale (see tree_height_for_funding / trunk_radius_for_headcount)
    sector_medians, global_median = headcount_medians(companies)
    for company in companies:
        placement = placements_by_company.get(company["id"])
        funding = company.get("total_funding_usd")
        if placement:
            placement["tree_height"] = round(tree_height_for_funding(funding), 2)
            placement["trunk_radius"] = round(
                trunk_radius_for_headcount(company, sector_medians, global_median), 3
            )
            placement["visual_importance_score"] = round(visual_importance(funding), 3)

    snapshot["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    out_path = os.path.join(SNAPSHOTS_DIR, f"snapshot-enriched-{stamp}.json")
    with open(out_path, "w") as f:
        json.dump(snapshot, f, indent=2)

    with open(UNMATCHED_PATH, "w") as f:
        json.dump(unmatched, f, indent=2)
    with open(CONFLICTS_PATH, "w") as f:
        json.dump(conflicts, f, indent=2)

    total_n = len(companies)
    print()
    print("=" * 60)
    print(f"Companies processed: {total_n}")
    print(f"Matched:             {len(matched)} ({100 * len(matched) / total_n:.0f}%)")
    print(f"Enriched (changed):  {len(enriched)}")
    print(f"Unmatched:           {len(unmatched)} -> {os.path.relpath(UNMATCHED_PATH, ROOT)}")
    print(f"Field conflicts:     {len(conflicts)} -> {os.path.relpath(CONFLICTS_PATH, ROOT)}")
    print(f"Enriched snapshot:   {os.path.relpath(out_path, ROOT)}")


if __name__ == "__main__":
    main()
