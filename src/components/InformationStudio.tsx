// TAILBLUE_INFORMATION_STUDIO_V1_20260827

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  createInformationItem,
  deleteInformationItem,
  importDiscordUpdates,
  loadDiscordInformationChannels,
  loadInformationAdmin,
  updateInformationItem,
} from "../api/informationApi";

import type {
  AdminRoadmap,
  AdminUpdate,
  AdminWiki,
  DiscordInformationChannel,
  InformationAdminSnapshot,
  InformationKind,
  RoadmapStatus,
  UpdateImportance,
} from "../types/information";

import "./informationStudio.css";

type StudioTab =
  | "updates"
  | "roadmap"
  | "wiki"
  | "discord";

type Props = {
  open: boolean;
  initialTab:
    | "updates"
    | "roadmap"
    | "wiki";
  onClose: () => void;
  onChanged: () => void;
};

const ROADMAP_LABELS: Record<
  RoadmapStatus,
  string
> = {
  current: "En cours",
  next: "Prochaine étape",
  done: "Terminé",
  later: "Plus tard",
  paused: "En attente",
};

// TAILBLUE_INFORMATION_MARKDOWN_PREVIEW_V1_20260827
function renderInlineMarkdown(value: string): string {
  // TAILBLUE_MARKDOWN_PERSIST_V3_20260827
  const normalized = value
    .replace(/^\s*#{1,6}\s+/, "")
    .trim();

  return normalized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

function renderMarkdownBlock(value: string): string {
  const lines = value.replace(/\r/g, "").split("\n");
  const html: string[] = [];

  let inList = false;
  let inQuote = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  const closeQuote = () => {
    if (inQuote) {
      html.push("</blockquote>");
      inQuote = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      closeQuote();
      html.push('<div class="md-space"></div>');
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeList();
      closeQuote();
      html.push("<hr />");
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (heading) {
      closeList();
      closeQuote();

      const level = Math.min(4, heading[1].length);

      html.push(
        `<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`,
      );
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.+)$/);

    if (bullet) {
      closeQuote();

      if (!inList) {
        html.push("<ul>");
        inList = true;
      }

      html.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    const quote = trimmed.match(/^>\s*(.*)$/);

    if (quote) {
      closeList();

      if (!inQuote) {
        html.push("<blockquote>");
        inQuote = true;
      }

      html.push(`<p>${renderInlineMarkdown(quote[1])}</p>`);
      continue;
    }

    closeList();
    closeQuote();
    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  closeQuote();

  return html.join("");
}

function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return (
      <div className="hime-markdown-empty">
        Rien à prévisualiser pour le moment.
      </div>
    );
  }

  return (
    <div
      className="hime-markdown-preview"
      dangerouslySetInnerHTML={{
        __html: renderMarkdownBlock(value),
      }}
    />
  );
}

// TAILBLUE_INFORMATION_TITLE_SUMMARY_PREVIEW_V2_20260827
function MarkdownSingleLineField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [preview, setPreview] = useState(true);

  // TAILBLUE_INFORMATION_NEW_EDITOR_MODE_V4_2_20260827
  // Quand ＋ Nouveau vide le champ, on doit immédiatement
  // repasser en mode édition au lieu d'afficher seulement "—".
  useEffect(() => {
    if (!String(value ?? "").trim()) {
      setPreview(false);
    }
  }, [value]);


  return (
    <label className="wide hime-markdown-field">
      <div className="hime-markdown-field-head">
        <span>{label}</span>

        <button
          type="button"
          className={preview ? "active" : ""}
          onClick={() => setPreview((current) => !current)}
        >
          {preview ? "✏️ Modifier" : "✨ Aperçu formaté"}
        </button>
      </div>

      {preview ? (
        <div
          className="hime-markdown-preview hime-markdown-preview-single"
          dangerouslySetInnerHTML={{
            __html: renderInlineMarkdown(value || "—"),
          }}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function MarkdownEditorField({
  label,
  value,
  rows,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [preview, setPreview] = useState(true);

  // TAILBLUE_INFORMATION_NEW_EDITOR_MODE_V4_2_20260827
  // Quand ＋ Nouveau vide le champ, on doit immédiatement
  // repasser en mode édition au lieu d'afficher seulement "—".
  useEffect(() => {
    if (!String(value ?? "").trim()) {
      setPreview(false);
    }
  }, [value]);


  return (
    <label className="wide hime-markdown-field">
      <div className="hime-markdown-field-head">
        <span>{label}</span>

        <button
          type="button"
          className={preview ? "active" : ""}
          onClick={() => setPreview((current) => !current)}
        >
          {preview ? "✏️ Modifier" : "✨ Aperçu formaté"}
        </button>
      </div>

      {preview ? (
        <MarkdownPreview value={value} />
      ) : (
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}


export default function InformationStudio({
  open,
  initialTab,
  onClose,
  onChanged,
}: Props) {
  const [tab, setTab] =
    useState<StudioTab>(
      initialTab,
    );

  const [snapshot, setSnapshot] =
    useState<InformationAdminSnapshot | null>(
      null,
    );

  const [channels, setChannels] =
    useState<
      DiscordInformationChannel[]
    >([]);

  const [
    discordChannelId,
    setDiscordChannelId,
  ] = useState("");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null,
  );

  // TAILBLUE_ROADMAP_EDIT_IDENTITY_V4_20260827
  const editingIdRef =
    useRef<string | null>(null);

  // TAILBLUE_INFORMATION_EXPLICIT_NEW_MODE_V4_1_20260827
  // Ne plus déduire le mode uniquement depuis editingId :
  // le bouton ＋ Nouveau force explicitement une création.
  const [creatingNew, setCreatingNew] =
    useState(true);

  const [updateForm, setUpdateForm] =
    useState(emptyUpdateForm());

  const [
    roadmapForm,
    setRoadmapForm,
  ] = useState(
    emptyRoadmapForm(),
  );

  const [wikiForm, setWikiForm] =
    useState(emptyWikiForm());

  const [importLimit, setImportLimit] =
    useState(50);

  // TAILBLUE_INFORMATION_IMPORT_FORUM_V3_20260827
  const [
    importDestination,
    setImportDestination,
  ] = useState<
    "updates" | "roadmap" | "wiki"
  >("updates");

  const [
    importRoadmapStatus,
    setImportRoadmapStatus,
  ] = useState<RoadmapStatus>("done");

  useEffect(() => {
    if (!open) return;

    setTab(initialTab);
    editingIdRef.current = null;
    setEditingId(null);
    setCreatingNew(true);
    setError(null);

    void Promise.all([
      loadInformationAdmin(),
      loadDiscordInformationChannels(),
    ])
      .then(
        ([
          next,
          discordChannels,
        ]) => {
          setSnapshot(next);
          setChannels(
            discordChannels,
          );

          const configured =
            next.settings
              .discordChannelId;

          const suggested =
            discordChannels.find(
              (item) =>
                item.suggested,
            )?.id;

          setDiscordChannelId(
            configured ??
              suggested ??
              discordChannels[0]
                ?.id ??
              "",
          );
        },
      )
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Studio Hime indisponible.",
        ),
      );
  }, [
    open,
    initialTab,
  ]);

  const rows = useMemo(() => {
    if (!snapshot) return [];

    if (tab === "updates") {
      return snapshot.updates;
    }

    if (tab === "roadmap") {
      return snapshot.roadmap;
    }

    if (tab === "wiki") {
      return snapshot.wiki;
    }

    return [];
  }, [
    snapshot,
    tab,
  ]);

  async function mutate(
    task: () =>
      Promise<InformationAdminSnapshot>,
  ) {
    setBusy(true);
    setError(null);

    try {
      const next =
        await task();

      setSnapshot(next);
      onChanged();

      setError(
        "✅ Enregistré dans TailBlue.",
      );

      return next;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Action impossible.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    editingIdRef.current = null;
    setEditingId(null);
    setCreatingNew(true);
    setError(null);

    if (tab === "updates") {
      setUpdateForm(
        emptyUpdateForm(),
      );
    } else if (
      tab === "roadmap"
    ) {
      setRoadmapForm(
        emptyRoadmapForm(),
      );
    } else if (
      tab === "wiki"
    ) {
      setWikiForm(
        emptyWikiForm(),
      );
    }
  }

  function edit(
    row:
      | AdminUpdate
      | AdminRoadmap
      | AdminWiki,
  ) {
    const rowId =
      String(row.id ?? "").trim();

    if (!rowId) {
      editingIdRef.current = null;
      setEditingId(null);
      setError(
        "❌ Cet élément n'a pas d'identifiant TailBlue. "
        + "Je refuse de le recréer en doublon.",
      );
      return;
    }

    editingIdRef.current = rowId;
    setEditingId(rowId);
    setCreatingNew(false);
    setError(null);

    if (
      tab === "updates"
    ) {
      const item =
        row as AdminUpdate;

      setUpdateForm({
        title: item.title,
        excerpt:
          item.excerpt,
        body: item.body,
        tag: item.tag,
        importance:
          item.importance,
        images:
          item.images.join(
            "\n",
          ),
        status:
          item.status,
        app:
          item.channels.app,
        discord:
          item.channels.discord,
        notifyApp: false,
      });
    }

    if (
      tab === "roadmap"
    ) {
      const item =
        row as AdminRoadmap;

      setRoadmapForm({
        title: item.title,
        description:
          item.description,
        area:
          item.area ?? "",
        target:
          item.target ?? "",
        status:
          item.status,
        checklist:
          item.checklist
            .map(
              (step) =>
                `${
                  step.done
                    ? "[x]"
                    : "[ ]"
                } ${step.text}`,
            )
            .join("\n"),
        manualProgress:
          item.manual_progress ===
            null ||
          item.manual_progress ===
            undefined
            ? ""
            : String(
                item.manual_progress,
              ),
        app:
          item.channels.app,
        discord:
          item.channels.discord,
        notifyApp: false,
      });
    }

    if (tab === "wiki") {
      const item =
        row as AdminWiki;

      setWikiForm({
        title: item.title,
        summary:
          item.summary,
        body: item.body,
        category:
          item.category,
        tags:
          item.tags.join(
            ", ",
          ),
        status:
          item.status,
        app:
          item.channels.app,
        discord:
          item.channels.discord,
        notifyApp: false,
      });
    }
  }

  async function saveCurrent() {
    if (
      tab === "discord"
    ) {
      return;
    }

    const kind =
      tab as InformationKind;

    let payload:
      Record<
        string,
        unknown
      >;

    if (
      tab === "updates"
    ) {
      payload = {
        ...updateForm,
        images:
          updateForm.images
            .split("\n")
            .map(
              (item) =>
                item.trim(),
            )
            .filter(Boolean),
        channels: {
          app:
            updateForm.app,
          discord:
            updateForm.discord,
        },
        discordChannelId:
          discordChannelId ||
          undefined,
      };
    } else if (
      tab === "roadmap"
    ) {
      payload = {
        title:
          roadmapForm.title,
        description:
          roadmapForm.description,
        area:
          roadmapForm.area,
        target:
          roadmapForm.target,
        status:
          roadmapForm.status,
        checklist:
          parseChecklist(
            roadmapForm.checklist,
          ),
        manualProgress:
          roadmapForm
            .manualProgress ||
          null,
        channels: {
          app:
            roadmapForm.app,
          discord:
            roadmapForm.discord,
        },
        notifyApp:
          roadmapForm.notifyApp,
        discordChannelId:
          discordChannelId ||
          undefined,
      };
    } else {
      payload = {
        ...wikiForm,
        tags:
          wikiForm.tags
            .split(",")
            .map(
              (item) =>
                item.trim(),
            )
            .filter(Boolean),
        channels: {
          app:
            wikiForm.app,
          discord:
            wikiForm.discord,
        },
        discordChannelId:
          discordChannelId ||
          undefined,
      };
    }

    const candidateId =
      editingIdRef.current ??
      editingId;

    const targetId =
      !creatingNew &&
      candidateId &&
      rows.some(
        (row) =>
          String(row.id) ===
          String(candidateId),
      )
        ? String(candidateId)
        : null;

    if (!creatingNew && !targetId) {
      setError(
        "❌ Mode modification sans identifiant valide. "
        + "Resélectionne l'élément : aucun doublon ne sera créé.",
      );
      return;
    }

    const next = await mutate(() =>
      creatingNew
        ? createInformationItem(
            kind,
            payload,
          )
        : updateInformationItem(
            kind,
            targetId as string,
            payload,
          ),
    );

    if (!next) {
      return;
    }

    if (creatingNew) {
      startNew();
    } else {
      editingIdRef.current =
        targetId;
      setEditingId(
        targetId,
      );
      setCreatingNew(false);
    }
  }

  async function removeCurrent(
    id: string,
  ) {
    if (
      tab === "discord"
    ) {
      return;
    }

    if (
      !window.confirm(
        "Supprimer définitivement cet élément du CMS TailBlue ?",
      )
    ) {
      return;
    }

    const next = await mutate(() =>
      deleteInformationItem(
        tab as InformationKind,
        id,
      ),
    );

    if (next) {
      editingIdRef.current = null;
      setEditingId(null);
      startNew();
    }
  }

  async function importDiscord() {
    if (!discordChannelId) {
      setError(
        "Choisis un salon Discord.",
      );
      return;
    }

    const next =
      await mutate(() =>
        importDiscordUpdates(
          discordChannelId,
          importLimit,
          importDestination,
          importRoadmapStatus,
        ),
      );

    if (next?.importResult) {
      setError(
        `✅ ${next.importResult.imported} importée(s), ${
          next.importResult.moved ?? 0
        } déplacée(s), ${next.importResult.skipped} déjà classée(s).`,
      );
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="hime-info-studio-backdrop"
      onMouseDown={(event) => {
        if (
          event.currentTarget ===
          event.target
        ) {
          onClose();
        }
      }}
    >
      <section className="hime-info-studio">
        <header className="hime-info-studio-header">
          <div>
            <p>
              👑 HIME-SAMA
            </p>
            <h1>
              Studio des Informations
            </h1>
            <span>
              Publie et synchronise
              TailBlue sans reconstruire
              l'application.
            </span>
          </div>

          <button
            className="hime-info-close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <nav className="hime-info-tabs">
          <button
            className={
              tab === "updates"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab("updates");
              editingIdRef.current = null;
              setEditingId(null);
              setCreatingNew(true);
              setUpdateForm(emptyUpdateForm());
            }}
          >
            ✨ Nouveautés
          </button>

          <button
            className={
              tab === "roadmap"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab("roadmap");
              editingIdRef.current = null;
              setEditingId(null);
              setCreatingNew(true);
              setRoadmapForm(emptyRoadmapForm());
            }}
          >
            🛣️ Roadmap
          </button>

          <button
            className={
              tab === "wiki"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab("wiki");
              editingIdRef.current = null;
              setEditingId(null);
              setCreatingNew(true);
              setWikiForm(emptyWikiForm());
            }}
          >
            📖 Wiki
          </button>

          <button
            className={
              tab === "discord"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("discord")
            }
          >
            🐰 Import Discord
          </button>
        </nav>

        {error && (
          <div className="hime-info-message">
            {error}
          </div>
        )}

        {tab === "discord" ? (
          <DiscordImport
            channels={
              channels
            }
            channelId={
              discordChannelId
            }
            setChannelId={
              setDiscordChannelId
            }
            limit={
              importLimit
            }
            setLimit={
              setImportLimit
            }
            busy={busy}
            onImport={() =>
              void importDiscord()
            }
            result={
              snapshot?.importResult
            }
            destination={importDestination}
            setDestination={setImportDestination}
            roadmapStatus={importRoadmapStatus}
            setRoadmapStatus={setImportRoadmapStatus}
          />
        ) : (
          <div className="hime-info-workspace">
            <aside className="hime-info-list">
              <div className="hime-info-list-top">
                <strong>
                  {tab ===
                  "updates"
                    ? "Chroniques"
                    : tab ===
                        "roadmap"
                      ? "Étapes"
                      : "Articles"}
                </strong>

                <button
                  onClick={
                    startNew
                  }
                >
                  ＋ Nouveau
                </button>
              </div>

              <div className="hime-info-items">
                {rows.map(
                  (row) => (
                    <button
                      key={
                        row.id
                      }
                      className={
                        editingId ===
                        row.id
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        edit(row)
                      }
                    >
                      <span>
                        {row.title}
                      </span>

                      <small>
                        <StatusBadges
                          tab={
                            tab
                          }
                          row={
                            row
                          }
                        />
                      </small>
                    </button>
                  ),
                )}

                {!rows.length && (
                  <div className="hime-info-empty">
                    Aucun élément.
                  </div>
                )}
              </div>
            </aside>

            <main className="hime-info-editor">
              <div className="hime-info-editor-title">
                <div>
                  <p>
                    {editingId
                      ? "MODIFICATION"
                      : "NOUVEL ÉLÉMENT"}
                  </p>
                  <h2>
                    {tab ===
                    "updates"
                      ? "Nouvelle chronique"
                      : tab ===
                          "roadmap"
                        ? "Étape de roadmap"
                        : "Article Wiki"}
                  </h2>
                </div>

                {editingId && (
                  <button
                    className="danger"
                    onClick={() =>
                      void removeCurrent(
                        editingId,
                      )
                    }
                  >
                    Supprimer
                  </button>
                )}
              </div>

              {tab ===
                "updates" && (
                <UpdateEditor
                  form={
                    updateForm
                  }
                  setForm={
                    setUpdateForm
                  }
                />
              )}

              {tab ===
                "roadmap" && (
                <RoadmapEditor
                  form={
                    roadmapForm
                  }
                  setForm={
                    setRoadmapForm
                  }
                />
              )}

              {tab ===
                "wiki" && (
                <WikiEditor
                  form={
                    wikiForm
                  }
                  setForm={
                    setWikiForm
                  }
                />
              )}

              <PublicationFooter
                channelId={
                  discordChannelId
                }
                channels={
                  channels
                }
                setChannelId={
                  setDiscordChannelId
                }
                busy={busy}
                onSave={() =>
                  void saveCurrent()
                }
              />
            </main>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadges({
  tab,
  row,
}: {
  tab:
    | "updates"
    | "roadmap"
    | "wiki";
  row:
    | AdminUpdate
    | AdminRoadmap
    | AdminWiki;
}) {
  const channels =
    "channels" in row
      ? row.channels
      : {
          app: false,
          discord: false,
        };

  const status =
    "status" in row
      ? row.status
      : "";

  return (
    <>
      <i>
        {tab === "roadmap"
          ? ROADMAP_LABELS[
              status as RoadmapStatus
            ]
          : status ===
              "published"
            ? "Publié"
            : status ===
                "archived"
              ? "Archivé"
              : "Brouillon"}
      </i>

      {channels.app && (
        <i className="app">
          APP
        </i>
      )}

      {channels.discord && (
        <i className="discord">
          DISCORD
        </i>
      )}

      {"imported_from_discord" in
        row &&
        row.imported_from_discord && (
          <i className="imported">
            IMPORTÉ
          </i>
        )}
    </>
  );
}

type UpdateForm = ReturnType<
  typeof emptyUpdateForm
>;

function emptyUpdateForm() {
  return {
    title: "",
    excerpt: "",
    body: "",
    tag: "Mise à jour",
    importance:
      "standard" as UpdateImportance,
    images: "",
    status:
      "draft" as
        | "draft"
        | "published"
        | "archived",
    app: true,
    discord: false,
    notifyApp: true,
  };
}

function UpdateEditor({
  form,
  setForm,
}: {
  form: UpdateForm;
  setForm: Dispatch<SetStateAction<UpdateForm>>;
}) {
  return (
    <div className="hime-info-fields">
      <MarkdownSingleLineField
        label="Titre"
        value={form.title}
        onChange={(value) =>
          setForm({
            ...form,
            title: value,
          })
        }
        placeholder="Ex. Social TailBlue est disponible !"
      />

      <label>
        <span>Tag</span>
        <input
          value={form.tag}
          onChange={(event) =>
            setForm({
              ...form,
              tag:
                event.target.value,
            })
          }
          placeholder="Mise à jour"
        />
      </label>

      <label>
        <span>Importance</span>
        <select
          value={
            form.importance
          }
          onChange={(event) =>
            setForm({
              ...form,
              importance:
                event.target
                  .value as UpdateImportance,
            })
          }
        >
          <option value="info">
            Info
          </option>
          <option value="standard">
            Standard
          </option>
          <option value="important">
            Important
          </option>
          <option value="urgent">
            Urgent
          </option>
          <option value="success">
            Succès
          </option>
        </select>
      </label>

      <label>
        <span>Statut</span>
        <select
          value={form.status}
          onChange={(event) =>
            setForm({
              ...form,
              status:
                event.target
                  .value as UpdateForm["status"],
            })
          }
        >
          <option value="draft">
            Brouillon
          </option>
          <option value="published">
            Publié
          </option>
          <option value="archived">
            Archivé
          </option>
        </select>
      </label>

      <MarkdownEditorField
        label="Résumé"
        rows={3}
        value={form.excerpt}
        onChange={(value) =>
          setForm({
            ...form,
            excerpt: value,
          })
        }
        placeholder="Court résumé visible sur la carte…"
      />

      <MarkdownEditorField
        label="Article"
        rows={11}
        value={form.body}
        onChange={(value) =>
          setForm({
            ...form,
            body: value,
          })
        }
        placeholder="Écris ici la chronique complète…"
      />

      <label className="wide">
        <span>
          Images — une URL
          par ligne
        </span>
        <textarea
          rows={3}
          value={
            form.images
          }
          onChange={(event) =>
            setForm({
              ...form,
              images:
                event.target.value,
            })
          }
          placeholder="https://…/image.png"
        />
      </label>

      <PublishToggles
        app={form.app}
        discord={
          form.discord
        }
        notifyApp={
          form.notifyApp
        }
        setApp={(value) =>
          setForm({
            ...form,
            app: value,
          })
        }
        setDiscord={(value) =>
          setForm({
            ...form,
            discord: value,
          })
        }
        setNotify={(value) =>
          setForm({
            ...form,
            notifyApp: value,
          })
        }
      />
    </div>
  );
}

type RoadmapForm =
  ReturnType<
    typeof emptyRoadmapForm
  >;

function emptyRoadmapForm() {
  return {
    title: "",
    description: "",
    area: "",
    target: "",
    status:
      "later" as RoadmapStatus,
    checklist: "",
    manualProgress: "",
    app: true,
    discord: false,
    notifyApp: true,
  };
}

function parseChecklist(
  value: string,
) {
  return value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line.trim(),
    )
    .filter(Boolean)
    .map((line) => {
      const done =
        /^\[(x|X|✓)\]/.test(
          line,
        );

      const text =
        line.replace(
          /^\[(x|X|✓| )\]\s*/,
          "",
        );

      return {
        text,
        done,
      };
    });
}

function RoadmapEditor({
  form,
  setForm,
}: {
  form: RoadmapForm;
  setForm: Dispatch<SetStateAction<RoadmapForm>>;
}) {
  const parsed =
    parseChecklist(
      form.checklist,
    );

  const calculated =
    form.status === "done"
      ? 100
      : parsed.length
        ? Math.round(
            (parsed.filter(
              (step) =>
                step.done,
            ).length /
              parsed.length) *
              100,
          )
        : form.manualProgress
          ? Number(
              form.manualProgress,
            )
          : 0;

  return (
    <div className="hime-info-fields">
      <MarkdownSingleLineField
        label="Titre"
        value={form.title}
        onChange={(value) =>
          setForm({
            ...form,
            title: value,
          })
        }
        placeholder="Ex. Messagerie TailBlue"
      />

      <label>
        <span>Statut</span>
        <select
          value={form.status}
          onChange={(event) =>
            setForm({
              ...form,
              status:
                event.target
                  .value as RoadmapStatus,
            })
          }
        >
          {Object.entries(
            ROADMAP_LABELS,
          ).map(
            ([
              value,
              label,
            ]) => (
              <option
                key={value}
                value={value}
              >
                {label}
              </option>
            ),
          )}
        </select>
      </label>

      <label>
        <span>Zone</span>
        <input
          value={form.area}
          onChange={(event) =>
            setForm({
              ...form,
              area:
                event.target.value,
            })
          }
          placeholder="Social"
        />
      </label>

      <label>
        <span>Cible / date</span>
        <input
          value={
            form.target
          }
          onChange={(event) =>
            setForm({
              ...form,
              target:
                event.target.value,
            })
          }
          placeholder="Avant bêta / septembre"
        />
      </label>

      <div className="hime-info-progress-preview">
        <span>
          Progression calculée
        </span>
        <strong>
          {Number.isFinite(
            calculated,
          )
            ? Math.max(
                0,
                Math.min(
                  100,
                  calculated,
                ),
              )
            : 0}
          %
        </strong>
      </div>

      <MarkdownEditorField
        label="Description"
        rows={5}
        value={form.description}
        onChange={(value) =>
          setForm({
            ...form,
            description: value,
          })
        }
        placeholder="Ce que cette étape apporte à TailBlue…"
      />

      <label className="wide">
        <span>
          Étapes — utilise
          [x] terminé / [ ]
          à faire
        </span>
        <textarea
          rows={8}
          value={
            form.checklist
          }
          onChange={(event) =>
            setForm({
              ...form,
              checklist:
                event.target.value,
            })
          }
          placeholder={"[x] Backend\n[x] Interface\n[ ] Notifications\n[ ] Tests"}
        />
      </label>

      <label>
        <span>
          Progression manuelle
          (si aucune étape)
        </span>
        <input
          type="number"
          min="0"
          max="100"
          value={
            form.manualProgress
          }
          onChange={(event) =>
            setForm({
              ...form,
              manualProgress:
                event.target.value,
            })
          }
          placeholder="0"
        />
      </label>

      <PublishToggles
        app={form.app}
        discord={
          form.discord
        }
        notifyApp={
          form.notifyApp
        }
        setApp={(value) =>
          setForm({
            ...form,
            app: value,
          })
        }
        setDiscord={(value) =>
          setForm({
            ...form,
            discord: value,
          })
        }
        setNotify={(value) =>
          setForm({
            ...form,
            notifyApp: value,
          })
        }
      />
    </div>
  );
}

type WikiForm =
  ReturnType<
    typeof emptyWikiForm
  >;

function emptyWikiForm() {
  return {
    title: "",
    summary: "",
    body: "",
    category: "Guide",
    tags: "",
    status:
      "draft" as
        | "draft"
        | "published"
        | "archived",
    app: true,
    discord: false,
    notifyApp: true,
  };
}

function WikiEditor({
  form,
  setForm,
}: {
  form: WikiForm;
  setForm: Dispatch<SetStateAction<WikiForm>>;
}) {
  return (
    <div className="hime-info-fields">
      <MarkdownSingleLineField
        label="Titre"
        value={form.title}
        onChange={(value) =>
          setForm({
            ...form,
            title: value,
          })
        }
        placeholder="Ex. Comment fonctionne le parrainage ?"
      />

      <label>
        <span>Catégorie</span>
        <input
          value={
            form.category
          }
          onChange={(event) =>
            setForm({
              ...form,
              category:
                event.target.value,
            })
          }
          placeholder="Guide"
        />
      </label>

      <label>
        <span>Statut</span>
        <select
          value={form.status}
          onChange={(event) =>
            setForm({
              ...form,
              status:
                event.target
                  .value as WikiForm["status"],
            })
          }
        >
          <option value="draft">
            Brouillon
          </option>
          <option value="published">
            Publié
          </option>
          <option value="archived">
            Archivé
          </option>
        </select>
      </label>

      <MarkdownEditorField
        label="Résumé"
        rows={3}
        value={form.summary}
        onChange={(value) =>
          setForm({
            ...form,
            summary: value,
          })
        }
        placeholder="Résumé visible dans le catalogue…"
      />

      <MarkdownEditorField
        label="Article"
        rows={13}
        value={form.body}
        onChange={(value) =>
          setForm({
            ...form,
            body: value,
          })
        }
        placeholder="Guide complet…"
      />

      <label className="wide">
        <span>
          Tags — séparés par
          des virgules
        </span>
        <input
          value={form.tags}
          onChange={(event) =>
            setForm({
              ...form,
              tags:
                event.target.value,
            })
          }
          placeholder="social, amis, messages"
        />
      </label>

      <PublishToggles
        app={form.app}
        discord={
          form.discord
        }
        notifyApp={
          form.notifyApp
        }
        setApp={(value) =>
          setForm({
            ...form,
            app: value,
          })
        }
        setDiscord={(value) =>
          setForm({
            ...form,
            discord: value,
          })
        }
        setNotify={(value) =>
          setForm({
            ...form,
            notifyApp: value,
          })
        }
      />
    </div>
  );
}

function PublishToggles({
  app,
  discord,
  notifyApp,
  setApp,
  setDiscord,
  setNotify,
}: {
  app: boolean;
  discord: boolean;
  notifyApp: boolean;
  setApp: (
    value: boolean,
  ) => void;
  setDiscord: (
    value: boolean,
  ) => void;
  setNotify: (
    value: boolean,
  ) => void;
}) {
  return (
    <div className="hime-info-publish-toggles wide">
      <label>
        <input
          type="checkbox"
          checked={app}
          onChange={(event) =>
            setApp(
              event.target.checked,
            )
          }
        />
        <span>
          <b>📱 APP</b>
          Visible dans TailBlue
        </span>
      </label>

      <label>
        <input
          type="checkbox"
          checked={discord}
          onChange={(event) =>
            setDiscord(
              event.target.checked,
            )
          }
        />
        <span>
          <b>🐰 DISCORD</b>
          Publier / synchroniser
        </span>
      </label>

      <label>
        <input
          type="checkbox"
          checked={
            notifyApp
          }
          onChange={(event) =>
            setNotify(
              event.target.checked,
            )
          }
        />
        <span>
          <b>🔔 NOTIFIER</b>
          Alerter les joueurs
        </span>
      </label>
    </div>
  );
}

function PublicationFooter({
  channelId,
  channels,
  setChannelId,
  busy,
  onSave,
}: {
  channelId: string;
  channels:
    DiscordInformationChannel[];
  setChannelId: (
    value: string,
  ) => void;
  busy: boolean;
  onSave: () => void;
}) {
  return (
    <footer className="hime-info-editor-footer">
      <label>
        <span>
          Salon Discord de
          publication
        </span>
        <select
          value={channelId}
          onChange={(event) =>
            setChannelId(
              event.target.value,
            )
          }
        >
          <option value="">
            Aucun
          </option>

          {channels.map(
            (channel) => (
              <option
                key={
                  channel.id
                }
                value={
                  channel.id
                }
                disabled={!channel.canSend}
              >
                {channel.kind === "forum"
                  ? "📚 "
                  : "#"}
                {channel.name}
                {channel.kind === "forum"
                  ? " · import uniquement"
                  : ""}
                {channel.suggested
                  ? " ★"
                  : ""}
              </option>
            ),
          )}
        </select>
      </label>

      <button
        className="hime-info-save"
        disabled={busy}
        onClick={onSave}
      >
        {busy
          ? "Enregistrement…"
          : "👑 Enregistrer"}
      </button>
    </footer>
  );
}

function DiscordImport({
  channels,
  channelId,
  setChannelId,
  limit,
  setLimit,
  busy,
  onImport,
  result,
  destination,
  setDestination,
  roadmapStatus,
  setRoadmapStatus,
}: {
  channels:
    DiscordInformationChannel[];
  channelId: string;
  setChannelId: (
    value: string,
  ) => void;
  limit: number;
  setLimit: (
    value: number,
  ) => void;
  busy: boolean;
  onImport: () => void;
  result?:
    InformationAdminSnapshot["importResult"];
  destination:
    "updates" | "roadmap" | "wiki";
  setDestination: (
    value: "updates" | "roadmap" | "wiki",
  ) => void;
  roadmapStatus: RoadmapStatus;
  setRoadmapStatus: (
    value: RoadmapStatus,
  ) => void;
}) {
  return (
    <div className="hime-info-import">
      <div className="hime-info-import-copy">
        <p>
          🐰 HISTORIQUE
          DISCORD
        </p>
        <h2>
          Importer les anciennes
          annonces
        </h2>
        <p>
          Choisis le salon où
          tu as déjà publié les
          mises à jour de
          TailBlue. Messages,
          embeds, images,
          dates et auteurs
          seront repris dans
          Nouveautés.
        </p>

        <div className="hime-info-import-safe">
          🔕 Les publications
          historiques importées
          ne déclenchent
          <strong>
            {" "}
            aucune ancienne
            notification
          </strong>
          .
        </div>
      </div>

      <div className="hime-info-import-form">
        <label>
          <span>Salon</span>
          <select
            value={channelId}
            onChange={(event) =>
              setChannelId(
                event.target.value,
              )
            }
          >
            <option value="">
              Choisir…
            </option>

            {channels.map(
              (channel) => (
                <option
                  key={
                    channel.id
                  }
                  value={
                    channel.id
                  }
                  disabled={
                    !channel.canReadHistory
                  }
                >
                  {channel.kind === "forum"
                    ? "📚 "
                    : "#"}
                  {channel.name}
                  {channel.kind === "forum"
                    ? " · Forum"
                    : ""}
                  {channel.suggested
                    ? " ★ suggéré"
                    : ""}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>
            Ranger l'import dans
          </span>

          <select
            value={destination}
            onChange={(event) =>
              setDestination(
                event.target.value as
                  | "updates"
                  | "roadmap"
                  | "wiki",
              )
            }
          >
            <option value="updates">
              ✨ Nouveautés
            </option>
            <option value="roadmap">
              🛣️ Roadmap
            </option>
            <option value="wiki">
              📖 Wiki
            </option>
          </select>
        </label>

        {destination === "roadmap" && (
          <label>
            <span>
              Statut des éléments importés
            </span>

            <select
              value={roadmapStatus}
              onChange={(event) =>
                setRoadmapStatus(
                  event.target.value as RoadmapStatus,
                )
              }
            >
              <option value="current">
                🛠️ En cours
              </option>
              <option value="next">
                ⏭️ Prochaine étape
              </option>
              <option value="done">
                ✅ Terminé
              </option>
              <option value="later">
                🌙 Plus tard
              </option>
              <option value="paused">
                ⏸️ En attente
              </option>
            </select>
          </label>
        )}

        <label>
          <span>
            Nombre de messages / posts
            à parcourir
          </span>
          <input
            type="number"
            min="1"
            max="200"
            value={limit}
            onChange={(event) =>
              setLimit(
                Math.max(
                  1,
                  Math.min(
                    200,
                    Number(
                      event.target
                        .value,
                    ) || 1,
                  ),
                ),
              )
            }
          />
        </label>

        <button
          disabled={
            busy ||
            !channelId
          }
          onClick={onImport}
        >
          {busy
            ? "Import…"
            : "🐰 Importer l'historique"}
        </button>

        {result && (
          <div className="hime-info-import-result">
            ✅{" "}
            {result.imported}
            {
              " "
            }
            importée(s)
            <br />
            🔀{" "}
            {result.moved ?? 0}
            {
              " "
            }
            déplacée(s)
            <br />
            ↪{" "}
            {result.skipped}
            {
              " "
            }
            déjà classée(s)
            {result.sourceType === "forum" && (
              <>
                <br />
                📚 Import depuis un Forum Discord
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
