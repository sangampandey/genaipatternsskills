# Tool Calling

> Category: Agents | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/agents/tool-calling

## What This Pattern Solves

**Tool Calling is** a pattern that lets an LLM invoke external functions, APIs, or services during generation. The model outputs a structured function call with arguments, the system executes it, and the result is fed back to the model for the next reasoning step.

## Architecture Rules

- The pattern works through a structured loop between your application code and the language model. You define a set of tools, each described by a name, a natural language description of what it does, and a schema for its input parameters. You include these tool definitions in the system prompt or API configuration when calling the model.
- When the model decides it needs to use a tool, it does not generate a natural language response. Instead, it emits a structured object, typically JSON, specifying which tool to call and what arguments to pass. Your application code intercepts this, validates the arguments, executes the actual function (makes the API call, runs the database query, performs the calculation), and returns the result to the model. The model then uses that result to formulate its response to the user.
- This loop can repeat multiple times within a single conversation turn. The model might call a search tool, examine the results, decide it needs more specific information, call a different tool with refined parameters, and then synthesize a final answer from all the gathered data. Each iteration follows the same pattern: model emits a tool call, your code executes it, the result goes back to the model.
- The critical architectural point is that the model never executes anything itself. It only produces a description of what it wants to happen. Your code is the execution layer, which means you retain full control over what actually runs. You can validate inputs, enforce rate limits, check permissions, and log every action before it happens. The model proposes; your code disposes.

## Implementation Steps

1. The pattern works through a structured loop between your application code and the language model. You define a set of tools, each described by a name, a natural language description of what it does, and a schema for its input parameters. You include these tool definitions in the system prompt or API configuration when calling the model.
2. When the model decides it needs to use a tool, it does not generate a natural language response. Instead, it emits a structured object, typically JSON, specifying which tool to call and what arguments to pass. Your application code intercepts this, validates the arguments, executes the actual function (makes the API call, runs the database query, performs the calculation), and returns the result to the model. The model then uses that result to formulate its response to the user.
3. This loop can repeat multiple times within a single conversation turn. The model might call a search tool, examine the results, decide it needs more specific information, call a different tool with refined parameters, and then synthesize a final answer from all the gathered data. Each iteration follows the same pattern: model emits a tool call, your code executes it, the result goes back to the model.
4. The critical architectural point is that the model never executes anything itself. It only produces a description of what it wants to happen. Your code is the execution layer, which means you retain full control over what actually runs. You can validate inputs, enforce rate limits, check permissions, and log every action before it happens. The model proposes; your code disposes.

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

- [ ] Verified: Schema design is where most tool-calling implementations fail first. If the tool description is vague or the parameter names are ambiguous, the model will misinterpret when to use the tool or what arguments to pass. A tool called "search" with a parameter called "query" gives the model very little to work with. A tool called "search_customer_orders" with parameters "customer_id" (required, string) and "date_range" (optional, object with start and end) communicates intent much more clearly. Investing time in precise, well-documented tool schemas pays off immediately in reliability.
- [ ] Verified: No model calling the wrong tool is a real problem in systems with many tools. If you expose 30 tools, the model may confuse similar-sounding options or try to use a tool for a purpose it was not designed for. Keeping the tool set small and focused for each conversation context helps. You do not need to expose every tool in every interaction.
- [ ] Verified: Infinite loops happen when the model calls a tool, receives a result it does not understand or cannot use, and calls the same tool again with slightly different parameters, over and over. Setting a maximum tool call count per turn and implementing circuit breakers are basic safeguards.
- [ ] Verified: Security is the most serious concern. The model is generating inputs that your code will execute. If one of your tools writes to a database or calls a third-party API with side effects, a malicious or confused model could cause real damage. Every tool call should be validated against an allowlist of permitted operations, parameter values should be sanitized, and destructive operations should require explicit confirmation before execution.

## Trade-offs

Each tool call adds latency. The model must generate the structured output, your code must execute the function, and the result must be sent back. For simple tools like a calculator, this overhead is small. For tools that call external APIs with their own latency (database queries, third-party services), each tool call can add hundreds of milliseconds or more. Multi-step tool chains where the model calls three or four tools in sequence can push total response time well beyond what feels interactive.

Schema maintenance is an ongoing burden. Every time you change an API, add a parameter, or rename a field, the tool schema must be updated. If the schema drifts from the actual implementation, the model will generate calls that fail at execution time. Treating tool schemas as a contract with the same discipline you apply to API versioning helps, but it is additional work that teams often underestimate.

The security surface area is real and proportional to the power of your tools. A read-only search tool is low risk. A tool that can modify production data is high risk. You need to think carefully about the blast radius of every tool you expose and implement appropriate guardrails. This is not optional and it is not paranoid. Models will occasionally generate unexpected tool calls, and your execution layer must handle those safely.

