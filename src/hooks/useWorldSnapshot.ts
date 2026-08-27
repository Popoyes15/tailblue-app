// TAILBLUE_WORLD_APP_V3_20260826
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  Dispatch,
  SetStateAction,
} from "react";

import {
  getCachedWorldSnapshot,
  type WorldCacheKey,
} from "../api/worldApi";

type Options<T> = {
  cacheKey: WorldCacheKey;
  loader: () => Promise<T>;
  pollMs?: number;
};

export function useWorldSnapshot<T>({
  cacheKey,
  loader,
  pollMs = 60_000,
}: Options<T>): {
  snapshot: T | null;
  setSnapshot:
    Dispatch<SetStateAction<T | null>>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: (
    quiet?: boolean,
  ) => Promise<void>;
} {
  const initial =
    getCachedWorldSnapshot<T>(
      cacheKey,
    );

  const [snapshot, setSnapshot] =
    useState<T | null>(() => initial);

  const [loading, setLoading] =
    useState(initial === null);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const ref =
    useRef<T | null>(initial);

  useEffect(() => {
    ref.current = snapshot;
  }, [snapshot]);

  const refresh = useCallback(
    async (quiet = false) => {
      const hadData =
        ref.current !== null;

      if (!quiet && hadData) {
        setRefreshing(true);
      } else if (!hadData) {
        setLoading(true);
      }

      try {
        const value =
          await loader();

        ref.current = value;
        setSnapshot(value);
        setError(null);
      } catch (cause) {
        // Le polling automatique ne remplace jamais
        // un vrai snapshot par une erreur réseau transitoire.
        if (!quiet || !hadData) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Connexion TailBlue impossible.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loader],
  );

  useEffect(() => {
    void refresh(initial !== null);

    const interval =
      window.setInterval(() => {
        void refresh(true);
      }, pollMs);

    const onFocus = () => {
      void refresh(true);
    };

    window.addEventListener(
      "focus",
      onFocus,
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "focus",
        onFocus,
      );
    };
  }, [pollMs, refresh]);

  return {
    snapshot,
    setSnapshot,
    loading,
    refreshing,
    error,
    refresh,
  };
}
