#!/usr/bin/env node

/**
 * Evaluate generated skill files for quality and spec compliance.
 *
 * Usage: node scripts/eval-skills.mjs
 *
 * Runs three eval suites:
 * 1. Structure eval — every skill has required sections, frontmatter, reasonable length
 * 2. Trigger eval — description field contains actionable keywords for agent matching
 * 3. Content quality eval — sections are distinct, non-empty, and well-formed
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, "..", "public", "skills");
const MANIFEST_PATH = path.join(SKILLS_DIR, "index.json");

// ---------------------------------------------------------------------------
// Load skills
// ---------------------------------------------------------------------------

function loadSkills() {
  const files = fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(SKILLS_DIR, file), "utf-8");
    return { file, raw };
  });
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
}

// ---------------------------------------------------------------------------
// Parse skill file
// ---------------------------------------------------------------------------

function parseSkill(raw) {
  const result = {
    hasFrontmatter: false,
    name: null,
    description: null,
    sections: {},
    sectionOrder: [],
    totalLines: raw.split("\n").length,
  };

  // Check YAML frontmatter
  if (raw.startsWith("---\n")) {
    const endIdx = raw.indexOf("\n---\n", 4);
    if (endIdx !== -1) {
      result.hasFrontmatter = true;
      const fm = raw.slice(4, endIdx);
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      if (nameMatch) result.name = nameMatch[1].trim();

      // Description can be multi-line with >-
      const descMatch = fm.match(/description:\s*>-\n\s+([\s\S]*?)(?=\n\w|$)/);
      if (descMatch) {
        result.description = descMatch[1].replace(/\n\s+/g, " ").trim();
      } else {
        const simpleDesc = fm.match(/^description:\s*(.+)$/m);
        if (simpleDesc) result.description = simpleDesc[1].trim();
      }
    }
  }

  // Parse sections
  const sectionRegex = /^## (.+)$/gm;
  let match;
  const sectionStarts = [];
  while ((match = sectionRegex.exec(raw)) !== null) {
    sectionStarts.push({ name: match[1], index: match.index });
  }

  for (let i = 0; i < sectionStarts.length; i++) {
    const start = sectionStarts[i].index;
    const end = i + 1 < sectionStarts.length ? sectionStarts[i + 1].index : raw.length;
    const content = raw.slice(start, end).replace(/^## .+\n/, "").trim();
    result.sections[sectionStarts[i].name] = content;
    result.sectionOrder.push(sectionStarts[i].name);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Eval 1: Structure
// ---------------------------------------------------------------------------

const REQUIRED_SECTIONS = [
  "What This Pattern Solves",
  "When to Use This Skill",
  "Architecture Rules",
  "Implementation Steps",
  "Code Template",
  "Verification Checklist",
];

function evalStructure(file, parsed) {
  const issues = [];

  // Frontmatter
  if (!parsed.hasFrontmatter) {
    issues.push("CRITICAL: Missing YAML frontmatter");
  } else {
    if (!parsed.name) issues.push("CRITICAL: Missing 'name' in frontmatter");
    if (!parsed.description) issues.push("CRITICAL: Missing 'description' in frontmatter");
    if (parsed.name && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(parsed.name)) {
      issues.push(`WARN: Name '${parsed.name}' doesn't match spec (lowercase, hyphens only)`);
    }
  }

  // Required sections
  for (const section of REQUIRED_SECTIONS) {
    if (!parsed.sections[section]) {
      issues.push(`CRITICAL: Missing section: "${section}"`);
    } else if (parsed.sections[section].length < 20) {
      issues.push(`WARN: Section "${section}" is very short (${parsed.sections[section].length} chars)`);
    }
  }

  // Length check (under 500 lines recommended)
  if (parsed.totalLines > 500) {
    issues.push(`WARN: ${parsed.totalLines} lines (recommended: <500)`);
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Eval 2: Trigger quality (description field)
// ---------------------------------------------------------------------------

function evalTrigger(file, parsed) {
  const issues = [];
  const desc = parsed.description;
  if (!desc) return ["CRITICAL: No description to evaluate"];

  // Length check (should be 50-200 chars for good triggering)
  if (desc.length < 50) {
    issues.push(`WARN: Description too short (${desc.length} chars) — may not trigger reliably`);
  }
  if (desc.length > 1024) {
    issues.push(`WARN: Description exceeds 1024 char spec limit (${desc.length} chars)`);
  }

  // Must describe WHAT (action verb)
  const actionVerbs = /\b(implement|build|create|design|set up|configure|add|integrate|deploy)\b/i;
  if (!actionVerbs.test(desc)) {
    issues.push("WARN: Description lacks action verb (implement, build, create, etc.)");
  }

  // Must describe WHEN (use case keywords)
  const whenKeywords = /\b(use when|use for|when working with|when you need)\b/i;
  if (!whenKeywords.test(desc)) {
    issues.push("WARN: Description lacks trigger keywords (use when, use for, when working with)");
  }

  // Should include domain keywords for matching
  const hasKeywords = /\b(RAG|retrieval|agent|prompt|routing|safety|guard|eval|cost|memory|LLM|AI)\b/i;
  if (!hasKeywords.test(desc)) {
    issues.push("WARN: Description lacks domain keywords for agent matching");
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Eval 3: Content quality
// ---------------------------------------------------------------------------

function evalContent(file, parsed) {
  const issues = [];

  // Architecture Rules vs Implementation Steps should be DIFFERENT
  const archRules = parsed.sections["Architecture Rules"] || "";
  const implSteps = parsed.sections["Implementation Steps"] || "";

  if (archRules && implSteps) {
    // Check if they share >70% of content (bad — they should be distinct)
    const archLines = archRules.split("\n").filter((l) => l.trim().length > 20);
    const implLines = implSteps.split("\n").filter((l) => l.trim().length > 20);
    let overlap = 0;
    for (const al of archLines) {
      for (const il of implLines) {
        // Check if implementation line contains the full architecture line
        if (il.includes(al.replace(/^- /, "").slice(0, 40))) {
          overlap++;
          break;
        }
      }
    }
    const overlapRatio = archLines.length > 0 ? overlap / archLines.length : 0;
    if (overlapRatio > 0.7) {
      issues.push(`IMPORTANT: Architecture Rules and Implementation Steps are >70% identical (${Math.round(overlapRatio * 100)}% overlap)`);
    }
  }

  // Verification Checklist should have actionable items
  const checklist = parsed.sections["Verification Checklist"] || "";
  if (checklist) {
    const checkItems = checklist.split("\n").filter((l) => l.startsWith("- [ ]"));
    if (checkItems.length < 3) {
      issues.push(`WARN: Only ${checkItems.length} checklist items (recommend 3+)`);
    }
    // Check for overly long items (paragraphs, not checks)
    for (const item of checkItems) {
      if (item.length > 150) {
        issues.push(`WARN: Checklist item too long (${item.length} chars): "${item.slice(0, 60)}..."`);
      }
    }
  }

  // When to Use should exist and be substantial
  const whenToUse = parsed.sections["When to Use This Skill"] || "";
  if (whenToUse.length < 50) {
    issues.push("WARN: 'When to Use This Skill' section is too thin — hurts triggering");
  }

  // Code Template should have a code block or a reference link
  const codeTemplate = parsed.sections["Code Template"] || "";
  if (codeTemplate && !codeTemplate.includes("```") && !codeTemplate.includes("genaipatterns.dev")) {
    issues.push("WARN: Code Template has no code block or reference link");
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Eval 4: Trigger accuracy simulation
// ---------------------------------------------------------------------------

// Test prompts that SHOULD trigger specific skills
const TRIGGER_TESTS = [
  { prompt: "Build a RAG pipeline for our knowledge base", expectedSkills: ["basic-rag"], shouldTrigger: true },
  { prompt: "Add guardrails to prevent prompt injection", expectedSkills: ["guardrails"], shouldTrigger: true },
  { prompt: "Implement a ReAct agent loop with tool calling", expectedSkills: ["react-loop", "tool-calling"], shouldTrigger: true },
  { prompt: "Set up semantic search with embeddings", expectedSkills: ["semantic-indexing"], shouldTrigger: true },
  { prompt: "Add chain of thought prompting", expectedSkills: ["chain-of-thought"], shouldTrigger: true },
  { prompt: "Route requests between different LLM models", expectedSkills: ["model-router", "semantic-router"], shouldTrigger: true },
  { prompt: "Cache prompts to reduce API costs", expectedSkills: ["prompt-caching"], shouldTrigger: true },
  { prompt: "Evaluate LLM output quality with another LLM", expectedSkills: ["llm-as-judge"], shouldTrigger: true },
  { prompt: "Add conversation memory to our chatbot", expectedSkills: ["conversation-memory"], shouldTrigger: true },
  { prompt: "Use multiple agents working together", expectedSkills: ["multi-agent-collaboration"], shouldTrigger: true },
  // Negative cases — should NOT trigger any skill
  { prompt: "Fix the CSS on the login page", expectedSkills: [], shouldTrigger: false },
  { prompt: "Write a SQL migration for the users table", expectedSkills: [], shouldTrigger: false },
  { prompt: "Deploy this to Kubernetes", expectedSkills: [], shouldTrigger: false },
];

function evalTriggerAccuracy(skills) {
  const results = [];

  for (const test of TRIGGER_TESTS) {
    const promptLower = test.prompt.toLowerCase();
    const promptWords = new Set(promptLower.split(/\s+/));

    // Simulate trigger: check if any skill's description matches the prompt
    const matchedSkills = [];
    for (const skill of skills) {
      const parsed = parseSkill(skill.raw);
      if (!parsed.description) continue;

      const descLower = parsed.description.toLowerCase();
      // Normalize hyphens to spaces for phrase matching (e.g. "chain-of-thought" → "chain of thought")
      const descNorm = descLower.replace(/-/g, " ");
      const promptNorm = promptLower.replace(/-/g, " ");
      const descWords = new Set(descLower.split(/\s+/));

      // Simple keyword overlap scoring
      let score = 0;
      for (const word of promptWords) {
        if (word.length > 3 && descWords.has(word)) score++;
      }
      // Check for phrase matches (use normalized forms for hyphen-insensitive matching)
      if (descLower.includes("rag") && promptLower.includes("rag")) score += 3;
      if (descNorm.includes("guardrail") && promptNorm.includes("guardrail")) score += 3;
      if (descNorm.includes("retrieval") && promptNorm.includes("retrieval")) score += 2;
      if (descNorm.includes("agent") && promptNorm.includes("agent")) score += 2;
      if (descNorm.includes("prompt") && promptNorm.includes("prompt")) score += 2;
      if (descNorm.includes("memory") && promptNorm.includes("memory")) score += 2;
      if (descNorm.includes("routing") && promptNorm.includes("rout")) score += 2;
      if (descNorm.includes("caching") && promptNorm.includes("cach")) score += 2;
      if (descNorm.includes("evaluation") && promptNorm.includes("evaluat")) score += 2;
      if (descNorm.includes("embedding") && promptNorm.includes("embedding")) score += 2;
      if (descNorm.includes("chain of thought") && promptNorm.includes("chain of thought")) score += 5;
      if (descNorm.includes("conversation") && promptNorm.includes("conversation")) score += 2;
      if (descNorm.includes("tool") && promptNorm.includes("tool")) score += 2;
      if (descNorm.includes("semantic") && promptNorm.includes("semantic")) score += 2;
      if (descNorm.includes("multi agent") && promptNorm.includes("multiple agents")) score += 3;
      if (descNorm.includes("reasoning") && promptNorm.includes("thought")) score += 2;
      if (descNorm.includes("step by step") && promptNorm.includes("thought")) score += 2;

      if (score >= 3) {
        matchedSkills.push({ slug: parsed.name, score });
      }
    }

    matchedSkills.sort((a, b) => b.score - a.score);
    const topMatches = matchedSkills.slice(0, 3).map((m) => m.slug);

    let pass = false;
    if (test.shouldTrigger) {
      // At least one expected skill should be in top matches
      pass = test.expectedSkills.some((s) => topMatches.includes(s));
    } else {
      // No skills should match strongly
      pass = matchedSkills.length === 0 || matchedSkills[0].score < 4;
    }

    results.push({
      prompt: test.prompt,
      expected: test.shouldTrigger ? test.expectedSkills.join(", ") : "(none)",
      got: topMatches.length > 0 ? topMatches.join(", ") : "(none)",
      pass,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const skills = loadSkills();
  const manifest = loadManifest();

  console.log("=".repeat(70));
  console.log("  GenAI Pattern Skills — Evaluation Report");
  console.log("=".repeat(70));
  console.log(`\n  Skills found: ${skills.length}`);
  console.log(`  Manifest entries: ${manifest.skills.length}\n`);

  // Manifest check
  if (skills.length !== manifest.skills.length) {
    console.log(`  ⚠ MISMATCH: ${skills.length} files vs ${manifest.skills.length} manifest entries\n`);
  }

  let totalCritical = 0;
  let totalImportant = 0;
  let totalWarn = 0;
  let totalPass = 0;

  // Run per-skill evals
  console.log("-".repeat(70));
  console.log("  EVAL 1: Structure + Trigger + Content Quality");
  console.log("-".repeat(70));

  for (const skill of skills) {
    const parsed = parseSkill(skill.raw);
    const structIssues = evalStructure(skill.file, parsed);
    const triggerIssues = evalTrigger(skill.file, parsed);
    const contentIssues = evalContent(skill.file, parsed);
    const allIssues = [...structIssues, ...triggerIssues, ...contentIssues];

    const critical = allIssues.filter((i) => i.startsWith("CRITICAL"));
    const important = allIssues.filter((i) => i.startsWith("IMPORTANT"));
    const warn = allIssues.filter((i) => i.startsWith("WARN"));

    totalCritical += critical.length;
    totalImportant += important.length;
    totalWarn += warn.length;

    if (allIssues.length === 0) {
      totalPass++;
      console.log(`  ✅ ${skill.file}`);
    } else if (critical.length > 0) {
      console.log(`  ❌ ${skill.file}`);
      for (const issue of allIssues) console.log(`     ${issue}`);
    } else if (important.length > 0) {
      console.log(`  ⚠  ${skill.file}`);
      for (const issue of allIssues) console.log(`     ${issue}`);
    } else {
      console.log(`  ✅ ${skill.file} (${warn.length} minor)`);
    }
  }

  // Run trigger accuracy eval
  console.log("\n" + "-".repeat(70));
  console.log("  EVAL 2: Trigger Accuracy Simulation");
  console.log("-".repeat(70));

  const triggerResults = evalTriggerAccuracy(skills);
  let triggerPass = 0;
  for (const r of triggerResults) {
    const icon = r.pass ? "✅" : "❌";
    triggerPass += r.pass ? 1 : 0;
    console.log(`  ${icon} "${r.prompt}"`);
    if (!r.pass) {
      console.log(`     Expected: ${r.expected} | Got: ${r.got}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`\n  Skills evaluated: ${skills.length}`);
  console.log(`  Clean pass: ${totalPass}/${skills.length}`);
  console.log(`  Critical issues: ${totalCritical}`);
  console.log(`  Important issues: ${totalImportant}`);
  console.log(`  Warnings: ${totalWarn}`);
  console.log(`\n  Trigger accuracy: ${triggerPass}/${triggerResults.length} (${Math.round((triggerPass / triggerResults.length) * 100)}%)`);

  const overallPass = totalCritical === 0 && triggerPass >= triggerResults.length * 0.8;
  console.log(`\n  Overall: ${overallPass ? "✅ PASS" : "❌ FAIL"}`);
  console.log("=".repeat(70));

  process.exit(overallPass ? 0 : 1);
}

main();
