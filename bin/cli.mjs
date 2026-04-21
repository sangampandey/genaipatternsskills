#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, "..", "skills");
const MANIFEST_PATH = path.join(SKILLS_DIR, "index.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw);
}

function detectTool() {
  if (fs.existsSync(path.join(process.cwd(), ".cursor"))) return "cursor";
  if (fs.existsSync(path.join(process.cwd(), "AGENTS.md"))) return "codex";
  if (fs.existsSync(path.join(process.cwd(), "GEMINI.md"))) return "gemini";
  return "claude";
}

function getInstallPath(tool, slug) {
  switch (tool) {
    case "claude": {
      const home = process.env.HOME || process.env.USERPROFILE || "~";
      const dir = path.join(home, ".claude", "commands");
      fs.mkdirSync(dir, { recursive: true });
      return path.join(dir, `genai-${slug}.md`);
    }
    case "cursor": {
      const dir = path.join(process.cwd(), ".cursor", "rules");
      fs.mkdirSync(dir, { recursive: true });
      return path.join(dir, `genai-${slug}.md`);
    }
    case "codex":
      return path.join(process.cwd(), "AGENTS.md");
    case "gemini":
      return path.join(process.cwd(), "GEMINI.md");
    default:
      return null;
  }
}

function installSkill(slug, tool) {
  const skillPath = path.join(SKILLS_DIR, `${slug}.md`);
  if (!fs.existsSync(skillPath)) {
    console.error(`  Error: skill "${slug}" not found`);
    return false;
  }

  const content = fs.readFileSync(skillPath, "utf-8");
  const destPath = getInstallPath(tool, slug);

  if (tool === "codex" || tool === "gemini") {
    const marker = `<!-- genai-skill: ${slug} -->`;
    const endMarker = `<!-- /genai-skill: ${slug} -->`;
    const block = `\n${marker}\n${content}\n${endMarker}\n`;

    const existing = fs.existsSync(destPath)
      ? fs.readFileSync(destPath, "utf-8")
      : "";

    if (existing.includes(marker)) {
      console.log(`  Skipped ${slug} (already installed)`);
      return true;
    }

    fs.writeFileSync(destPath, existing + block);
  } else {
    fs.writeFileSync(destPath, content);
  }

  return true;
}

function removeSkill(slug, tool) {
  if (tool === "codex" || tool === "gemini") {
    const destPath = getInstallPath(tool, slug);
    if (!fs.existsSync(destPath)) return false;

    const content = fs.readFileSync(destPath, "utf-8");
    const marker = `<!-- genai-skill: ${slug} -->`;
    const endMarker = `<!-- /genai-skill: ${slug} -->`;
    const regex = new RegExp(
      `\\n?${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`,
      "g"
    );
    fs.writeFileSync(destPath, content.replace(regex, ""));
    return true;
  } else {
    const destPath = getInstallPath(tool, slug);
    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
      return true;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdAdd(args, tool) {
  const manifest = loadManifest();
  let slugs = [];

  if (args.includes("--all")) {
    slugs = manifest.skills.map((s) => s.slug);
  } else if (args.includes("--category")) {
    const catIdx = args.indexOf("--category");
    const cat = args[catIdx + 1];
    if (!cat) {
      console.error("Error: --category requires a value");
      process.exit(1);
    }
    slugs = manifest.skills
      .filter((s) => s.category === cat)
      .map((s) => s.slug);
    if (slugs.length === 0) {
      console.error(`Error: no skills found for category "${cat}"`);
      process.exit(1);
    }
  } else {
    slugs = args.filter((a) => !a.startsWith("--"));
  }

  if (slugs.length === 0) {
    console.error("Usage: genai-skills add <slug> [--all] [--category <cat>]");
    process.exit(1);
  }

  const toolName = { claude: "Claude Code", cursor: "Cursor", codex: "Codex", gemini: "Gemini CLI" }[tool];
  console.log(`Installing ${slugs.length} skill(s) for ${toolName}...\n`);

  let installed = 0;
  for (const slug of slugs) {
    if (installSkill(slug, tool)) {
      console.log(`  ✓ ${slug}`);
      installed++;
    }
  }

  console.log(`\n✓ Installed ${installed} skill(s)`);
}

function cmdList() {
  const manifest = loadManifest();
  const byCategory = {};
  for (const s of manifest.skills) {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s);
  }

  console.log(`GenAI Pattern Skills (${manifest.skills.length} available)\n`);

  for (const [cat, skills] of Object.entries(byCategory)) {
    console.log(`  ${cat} (${skills.length})`);
    for (const s of skills) {
      const pad = " ".repeat(Math.max(0, 28 - s.slug.length));
      console.log(`    ${s.slug}${pad}${s.difficulty.padEnd(14)}${s.title}`);
    }
    console.log();
  }
}

function cmdRemove(args, tool) {
  const slugs = args.filter((a) => !a.startsWith("--"));
  if (slugs.length === 0) {
    console.error("Usage: genai-skills remove <slug>");
    process.exit(1);
  }

  for (const slug of slugs) {
    if (removeSkill(slug, tool)) {
      console.log(`  ✓ Removed ${slug}`);
    } else {
      console.log(`  Skipped ${slug} (not installed)`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0];
const restArgs = args.slice(1);

// Parse --tool flag
let tool = null;
const toolIdx = restArgs.indexOf("--tool");
if (toolIdx !== -1) {
  tool = restArgs[toolIdx + 1];
  restArgs.splice(toolIdx, 2);
}
if (!tool) tool = detectTool();

switch (command) {
  case "add":
    cmdAdd(restArgs, tool);
    break;
  case "list":
    cmdList();
    break;
  case "remove":
    cmdRemove(restArgs, tool);
    break;
  default:
    console.log(`genai-skills — Install GenAI pattern skills

Usage:
  genai-skills add <slug>              Install a skill
  genai-skills add --all               Install all skills
  genai-skills add --category <cat>    Install by category
  genai-skills list                    List available skills
  genai-skills remove <slug>           Remove a skill

Options:
  --tool <tool>    Target tool: claude, cursor, codex, gemini (auto-detected)

Examples:
  npx genai-skills add basic-rag
  npx genai-skills add --all --tool cursor
  npx genai-skills add --category rag
`);
}
