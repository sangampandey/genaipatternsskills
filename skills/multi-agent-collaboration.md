# Multi-Agent Collaboration

> Category: Agents | Difficulty: advanced | Pattern: genaipatterns.dev/patterns/agents/multi-agent-collaboration

## What This Pattern Solves

**Multi-Agent Collaboration is** a pattern where multiple specialized LLM agents work together on a task. Each agent has a defined role, toolset, and expertise area. A coordinator routes subtasks to the right agent and merges their outputs into a coherent result.

## Architecture Rules

- Instead of one agent doing everything, you create multiple agents that each focus on a narrow domain. A research agent knows how to search the web and synthesize findings. A coding agent knows how to write and modify code. A review agent knows how to evaluate code quality. Each agent has its own system prompt, its own set of tools, and its own area of expertise.
- The interesting question is how these agents coordinate. There are three main orchestration patterns.
- In the **supervisor** pattern, one agent acts as the coordinator. It receives the user request, decides which specialist agent should handle each part, delegates work, collects results, and assembles the final response. The specialist agents never talk to each other directly. All communication flows through the supervisor. This is the simplest pattern to implement and reason about.
- The **peer-to-peer** pattern lets agents communicate directly with each other. A coding agent might ask a research agent to look up an API specification, receive the answer, and continue its work without a central coordinator. This is more flexible but harder to debug because the flow of control is distributed. You need clear protocols for how agents discover and message each other.
- The **hierarchical** pattern adds layers of delegation. A top-level supervisor delegates to mid-level supervisors, who delegate to specialist agents. This works for very complex tasks where even the subtasks are too broad for a single agent. Think of a software project manager who delegates to a frontend lead and a backend lead, each of whom manages their own team of specialists.
- Regardless of the orchestration pattern, the key principle is the same. Each agent is small, focused, and independently testable. You can swap out the coding agent for a better one without touching the research agent. You can test the review agent in isolation by feeding it code samples.

## Implementation Steps

1. Instead of one agent doing everything, you create multiple agents that each focus on a narrow domain. A research agent knows how to search the web and synthesize findings. A coding agent knows how to write and modify code. A review agent knows how to evaluate code quality. Each agent has its own system prompt, its own set of tools, and its own area of expertise.
2. The interesting question is how these agents coordinate. There are three main orchestration patterns.
3. In the **supervisor** pattern, one agent acts as the coordinator. It receives the user request, decides which specialist agent should handle each part, delegates work, collects results, and assembles the final response. The specialist agents never talk to each other directly. All communication flows through the supervisor. This is the simplest pattern to implement and reason about.
4. The **peer-to-peer** pattern lets agents communicate directly with each other. A coding agent might ask a research agent to look up an API specification, receive the answer, and continue its work without a central coordinator. This is more flexible but harder to debug because the flow of control is distributed. You need clear protocols for how agents discover and message each other.
5. The **hierarchical** pattern adds layers of delegation. A top-level supervisor delegates to mid-level supervisors, who delegate to specialist agents. This works for very complex tasks where even the subtasks are too broad for a single agent. Think of a software project manager who delegates to a frontend lead and a backend lead, each of whom manages their own team of specialists.
6. Regardless of the orchestration pattern, the key principle is the same. Each agent is small, focused, and independently testable. You can swap out the coding agent for a better one without touching the research agent. You can test the review agent in isolation by feeding it code samples.

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

- [ ] Verified: *Coordination overhead** is the most immediate risk. If agents spend more time communicating than working, you have created a bureaucracy, not a productive team. The supervisor becomes a bottleneck, reformulating messages and routing information. Keep the number of agents small and the interfaces between them clean.
- [ ] Verified: *Lost context** happens when important information fails to transfer between agents. The research agent discovers a critical constraint, but the summary it passes to the coding agent omits that detail. Each handoff between agents is an opportunity for information loss. Be explicit about what information must flow between agents.
- [ ] Verified: *Infinite delegation loops** occur when agents pass work back and forth without making progress. Agent A asks Agent B for clarification, Agent B asks Agent A for more context, and neither produces useful work. Set maximum iteration limits and include circuit breakers that escalate to a human when agents are stuck.
- [ ] Verified: *Inconsistent outputs** arise when agents make conflicting assumptions. The frontend agent assumes a REST API while the backend agent builds a GraphQL endpoint. Without shared context about architectural decisions, agents will drift apart. A shared scratchpad or state document that all agents can read helps maintain consistency.
- [ ] Verified: *Debugging becomes harder** because the execution path spans multiple agents. When the final output is wrong, you need to trace through several agents to find where things went off track. Good logging at every agent boundary is essential.

## Trade-offs

**You gain** modularity, the ability to use different models per task, easier testing of individual components, and natural parallelism where independent subtasks can run concurrently.

**You pay** with increased system complexity, higher total token usage due to inter-agent communication, more infrastructure to manage, and harder debugging when things go wrong.

**Latency increases** because sequential agent calls add up. If Agent A must finish before Agent B can start, total time is the sum of both. Identify which subtasks can run in parallel and execute them concurrently where possible.

**Cost scales with communication.** Every message between agents is an LLM call. A chatty multi-agent system where agents frequently request clarification can become expensive quickly. Design agent interfaces to minimize round trips.

**The sweet spot is usually 2 to 5 agents.** Fewer than that and you probably do not need multi-agent at all. More than that and the coordination overhead starts dominating. Start with the minimum number of agents and add more only when you have evidence that a single agent cannot handle a particular subtask well.

