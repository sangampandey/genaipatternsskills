# genai-skills

Install [GenAI Pattern](https://www.genaipatterns.dev) skills into your AI coding assistant. 29 production-tested design patterns for RAG, agents, prompting, and more.

## Quick Start

```bash
# Install all skills (Claude Code)
npx genai-skills add --all

# Install a single skill
npx genai-skills add basic-rag

# Install by category
npx genai-skills add --category rag
```

## Supported Tools

| Tool | Command |
|---|---|
| Claude Code | `npx genai-skills add --all` |
| Cursor | `npx genai-skills add --all --tool cursor` |
| Codex | `npx genai-skills add --all --tool codex` |
| Gemini CLI | `npx genai-skills add --all --tool gemini` |

The tool is auto-detected from your project. Use `--tool` to override.

## Commands

```bash
genai-skills add <slug>              # Install a skill
genai-skills add --all               # Install all 29 skills
genai-skills add --category <cat>    # Install by category
genai-skills list                    # List available skills
genai-skills remove <slug>           # Remove a skill
```

## Categories

- **rag** — Retrieval-Augmented Generation
- **agents** — Agent Architectures
- **prompting** — Prompt Engineering
- **routing** — Routing & Orchestration
- **safety** — Safety & Guardrails
- **evaluation** — Evaluation
- **cost-performance** — Cost & Performance
- **memory** — Memory & State

## Links

- Website: [genaipatterns.dev/skills](https://www.genaipatterns.dev/skills)
- Patterns: [genaipatterns.dev/patterns](https://www.genaipatterns.dev/patterns)
- Book: [genaipatterns.dev/book](https://www.genaipatterns.dev/book)

## License

MIT
