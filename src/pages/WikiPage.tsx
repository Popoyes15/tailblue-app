import { useMemo, useState, type ChangeEvent } from "react";
import { ALL_COMMANDS, COMMAND_COUNT, COMMAND_GROUPS, GROUP_COUNT } from "../data/commandGuideData";
import type { CommandGuide } from "../types/information";
import "./informationFinal.css";

export default function WikiPage() {
  const [groupId, setGroupId] = useState(COMMAND_GROUPS[0]?.id ?? "depart");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(COMMAND_GROUPS[0]?.commands[0]?.id ?? "start");

  const normalized = query.trim().toLocaleLowerCase("fr");
  const currentGroup = COMMAND_GROUPS.find((group) => group.id === groupId) ?? COMMAND_GROUPS[0];

  const visible = useMemo(() => {
    if (!normalized) return currentGroup.commands.map((command) => ({ ...command, groupTitle: currentGroup.title, groupIcon: currentGroup.icon }));
    return ALL_COMMANDS.filter((command) =>
      [command.command, command.title, command.summary, command.groupTitle]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(normalized),
    );
  }, [currentGroup, normalized]);

  const selected =
    visible.find((command) => command.id === selectedId) ??
    visible[0] ??
    currentGroup.commands[0] ??
    null;

  function chooseGroup(nextId: string) {
    const group = COMMAND_GROUPS.find((item) => item.id === nextId);
    if (!group) return;
    setGroupId(nextId);
    setQuery("");
    setSelectedId(group.commands[0]?.id ?? "");
  }

  return (
    <section className="info-page wiki-final-page">
      <header className="info-heading">
        <div>
          <p className="info-eyebrow">📖 GUIDE OFFICIEL DU ROYAUME</p>
          <h1>Wiki TailBlue</h1>
          <p>
            Le catalogue public reprend <strong>tout le HELP_DATA de <code>!helpme</code></strong> :
            aucune catégorie et aucune commande du guide Discord n'est volontairement retirée.
          </p>
        </div>
        <div className="info-heading-pills">
          <span>✅ {COMMAND_COUNT} commandes</span>
          <span>📚 {GROUP_COUNT} catégories</span>
          <span>🐰 Source : !helpme</span>
        </div>
      </header>

      <div className="wiki-search-final">
        <span>⌕</span>
        <input
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          placeholder="Rechercher une commande, une fonction ou une catégorie…"
          aria-label="Rechercher dans le Wiki TailBlue"
        />
        {query && <button onClick={() => setQuery("")}>Effacer</button>}
      </div>

      <div className="wiki-final-layout">
        <nav className="wiki-category-rail" aria-label="Catégories du guide TailBlue">
          <p>CATÉGORIES</p>
          {COMMAND_GROUPS.map((group) => (
            <button
              key={group.id}
              className={!normalized && group.id === currentGroup.id ? "selected" : ""}
              onClick={() => chooseGroup(group.id)}
            >
              <span>{group.icon}</span>
              <strong>{group.title}</strong>
              <em>{group.commands.length}</em>
            </button>
          ))}
        </nav>

        <main className="wiki-command-browser">
          <div className="wiki-browser-top">
            <div>
              <p className="info-eyebrow">{normalized ? "RÉSULTATS" : `${currentGroup.icon} ${currentGroup.title.toUpperCase()}`}</p>
              <h2>{normalized ? `${visible.length} résultat(s)` : currentGroup.title}</h2>
              <p>{normalized ? `Recherche dans les ${COMMAND_COUNT} commandes de !helpme.` : currentGroup.description}</p>
            </div>
          </div>

          <div className="wiki-command-list">
            {visible.map((command) => (
              <button
                key={`${command.groupTitle}-${command.id}`}
                className={selected?.id === command.id ? "selected" : ""}
                onClick={() => setSelectedId(command.id)}
              >
                <span className="wiki-command-icon">{command.icon}</span>
                <span className="wiki-command-copy">
                  <code>{command.command}</code>
                  <strong>{command.title}</strong>
                  <small>{command.summary}</small>
                </span>
                {normalized && <span className="wiki-command-group">{command.groupIcon} {command.groupTitle}</span>}
                <span className="wiki-command-arrow">›</span>
              </button>
            ))}

            {!visible.length && (
              <div className="wiki-empty-final">
                <span>🔎</span>
                <h3>Aucune commande trouvée</h3>
                <p>Essaie un nom comme « guilde », « cookie », « maison » ou « mariage ».</p>
              </div>
            )}
          </div>
        </main>

        <aside className="wiki-detail-final">
          {selected ? <CommandDetail command={selected} /> : <div className="wiki-empty-final">Sélectionne une commande.</div>}
        </aside>
      </div>

      <footer className="wiki-source-note">
        <span>ℹ️</span>
        <p>
          Ce Wiki est le miroir du guide public <code>!helpme</code>. Les commandes administratives de
          <code> !himehelp</code> restent séparées : elles appartiennent au Hime Control et leurs permissions
          devront rester validées côté backend.
        </p>
      </footer>
    </section>
  );
}

function CommandDetail({ command }: { command: CommandGuide & { groupTitle?: string; groupIcon?: string } }) {
  return (
    <article className="wiki-detail-card-final">
      <header>
        <span>{command.icon}</span>
        <div>
          <p className="info-eyebrow">{command.groupIcon} {command.groupTitle ?? "TAILBLUE"}</p>
          <h2>{command.title}</h2>
          <code>{command.command}</code>
        </div>
      </header>
      <section>
        <h3>À quoi ça sert ?</h3>
        <p>{command.details}</p>
      </section>
      <section>
        <h3>Syntaxe officielle</h3>
        {command.usage.map((usage) => <code key={usage}>{usage}</code>)}
      </section>
      <section>
        <h3>Description de !helpme</h3>
        <p>{command.summary}</p>
      </section>
      <footer>✅ Commande présente dans le guide public TailBlue</footer>
    </article>
  );
}
