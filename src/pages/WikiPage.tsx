import { useMemo, useState } from "react";
import {
  COMMAND_COUNT,
  COMMAND_GROUPS,
  type CommandGuide,
} from "../data/commandGuideData";
import "./remainingPages.css";

export default function WikiPage() {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState(COMMAND_GROUPS[0].id);
  const [selectedId, setSelectedId] = useState(COMMAND_GROUPS[0].commands[0].id);

  const normalizedQuery = query.trim().toLocaleLowerCase("fr");

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return COMMAND_GROUPS.flatMap((group) =>
      group.commands
        .filter((command) => {
          const haystack = [
            command.command,
            command.title,
            command.summary,
            command.details,
            ...(command.usage ?? []),
            ...(command.prerequisites ?? []),
            ...(command.effects ?? []),
            ...(command.tips ?? []),
            ...(command.related ?? []),
          ]
            .join(" ")
            .toLocaleLowerCase("fr");
          return haystack.includes(normalizedQuery);
        })
        .map((command) => ({ group, command }))
    );
  }, [normalizedQuery]);

  const activeGroup = COMMAND_GROUPS.find((group) => group.id === groupId) ?? COMMAND_GROUPS[0];
  const activeCommands = normalizedQuery
    ? searchResults.map((result) => result.command)
    : activeGroup.commands;

  const selectedCommand = useMemo<CommandGuide | null>(() => {
    const fromVisible = activeCommands.find((command) => command.id === selectedId);
    if (fromVisible) return fromVisible;
    return activeCommands[0] ?? null;
  }, [activeCommands, selectedId]);

  function chooseGroup(nextGroupId: string) {
    const nextGroup = COMMAND_GROUPS.find((group) => group.id === nextGroupId);
    if (!nextGroup) return;
    setQuery("");
    setGroupId(nextGroup.id);
    setSelectedId(nextGroup.commands[0]?.id ?? "");
  }

  function chooseSearchResult(command: CommandGuide) {
    const owner = COMMAND_GROUPS.find((group) => group.commands.some((entry) => entry.id === command.id));
    if (owner) setGroupId(owner.id);
    setSelectedId(command.id);
  }

  return (
    <section className="extra-page wiki-page wiki-guide-page">
      <div className="extra-heading wiki-guide-heading">
        <div>
          <p className="eyebrow">📖 GUIDE COMPLET DU ROYAUME</p>
          <h2>Wiki des commandes</h2>
          <p className="extra-muted">
            Le <strong>!helpme</strong> donne la version rapide sur Discord. Ici, chaque commande explique
            ce qu'elle fait, comment l'utiliser, ses conditions, ses effets et les commandes liées.
          </p>
        </div>
        <div className="wiki-guide-counter">
          <strong>{COMMAND_COUNT}</strong>
          <span>commandes documentées</span>
        </div>
      </div>

      <div className="wiki-guide-search">
        <span>⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Chercher une commande : mine, chenil, guilde, craft…"
        />
        {query && <button onClick={() => setQuery("")}>Effacer</button>}
      </div>

      <div className="wiki-guide-layout">
        <aside className="wiki-group-rail">
          <div className="wiki-rail-title">CATÉGORIES</div>
          {COMMAND_GROUPS.map((group) => (
            <button
              key={group.id}
              className={group.id === groupId && !normalizedQuery ? "selected" : ""}
              onClick={() => chooseGroup(group.id)}
            >
              <span>{group.icon}</span>
              <div>
                <strong>{group.title}</strong>
                <small>{group.commands.length} commande{group.commands.length > 1 ? "s" : ""}</small>
              </div>
            </button>
          ))}
        </aside>

        <main className="wiki-command-browser">
          <div className="wiki-command-list-head">
            <div>
              <p className="eyebrow">{normalizedQuery ? "RÉSULTATS" : `${activeGroup.icon} ${activeGroup.title.toUpperCase()}`}</p>
              <h3>{normalizedQuery ? `${searchResults.length} résultat(s)` : activeGroup.title}</h3>
              <p>{normalizedQuery ? `Recherche : « ${query.trim()} »` : activeGroup.description}</p>
            </div>
          </div>

          <div className="wiki-command-list">
            {activeCommands.map((command) => (
              <button
                key={command.id}
                className={`wiki-command-row ${selectedCommand?.id === command.id ? "selected" : ""}`}
                onClick={() => chooseSearchResult(command)}
              >
                <span className="wiki-command-icon">{command.icon}</span>
                <div className="wiki-command-row-copy">
                  <code>{command.command}</code>
                  <strong>{command.title}</strong>
                  <p>{command.summary}</p>
                </div>
                {command.adminOnly && <span className="wiki-admin-pill">👑 Hime</span>}
                <span className="wiki-row-arrow">›</span>
              </button>
            ))}

            {activeCommands.length === 0 && (
              <div className="wiki-no-result">
                <span>🔎</span>
                <h3>Aucune commande trouvée</h3>
                <p>Essaie un nom plus court ou une autre catégorie.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="wiki-command-detail">
          {selectedCommand ? <CommandDetail command={selectedCommand} /> : null}
        </aside>
      </div>
    </section>
  );
}

function CommandDetail({ command }: { command: CommandGuide }) {
  return (
    <article className="wiki-detail-card">
      <header>
        <div className="wiki-detail-symbol">{command.icon}</div>
        <div>
          <p className="eyebrow">FICHE COMMANDE</p>
          <h2>{command.title}</h2>
          <code>{command.command}</code>
        </div>
      </header>

      {command.adminOnly && (
        <div className="wiki-detail-admin">👑 Commande administrative réservée à Hime-sama</div>
      )}

      <section>
        <h4>À quoi ça sert ?</h4>
        <p>{command.details}</p>
      </section>

      <DetailList icon="⌨️" title="Syntaxe" values={command.usage} code />
      <DetailList icon="🔒" title="Conditions" values={command.prerequisites} />
      <DetailList icon="✨" title="Ce que ça change" values={command.effects} />
      <DetailList icon="💡" title="À savoir" values={command.tips} />
      <DetailList icon="🔗" title="Commandes liées" values={command.related} code />
    </article>
  );
}

function DetailList({
  icon,
  title,
  values,
  code = false,
}: {
  icon: string;
  title: string;
  values?: string[];
  code?: boolean;
}) {
  if (!values?.length) return null;

  return (
    <section className="wiki-detail-list">
      <h4>{icon} {title}</h4>
      <div>
        {values.map((value) =>
          code ? <code key={value}>{value}</code> : <p key={value}>• {value}</p>
        )}
      </div>
    </section>
  );
}
