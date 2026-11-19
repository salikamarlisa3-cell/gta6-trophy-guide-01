// Leonida Legend — the make.fun entry program for gta6-trophy-guide-01
// (Node 22+, standard library only).
//
// What this entry ships is a static, offline trophy guide in app/: plain
// HTML/CSS/JS with no build step, plus the trophy data in
// app/data/trophies.json. This program is the handover step. Before anything
// is copied it validates the trophy data it is about to ship — the guide is
// only worth handing in if the data provably matches the official list's
// shape — then it copies app/ and screenshots/ next to itself into the
// output directory and writes dossier.json there with the vendored
// buildDossier. vendor/makefun-frontend.ts stays byte-for-byte untouched:
// the scorer requires dossier.json to equal what its own copy produces.
//
// Output directory: process.env.MAKEFUN_OUTPUT_DIR ?? '/output'.
// Run locally with:  MAKEFUN_OUTPUT_DIR=/tmp/tg-out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const EXPECTED_TOTAL = 55;
const EXPECTED_GRADES: Record<string, number> = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const EXPECTED_POINTS: Record<string, number> = { platinum: 300, gold: 90, silver: 30, bronze: 15 };

interface TrophyRecord {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  grade?: unknown;
  guide?: unknown;
  points?: unknown;
  sources?: unknown;
}

// Fail-closed validation of app/data/trophies.json: exactly 55 trophies,
// unique non-blank names, an official description and a non-blank guide on
// every entry, sources cited, PSN points consistent with the grade, and the
// grade split summing to 1 platinum / 2 gold / 6 silver / 46 bronze. Any
// deviation throws, so a broken data file can never be handed in silently.
function validateTrophyData(raw: string): { total: number; totalPoints: number } {
  const data = JSON.parse(raw) as { trophies?: unknown };
  if (!data || !Array.isArray(data.trophies)) {
    throw new Error('trophies.json: expected an object with a "trophies" array');
  }
  const list = data.trophies as TrophyRecord[];
  if (list.length !== EXPECTED_TOTAL) {
    throw new Error(`trophies.json: expected ${EXPECTED_TOTAL} trophies, found ${list.length}`);
  }
  const seenNames = new Set<string>();
  const gradeCounts: Record<string, number> = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let totalPoints = 0;
  for (const [index, trophy] of list.entries()) {
    const where = `trophies[${index}]`;
    if (typeof trophy.name !== 'string' || trophy.name.trim() === '') {
      throw new Error(`${where}: name is missing or blank`);
    }
    if (seenNames.has(trophy.name)) {
      throw new Error(`${where}: duplicate trophy name "${trophy.name}"`);
    }
    seenNames.add(trophy.name);
    if (typeof trophy.description !== 'string' || trophy.description.trim() === '') {
      throw new Error(`${where} ("${trophy.name}"): description is missing or blank`);
    }
    if (typeof trophy.guide !== 'string' || trophy.guide.trim() === '') {
      throw new Error(`${where} ("${trophy.name}"): guide is missing or blank`);
    }
    if (!Array.isArray(trophy.sources) || trophy.sources.length === 0) {
      throw new Error(`${where} ("${trophy.name}"): at least one cited source is required`);
    }
    if (typeof trophy.grade !== 'string' || !(trophy.grade in EXPECTED_GRADES)) {
      throw new Error(`${where} ("${trophy.name}"): unknown grade "${String(trophy.grade)}"`);
    }
    gradeCounts[trophy.grade] += 1;
    if (trophy.points !== EXPECTED_POINTS[trophy.grade]) {
      throw new Error(`${where} ("${trophy.name}"): points ${String(trophy.points)} do not match grade ${trophy.grade}`);
    }
    totalPoints += trophy.points as number;
  }
  for (const [grade, expected] of Object.entries(EXPECTED_GRADES)) {
    if (gradeCounts[grade] !== expected) {
      throw new Error(`trophies.json: expected ${expected} ${grade} trophies, found ${gradeCounts[grade]}`);
    }
  }
  return { total: list.length, totalPoints };
}

const summary = validateTrophyData(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
console.log(
  `trophy data OK: ${summary.total} trophies, unique names, every guide written and cited, ` +
  `grades 1 platinum / 2 gold / 6 silver / 46 bronze, ${summary.totalPoints} PSN points total`,
);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier caps exactly as the bounty specifies them.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
