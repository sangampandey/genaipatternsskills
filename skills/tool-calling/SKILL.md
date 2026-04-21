---
name: tool-calling
description: >-
  Implement the Tool Calling pattern (Agents). Let LLMs interact with external systems by emitting structured function calls that your code executes safely on their behalf. Use when working with: function-calling, tools, actions, api.
---

# Tool Calling

> Category: Agents | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/agents/tool-calling

## What This Pattern Solves

**Tool Calling is** a pattern that lets an LLM invoke external functions, APIs, or services during generation. The model outputs a structured function call with arguments, the system executes it, and the result is fed back to the model for the next reasoning step.

## When to Use This Skill

Tool calling is the right pattern whenever the model needs information or capabilities that are not in its training data or the current prompt context. The most common cases are real-time data access (current stock prices, live system status, weather), operations on external systems (sending messages, updating records, triggering workflows), and precise computation (math, date calculations, data transformations where token prediction is unreliable).

It is also the right choice when you want to keep the model's responsibilities narrow. Rather than trying to stuff every possible piece of context into the prompt, you let the model decide what information it needs and fetch it on demand. This keeps prompts small, reduces token costs, and means the model works with current data rather than a potentially stale context snapshot.

If you are building anything that goes beyond question-answering over static text, you will likely need tool calling. It is the foundation of agent-style systems where the model acts as a reasoning and planning layer while external tools handle execution.

## Architecture Rules

- Tool calling is the right pattern whenever the model needs information or capabilities that are n...
- It is also the right choice when you want to keep the model's responsibilities narrow
- If you are building anything that goes beyond question-answering over static text, you will likel...

## Implementation Steps

1. The pattern works through a structured loop between your application code and the language model. You define a set of tools, each described by a name, a natural language description of what it does, and a schema for its input parameters.
2. When the model decides it needs to use a tool, it does not generate a natural language response. Instead, it emits a structured object, typically JSON, specifying which tool to call and what arguments to pass.
3. This loop can repeat multiple times within a single conversation turn. The model might call a search tool, examine the results, decide it needs more specific information, call a different tool with refined parameters, and then synthesize a final answer from all the gathered data.
4. The critical architectural point is that the model never executes anything itself. It only produces a description of what it wants to happen.
5. Adapt the code template below to your specific requirements
6. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
import json
from openai import OpenAI

client = OpenAI()

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "City name"},
            },
            "required": ["location"],
        },
    },
}]

def get_weather(location: str) -> str:
    return json.dumps({"location": location, "temp": "72F", "condition": "sunny"})

TOOL_MAP = {"get_weather": get_weather}

def agent_loop(query: str, max_iterations: int = 10) -> str:
    messages = [{"role": "user", "content": query}]

    for _ in range(max_iterations):
        response = client.chat.completions.create(
            model="gpt-4o", messages=messages, tools=tools,
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            return msg.content

        messages.append(msg)
        for tc in msg.tool_calls:
            fn = TOOL_MAP.get(tc.function.name)
            if fn is None:
                result = json.dumps({"error": f"Unknown tool: {tc.function.name}"})
            else:
                result = fn(**json.loads(tc.function.arguments))
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return "Max iterations reached. Could not complete the request."
```

## Verification Checklist

- [ ] Verified: Schema design is where most tool-calling implementations fail first.
- [ ] Verified: model calling the wrong tool is a real problem in systems with many tools.
- [ ] Maximum iteration limit is set to prevent infinite loops
- [ ] Security checks are in place against prompt injection and adversarial inputs
- [ ] Implementation follows the Tool Calling architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Each tool call adds latency. The model must generate the structured output, your code must execute the function, and the result must be sent back. For simple tools like a calculator, this overhead is small. For tools that call external APIs with their own latency (database queries, third-party services), each tool call can add hundreds of milliseconds or more. Multi-step tool chains where the model calls three or four tools in sequence can push total response time well beyond what feels interactive.

Schema maintenance is an ongoing burden. Every time you change an API, add a parameter, or rename a field, the tool schema must be updated. If the schema drifts from the actual implementation, the model will generate calls that fail at execution time. Treating tool schemas as a contract with the same discipline you apply to API versioning helps, but it is additional work that teams often underestimate.

The security surface area is real and proportional to the power of your tools. A read-only search tool is low risk. A tool that can modify production data is high risk. You need to think carefully about the blast radius of every tool you expose and implement appropriate guardrails. This is not optional and it is not paranoid. Models will occasionally generate unexpected tool calls, and your execution layer must handle those safely.

