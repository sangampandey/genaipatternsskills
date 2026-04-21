---
name: code-execution
description: >-
  Implement the Code Execution pattern (Agents). Let LLMs generate and execute code in sandboxed environments for tasks requiring computational precision like data analysis and visualization. Use when working with: sandbox, code-generation, sql, visualization.
---

# Code Execution

> Category: Agents | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/agents/code-execution

## What This Pattern Solves

**Code Execution is** a pattern that lets an LLM write and run code in a sandboxed environment during inference. Instead of reasoning about computations in natural language, the model generates executable code, runs it, and incorporates the output into its response.

## When to Use This Skill

Use Code Execution when the task involves computation, data transformation, or artifact generation that an LLM cannot reliably do through text generation alone.

Specific signals that this pattern fits well:

- The user needs a chart, graph, or visualization as output
- The task involves numerical computation where precision matters (financial calculations, statistics, simulations)
- You need to query structured data in a database
- The output is a file (PDF report, CSV export, image) rather than plain text
- The problem involves iterative data manipulation, things like filtering, grouping, pivoting, and aggregating a dataset

If the task is purely about generating or transforming text, you probably do not need this. If the task requires interacting with external APIs or services, tool calling might be a better fit. Code Execution shines when the LLM needs to leverage a programming language runtime to produce results it cannot produce through token generation.

## Architecture Rules

- Code Execution when the task involves computation, data transformation, or a
- Specific signals that this pattern fits well:
- user needs a chart, graph, or visualization as output
- task involves numerical computation where precision matters (financial calcu
- You need to query structured data in a database

## Implementation Steps

1. The Code Execution pattern splits the work into two distinct phases. First, the LLM generates code that solves the problem.
2. Think of it as giving the model a scratch pad that actually runs. When a user asks "show me a scatter plot of revenue vs.
3. The sandbox is critical. You are executing LLM-generated code, which means you are executing code you did not write and did not review.
4. This pattern works with many target languages. Python is the most common because of its ecosystem for data science and visualization.
5. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/agents/code-execution

## Verification Checklist

- [ ] Verified: most common failure is generated code that does not run.
- [ ] Errors are handled gracefully with appropriate fallbacks
- [ ] Maximum iteration limit is set to prevent infinite loops
- [ ] Latency impact is measured and within acceptable bounds
- [ ] Verified: Over-reliance on code execution for tasks where simpler approaches work is another anti-pattern.
- [ ] Implementation follows the Code Execution architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

**You gain** computational precision, the ability to produce real artifacts (images, files, query results), and access to the full ecosystem of a programming language.

**You pay** with added infrastructure complexity (you need a sandbox service), increased latency per interaction, and a new attack surface that requires ongoing security attention.

**Code quality varies.** The LLM-generated code is not production code. It is throwaway scripting meant to solve an immediate problem. Expecting clean, well-architected output is unrealistic. What matters is that it runs correctly for the specific input.

**Debugging gets harder.** When something goes wrong, you are debugging code you did not write. Good implementations return both the generated code and any error messages to the LLM so it can self-correct, but this means additional API calls and higher costs.

**Sandbox maintenance is real work.** You need to keep the sandbox environment updated with the right libraries, patch security vulnerabilities, and monitor resource usage. This is operational overhead that scales with usage.

