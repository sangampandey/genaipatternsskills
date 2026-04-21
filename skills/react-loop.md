---
name: react-loop
description: >-
  Implement the ReAct Loop pattern (Agents). Interleave reasoning and action in a loop where the agent thinks, acts, observes, and repeats until the task is complete. Use when working with: reasoning, acting, loop, observation.
---

# ReAct Loop

> Category: Agents | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/agents/react-loop

## What This Pattern Solves

**The ReAct (Reasoning + Acting) Loop is** a pattern that interleaves thinking and tool use in a cycle. The agent produces a Thought explaining its reasoning, takes an Action by calling a tool, receives an Observation with the result, and repeats until it has enough information to answer.

## When to Use This Skill

ReAct is a good default choice for any task that requires the model to gather information or interact with external systems before producing an answer.

Use it when:

- The answer depends on information the model does not have in its training data
- The task requires combining information from multiple sources
- You need an audit trail of the agent's reasoning and actions
- The number of steps needed is not predictable in advance
- The task is interactive, where the result of one action determines the next

Skip it when:

- The task can be answered purely from the model's existing knowledge
- The workflow is completely deterministic and can be hard-coded as a pipeline
- You need guaranteed completion within a fixed number of steps (ReAct loops can be unpredictable in length)
- The task decomposes cleanly into a plan that should be created upfront

## Architecture Rules

- ReAct is a good default choice for any task that requires the model to gather in
- it when:
- answer depends on information the model does not have in its training data
- task requires combining information from multiple sources
- You need an audit trail of the agent's reasoning and actions

## Implementation Steps

1. The ReAct pattern formalizes this interleaving into a simple loop with three components. The agent produces a **Thought** explaining what it knows so far and what it needs to do next.
2. This cycle repeats until the agent decides it has enough information to produce a final answer. The decision to stop is itself a reasoning step.
3. What makes this pattern effective is that each action is motivated by explicit reasoning. The agent does not call tools randomly.
4. A typical ReAct trace looks something like this. The user asks a question.
5. The pattern is surprisingly general. It works for question answering over documents, for interacting with APIs, for navigating websites, for data analysis, and for many other tasks where the agent needs external information.
6. Adapt the code template below to your specific requirements
7. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
import json
from openai import OpenAI

client = OpenAI()

tools = [{
    "type": "function",
    "function": {
        "name": "search",
        "description": "Search for information on a topic",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Search query"}},
            "required": ["query"],
        },
    },
}]

def search(query: str) -> str:
    """Stub — replace with real search API."""
    return f"Results for '{query}': The population of France is approximately 68 million."

TOOL_MAP = {"search": search}

def react_loop(question: str, max_iterations: int = 5) -> str:
    """ReAct loop: reason, act, observe, repeat."""
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Think step by step. Use tools when you need external information."},
        {"role": "user", "content": question},
    ]

    for i in range(max_iterations):
        response = client.chat.completions.create(
            model="gpt-4o", messages=messages, tools=tools,
        )
        msg = response.choices[0].message

        # No tool calls — agent is done reasoning
        if not msg.tool_calls:
            return msg.content

        # Execute each tool call (Action) and collect results (Observation)
        messages.append(msg)
        for tc in msg.tool_calls:
            fn = TOOL_MAP.get(tc.function.name)
            result = fn(**json.loads(tc.function.arguments)) if fn else "Unknown tool"
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return "Reached max iterations without a final answer."

# Usage
print(react_loop("What is the population of France?"))
```

## Verification Checklist

- [ ] Maximum iteration limit is set to prevent infinite loops
- [ ] Agent reasoning references previous observations (not ignoring tool results)
- [ ] Verified: *Action selection that is too narrow.
- [ ] Context window usage is managed — retrieved content fits within model limits
- [ ] Latency impact is measured and within acceptable bounds
- [ ] Implementation follows the ReAct Loop architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

**You gain** flexibility, interpretability, and the ability to handle tasks where the path to a solution is not known in advance. The reasoning trace is valuable for debugging and for building user trust.

**You pay** with unpredictable latency and cost. Because the number of iterations varies per query, you cannot easily predict how long a request will take or how much it will cost. This makes capacity planning harder than with fixed pipelines.

**Token efficiency is moderate.** The reasoning text consumes tokens that do not directly contribute to the final answer. Each Thought is essentially the agent talking to itself. This is the price of interpretability. You can reduce this cost by using shorter reasoning prompts, but that risks reducing the quality of the agent's decisions.

**The pattern scales linearly with task complexity.** Harder tasks need more iterations, which means more time and money. This is usually the right behavior, but it means a poorly scoped question can trigger an expensive chain of actions. Input validation and query refinement before entering the loop help control this.

**Compared to Plan and Execute, ReAct is more adaptive but less efficient.** It handles surprises well because it reasons about each new observation in context. But it can wander when a more structured approach would reach the answer faster. For tasks with clear structure, consider whether Plan and Execute would be more appropriate.

