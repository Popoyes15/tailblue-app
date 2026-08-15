import { useCallback, useEffect, useState } from "react";
import { himeApi, himeApiConfigured } from "../api/himeApi";
import type { HimeSidebarBadges } from "../types/hime";

const EMPTY: HimeSidebarBadges = { ideas: 0, errors: 0, total: 0 };

export function useHimeBadges() {
  const [badges, setBadges] = useState<HimeSidebarBadges>(EMPTY);

  const refresh = useCallback(async () => {
    if (!himeApiConfigured) {
      setBadges(EMPTY);
      return;
    }
    try {
      setBadges(await himeApi.badges());
    } catch {
      // Une erreur de badge ne doit jamais casser la sidebar.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    const closeStream = himeApi.openStream(() => void refresh());
    return () => {
      window.clearInterval(timer);
      closeStream();
    };
  }, [refresh]);

  return { badges, refresh };
}
