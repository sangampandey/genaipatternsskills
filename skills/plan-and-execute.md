---
name: plan-and-execute
description: >-
  Implement the Plan and Execute pattern (Agents). Separate strategic planning from tactical execution by having one agent plan and another execute each step for more structured workflows. Use when working with: planning, execution, structured, decomposition.
---

# Plan and Execute

> Category: Agents | Difficulty: advanced | Reference: https://www.genaipatterns.dev/patterns/agents/plan-and-execute

## What This Pattern Solves

**Plan and Execute is** a pattern that separates planning from execution. A planner agent decomposes a complex task into an ordered list of subtasks, and an executor agent carries them out one by one, with optional re-planning if intermediate results change the approach.

## When to Use This Skill

This pattern fits best when the task has a clear structure that benefits from upfront decomposition.

Strong signals:

- The task involves multiple distinct phases that build on each other (research, then analysis, then writing)
- You can estimate the steps needed before starting execution
- The task is expensive in API calls, and wasted exploration hurts your budget
- You need a visible progress indicator, the plan itself serves as a progress bar
- The task benefits from human review of the plan before execution begins

Weaker signals where a simpler ReAct loop might be sufficient:

- The task is exploratory and the path to a solution is genuinely unpredictable
- The task is simple enough to complete in two or three steps
- The environment changes rapidly and plans become stale before they can be executed

## Architecture Rules

- pattern fits best when the task has a clear structure that benefits from up
- Strong signals:
- task involves multiple distinct phases that build on each other (research, t
- You can estimate the steps needed before starting execution
- task is expensive in API calls, and wasted exploration hurts your budget

## Implementation Steps

1. Plan and Execute separates these two concerns into distinct phases with distinct roles. A planner agent looks at the full task and produces a structured plan, a sequence of steps that, when completed, will solve the problem.
2. The planner operates at a high level. It decomposes the task, identifies dependencies between steps, and produces something resembling a checklist or workflow.
3. The executor operates at a low level. It takes a single step from the plan, figures out how to accomplish it using available tools, and returns the result.
4. After each step completes, the system can optionally send the results back to the planner for review. The planner might revise the remaining steps based on what the executor discovered.
5. The separation has a practical benefit for token usage. The planner needs to see the full task description and the current state of progress, but it does not need to see the detailed execution traces.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/agents/plan-and-execute

## Verification Checklist

- [ ] Maximum iteration limit is set to prevent infinite loops
- [ ] Verified: *Over-planning.
- [ ] Verified: *Plan granularity mismatch.
- [ ] Verified: *Planner hallucinating capabilities.
- [ ] Verified: *Cascading failures.
- [ ] Implementation follows the Plan and Execute architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

**You gain** structured progress, reduced wasted exploration, visible execution plans that can be reviewed before running, and cleaner separation of strategic and tactical reasoning.

**You pay** with the overhead of generating a plan (additional LLM call before any execution happens), the complexity of maintaining plan state and handling replanning, and the risk of rigidity if replanning is not implemented well.

**Latency is front-loaded.** The planning phase adds time before any visible work begins. For interactive applications, users might perceive the system as slow because nothing happens while the plan is being generated. Consider streaming the plan to the user as it is created.

**Total token cost can be higher or lower than ReAct.** If the plan is good and the executor follows it efficiently, you save tokens by avoiding wasted exploration. If the plan is poor and requires frequent revision, you spend extra tokens on both planning and replanning without saving on execution.

**This pattern works best at the middle complexity range.** Simple tasks do not need a plan. Extremely complex or novel tasks resist planning because the problem space is not understood well enough upfront. The sweet spot is tasks where you roughly know what needs to happen but the details require careful execution.

