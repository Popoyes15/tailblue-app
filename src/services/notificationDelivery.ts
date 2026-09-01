import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

import type {
  TailBlueSettings,
} from "../settings/tailblueSettings";
import type {
  HomeNotification,
} from "../types/home";

import {
  getNotificationDeliveryMode,
  isNotificationLevelAllowed,
} from "./notificationCenter";
import {
  playNotificationTone,
} from "./audioService";

export function shouldShowNotificationToast(
  settings: TailBlueSettings,
  notification: HomeNotification,
) {
  if (
    !isNotificationLevelAllowed(
      settings,
      notification.level,
    )
  ) {
    return false;
  }

  return (
    getNotificationDeliveryMode(settings) ===
    "sound"
  );
}

export async function ensureNativeNotificationPermission(
  requestIfNeeded = false,
): Promise<boolean> {
  try {
    let granted =
      await isPermissionGranted();

    if (
      !granted &&
      requestIfNeeded
    ) {
      granted =
        (await requestPermission()) ===
        "granted";
    }

    return granted;
  } catch (error) {
    console.warn(
      "Notifications système indisponibles :",
      error,
    );
    return false;
  }
}

export async function deliverNotificationPresentation(
  settings: TailBlueSettings,
  notification: HomeNotification,
) {
  if (
    !isNotificationLevelAllowed(
      settings,
      notification.level,
    )
  ) {
    return;
  }

  const mode =
    getNotificationDeliveryMode(settings);

  if (
    mode === "sound" ||
    mode === "banner_sound"
  ) {
    await playNotificationTone(
      notification.level,
    );
  }

  if (
    mode === "banner" ||
    mode === "banner_sound"
  ) {
    if (
      !(await ensureNativeNotificationPermission(
        false,
      ))
    ) {
      return;
    }

    try {
      sendNotification({
        title:
          `${notification.icon || "🔔"} ${notification.title}`.trim(),
        body: notification.message,
      });
    } catch (error) {
      console.warn(
        "Bannière système TailBlue impossible :",
        error,
      );
    }
  }
}
