import type {
  HomeNotification,
} from "../types/home";
import type {
  NotificationLevelSetting,
  TailBlueSettings,
} from "../settings/tailblueSettings";

const STORAGE_KEY = "tailblue-notification-state-v2";
const EVENT_NAME = "tailblue:notification-state";
export const TEST_NOTIFICATION_EVENT =
  "tailblue:test-notification";

type NotificationLocalState = {
  readIds: string[];
  dismissedIds: string[];
};

const EMPTY_STATE: NotificationLocalState = {
  readIds: [],
  dismissedIds: [],
};

function loadState(): NotificationLocalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;

    const parsed =
      JSON.parse(raw) as Partial<NotificationLocalState>;

    return {
      readIds: Array.isArray(parsed.readIds)
        ? parsed.readIds.map(String)
        : [],
      dismissedIds: Array.isArray(
        parsed.dismissedIds,
      )
        ? parsed.dismissedIds.map(String)
        : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function saveState(state: NotificationLocalState) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state),
  );

  window.dispatchEvent(new Event(EVENT_NAME));
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function subscribeNotificationState(
  callback: () => void,
) {
  window.addEventListener(EVENT_NAME, callback);

  return () =>
    window.removeEventListener(
      EVENT_NAME,
      callback,
    );
}

export function markNotificationReadLocal(
  id: string,
) {
  const state = loadState();

  saveState({
    ...state,
    readIds: unique([...state.readIds, id]),
  });
}

export function markNotificationsReadLocal(
  ids: string[],
) {
  const state = loadState();

  saveState({
    ...state,
    readIds: unique([...state.readIds, ...ids]),
  });
}

export function dismissNotificationLocal(
  id: string,
) {
  const state = loadState();

  saveState({
    ...state,
    dismissedIds: unique([
      ...state.dismissedIds,
      id,
    ]),
  });
}

export function dismissNotificationsLocal(
  ids: string[],
) {
  const state = loadState();

  saveState({
    ...state,
    dismissedIds: unique([
      ...state.dismissedIds,
      ...ids,
    ]),
  });
}

export function resetNotificationLocalState() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function isNotificationLevelAllowed(
  settings: TailBlueSettings,
  level: HomeNotification["level"],
) {
  if (!settings.notifications) return false;

  return Boolean(
    settings.notificationLevels[
      level as NotificationLevelSetting
    ],
  );
}

export function getVisibleNotifications(
  notifications: HomeNotification[],
  settings: TailBlueSettings,
) {
  const state = loadState();

  const read = new Set(state.readIds);
  const dismissed = new Set(state.dismissedIds);

  return notifications
    .filter(
      (notification) =>
        !dismissed.has(notification.id) &&
        isNotificationLevelAllowed(
          settings,
          notification.level,
        ),
    )
    .map((notification) => ({
      ...notification,
      read:
        notification.read ||
        read.has(notification.id),
    }))
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
}

export function createTestNotification(
  level: NotificationLevelSetting = "standard",
): HomeNotification {
  const labels: Record<
    NotificationLevelSetting,
    {
      icon: string;
      title: string;
      message: string;
    }
  > = {
    info: {
      icon: "💬",
      title: "Information TailBlue",
      message:
        "Test : une information simple vient d'arriver.",
    },
    standard: {
      icon: "✨",
      title: "Notification TailBlue",
      message:
        "Test : la cloche, le son et le centre de notifications fonctionnent.",
    },
    success: {
      icon: "✅",
      title: "Action réussie",
      message:
        "Test : cette notification représente une réussite.",
    },
    important: {
      icon: "⚠️",
      title: "Notification importante",
      message:
        "Test : une information mérite ton attention.",
    },
    urgent: {
      icon: "🚨",
      title: "Alerte urgente",
      message:
        "Test : cette notification utilise le niveau urgent.",
    },
  };

  const template = labels[level];

  return {
    id: `test-${level}-${Date.now()}`,
    icon: template.icon,
    title: template.title,
    message: template.message,
    createdAt: new Date().toISOString(),
    read: false,
    level,
    targetPage: null,
  };
}

export function dispatchTestNotification(
  level: NotificationLevelSetting = "standard",
) {
  window.dispatchEvent(
    new CustomEvent<HomeNotification>(
      TEST_NOTIFICATION_EVENT,
      {
        detail: createTestNotification(level),
      },
    ),
  );
}
