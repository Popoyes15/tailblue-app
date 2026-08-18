import fs from "node:fs/promises";
import path from "node:path";

const repo = process.env.GITHUB_REPOSITORY || "Popoyes15/tailblue-app";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!token) {
  console.error("GITHUB_TOKEN/GH_TOKEN manquant.");
  process.exit(1);
}

const [owner, name] = repo.split("/");
if (!owner || !name) {
  console.error(`GITHUB_REPOSITORY invalide: ${repo}`);
  process.exit(1);
}

const PHASES = [
  {
    label: "phase:fondations",
    icon: "✦",
    title: "Fondations de TailBlue",
    description:
      "La base de l'expérience desktop, l'identité visuelle et les systèmes essentiels.",
  },
  {
    label: "phase:aventure",
    icon: "⚔",
    title: "Aventure & combat",
    description:
      "Mine, exploration, combats, compagnons et boucles de jeu.",
  },
  {
    label: "phase:backend",
    icon: "⌁",
    title: "Backend réel",
    description:
      "Connexion de l'application aux données et actions réelles de TailBlue.",
  },
  {
    label: "phase:distribution",
    icon: "⇧",
    title: "Distribution",
    description:
      "Installation, connexion persistante, mises à jour et builds desktop.",
  },
  {
    label: "phase:royaume",
    icon: "♕",
    title: "Le royaume grandit",
    description:
      "Les futurs systèmes, contenus, événements et extensions de TailBlue.",
  },
];

async function github(pathname) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "tailblue-roadmap-builder",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API ${response.status} ${response.statusText}\n${body}`,
    );
  }

  return response.json();
}

async function getAllRoadmapIssues() {
  const issues = [];

  for (let page = 1; ; page += 1) {
    const batch = await github(
      `/repos/${owner}/${name}/issues?state=all&labels=roadmap&per_page=100&page=${page}&sort=created&direction=asc`,
    );

    const pureIssues = batch.filter((issue) => !issue.pull_request);
    issues.push(...pureIssues);

    if (batch.length < 100) break;
  }

  return issues;
}

function labelNames(issue) {
  return issue.labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean);
}

function statusFor(issue, labels) {
  if (issue.state === "closed") return "done";
  if (labels.includes("status:doing")) return "doing";
  return "todo";
}

function sortKey(issue, labels) {
  const order = labels.find((label) => /^order:\d+$/i.test(label));
  if (!order) return issue.number;
  return Number(order.split(":")[1]) || issue.number;
}

const issues = await getAllRoadmapIssues();

const existingRoadmapPath = path.resolve("docs/roadmap.json");
let fallback = null;

try {
  fallback = JSON.parse(await fs.readFile(existingRoadmapPath, "utf8"));
} catch {
  fallback = null;
}

if (issues.length === 0) {
  if (fallback?.phases?.length) {
    console.log(
      "Aucune Issue labellisée roadmap : conservation du roadmap.json existant.",
    );
    process.exit(0);
  }

  console.error(
    "Aucune Issue labellisée roadmap et aucun roadmap.json de secours.",
  );
  process.exit(1);
}

const phases = PHASES.map((phase) => {
  const phaseIssues = issues
    .map((issue) => {
      const labels = labelNames(issue);
      return { issue, labels };
    })
    .filter(({ labels }) => labels.includes(phase.label))
    .sort(
      (a, b) =>
        sortKey(a.issue, a.labels) - sortKey(b.issue, b.labels),
    );

  return {
    icon: phase.icon,
    title: phase.title,
    description: phase.description,
    items: phaseIssues.map(({ issue, labels }) => ({
      label: issue.title,
      status: statusFor(issue, labels),
      issue: issue.number,
      url: issue.html_url,
    })),
  };
}).filter((phase) => phase.items.length > 0);

const unphased = issues
  .map((issue) => ({ issue, labels: labelNames(issue) }))
  .filter(
    ({ labels }) =>
      !PHASES.some((phase) => labels.includes(phase.label)),
  );

if (unphased.length > 0) {
  phases.push({
    icon: "◇",
    title: "Autres évolutions",
    description:
      "Éléments Roadmap qui n'ont pas encore été classés dans une phase.",
    items: unphased.map(({ issue, labels }) => ({
      label: issue.title,
      status: statusFor(issue, labels),
      issue: issue.number,
      url: issue.html_url,
    })),
  });
}

const output = {
  generatedFrom: `${owner}/${name} issues`,
  updated: new Date().toISOString(),
  phases,
};

await fs.writeFile(
  existingRoadmapPath,
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);

console.log(
  `Roadmap générée : ${issues.length} issue(s), ${phases.length} phase(s).`,
);
