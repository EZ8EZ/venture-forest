"""
Venture Forest: Dataset Builder

Builds the full forest snapshot from the curated seed roster at
data/seeds/top-funded-companies.json. Replaces the previous mixed
fictional/real dataset with an all-real one:

1. Archives the current snapshot (rollback point).
2. Resolves every roster entry through the high-confidence Harmonic matcher
   from enrich_from_harmonic.py (domain ownership + name agreement, search
   fallback with collision rejection). Entries that fail to resolve are
   DROPPED and logged to data/enrichment-unmatched.json, never guessed.
   Raw Harmonic responses are cached under data/raw/harmonic/ so re-runs
   cost zero API calls.
3. Builds companies (sector is authoritative from the seed), rebuilds the
   investor and edge sets from scratch (deduped by slug, capped at 12
   investors per company), and empties funding_rounds (nothing in the app
   reads them and Harmonic provides no per-round data on this plan).
4. Generates groves and placements by invoking scripts/layout_snapshot.ts,
   which runs the tested @venture-forest/layout-engine (seeded,
   deterministic). The engine emits the canonical visual encoding curve.
5. Validates hard invariants and writes the snapshot to the app, the
   fixtures copy, and a timestamped archive.

Survivor continuity: companies already in the snapshot (matched by slug or
domain) keep their ids, founders, and tags.

Usage:
    python scripts/build_forest_dataset.py [--only SECTOR] [--dry-run]

--only SECTOR limits Harmonic fetching to one sector (cache warm-up in
chunks); the final snapshot still requires a full run.
"""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import enrich_from_harmonic as efh  # noqa: E402

ROOT = efh.ROOT
SEEDS_PATH = os.path.join(ROOT, "data", "seeds", "top-funded-companies.json")
SNAPSHOT_PATH = efh.SNAPSHOT_PATH
FIXTURES_PATH = os.path.join(ROOT, "data", "fixtures", "demo-snapshot.json")
SNAPSHOTS_DIR = efh.SNAPSHOTS_DIR
CACHE_DIR = os.path.join(ROOT, "data", "raw", "harmonic")
UNMATCHED_PATH = efh.UNMATCHED_PATH
LAYOUT_SCRIPT = os.path.join(ROOT, "scripts", "layout_snapshot.ts")

CURRENT_YEAR = datetime.now(timezone.utc).year

COUNTRY_CODES = {
    "United States": "US", "United Kingdom": "GB", "Germany": "DE",
    "France": "FR", "Canada": "CA", "Australia": "AU", "India": "IN",
    "Sweden": "SE", "Netherlands": "NL", "Switzerland": "CH",
    "Ireland": "IE", "Estonia": "EE", "Austria": "AT", "Singapore": "SG",
    "Japan": "JP", "Israel": "IL", "Brazil": "BR", "Spain": "ES",
    "Belgium": "BE", "Denmark": "DK", "Norway": "NO", "Finland": "FI",
    "China": "CN", "Hong Kong": "HK", "United Arab Emirates": "AE",
    "Turkey": "TR", "Lithuania": "LT", "Portugal": "PT", "Mexico": "MX",
    "Italy": "IT", "South Korea": "KR", "New Zealand": "NZ",
}

STATUS_MAP = {
    "PRIVATE": "active",
    "PUBLIC": "public",
    "ACQUIRED": "acquired",
    "SUBSIDIARY": "acquired",
    "DEAD": "closed",
    "CLOSED": "closed",
}


# -- Response cache around the Harmonic client -------------------------------
# Wraps efh.api_request so identical requests replay from disk. Only
# successful responses are cached; failures retry on the next run.

_orig_api_request = efh.api_request


def cached_api_request(method, path, query=None, body=None):
    key_src = json.dumps([method, path, query, body], sort_keys=True)
    key = hashlib.sha1(key_src.encode()).hexdigest()[:24]
    cache_file = os.path.join(CACHE_DIR, f"{key}.json")
    if os.path.exists(cache_file):
        with open(cache_file) as f:
            return json.load(f)
    result = _orig_api_request(method, path, query, body)
    if result is not None:
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cache_file, "w") as f:
            json.dump(result, f)
    return result


efh.api_request = cached_api_request
# find_match captured api_request at module scope inside efh, so patching
# the module attribute is enough (Python late-binds module globals)


def completeness(company, has_investors):
    # Essential (weight 2): name, sector, funding. Very useful (weight 1):
    # headcount, founded year, latest round, investors. Mirrors data-model.md.
    total = 2 * 3 + 4
    score = 2 * (1 if company["name"] else 0)
    score += 2 * (1 if company["sector"] else 0)
    score += 2 * (1 if company["total_funding_usd"] else 0)
    score += 1 if company.get("headcount_bucket") else 0
    score += 1 if company.get("founded_year") else 0
    score += 1 if company.get("latest_round_type") else 0
    score += 1 if has_investors else 0
    return round(score / total, 2)


def build_company(seed, record, old_by_slug, old_by_domain):
    funding = record.get("funding") or {}
    location = record.get("location") or {}
    founding = record.get("founding_date") or {}

    slug = efh.slugify(seed["name"])
    old = old_by_slug.get(slug) or old_by_domain.get(efh.extract_domain(seed["website"]))

    founded_year = None
    if founding.get("date"):
        try:
            founded_year = int(founding["date"][:4])
        except ValueError:
            pass

    raw_country = location.get("country")
    company = {
        "id": old["id"] if old else None,  # assigned later if None
        "slug": slug,
        "name": seed["name"],
        "website": (record.get("website") or {}).get("url") or seed["website"],
        "description": efh.one_line(record.get("short_description") or record.get("description")),
        "founders": (old.get("founders") if old else None) or [],
        "founded_year": founded_year,
        "age_years": (CURRENT_YEAR - founded_year) if founded_year else None,
        "hq_city": location.get("city"),
        "hq_country": COUNTRY_CODES.get(raw_country, raw_country) if raw_country else None,
        "sector": seed["sector"],
        "subsector": seed.get("subsector"),
        "tags": (old.get("tags") if old else None) or ([seed["subsector"]] if seed.get("subsector") else []),
        "total_funding_usd": int(funding.get("funding_total") or 0),
        "latest_round_type": efh.map_round_type(funding.get("last_funding_type")),
        "latest_round_date": (funding.get("last_funding_at") or "")[:10] or None,
        "latest_round_amount_usd": int(funding.get("last_funding_total") or 0) or None,
        "status": STATUS_MAP.get(record.get("ownership_status"), "active"),
        "logo_url": record.get("logo_url"),
        "external_source_url": None,
        "source_ids": [record.get("entity_urn")] if record.get("entity_urn") else [],
        "confidence_flags": {},
    }
    company.update(efh.headcount_fields(record.get("headcount")))
    for k in ("headcount_min", "headcount_max", "headcount_display", "headcount_bucket"):
        company.setdefault(k, None)

    investors = (funding.get("investors") or [])[: efh.MAX_INVESTORS_PER_COMPANY]
    company["completeness_score"] = completeness(company, len(investors) > 0)
    return company, investors


def run_layout(companies):
    tmp_in = os.path.join(SNAPSHOTS_DIR, "_layout_in.json")
    tmp_out = os.path.join(SNAPSHOTS_DIR, "_layout_out.json")
    os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
    with open(tmp_in, "w") as f:
        json.dump(companies, f)

    env = dict(os.environ)
    env["PATH"] = "/opt/homebrew/opt/node@22/bin:" + env.get("PATH", "")
    result = subprocess.run(
        ["pnpm", "--filter", "@venture-forest/api", "exec", "tsx", LAYOUT_SCRIPT, tmp_in, tmp_out],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stdout, file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        raise RuntimeError("layout step failed")
    print(f"  {result.stderr.strip()}")
    with open(tmp_out) as f:
        layout = json.load(f)
    os.remove(tmp_in)
    os.remove(tmp_out)
    return layout


def validate(snapshot):
    errors = []
    companies = snapshot["companies"]
    ids = [c["id"] for c in companies]
    slugs = [c["slug"] for c in companies]
    if len(set(ids)) != len(ids):
        errors.append("duplicate company ids")
    if len(set(slugs)) != len(slugs):
        errors.append("duplicate company slugs")
    inv_slugs = [i["slug"] for i in snapshot["investors"]]
    if len(set(inv_slugs)) != len(inv_slugs):
        errors.append("duplicate investor slugs")

    id_set = set(ids)
    inv_ids = {i["id"] for i in snapshot["investors"]}
    for e in snapshot["edges"]:
        if e["company_id"] not in id_set:
            errors.append(f"edge to missing company {e['company_id']}")
        if e["investor_id"] not in inv_ids:
            errors.append(f"edge to missing investor {e['investor_id']}")

    placements = snapshot["placements"]
    if len(placements) != len(companies):
        errors.append(f"placement count {len(placements)} != company count {len(companies)}")
    for i, p in enumerate(placements):
        if p["company_id"] != companies[i]["id"]:
            errors.append(f"placement order mismatch at index {i}")
            break
    for p in placements:
        if not (1.5 <= p["tree_height"] <= 28):
            errors.append(f"height out of range: {p['company_id']} {p['tree_height']}")
        if abs(p["world_x"]) > 250 or abs(p["world_z"]) > 250:
            errors.append(f"placement outside world bounds: {p['company_id']}")

    sectors = {c["sector"] for c in companies}
    grove_sectors = {g["sector"] for g in snapshot["groves"]}
    if sectors - grove_sectors:
        errors.append(f"sectors without groves: {sectors - grove_sectors}")
    if snapshot["company_count"] != len(companies):
        errors.append("company_count mismatch")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="limit Harmonic fetching to one sector (cache warm-up)")
    parser.add_argument("--dry-run", action="store_true", help="resolve and report, write nothing")
    args = parser.parse_args()

    if not efh.API_KEY:
        print("HARMONIC_API_KEY not found.", file=sys.stderr)
        sys.exit(1)

    with open(SEEDS_PATH) as f:
        seeds = json.load(f)["companies"]
    with open(SNAPSHOT_PATH) as f:
        old_snapshot = json.load(f)

    old_by_slug = {c["slug"]: c for c in old_snapshot["companies"]}
    old_by_domain = {}
    for c in old_snapshot["companies"]:
        d = efh.extract_domain(c.get("website"))
        if d:
            old_by_domain[d] = c

    if args.only:
        seeds = [s for s in seeds if s["sector"] == args.only]
        print(f"limiting to sector {args.only}: {len(seeds)} seeds")

    # Archive before any writes
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    if not args.dry_run and not args.only:
        os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
        shutil.copyfile(SNAPSHOT_PATH, os.path.join(SNAPSHOTS_DIR, f"snapshot-pre-expansion-{stamp}.json"))

    companies, unmatched = [], []
    investors_by_slug = {}
    investors_list, edges = [], []
    used_slugs = set()

    def get_or_create_investor(name):
        slug = efh.slugify(name)
        if slug in investors_by_slug:
            return investors_by_slug[slug]
        inv = {
            "id": f"inv-{len(investors_list) + 1:03d}",
            "slug": slug,
            "name": name,
            "type": efh.classify_investor(name),
            "website": None,
            "description": None,
            "location": None,
            "external_source_url": None,
        }
        investors_list.append(inv)
        investors_by_slug[slug] = inv
        return inv

    for i, seed in enumerate(seeds, 1):
        print(f"[{i}/{len(seeds)}] {seed['name']} ... ", end="", flush=True)
        try:
            record, detail = efh.find_match({"name": seed["name"], "website": seed["website"]})
        except Exception as exc:
            print(f"ERROR ({exc})")
            unmatched.append({"name": seed["name"], "sector": seed["sector"], "reason": f"request error: {exc}"})
            continue
        if not record:
            print(f"unmatched ({detail})")
            unmatched.append({"name": seed["name"], "sector": seed["sector"], "reason": detail})
            continue

        company, h_investors = build_company(seed, record, old_by_slug, old_by_domain)

        # Slug collisions get a numeric suffix (stable: seed order)
        base_slug = company["slug"]
        n = 2
        while company["slug"] in used_slugs:
            company["slug"] = f"{base_slug}-{n}"
            n += 1
        used_slugs.add(company["slug"])

        companies.append(company)
        for h_inv in h_investors:
            inv = get_or_create_investor(h_inv["name"])
            edges.append({
                "company_id": None,  # patched after id assignment
                "_company_index": len(companies) - 1,
                "investor_id": inv["id"],
                "edge_strength": 0.6,
                "role": "participant",
                "source": "harmonic",
            })
        print(f"matched ({detail}), ${company['total_funding_usd'] / 1e9:.1f}B, {len(h_investors)} investors")

    # Assign ids: survivors keep theirs, new companies continue sequentially
    max_id = 0
    for c in old_snapshot["companies"]:
        try:
            max_id = max(max_id, int(c["id"].split("-")[1]))
        except (IndexError, ValueError):
            pass
    taken = {c["id"] for c in companies if c["id"]}
    next_id = max_id + 1
    for c in companies:
        if not c["id"]:
            while f"c-{next_id:03d}" in taken:
                next_id += 1
            c["id"] = f"c-{next_id:03d}"
            taken.add(c["id"])
            next_id += 1
    for e in edges:
        e["company_id"] = companies[e.pop("_company_index")]["id"]

    print(f"\nresolved {len(companies)}/{len(seeds)} seeds, {len(unmatched)} unmatched")

    if args.dry_run or args.only:
        with open(UNMATCHED_PATH, "w") as f:
            json.dump(unmatched, f, indent=2)
        print(f"(dry-run/partial: unmatched -> {os.path.relpath(UNMATCHED_PATH, ROOT)}, no snapshot written)")
        return

    # Layout via the tested layout engine
    print("running layout engine ...")
    layout = run_layout(companies)

    # Reorder placements to companies order (index-aligned invariant)
    by_company = {p["company_id"]: p for p in layout["placements"]}
    placements = [by_company[c["id"]] for c in companies]

    snapshot = {
        "version": "2.0.0",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "company_count": len(companies),
        "companies": companies,
        "investors": investors_list,
        "funding_rounds": [],
        "edges": edges,
        "placements": placements,
        "groves": layout["groves"],
    }

    errors = validate(snapshot)
    if errors:
        for e in errors[:20]:
            print(f"VALIDATION: {e}", file=sys.stderr)
        sys.exit(1)

    out_archive = os.path.join(SNAPSHOTS_DIR, f"snapshot-expanded-{stamp}.json")
    for path in (SNAPSHOT_PATH, FIXTURES_PATH, out_archive):
        with open(path, "w") as f:
            json.dump(snapshot, f, indent=2)
    with open(UNMATCHED_PATH, "w") as f:
        json.dump(unmatched, f, indent=2)

    print("=" * 60)
    print(f"Seeds processed:   {len(seeds)}")
    print(f"Companies built:   {len(companies)}")
    print(f"Investors:         {len(investors_list)}")
    print(f"Edges:             {len(edges)}")
    print(f"Unmatched:         {len(unmatched)} -> {os.path.relpath(UNMATCHED_PATH, ROOT)}")
    print(f"Snapshot written:  {os.path.relpath(SNAPSHOT_PATH, ROOT)}")
    print(f"Archive:           {os.path.relpath(out_archive, ROOT)}")


if __name__ == "__main__":
    main()
