"use client";

import { useCallback, useEffect, useState } from "react";

type AsyncState<T> = {
  data: T | null;
  error: unknown;
  loading: boolean;
};

/**
 * Runs `load` on mount and whenever `key` changes; `reload()` runs it again.
 * Previous data stays visible while reloading, so lists don't flicker after edits.
 */
export function useAsyncData<T>(load: () => Promise<T>, key: string = "") {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setState({ data, error: null, loading: false }),
      (error) => active && setState((prev) => ({ ...prev, error, loading: false })),
    );
    return () => {
      active = false;
    };
    // `load` is usually an inline function; `key` and `version` decide when to run again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, reload };
}
