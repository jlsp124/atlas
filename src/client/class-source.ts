import { useEffect, useState } from 'react';
import { API, useLearner } from './store';
import {
  privatePhysicsSourceSchema,
  type PrivatePhysicsSource,
} from '../core/physics-source';
export function useClassSource(id: string) {
  const state = useLearner(),
    key = `${id}:${state.user?.role === 'admin' ? state.user.id : ''}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    source?: PrivatePhysicsSource;
    missing?: boolean;
  }>();
  useEffect(() => {
    setLoaded(undefined);
    if (!API || state.user?.role !== 'admin') return;
    const controller = new AbortController();
    void fetch(`${API}/class/sources/${id}`, {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const source = response.ok
          ? privatePhysicsSourceSchema.parse(await response.json())
          : undefined;
        if (!controller.signal.aborted)
          setLoaded({ key, source, missing: !source });
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ key, missing: true });
      });
    return () => controller.abort();
  }, [id, key, state.user?.role]);
  return loaded?.key === key && state.user?.role === 'admin'
    ? loaded
    : undefined;
}
