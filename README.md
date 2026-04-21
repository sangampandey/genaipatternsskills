<p align="center">
  <strong>genai-skills</strong>
</p>

<p align="center">
  Install production-tested GenAI design pattern knowledge directly into your AI coding assistant.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/genai-skills"><img src="https://img.shields.io/npm/v/genai-skills?style=flat&color=0a0a0a" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/genai-skills"><img src="https://img.shields.io/npm/dm/genai-skills?style=flat&color=0a0a0a" alt="npm downloads" /></a>
  <a href="https://github.com/sangampandey/genaipatternsskills"><img src="https://img.shields.io/github/stars/sangampandey/genaipatternsskills?style=flat&color=0a0a0a" alt="GitHub stars" /></a>
  <a href="https://github.com/sangampandey/genaipatternsskills/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/genai-skills?style=flat&color=0a0a0a" alt="License" /></a>
</p>

<p align="center">
  <a href="https://www.genaipatterns.dev/skills">Website</a> &middot;
  <a href="https://www.genaipatterns.dev/patterns">Patterns</a> &middot;
  <a href="https://www.genaipatterns.dev/book">Book</a> &middot;
  <a href="https://github.com/sangampandey/genaipatternsskills">GitHub</a>
</p>

---

<p align="center">
  <a href="https://www.genaipatterns.dev/skills">
    <img src="https://raw.githubusercontent.com/sangampandey/genaipatternsskills/main/screenshots/skills-page.png" alt="Skills Page — browse and install 29 GenAI pattern skills" width="100%" />
  </a>
</p>

---

## What is this?

**genai-skills** gives your AI coding assistant expert knowledge about 29 GenAI design patterns — RAG, agents, prompt engineering, routing, safety, evaluation, cost optimization, and memory management. Instead of hallucinating architecture advice, your assistant references battle-tested patterns from [genaipatterns.dev](https://www.genaipatterns.dev).

Each skill follows the [Anthropic Agent Skills spec](https://www.genaipatterns.dev/skills) with YAML frontmatter for agent triggering, architecture rules, implementation steps, code templates, and verification checklists.

## Quick Start

```bash
npx genai-skills add --all
```

That's it. Your AI assistant now knows 29 production patterns. Try asking it:

> "Build a RAG pipeline for our knowledge base"

## Supported Tools

| Tool | Install Command | Auto-detected |
|------|----------------|:---:|
| **Claude Code** | `npx genai-skills add --all` | Yes |
| **Cursor** | `npx genai-skills add --all --tool cursor` | Yes |
| **Codex** | `npx genai-skills add --all --tool codex` | Yes |
| **Gemini CLI** | `npx genai-skills add --all --tool gemini` | Yes |

The CLI auto-detects your tool from project config files. Use `--tool` to override.

## Commands

```bash
genai-skills add <slug>              # Install a single skill
genai-skills add --all               # Install all 29 skills
genai-skills add --category <cat>    # Install by category
genai-skills list                    # List available skills
genai-skills remove <slug>           # Remove a skill
```

## Skill Catalog

### RAG (7 skills)

| Skill | Difficulty | What it does |
|-------|:---:|------|
| **Basic RAG** | Beginner | Ground responses in external knowledge via retrieve-then-generate |
| **Semantic Indexing** | Intermediate | Replace keyword matching with vector embeddings for meaning-based search |
| **Hybrid Retrieval** | Intermediate | Combine keyword and semantic search to bridge the vocabulary gap |
| **Retrieval Refinement** | Intermediate | Rerank, compress, and filter retrieved chunks before generation |
| **Agentic RAG** | Advanced | Give an agent control over when, where, and how to retrieve |
| **Deep Search** | Advanced | Iterative retrieval-reasoning cycles for complex multi-hop questions |
| **Grounded Generation** | Advanced | Inline citations, out-of-domain detection, and attribution tracking |

### Agents (5 skills)

| Skill | Difficulty | What it does |
|-------|:---:|------|
| **Tool Calling** | Intermediate | Structured function calls to external systems |
| **ReAct Loop** | Intermediate | Think-act-observe reasoning loop with tool use |
| **Code Execution** | Intermediate | Generate and execute code in sandboxed environments |
| **Plan and Execute** | Advanced | Separate strategic planning from tactical execution |
| **Multi-Agent Collaboration** | Advanced | Coordinate multiple specialized agents on complex tasks |

### Prompting (5 skills)

| Skill | Difficulty | What it does |
|-------|:---:|------|
| **Chain-of-Thought** | Beginner | Step-by-step reasoning for math, logic, and analysis |
| **Few-Shot Prompting** | Beginner | Teach format and behavior through input-output examples |
| **Prompt Chaining** | Intermediate | Sequential focused prompts where each feeds the next |
| **Self-Consistency** | Intermediate | Multiple reasoning paths with majority voting |
| **Prompt Optimization** | Advanced | Automatically optimize prompts against eval datasets |

### Routing & Orchestration (3 skills)

| Skill | Difficulty | What it does |
|-------|:---:|------|
| **Semantic Router** | Intermediate | Classify intent via embeddings and route to handlers |
| **Model Router** | Intermediate | Route to the right model tier based on complexity |
| **Cascading** | Intermediate | Try cheap models first, escalate when confidence is low |

### Safety & Guardrails (2 skills)

| Skill | Difficulty | What it does |
|-------|:---:|------|
| **Guardrails** | Intermediate | Input/output/retrieval/execution safety layers |
| **Self-Check** | Advanced | Detect hallucinations via confidence analysis |

### Evaluation (2 skills)

| Skill | Difficulty | What it does |
|-------|:---:|------|
| **LLM-as-Judge** | Intermediate | LLM scoring with custom rubrics at scale |
| **Reflection** | Intermediate | Iterative generate-evaluate-critique-regenerate loops |

### Cost & Performance (3 skills)

| Skill | Difficulty | What it does |
|-------|:---:|------|
| **Prompt Caching** | Intermediate | Reuse responses for repeated or similar prompts |
| **Inference Optimization** | Advanced | Batching, KV cache optimization, model parallelism |
| **Small Language Models** | Advanced | Distillation, quantization, and speculative decoding |

### Memory & State (2 skills)

| Skill | Difficulty | What it does |
|-------|:---:|------|
| **Conversation Memory** | Beginner | Sliding windows, summaries, and entity tracking |
| **Long-Term Memory** | Intermediate | Persist facts and preferences in external memory stores |

## Quality Eval Results

Every skill is tested against a 3-suite eval framework before release:

```
======================================================================
  GenAI Pattern Skills — Evaluation Report
======================================================================

  Skills evaluated:    29
  Clean pass:          26/29 (3 minor warnings)
  Critical issues:     0
  Important issues:    0
  Warnings:            3

  Trigger accuracy:    13/13 (100%)

  Overall:             PASS
======================================================================
```

**Eval suites:**

| Suite | What it checks |
|-------|---------------|
| **Structure** | YAML frontmatter, required sections, file length |
| **Trigger Quality** | Description has action verbs, trigger keywords, domain terms |
| **Content Quality** | Architecture Rules and Implementation Steps are distinct, checklists are actionable |
| **Trigger Accuracy** | 13 test prompts (10 positive, 3 negative) match the correct skills |

Run evals yourself:

```bash
git clone https://github.com/sangampandey/genaipatternsskills
node scripts/eval-skills.mjs
```

## How Each Skill is Structured

Every skill file follows a consistent format optimized for AI agent consumption:

```
---
name: basic-rag
description: >-
  Implement the Basic RAG pattern (RAG). Ground LLM responses in
  external knowledge by retrieving relevant documents...
---

# Basic RAG

## What This Pattern Solves      ← Problem context
## When to Use This Skill        ← Trigger conditions
## Architecture Rules            ← Constraints and principles
## Implementation Steps          ← Ordered, imperative instructions
## Code Template                 ← Copy-paste Python starter
## Verification Checklist        ← Pre-flight checks
## Trade-offs                    ← When NOT to use this
```

## From the Website

Every skill is sourced from a full pattern page on [genaipatterns.dev](https://www.genaipatterns.dev) with architecture diagrams, code examples, trade-off analysis, and composition guides.

<table>
<tr>
<td width="50%">
<a href="https://www.genaipatterns.dev/patterns">
<img src="https://raw.githubusercontent.com/sangampandey/genaipatternsskills/main/screenshots/patterns-page.png" alt="Pattern catalog with architecture diagrams" />
</a>
<p align="center"><strong>29 Pattern Pages</strong> — architecture diagrams, code, trade-offs</p>
</td>
<td width="50%">
<a href="https://www.genaipatterns.dev/book">
<img src="https://raw.githubusercontent.com/sangampandey/genaipatternsskills/main/screenshots/book-page.png" alt="The GenAI Patterns Book" />
</a>
<p align="center"><strong>The Book</strong> — all patterns in one offline-ready package</p>
</td>
</tr>
</table>

## Contributing

We welcome contributions! To add or improve a skill:

1. Edit the source pattern MDX in `content/patterns/{category}/{slug}.mdx`
2. Run `node scripts/generate-skills.mjs` to regenerate skills
3. Run `node scripts/eval-skills.mjs` to verify quality
4. Submit a PR

## License

[MIT](LICENSE) &copy; Sangam Pandey
