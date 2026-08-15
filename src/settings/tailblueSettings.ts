import {
  useCallback,
  useEffect,
  useState,
} from "react";

export type NotificationLevelSetting =
  | "info"
  | "standard"
  | "success"
  | "important"
  | "urgent";

export type TailBlueSettings = {
  animations: boolean;
  compact: boolean;

  notifications: boolean;
  notificationLevels: Record<
    NotificationLevelSetting,
    boolean
  >;

  sound: boolean;
  ambientMusic: boolean;
  uiSounds: boolean;
  notificationSounds: boolean;
  combatSounds: boolean;

  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
};

const STORAGE_KEY = "tailblue-settings-v2";
const LEGACY_STORAGE_KEY = "tailblue-settings";
const EVENT_NAME = "tailblue:settings-changed";

export const DEFAULT_TAILBLUE_SETTINGS: TailBlueSettings = {
  animations: true,
  compact: false,

  notifications: true,
  notificationLevels: {
    info: true,
    standard: true,
    success: true,
    important: true,
    urgent: true,
  },

  sound: false,
  ambientMusic: false,
  uiSounds: true,
  notificationSounds: true,
  combatSounds: true,

  masterVolume: 0.7,
  musicVolume: 0.35,
  effectsVolume: 0.65,
};

function clampVolume(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}

function normalize(
  raw: Partial<TailBlueSettings> | null | undefined,
): TailBlueSettings {
  const source = raw ?? {};

  return {
    ...DEFAULT_TAILBLUE_SETTINGS,
    ...source,

    notificationLevels: {
      ...DEFAULT_TAILBLUE_SETTINGS.notificationLevels,
      ...(source.notificationLevels ?? {}),
    },

    masterVolume: clampVolume(
      source.masterVolume,
      DEFAULT_TAILBLUE_SETTINGS.masterVolume,
    ),

    musicVolume: clampVolume(
      source.musicVolume,
      DEFAULT_TAILBLUE_SETTINGS.musicVolume,
    ),

    effectsVolume: clampVolume(
      source.effectsVolume,
      DEFAULT_TAILBLUE_SETTINGS.effectsVolume,
    ),
  };
}

function migrateLegacy(): TailBlueSettings | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const old = JSON.parse(raw) as Partial<{
      animations: boolean;
      compact: boolean;
      notifications: boolean;
      sound: boolean;
    }>;

    return normalize({
      animations: old.animations,
      compact: old.compact,
      notifications: old.notifications,
      sound: old.sound,
    });
  } catch {
    return null;
  }
}

export function loadTailBlueSettings(): TailBlueSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      return normalize(
        JSON.parse(raw) as Partial<TailBlueSettings>,
      );
    }

    const migrated = migrateLegacy();

    if (migrated) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(migrated),
      );
      return migrated;
    }
  } catch {
    // Retour aux valeurs sûres.
  }

  return DEFAULT_TAILBLUE_SETTINGS;
}

export function saveTailBlueSettings(
  settings: TailBlueSettings,
) {
  const normalized = normalize(settings);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalized),
  );

  window.dispatchEvent(
    new CustomEvent<TailBlueSettings>(EVENT_NAME, {
      detail: normalized,
    }),
  );
}

export function resetTailBlueSettings() {
  saveTailBlueSettings(DEFAULT_TAILBLUE_SETTINGS);
}

export function applySettingsToDocument(
  settings: TailBlueSettings,
) {
  const root = document.documentElement;

  root.classList.toggle(
    "tb-no-animations",
    !settings.animations,
  );

  root.classList.toggle(
    "tb-compact",
    settings.compact,
  );

  root.classList.toggle(
    "tb-notifications-disabled",
    !settings.notifications,
  );

  root.classList.toggle(
    "tb-sound-enabled",
    settings.sound,
  );
}

export function useTailBlueSettings() {
  const [settings, setSettingsState] =
    useState<TailBlueSettings>(() =>
      loadTailBlueSettings(),
    );

  useEffect(() => {
    const onChanged = (event: Event) => {
      const custom =
        event as CustomEvent<TailBlueSettings>;

      setSettingsState(
        custom.detail ?? loadTailBlueSettings(),
      );
    };

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEY ||
        event.key === LEGACY_STORAGE_KEY
      ) {
        setSettingsState(loadTailBlueSettings());
      }
    };

    window.addEventListener(EVENT_NAME, onChanged);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const replaceSettings = useCallback(
    (next: TailBlueSettings) => {
      saveTailBlueSettings(next);
    },
    [],
  );

  const patchSettings = useCallback(
    (patch: Partial<TailBlueSettings>) => {
      const current = loadTailBlueSettings();

      replaceSettings({
        ...current,
        ...patch,
        notificationLevels: {
          ...current.notificationLevels,
          ...(patch.notificationLevels ?? {}),
        },
      });
    },
    [replaceSettings],
  );

  const toggle = useCallback(
    (
      key:
        | "animations"
        | "compact"
        | "notifications"
        | "sound"
        | "ambientMusic"
        | "uiSounds"
        | "notificationSounds"
        | "combatSounds",
    ) => {
      const current = loadTailBlueSettings();

      patchSettings({
        [key]: !current[key],
      } as Partial<TailBlueSettings>);
    },
    [patchSettings],
  );

  const toggleNotificationLevel = useCallback(
    (level: NotificationLevelSetting) => {
      const current = loadTailBlueSettings();

      patchSettings({
        notificationLevels: {
          ...current.notificationLevels,
          [level]:
            !current.notificationLevels[level],
        },
      });
    },
    [patchSettings],
  );

  return {
    settings,
    patchSettings,
    replaceSettings,
    toggle,
    toggleNotificationLevel,
    reset: resetTailBlueSettings,
  };
}
