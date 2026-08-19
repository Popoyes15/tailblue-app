import { invoke } from "@tauri-apps/api/core";

export async function readPersistedDesktopRefreshToken():
  Promise<string | null> {

  const token = await invoke<string | null>(
    "tailblue_auth_token_load",
  );

  const clean =
    typeof token === "string"
      ? token.trim()
      : "";

  return clean || null;
}

export async function persistDesktopRefreshToken(
  token: string,
): Promise<void> {

  const clean =
    String(token ?? "").trim();

  if (!clean) {
    return;
  }

  await invoke(
    "tailblue_auth_token_save",
    {
      token: clean,
    },
  );
}

export async function clearPersistedDesktopRefreshToken():
  Promise<void> {

  await invoke(
    "tailblue_auth_token_clear",
  );
}
