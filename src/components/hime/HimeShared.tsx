import type { ReactNode } from "react";

export function fmtNumber(value: number | null | undefined) {
  return value == null ? "—" : new Intl.NumberFormat("fr-CH").format(value);
}

export function fmtDecimal(value: number | null | undefined) {
  return value == null
    ? "—"
    : new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 1 }).format(value);
}

export function fmtDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-CH", { dateStyle: "short", timeStyle: "short" });
}

export function fmtDuration(seconds?: number | null) {
  if (seconds == null) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function Avatar({ name, src }: { name: string; src?: string | null }) {
  return src ? (
    <img className="tb-hime-avatar" src={src} alt={name} />
  ) : (
    <div className="tb-hime-avatar tb-hime-avatar-fallback">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function Kpi({
  icon,
  label,
  value,
  detail,
  tone = "",
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <article className={`tb-hime-kpi ${tone}`}>
      <div className="tb-hime-kpi-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

export function Empty({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="tb-hime-empty">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <article className={`tb-hime-card ${className}`}>{children}</article>;
}
