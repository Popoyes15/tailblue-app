import { useEffect, useState } from "react";
import "./remainingPages.css";

type Settings = {
  animations: boolean;
  compact: boolean;
  notifications: boolean;
  sound: boolean;
};

const defaults: Settings = {
  animations: true,
  compact: false,
  notifications: true,
  sound: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem("tailblue-settings") ?? "{}") };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem("tailblue-settings", JSON.stringify(settings));
  }, [settings]);

  function toggle(key: keyof Settings) {
    setSettings((old) => ({ ...old, [key]: !old[key] }));
  }

  return (
    <section className="extra-page">
      <div className="extra-heading">
        <div><p className="eyebrow">APPLICATION</p><h2>Paramètres</h2><p className="extra-muted">Préférences locales de l'application TailBlue.</p></div>
      </div>

      <div className="settings-grid">
        <article className="settings-card">
          <div><span>✨</span><section><h3>Animations</h3><p>Effets, transitions et magie visuelle.</p></section></div>
          <Toggle active={settings.animations} onClick={() => toggle("animations")} />
        </article>
        <article className="settings-card">
          <div><span>↔️</span><section><h3>Mode compact</h3><p>Réduire les espacements sur petits écrans.</p></section></div>
          <Toggle active={settings.compact} onClick={() => toggle("compact")} />
        </article>
        <article className="settings-card">
          <div><span>🔔</span><section><h3>Notifications</h3><p>Alertes TailBlue dans l'application.</p></section></div>
          <Toggle active={settings.notifications} onClick={() => toggle("notifications")} />
        </article>
        <article className="settings-card">
          <div><span>🔊</span><section><h3>Sons</h3><p>Prévu pour combats, coffres et événements.</p></section></div>
          <Toggle active={settings.sound} onClick={() => toggle("sound")} />
        </article>
      </div>

      <article className="account-settings">
        <div className="account-avatar">H</div>
        <div><p className="eyebrow">COMPTE</p><h3>Discord</h3><p>L'avatar, le nom et l'identité réelle seront récupérés avec OAuth2.</p></div>
        <button disabled>Connecter Discord — bientôt</button>
      </article>
    </section>
  );
}

function Toggle({ active, onClick }: { active:boolean; onClick:()=>void }) {
  return <button className={`toggle ${active ? "on" : ""}`} onClick={onClick}><i /></button>;
}
