import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cwd = process.cwd();
const publicDir = path.join(cwd, "public");
const output = path.join(cwd, "src", "services", "mineAudioManifest.generated.ts");
const extensions = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (extensions.has(path.extname(entry.name).toLowerCase())) result.push(full);
  }
  return result;
}

const files = walk(publicDir)
  .map((full) => "/" + path.relative(publicDir, full).split(path.sep).map(encodeURIComponent).join("/"))
  .sort((a, b) => a.localeCompare(b));

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(
  output,
  `// Généré automatiquement depuis public/ le ${new Date().toISOString()}\n` +
  `export const MINE_AUDIO_FILES: readonly string[] = ${JSON.stringify(files, null, 2)} as const;\n`,
  "utf8",
);

console.log(`✅ Manifest audio TailBlue : ${files.length} fichier(s) détecté(s).`);
for (const file of files) console.log(`   ${file}`);
if (!files.length) {
  console.warn("⚠️ Aucun fichier audio trouvé dans public/. Vérifie que tes .mp3/.wav/.ogg sont bien dans le projet frontend.");
}
