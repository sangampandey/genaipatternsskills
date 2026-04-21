# Plan and Execute

> Category: Agents | Difficulty: advanced | Pattern: genaipatterns.dev/patterns/agents/plan-and-execute

## What This Pattern Solves

**Plan and Execute is** a pattern that separates planning from execution. A planner agent decomposes a complex task into an ordered list of subtasks, and an executor agent carries them out one by one, with optional re-planning if intermediate results change the approach.

## Architecture Rules

- Plan and Execute separates these two concerns into distinct phases with distinct roles. A planner agent looks at the full task and produces a structured plan, a sequence of steps that, when completed, will solve the problem. An executor agent then works through the plan one step at a time, focusing entirely on carrying out each step well.
- The planner operates at a high level. It decomposes the task, identifies dependencies between steps, and produces something resembling a checklist or workflow. It does not execute anything. It thinks about what needs to happen and in what order.
- The executor operates at a low level. It takes a single step from the plan, figures out how to accomplish it using available tools, and returns the result. It does not worry about the big picture. Its job is to do one thing well.
- After each step completes, the system can optionally send the results back to the planner for review. The planner might revise the remaining steps based on what the executor discovered. Maybe the first research step revealed that one competitor was acquired last month, so the planner removes that competitor from the remaining analysis steps and adds the acquiring company instead. This replanning capability is what makes the pattern adaptive rather than rigid.
- The separation has a practical benefit for token usage. The planner needs to see the full task description and the current state of progress, but it does not need to see the detailed execution traces. The executor needs the current step instructions and relevant tool outputs, but it does not need to carry the entire plan in its context. Each agent gets a focused context window with only the information it needs.

## Implementation Steps

1. Plan and Execute separates these two concerns into distinct phases with distinct roles. A planner agent looks at the full task and produces a structured plan, a sequence of steps that, when completed, will solve the problem. An executor agent then works through the plan one step at a time, focusing entirely on carrying out each step well.
2. The planner operates at a high level. It decomposes the task, identifies dependencies between steps, and produces something resembling a checklist or workflow. It does not execute anything. It thinks about what needs to happen and in what order.
3. The executor operates at a low level. It takes a single step from the plan, figures out how to accomplish it using available tools, and returns the result. It does not worry about the big picture. Its job is to do one thing well.
4. After each step completes, the system can optionally send the results back to the planner for review. The planner might revise the remaining steps based on what the executor discovered. Maybe the first research step revealed that one competitor was acquired last month, so the planner removes that competitor from the remaining analysis steps and adds the acquiring company instead. This replanning capability is what makes the pattern adaptive rather than rigid.
5. The separation has a practical benefit for token usage. The planner needs to see the full task description and the current state of progress, but it does not need to see the detailed execution traces. The executor needs the current step instructions and relevant tool outputs, but it does not need to carry the entire plan in its context. Each agent gets a focused context window with only the information it needs.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/agents/plan-and-execute

## Verification Checklist

- [ ] Verified: *Rigid plans that do not adapt.** If the planner creates a plan and the executor follows it blindly regardless of what it discovers, the system becomes brittle. A step might fail or return unexpected results that invalidate the rest of the plan. Without replanning, the executor wastes effort on steps that no longer make sense. Always include a feedback loop where execution results inform the planner.
- [ ] Verified: *Over-planning.** Some tasks do not decompose neatly into sequential steps. Forcing a detailed plan on an inherently exploratory task adds overhead without benefit. The planner spends tokens producing a plan that will need heavy revision after almost every step. If you find yourself replanning more often than executing, the task might be better suited to a reactive approach.
- [ ] Verified: *Plan granularity mismatch.** Plans that are too high-level give the executor insufficient guidance. Plans that are too detailed constrain the executor unnecessarily and bloat the planner's output. Finding the right level of granularity requires experimentation. A good rule of thumb is that each step should be accomplishable in one to three tool calls.
- [ ] Verified: *Planner hallucinating capabilities.** The planner might include steps that assume tools or data sources the executor does not have access to. If the planner is not aware of the executor's actual capabilities, it will produce plans that cannot be executed. Share the tool inventory with the planner so it knows what is possible.
- [ ] Verified: *Cascading failures.** When an early step fails, all downstream steps that depend on it will also fail. The system needs graceful handling of step failures, either retrying the failed step, revising the plan to work around the failure, or escalating to a human.

## Trade-offs

**You gain** structured progress, reduced wasted exploration, visible execution plans that can be reviewed before running, and cleaner separation of strategic and tactical reasoning.

**You pay** with the overhead of generating a plan (additional LLM call before any execution happens), the complexity of maintaining plan state and handling replanning, and the risk of rigidity if replanning is not implemented well.

**Latency is front-loaded.** The planning phase adds time before any visible work begins. For interactive applications, users might perceive the system as slow because nothing happens while the plan is being generated. Consider streaming the plan to the user as it is created.

**Total token cost can be higher or lower than ReAct.** If the plan is good and the executor follows it efficiently, you save tokens by avoiding wasted exploration. If the plan is poor and requires frequent revision, you spend extra tokens on both planning and replanning without saving on execution.

**This pattern works best at the middle complexity range.** Simple tasks do not need a plan. Extremely complex or novel tasks resist planning because the problem space is not understood well enough upfront. The sweet spot is tasks where you roughly know what needs to happen but the details require careful execution.

