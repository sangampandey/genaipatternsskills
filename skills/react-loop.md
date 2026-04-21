# ReAct Loop

> Category: Agents | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/agents/react-loop

## What This Pattern Solves

**The ReAct (Reasoning + Acting) Loop is** a pattern that interleaves thinking and tool use in a cycle. The agent produces a Thought explaining its reasoning, takes an Action by calling a tool, receives an Observation with the result, and repeats until it has enough information to answer.

## Architecture Rules

- The ReAct pattern formalizes this interleaving into a simple loop with three components. The agent produces a **Thought** explaining what it knows so far and what it needs to do next. It then takes an **Action**, typically a tool call like a web search, database query, or API request. It receives an **Observation**, which is the result of that action. Then it loops back to produce another Thought incorporating the new information.
- This cycle repeats until the agent decides it has enough information to produce a final answer. The decision to stop is itself a reasoning step. The agent's Thought might say something like "I now have the revenue figures for all three companies and can compare them."
- What makes this pattern effective is that each action is motivated by explicit reasoning. The agent does not call tools randomly. It articulates why it needs a particular piece of information before going to get it. This creates a traceable chain of logic that you can inspect when things go wrong.
- A typical ReAct trace looks something like this. The user asks a question. The agent thinks about what information it needs. It searches for that information. It reads the result and realizes it needs one more data point. It searches again. It combines both results and produces an answer. Each step is grounded in the previous one.
- The pattern is surprisingly general. It works for question answering over documents, for interacting with APIs, for navigating websites, for data analysis, and for many other tasks where the agent needs external information. This generality is probably why it has become the most widely adopted agentic pattern in practice.

## Implementation Steps

1. The ReAct pattern formalizes this interleaving into a simple loop with three components. The agent produces a **Thought** explaining what it knows so far and what it needs to do next. It then takes an **Action**, typically a tool call like a web search, database query, or API request. It receives an **Observation**, which is the result of that action. Then it loops back to produce another Thought incorporating the new information.
2. This cycle repeats until the agent decides it has enough information to produce a final answer. The decision to stop is itself a reasoning step. The agent's Thought might say something like "I now have the revenue figures for all three companies and can compare them."
3. What makes this pattern effective is that each action is motivated by explicit reasoning. The agent does not call tools randomly. It articulates why it needs a particular piece of information before going to get it. This creates a traceable chain of logic that you can inspect when things go wrong.
4. A typical ReAct trace looks something like this. The user asks a question. The agent thinks about what information it needs. It searches for that information. It reads the result and realizes it needs one more data point. It searches again. It combines both results and produces an answer. Each step is grounded in the previous one.
5. The pattern is surprisingly general. It works for question answering over documents, for interacting with APIs, for navigating websites, for data analysis, and for many other tasks where the agent needs external information. This generality is probably why it has become the most widely adopted agentic pattern in practice.

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

- [ ] Verified: *Loops that never terminate.** The agent keeps searching, finding somewhat relevant information, deciding it is not quite enough, and searching again. Without a maximum iteration limit, this can run indefinitely. Always set a cap on the number of reasoning-action cycles. Somewhere between 5 and 15 iterations is typical, depending on the task complexity.
- [ ] Verified: *Reasoning that ignores observations.** Sometimes the agent's Thought does not actually incorporate the information from the previous Observation. It goes through the motions of the loop without genuinely reasoning about what it learned. This often manifests as the agent repeating similar searches or ignoring relevant data it already has. Better system prompts that explicitly instruct the agent to reference previous observations can help.
- [ ] Verified: *Action selection that is too narrow.** The agent gets fixated on a single tool or approach. It keeps searching the web with slightly different queries when the answer might be in a database it also has access to. Providing clear descriptions of when to use each tool helps the agent choose more effectively.
- [ ] Verified: *Observation overload.** A tool call might return a large amount of data, filling up the context window and pushing earlier reasoning out. The agent loses track of what it was doing and starts reasoning in circles. Truncating or summarizing long tool outputs before feeding them back to the agent keeps the context manageable.
- [ ] Verified: *Reasoning overhead on simple tasks.** For straightforward questions that need a single tool call, the full Thought-Action-Observation cycle adds unnecessary latency and cost. If you know a task is simple, consider a direct tool call without the reasoning wrapper.

## Trade-offs

**You gain** flexibility, interpretability, and the ability to handle tasks where the path to a solution is not known in advance. The reasoning trace is valuable for debugging and for building user trust.

**You pay** with unpredictable latency and cost. Because the number of iterations varies per query, you cannot easily predict how long a request will take or how much it will cost. This makes capacity planning harder than with fixed pipelines.

**Token efficiency is moderate.** The reasoning text consumes tokens that do not directly contribute to the final answer. Each Thought is essentially the agent talking to itself. This is the price of interpretability. You can reduce this cost by using shorter reasoning prompts, but that risks reducing the quality of the agent's decisions.

**The pattern scales linearly with task complexity.** Harder tasks need more iterations, which means more time and money. This is usually the right behavior, but it means a poorly scoped question can trigger an expensive chain of actions. Input validation and query refinement before entering the loop help control this.

**Compared to Plan and Execute, ReAct is more adaptive but less efficient.** It handles surprises well because it reasons about each new observation in context. But it can wander when a more structured approach would reach the answer faster. For tasks with clear structure, consider whether Plan and Execute would be more appropriate.

