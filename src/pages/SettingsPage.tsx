import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  type NotificationDeliveryMode,
  type NotificationLevelSetting,
  useTailBlueSettings,
} from "../settings/tailblueSettings";
import {
  dispatchTestNotification,
  resetNotificationLocalState,
} from "../services/notificationCenter";
import {
  configureAudio,
  TAILBLUE_AUDIO_ASSETS,
  testAudio,
} from "../services/audioService";
import {
  ensureNativeNotificationPermission,
} from "../services/notificationDelivery";
import "./settingsFinal.css";

const LEVELS: Array<{
  id: NotificationLevelSetting;
  icon: string;
  label: string;
  description: string;
}> = [
  {
    id: "info",
    icon: "💬",
    label: "Informations",
    description: "Messages généraux et rappels.",
  },
  {
    id: "standard",
    icon: "🔵",
    label: "Standard",
    description: "Nouveautés et événements classiques.",
  },
  {
    id: "success",
    icon: "✅",
    label: "Réussites",
    description: "Quêtes, fabrications et actions terminées.",
  },
  {
    id: "important",
    icon: "🟠",
    label: "Importantes",
    description: "Événements qui méritent ton attention.",
  },
  {
    id: "urgent",
    icon: "🚨",
    label: "Urgentes",
    description: "Erreurs et alertes critiques.",
  },
];

const DELIVERY_MODES: Array<{
  id: NotificationDeliveryMode;
  icon: string;
  label: string;
  description: string;
}> = [
  {
    id: "sound",
    icon: "🔊",
    label: "Son uniquement",
    description:
      "Son TailBlue, aucune bannière Windows.",
  },
  {
    id: "banner_sound",
    icon: "🪟",
    label: "Bannière + son",
    description:
      "Notification Windows + son TailBlue.",
  },
  {
    id: "banner",
    icon: "📣",
    label: "Bannière",
    description:
      "Notification Windows sans son TailBlue.",
  },
  {
    id: "silent",
    icon: "🌙",
    label: "Silencieux",
    description:
      "Centre TailBlue uniquement.",
  },
];

function percent(value: number) {
  return Math.round(value * 100);
}

function Toggle({
  active,
  disabled = false,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`tb-setting-toggle ${
        active ? "on" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      <i />
    </button>
  );
}

function SettingCard({
  icon,
  title,
  description,
  active,
  disabled,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  return (
    <article
      className={`tb-setting-card ${
        active ? "enabled" : ""
      } ${disabled ? "disabled" : ""}`}
    >
      <div className="tb-setting-card-main">
        <span className="tb-setting-icon">
          {icon}
        </span>

        <div className="tb-setting-copy">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <Toggle
          active={active}
          disabled={disabled}
          onClick={onToggle}
        />
      </div>

      {children}
    </article>
  );
}

export default function SettingsPage() {
  const {
    settings,
    patchSettings,
    toggle,
    toggleNotificationLevel,
    reset,
  } = useTailBlueSettings();

  const [audioMessage, setAudioMessage] =
    useState<string | null>(null);

  const [resetDone, setResetDone] = useState(false);

  const [
    notificationPermissionMessage,
    setNotificationPermissionMessage,
  ] = useState<string | null>(null);

  useEffect(() => {
    configureAudio(settings);
  }, [settings]);

  const enabledNotificationLevels = useMemo(
    () =>
      Object.values(
        settings.notificationLevels,
      ).filter(Boolean).length,
    [settings.notificationLevels],
  );

  async function runSoundTest(
    type:
      | "ui"
      | "notification"
      | "urgent"
      | "combat"
      | "ambience",
  ) {
    if (!settings.sound) {
      setAudioMessage(
        "🔇 Active d'abord le son général.",
      );
      return;
    }

    await testAudio(type);

    setAudioMessage(
      type === "ambience"
        ? "🎵 Test lancé. Si aucun fichier ambiance n'existe encore, TailBlue joue un petit son de démonstration."
        : "🔊 Son de test joué.",
    );
  }

  async function setDeliveryMode(
    mode: NotificationDeliveryMode,
  ) {
    if (
      mode === "banner" ||
      mode === "banner_sound"
    ) {
      const allowed =
        await ensureNativeNotificationPermission(
          true,
        );

      setNotificationPermissionMessage(
        allowed
          ? "✅ Les bannières système sont autorisées."
          : "⚠️ Windows n'a pas autorisé les bannières.",
      );

      if (!allowed) return;
    } else {
      setNotificationPermissionMessage(
        null,
      );
    }

    patchSettings({
      notificationDeliveryMode: mode,
    });
  }

  function resetEverything() {
    reset();
    resetNotificationLocalState();
    setResetDone(true);

    window.setTimeout(
      () => setResetDone(false),
      1600,
    );
  }

  return (
    <section className="tb-settings-page">
      <header className="tb-settings-heading">
        <div>
          <p className="eyebrow">APPLICATION</p>
          <h1>Paramètres</h1>
          <p>
            Tout s'applique immédiatement, sans redémarrer
            TailBlue.
          </p>
        </div>

        <div className="tb-settings-status">
          <span>💾 Sauvegarde locale</span>
          <strong>Automatique</strong>
        </div>
      </header>

      <section className="tb-settings-section">
        <div className="tb-settings-section-title">
          <div>
            <p className="eyebrow">APPARENCE</p>
            <h2>Interface</h2>
          </div>
        </div>

        <div className="tb-settings-two-columns">
          <SettingCard
            icon="✨"
            title="Animations"
            description="Transitions, confettis, mouvements et effets visuels de l'application."
            active={settings.animations}
            onToggle={() => toggle("animations")}
          >
            <div className="tb-setting-demo">
              <span
                className={
                  settings.animations
                    ? "tb-animation-demo active"
                    : "tb-animation-demo"
                }
              >
                ✦
              </span>

              <span>
                {settings.animations
                  ? "Animations actives"
                  : "Animations coupées"}
              </span>
            </div>
          </SettingCard>

          <SettingCard
            icon="↔️"
            title="Mode compact"
            description="Réduit la barre latérale, les marges, les cartes et les espacements pour afficher davantage de contenu."
            active={settings.compact}
            onToggle={() => toggle("compact")}
          >
            <div className="tb-setting-demo">
              <span>📐</span>
              <span>
                {settings.compact
                  ? "Interface resserrée"
                  : "Interface confortable"}
              </span>
            </div>
          </SettingCard>
        </div>
      </section>

      <section className="tb-settings-section">
        <div className="tb-settings-section-title">
          <div>
            <p className="eyebrow">CENTRE TAILBLUE</p>
            <h2>Notifications</h2>
          </div>

          <span className="tb-settings-mini-state">
            {settings.notifications
              ? `${enabledNotificationLevels}/5 types actifs`
              : "Toutes coupées"}
          </span>
        </div>

        <SettingCard
          icon={
            settings.notifications ? "🔔" : "🔕"
          }
          title="Notifications dans l'application"
          description="Affiche la cloche, le compteur, les alertes et les nouvelles notifications envoyées par TailBlue."
          active={settings.notifications}
          onToggle={() => toggle("notifications")}
        >
          <div className="tb-notification-preferences">
            {LEVELS.map((level) => (
              <button
                key={level.id}
                className={`tb-notification-level ${
                  settings.notificationLevels[level.id]
                    ? "active"
                    : ""
                }`}
                disabled={!settings.notifications}
                onClick={() =>
                  toggleNotificationLevel(level.id)
                }
              >
                <span>{level.icon}</span>
                <div>
                  <strong>{level.label}</strong>
                  <small>{level.description}</small>
                </div>
                <i>
                  {settings.notificationLevels[level.id]
                    ? "ON"
                    : "OFF"}
                </i>
              </button>
            ))}
          </div>

          <section className="tb-notification-delivery">
            <div>
              <strong>
                Comment TailBlue te prévient
              </strong>
              <p>
                Par défaut : son TailBlue uniquement.
                Les bannières Windows sont optionnelles.
              </p>
            </div>

            <div className="tb-delivery-mode-grid">
              {DELIVERY_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`tb-delivery-mode ${
                    settings.notificationDeliveryMode ===
                    mode.id
                      ? "active"
                      : ""
                  }`}
                  disabled={!settings.notifications}
                  onClick={() =>
                    void setDeliveryMode(mode.id)
                  }
                >
                  <span>{mode.icon}</span>
                  <div>
                    <strong>{mode.label}</strong>
                    <small>{mode.description}</small>
                  </div>
                </button>
              ))}
            </div>

            {notificationPermissionMessage && (
              <div className="tb-notification-permission-message">
                {notificationPermissionMessage}
              </div>
            )}
          </section>

          <div className="tb-setting-actions">
            <button
              disabled={!settings.notifications}
              onClick={() =>
                dispatchTestNotification("standard")
              }
            >
              🔔 Tester une notification
            </button>

            <button
              disabled={!settings.notifications}
              onClick={() =>
                dispatchTestNotification("urgent")
              }
            >
              🚨 Tester une urgente
            </button>

            <button
              onClick={resetNotificationLocalState}
            >
              ♻️ Réafficher les notifications masquées
            </button>
          </div>
        </SettingCard>
      </section>

      <section className="tb-settings-section">
        <div className="tb-settings-section-title">
          <div>
            <p className="eyebrow">AUDIO</p>
            <h2>Sons & ambiance</h2>
          </div>

          <span className="tb-settings-mini-state">
            {settings.sound
              ? `${percent(settings.masterVolume)} %`
              : "Muet"}
          </span>
        </div>

        <SettingCard
          icon={settings.sound ? "🔊" : "🔇"}
          title="Son général"
          description="Active tous les sons TailBlue. Les sous-options restent mémorisées même lorsque le son général est coupé."
          active={settings.sound}
          onToggle={() => toggle("sound")}
        >
          <div className="tb-volume-control">
            <div>
              <strong>Volume général</strong>
              <span>
                {percent(settings.masterVolume)} %
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={percent(settings.masterVolume)}
              disabled={!settings.sound}
              onChange={(event) =>
                patchSettings({
                  masterVolume:
                    Number(event.target.value) / 100,
                })
              }
            />
          </div>

          <div className="tb-sound-options">
            <div className="tb-sound-option">
              <div>
                <span>🎵</span>
                <div>
                  <strong>Musique d'ambiance</strong>
                  <small>
                    Boucle musicale générale de l'application.
                  </small>
                </div>
              </div>
              <Toggle
                active={settings.ambientMusic}
                disabled={!settings.sound}
                onClick={() => toggle("ambientMusic")}
              />
            </div>

            <div className="tb-sound-option">
              <div>
                <span>🖱️</span>
                <div>
                  <strong>Sons d'interface</strong>
                  <small>
                    Boutons, menus et interactions.
                  </small>
                </div>
              </div>
              <Toggle
                active={settings.uiSounds}
                disabled={!settings.sound}
                onClick={() => toggle("uiSounds")}
              />
            </div>

            <div className="tb-sound-option">
              <div>
                <span>🔔</span>
                <div>
                  <strong>Sons de notification</strong>
                  <small>
                    Alertes normales et urgentes.
                  </small>
                </div>
              </div>
              <Toggle
                active={settings.notificationSounds}
                disabled={!settings.sound}
                onClick={() =>
                  toggle("notificationSounds")
                }
              />
            </div>

            <div className="tb-sound-option">
              <div>
                <span>⚔️</span>
                <div>
                  <strong>Sons de combat</strong>
                  <small>
                    Prêt pour Mine et les futurs combats.
                  </small>
                </div>
              </div>
              <Toggle
                active={settings.combatSounds}
                disabled={!settings.sound}
                onClick={() => toggle("combatSounds")}
              />
            </div>
          </div>

          <div className="tb-volume-control split">
            <div>
              <strong>Musique</strong>
              <span>
                {percent(settings.musicVolume)} %
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={percent(settings.musicVolume)}
              disabled={
                !settings.sound ||
                !settings.ambientMusic
              }
              onChange={(event) =>
                patchSettings({
                  musicVolume:
                    Number(event.target.value) / 100,
                })
              }
            />
          </div>

          <div className="tb-volume-control split">
            <div>
              <strong>Effets</strong>
              <span>
                {percent(settings.effectsVolume)} %
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={percent(settings.effectsVolume)}
              disabled={!settings.sound}
              onChange={(event) =>
                patchSettings({
                  effectsVolume:
                    Number(event.target.value) / 100,
                })
              }
            />
          </div>

          <div className="tb-setting-actions">
            <button
              disabled={!settings.sound}
              onClick={() => void runSoundTest("ui")}
            >
              🖱️ Test clic
            </button>

            <button
              disabled={!settings.sound}
              onClick={() =>
                void runSoundTest("notification")
              }
            >
              🔔 Test notif
            </button>

            <button
              disabled={!settings.sound}
              onClick={() =>
                void runSoundTest("combat")
              }
            >
              ⚔️ Test combat
            </button>

            <button
              disabled={!settings.sound}
              onClick={() =>
                void runSoundTest("ambience")
              }
            >
              🎵 Test ambiance
            </button>
          </div>

          {audioMessage && (
            <div className="tb-audio-message">
              {audioMessage}
            </div>
          )}

          <details className="tb-audio-files">
            <summary>
              📁 Futurs fichiers audio préparés
            </summary>

            <code>
              public{TAILBLUE_AUDIO_ASSETS.ambience}
            </code>
            <code>
              public{TAILBLUE_AUDIO_ASSETS.uiClick}
            </code>
            <code>
              public{TAILBLUE_AUDIO_ASSETS.notification}
            </code>
            <code>
              public{TAILBLUE_AUDIO_ASSETS.urgent}
            </code>
            <code>
              public{TAILBLUE_AUDIO_ASSETS.combat}
            </code>

            <p>
              Tant qu'un fichier n'existe pas, les clics et
              tests utilisent un petit son généré par
              TailBlue. La musique d'ambiance utilisera
              automatiquement le MP3 lorsqu'il sera ajouté.
            </p>
          </details>
        </SettingCard>
      </section>

      <section className="tb-settings-section">
        <div className="tb-settings-section-title">
          <div>
            <p className="eyebrow">COMPTE</p>
            <h2>Discord & données locales</h2>
          </div>
        </div>

        <div className="tb-settings-account-card">
          <div>
            <span className="tb-settings-account-icon">
              👤
            </span>

            <div>
              <strong>Compte Discord</strong>
              <p>
                La connexion, l'ID, la PP et la
                déconnexion se gèrent depuis ta carte de
                profil en haut à droite.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              window.dispatchEvent(
                new Event("tailblue:open-account"),
              )
            }
          >
            Ouvrir mon compte →
          </button>
        </div>

        <div className="tb-settings-danger-zone">
          <div>
            <strong>Réinitialiser les paramètres</strong>
            <p>
              Remet les préférences de l'application à
              leurs valeurs par défaut. Aucune donnée RPG
              n'est touchée.
            </p>
          </div>

          <button onClick={resetEverything}>
            {resetDone
              ? "✓ Réinitialisé"
              : "Réinitialiser"}
          </button>
        </div>
      </section>

      <footer className="tb-settings-footer">
        <strong>
          💾 Les paramètres sont enregistrés
          automatiquement sur cet appareil.
        </strong>

        <span>
          Valeurs par défaut : animations ON, mode compact
          OFF, notifications ON, sons OFF.
        </span>
      </footer>
    </section>
  );
}
