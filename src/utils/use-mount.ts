import { useEffect } from 'react';

type Fn = () => void;

export function useMount(effect: () => void | Fn): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
