/**
 * Guardián de fronteras FSD.
 *
 * Falla si se viola la regla de dependencias de Feature-Sliced Design:
 *
 *   1. Un slice no puede importar de otro slice del MISMO layer
 *      (`entities/incident` → `entities/user` está prohibido).
 *   2. Un layer no puede importar de un layer SUPERIOR
 *      (`shared` → `entities` está prohibido; `entities` → `features`, etc.).
 *
 * Sin esta comprobación la arquitectura se degrada sola: basta un import
 * cómodo para que `shared` empiece a conocer dominios.
 *
 * Uso:  node scripts/check-fsd-boundaries.mjs
 * Sale con código 1 si hay violaciones, para poder encadenarlo en CI.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

/** Layers de abajo hacia arriba: cada uno sólo puede importar de los anteriores. */
const LAYERS = ["shared", "entities", "features", "widgets", "pages", "app"];

/** Prefijos de alias que apuntan a cada layer. */
const ALIAS_LAYER = {
  "@shared": "shared",
  "@entities": "entities",
  "@features": "features",
  "@widgets": "widgets",
  "@pages": "pages",
};

/** Rutas legacy: todavía no son capas FSD, se ignoran hasta que migren. */
const LEGACY = [path.join(SRC, "core"), path.join(SRC, "modules"), path.join(SRC, "providers")];

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
};

const layerOf = (file) => {
  const rel = path.relative(SRC, file);
  const [first, second] = rel.split(path.sep);
  return LAYERS.includes(first) ? { layer: first, slice: second && !second.endsWith(".ts") ? second : "(raíz)" } : null;
};

const IMPORT_RE = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

const violations = [];

for (const layer of LAYERS) {
  const dir = path.join(SRC, layer);
  let files;
  try {
    files = walk(dir);
  } catch {
    continue; // el layer aún no existe
  }

  for (const file of files) {
    if (LEGACY.some((l) => file.startsWith(l))) continue;

    const from = layerOf(file);
    if (!from) continue;
    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(IMPORT_RE)) {
      const spec = match[1];

      // ── Regla 1: imports entre slices del mismo layer ──
      for (const [alias, targetLayer] of Object.entries(ALIAS_LAYER)) {
        if (!spec.startsWith(alias + "/")) continue;
        const rest = spec.slice(alias.length + 1);

        if (targetLayer === from.layer) {
          const targetSlice = rest.split("/")[0];
          if (targetSlice !== from.slice) {
            violations.push({
              rule: "slice cruzado",
              file,
              spec,
              detail: `${from.layer}/${from.slice} → ${targetLayer}/${targetSlice} (mismo layer)`,
            });
          }
        }

        // ── Regla 2: importar de un layer superior ──
        const fromIdx = LAYERS.indexOf(from.layer);
        const toIdx = LAYERS.indexOf(targetLayer);
        if (toIdx > fromIdx) {
          violations.push({
            rule: "layer superior",
            file,
            spec,
            detail: `${from.layer} → ${targetLayer} (${targetLayer} está por encima)`,
          });
        }
      }
    }
  }
}

if (violations.length === 0) {
  console.log("✓ Fronteras FSD respetadas");
  process.exit(0);
}

console.error(`✗ ${violations.length} violación(es) de fronteras FSD:\n`);
for (const v of violations) {
  console.error(`  [${v.rule}] ${path.relative(ROOT, v.file)}`);
  console.error(`      import "${v.spec}"  →  ${v.detail}\n`);
}
process.exit(1);
