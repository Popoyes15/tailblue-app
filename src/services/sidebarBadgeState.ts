import {
  useCallback,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "tailblue-sidebar-badges-v1";
const EVENT_NAME = "tailblue:sidebar-badges";

type SidebarBadgeState = Record<string, string>;

function loadState(): SidebarBadgeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        String(key),
        String(value),
      ]),
    );
  } catch {
    return {};
  }
}

function saveState(state: SidebarBadgeState) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state),
  );

  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useSidebarBadgeState() {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () =>
      setRevision((value) => value + 1);

    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isAcknowledged = useCallback(
    (key: string, signature: string) => {
      return loadState()[key] === signature;
    },
    [],
  );

  const acknowledge = useCallback(
    (key: string, signature: string) => {
      const state = loadState();

      saveState({
        ...state,
        [key]: signature,
      });
    },
    [],
  );

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return {
    isAcknowledged,
    acknowledge,
    reset,
  };
}
