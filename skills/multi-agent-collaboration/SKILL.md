---
name: multi-agent-collaboration
description: >-
  Implement the Multi-Agent Collaboration pattern (Agents). Coordinate multiple specialized agents to solve complex tasks that exceed any single agent's capabilities using supervisor or peer topologies. Use when working with: multi-agent, orchestration, supervisor, delegation.
---

# Multi-Agent Collaboration

> Category: Agents | Difficulty: advanced | Reference: https://www.genaipatterns.dev/patterns/agents/multi-agent-collaboration

## What This Pattern Solves

**Multi-Agent Collaboration is** a pattern where multiple specialized LLM agents work together on a task. Each agent has a defined role, toolset, and expertise area. A coordinator routes subtasks to the right agent and merges their outputs into a coherent result.

## When to Use This Skill

Multi-agent collaboration makes sense when the task naturally decomposes into distinct domains that require different expertise, tools, or context.

Good indicators:

- The task involves multiple disciplines (research, coding, design, analysis) that would require very different tool sets
- A single agent's context window cannot hold all the information needed for the full task
- You want to use different models for different subtasks, perhaps a cheaper model for simple classification and a powerful model for code generation
- You need clear audit trails showing which agent made which decision
- The system needs to scale, and different subtasks have different latency or cost profiles

If the task is straightforward enough that a single agent with a few tools can handle it reliably, adding multiple agents is unnecessary overhead. The coordination cost is real. Every message between agents costs tokens and adds latency.

## Architecture Rules

- Multi-agent collaboration makes sense when the task naturally decomposes into di
- Good indicators:
- task involves multiple disciplines (research, coding, design, analysis) that
- single agent's context window cannot hold all the information needed for the f
- You want to use different models for different subtasks, perhaps a cheaper model

## Implementation Steps

1. Instead of one agent doing everything, you create multiple agents that each focus on a narrow domain. A research agent knows how to search the web and synthesize findings.
2. The interesting question is how these agents coordinate. There are three main orchestration patterns.
3. In the **supervisor** pattern, one agent acts as the coordinator. It receives the user request, decides which specialist agent should handle each part, delegates work, collects results, and assembles the final response.
4. The **peer-to-peer** pattern lets agents communicate directly with each other. A coding agent might ask a research agent to look up an API specification, receive the answer, and continue its work without a central coordinator.
5. The **hierarchical** pattern adds layers of delegation. A top-level supervisor delegates to mid-level supervisors, who delegate to specialist agents.
6. Adapt the code template below to your specific requirements
7. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

def call_agent(system_prompt: str, task: str) -> str:
    """Run a specialist agent with a focused system prompt."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": task},
        ],
    )
    return response.choices[0].message.content

def supervisor(task: str) -> str:
    """Supervisor pattern: delegate to specialists, then synthesize."""
    # Step 1: Research agent gathers information
    research = call_agent(
        "You are a research specialist. Gather key facts and data points. Be concise.",
        task,
    )

    # Step 2: Writing agent drafts a response using the research
    draft = call_agent(
        "You are a writing specialist. Write a clear, well-structured response based on the research provided.",
        f"Task: {task}\n\nResearch findings:\n{research}",
    )

    # Step 3: Review agent checks quality
    review = call_agent(
        "You are a review specialist. Check for accuracy, clarity, and completeness. Return the final version with any corrections.",
        f"Original task: {task}\n\nDraft to review:\n{draft}",
    )
    return review

# Usage
print(supervisor("Write a brief comparison of PostgreSQL vs. MySQL for a startup"))
```

## Verification Checklist

- [ ] Verified: *Coordination overhead is the most immediate risk.
- [ ] Verified: *Lost context happens when important information fails to transfer between agents.
- [ ] Maximum iteration limit is set to prevent infinite loops
- [ ] Verified: *Inconsistent outputs arise when agents make conflicting assumptions.
- [ ] Monitoring and logging are configured for production debugging
- [ ] Implementation follows the Multi-Agent Collaboration architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

**You gain** modularity, the ability to use different models per task, easier testing of individual components, and natural parallelism where independent subtasks can run concurrently.

**You pay** with increased system complexity, higher total token usage due to inter-agent communication, more infrastructure to manage, and harder debugging when things go wrong.

**Latency increases** because sequential agent calls add up. If Agent A must finish before Agent B can start, total time is the sum of both. Identify which subtasks can run in parallel and execute them concurrently where possible.

**Cost scales with communication.** Every message between agents is an LLM call. A chatty multi-agent system where agents frequently request clarification can become expensive quickly. Design agent interfaces to minimize round trips.

**The sweet spot is usually 2 to 5 agents.** Fewer than that and you probably do not need multi-agent at all. More than that and the coordination overhead starts dominating. Start with the minimum number of agents and add more only when you have evidence that a single agent cannot handle a particular subtask well.

