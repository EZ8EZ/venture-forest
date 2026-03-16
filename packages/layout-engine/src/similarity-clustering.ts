import type {
  Company,
  CompanyInvestorEdge,
  CompanyPlacement,
} from "@venture-forest/shared-types";

export interface ClusterAssignment {
  company_id: string;
  cluster_id: string;
}

/**
 * Simple distance-based similarity clustering for v1.
 *
 * Within a grove, clusters companies by:
 * 1. Shared investors (strongest signal)
 * 2. Shared subsector
 * 3. Shared tags
 *
 * Uses a basic agglomerative approach: start with each company as its own
 * cluster, then merge the two most similar clusters until the similarity
 * falls below a threshold.
 */
export function clusterCompaniesInGrove(
  companies: Company[],
  edges: CompanyInvestorEdge[],
  maxClusters: number = 8,
  similarityThreshold: number = 0.15
): ClusterAssignment[] {
  if (companies.length === 0) return [];
  if (companies.length === 1) {
    return [{ company_id: companies[0].id, cluster_id: "cluster-0" }];
  }

  // Build investor set per company
  const investorsByCompany = new Map<string, Set<string>>();
  for (const edge of edges) {
    const companyIds = companies.map((c) => c.id);
    if (!companyIds.includes(edge.company_id)) continue;

    const set = investorsByCompany.get(edge.company_id) ?? new Set();
    set.add(edge.investor_id);
    investorsByCompany.set(edge.company_id, set);
  }

  // Compute pairwise similarity
  function computeSimilarity(a: Company, b: Company): number {
    let score = 0;

    // Shared investors (Jaccard coefficient, weighted heavily)
    const investorsA = investorsByCompany.get(a.id) ?? new Set();
    const investorsB = investorsByCompany.get(b.id) ?? new Set();
    if (investorsA.size > 0 || investorsB.size > 0) {
      let intersection = 0;
      for (const inv of investorsA) {
        if (investorsB.has(inv)) intersection++;
      }
      const union = investorsA.size + investorsB.size - intersection;
      if (union > 0) {
        score += (intersection / union) * 0.6;
      }
    }

    // Shared subsector
    if (a.subsector && b.subsector && a.subsector === b.subsector) {
      score += 0.25;
    }

    // Shared tags (Jaccard)
    if (a.tags.length > 0 || b.tags.length > 0) {
      const tagsA = new Set(a.tags);
      const tagsB = new Set(b.tags);
      let tagIntersection = 0;
      for (const tag of tagsA) {
        if (tagsB.has(tag)) tagIntersection++;
      }
      const tagUnion = tagsA.size + tagsB.size - tagIntersection;
      if (tagUnion > 0) {
        score += (tagIntersection / tagUnion) * 0.15;
      }
    }

    return score;
  }

  // Initialize: each company is its own cluster
  type Cluster = { id: string; members: Company[] };
  let clusters: Cluster[] = companies.map((c, i) => ({
    id: `cluster-${i}`,
    members: [c],
  }));

  // Agglomerative merging
  while (clusters.length > maxClusters) {
    let bestSim = -1;
    let bestI = 0;
    let bestJ = 1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        // Average linkage between clusters
        let totalSim = 0;
        let count = 0;
        for (const a of clusters[i].members) {
          for (const b of clusters[j].members) {
            totalSim += computeSimilarity(a, b);
            count++;
          }
        }
        const avgSim = count > 0 ? totalSim / count : 0;
        if (avgSim > bestSim) {
          bestSim = avgSim;
          bestI = i;
          bestJ = j;
        }
      }
    }

    if (bestSim < similarityThreshold) break;

    // Merge bestJ into bestI
    const merged: Cluster = {
      id: clusters[bestI].id,
      members: [...clusters[bestI].members, ...clusters[bestJ].members],
    };
    clusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ);
    clusters.push(merged);
  }

  // Build assignments
  const assignments: ClusterAssignment[] = [];
  for (const cluster of clusters) {
    for (const company of cluster.members) {
      assignments.push({
        company_id: company.id,
        cluster_id: cluster.id,
      });
    }
  }

  return assignments;
}

/**
 * Apply cluster assignments to existing placements by setting
 * the local_cluster_id field.
 */
export function applyClusterAssignments(
  placements: CompanyPlacement[],
  assignments: ClusterAssignment[]
): CompanyPlacement[] {
  const clusterMap = new Map<string, string>();
  for (const a of assignments) {
    clusterMap.set(a.company_id, a.cluster_id);
  }

  return placements.map((p) => ({
    ...p,
    local_cluster_id: clusterMap.get(p.company_id) ?? null,
  }));
}
