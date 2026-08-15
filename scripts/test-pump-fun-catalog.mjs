#!/usr/bin/env node

/**
 * Durable proof that the official pump-fun skill collection is cataloged,
 * categorized Solana / Blockchain, grouped in Pump.fun family lists, and
 * one-shot installable. Drives catalog.json + bin/skills.mjs (not a reimplementation).
 */

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { categorize, normalizeText, parseFrontmatter, sourceFamily } from "./build-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILLS_ROOT = path.join(ROOT, "skills");
const INSTALLER = path.join(ROOT, "bin", "skills.mjs");
const EXPECTED_CATEGORY = "Solana / Blockchain";

export const PUMP_FUN_SLUGS = [
  "pump-fun/coin-fees",
  "pump-fun/create-coin",
  "pump-fun/interacting",
  "pump-fun/swap",
  "pump-fun/tokenized-agents",
];

export async function loadLivePumpFunSkills(skillsRoot = SKILLS_ROOT) {
  const skills = [];
  for (const slug of PUMP_FUN_SLUGS) {
    const skillPath = path.join(skillsRoot, slug, "SKILL.md");
    if (!existsSync(skillPath)) {
      throw new Error(`missing catalog source SKILL.md: skills/${slug}/SKILL.md`);
    }
    const content = await readFile(skillPath, "utf8");
    const frontmatter = parseFrontmatter(content);
    skills.push({
      slug,
      skillPath,
      name: normalizeText(frontmatter.name) || slug,
      description: normalizeText(frontmatter.description),
    });
  }
  return skills;
}

export async function loadCatalog(catalogPath = path.join(ROOT, "catalog.json")) {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  if (!Array.isArray(catalog)) throw new Error("catalog.json must be an array");
  return catalog;
}

export function assertPumpFunCataloged(catalog, liveSkills) {
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  const missing = [];
  const mismatches = [];

  for (const live of liveSkills) {
    const entry = bySlug.get(live.slug);
    if (!entry) {
      missing.push(live.slug);
      continue;
    }
    const classified = categorize(
      { slug: live.slug, name: live.name, description: live.description },
      new Map(),
    );
    if (classified !== EXPECTED_CATEGORY) {
      mismatches.push(`${live.slug}: categorize() returned ${JSON.stringify(classified)}`);
    }
    if (sourceFamily(live.slug) !== "pump/pumpfun/*") {
      mismatches.push(`${live.slug}: sourceFamily() returned ${JSON.stringify(sourceFamily(live.slug))}`);
    }
    if (entry.category !== EXPECTED_CATEGORY) {
      mismatches.push(`${live.slug}: category ${JSON.stringify(entry.category)} !== ${JSON.stringify(EXPECTED_CATEGORY)}`);
    }
    if (entry.name !== live.name) {
      mismatches.push(`${live.slug}: catalog name ${JSON.stringify(entry.name)} !== live ${JSON.stringify(live.name)}`);
    }
    if (entry.description !== live.description) {
      mismatches.push(`${live.slug}: catalog description does not match live SKILL.md frontmatter`);
    }
  }

  if (missing.length > 0) {
    throw new Error(`catalog.json missing pump-fun slugs: ${missing.join(", ")}`);
  }
  if (mismatches.length > 0) {
    throw new Error(`catalog.json pump-fun mismatches:\n  - ${mismatches.join("\n  - ")}`);
  }

  return { present: liveSkills.length, totalCatalog: catalog.length };
}

function runInstaller(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [INSTALLER, ...args], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

export async function installPumpFunToTemp(slugs = PUMP_FUN_SLUGS) {
  const target = await mkdtemp(path.join(os.tmpdir(), "skillhub-pump-fun-"));
  try {
    const result = await runInstaller(["install", "--target", target, "--force", ...slugs]);
    if (result.code !== 0) {
      throw new Error(
        `installer exited ${result.code}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
      );
    }
    const missing = slugs.filter((slug) => !existsSync(path.join(target, slug, "SKILL.md")));
    if (missing.length > 0) {
      throw new Error(`install missing SKILL.md for: ${missing.join(", ")}`);
    }
    return { target, installed: slugs.length, stdout: result.stdout };
  } catch (error) {
    await rm(target, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

async function assertPumpFunGroupings(liveSkills) {
  const skillsSh = JSON.parse(await readFile(path.join(ROOT, "skills.sh.json"), "utf8"));
  const solanaGroup = (skillsSh.groupings || []).find((group) => group.title === EXPECTED_CATEGORY);
  if (!solanaGroup) {
    throw new Error("skills.sh.json missing Solana / Blockchain grouping");
  }
  const grouped = new Set(solanaGroup.skills);
  const missing = liveSkills.map((skill) => skill.slug).filter((slug) => !grouped.has(slug));
  if (missing.length > 0) {
    throw new Error(`skills.sh.json Solana grouping missing: ${missing.join(", ")}`);
  }

  const registry = JSON.parse(
    await readFile(path.join(ROOT, "public", ".well-known", "onchain-skill-registry.json"), "utf8"),
  );
  const registrySlugs = new Set((registry.skills || []).map((skill) => skill.slug));
  const registryMissing = liveSkills.map((skill) => skill.slug).filter((slug) => !registrySlugs.has(slug));
  if (registryMissing.length > 0) {
    throw new Error(`onchain registry missing: ${registryMissing.join(", ")}`);
  }
  if (registry.totalSkills !== (await loadCatalog()).length) {
    throw new Error(`onchain registry totalSkills ${registry.totalSkills} !== catalog length`);
  }

  const publicMissing = liveSkills
    .map((skill) => skill.slug)
    .filter((slug) => !existsSync(path.join(ROOT, "public", "api", "skills", ...slug.split("/"), "SKILL.md")));
  if (publicMissing.length > 0) {
    throw new Error(`public API SKILL.md missing: ${publicMissing.join(", ")}`);
  }

  return { registryTotal: registry.totalSkills };
}

async function main() {
  const liveSkills = await loadLivePumpFunSkills();
  const catalog = await loadCatalog();
  const inclusion = await assertPumpFunCataloged(catalog, liveSkills);
  const grouping = await assertPumpFunGroupings(liveSkills);

  const first = await installPumpFunToTemp();
  await rm(first.target, { recursive: true, force: true });
  const second = await installPumpFunToTemp();
  await rm(second.target, { recursive: true, force: true });

  console.log(
    `Pump-fun catalog test passed: ${inclusion.present} slugs in catalog (${inclusion.totalCatalog} total, registry ${grouping.registryTotal}); installed twice via bin/skills.mjs.`,
  );
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
