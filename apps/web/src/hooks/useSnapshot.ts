import { useQuery } from '@tanstack/react-query';
import { loadSnapshot } from '@/lib/snapshot-loader';
import { useForestStore } from '@/stores/forest-store';
import { useEffect } from 'react';

export function useSnapshot() {
  const setLoading = useForestStore((s) => s.setLoading);
  const setLoadProgress = useForestStore((s) => s.setLoadProgress);

  const query = useQuery({
    queryKey: ['forest-snapshot'],
    queryFn: async () => {
      setLoadProgress(10);
      const snapshot = await loadSnapshot();
      setLoadProgress(100);
      return snapshot;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.data) {
      setLoading(false);
    }
  }, [query.data, setLoading]);

  return query;
}
