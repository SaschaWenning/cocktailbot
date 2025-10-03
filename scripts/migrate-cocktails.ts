/**
 * Einmaliges Migrationsskript:
 * - wandelt recipe-Items mit { type: "manual" } in { manual: true } um
 * - vereinheitlicht "instruction" -> "instructions"
 * Ausführen:
 *   node scripts/migrate-cocktails.ts
 */
import fs from "node:fs"
import path from "node:path"

const DATA_FILE = path.join(process.cwd(), "data", "cocktails.json")

if (!fs.existsSync(DATA_FILE)) {
  console.error("Datei nicht gefunden:", DATA_FILE)
  process.exit(1)
}

const raw = fs.readFileSync(DATA_FILE, "utf8")
const data = JSON.parse(raw)
if (!Array.isArray(data?.cocktails)) {
  console.error("Unerwartetes Format in data/cocktails.json (fehlendes 'cocktails'-Array).")
  process.exit(1)
}

function normalizeItem(it: any) {
  const isManual = it?.manual === true || (typeof it?.type === "string" && it.type.toLowerCase() === "manual")
  const instructions =
    (typeof it?.instructions === "string" && it.instructions) ||
    (typeof it?.instruction === "string" && it.instruction) ||
    ""
  const out: any = {
    ingredientId: String(it?.ingredientId ?? ""),
    amount: Number(it?.amount ?? 0),
  }
  if (isManual) out.manual = true
  if (instructions) out.instructions = instructions
  if (it?.delayed) out.delayed = true
  return out
}

let changed = 0
for (const c of data.cocktails) {
  if (!Array.isArray(c?.recipe)) continue
  const before = JSON.stringify(c.recipe)
  c.recipe = c.recipe.map(normalizeItem)
  const after = JSON.stringify(c.recipe)
  if (before !== after) changed++
}

fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
console.log(`Migration abgeschlossen. Geänderte Cocktails: ${changed}`)
