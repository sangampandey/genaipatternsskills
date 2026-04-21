---
name: guardrails
description: >-
  Implement the Guardrails pattern (Safety & Guardrails). Insert safety layers at input, output, retrieval, and execution points to enforce content policies, prevent harm, and block prompt injection. Use when working with: safety, input-filtering, output-filtering, moderation.
---

# Guardrails

> Category: Safety & Guardrails | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/safety/guardrails

## What This Pattern Solves

**Guardrails is** a pattern that wraps LLM inputs and outputs with validation rules to enforce safety, format, and policy constraints. Input guardrails filter harmful or off-topic prompts before they reach the model. Output guardrails check generated text for policy violations, hallucinations, or format errors before returning it to the user.

## When to Use This Skill

Use guardrails when your application is user-facing and you cannot tolerate arbitrary model outputs. This is especially important when the application handles sensitive data like personal information, financial records, or health data. If you are building an internal tool for a small trusted team, lightweight guardrails may suffice. If you are building a consumer product, you need all four layers.

Guardrails are also the right choice when you need auditable safety. Regulated industries often require you to demonstrate that specific controls are in place. A guardrail architecture gives you clear checkpoints where you can log decisions, flag violations, and prove compliance.

If your application allows the model to execute actions (calling APIs, writing to databases, sending emails), execution guardrails are non-negotiable. A model that can take real-world actions without validation is a security incident waiting to happen.

## Architecture Rules

- guardrails when your application is user-facing and you cannot tolerate arbitrary model outputs
- Guardrails are also the right choice when you need auditable safety
- If your application allows the model to execute actions (calling APIs, writing to databases, send...

## Implementation Steps

1. Guardrails are dedicated processing layers that sit between the components of your LLM pipeline. Think of them as middleware for AI applications.
2. There are four natural insertion points. Input guardrails sit between the user and the model.
3. Each guardrail layer can perform three actions. It can pass the data through unchanged, modify the data (for example, redacting PII or rewriting a response), or reject the request entirely with an appropriate error message.
4. Adapt the code template below to your specific requirements
5. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

BLOCKED_TOPICS = ["violence", "illegal activity", "self-harm"]

def input_guardrail(user_input: str) -> tuple[bool, str]:
    """Check if user input violates safety policies."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": f"You are a safety classifier. Does this input request content about any of these topics: {', '.join(BLOCKED_TOPICS)}? Reply with only YES or NO."},
            {"role": "user", "content": user_input},
        ],
    )
    is_blocked = response.choices[0].message.content.strip().upper() == "YES"
    return (not is_blocked, "Input blocked by safety policy." if is_blocked else "")

def output_guardrail(response_text: str) -> tuple[bool, str]:
    """Check if model output contains problematic content."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Does this text contain factual claims that could be harmful if wrong (medical, legal, financial advice)? Reply YES or NO."},
            {"role": "user", "content": response_text},
        ],
    )
    needs_disclaimer = response.choices[0].message.content.strip().upper() == "YES"
    if needs_disclaimer:
        return (True, response_text + "\n\n*Disclaimer: This is not professional advice. Consult a qualified expert.*")
    return (True, response_text)

def guarded_chat(user_input: str) -> str:
    """Chat with input and output guardrails."""
    safe, msg = input_guardrail(user_input)
    if not safe:
        return msg

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": user_input}],
    )
    raw_output = response.choices[0].message.content

    _, final_output = output_guardrail(raw_output)
    return final_output

# Usage
print(guarded_chat("What are some good stretches for lower back pain?"))
```

## Verification Checklist

- [ ] Guardrails are calibrated — not too strict (blocking legitimate use) or too loose
- [ ] Security checks are in place against prompt injection and adversarial inputs
- [ ] Verified: Over-reliance on LLM-based guardrails introduces a circular problem.
- [ ] Latency impact is measured and within acceptable bounds
- [ ] Implementation follows the Guardrails architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Guardrails increase system complexity. You are adding multiple processing stages, each with its own logic, configuration, and failure modes. This means more code to maintain, more tests to write, and more things that can break during deployment.

There is a real tension between safety and utility. Every guardrail that blocks harmful content will occasionally block legitimate content. The tighter your filters, the more false positives you generate. Finding the right threshold is an ongoing process, not a one-time decision.

Cost is a factor when guardrail layers involve additional model calls. Running a classifier on every input and output doubles your inference costs at minimum. Rule-based and regex-based checks are essentially free, but they catch fewer edge cases.

Latency increases with each guardrail layer. Users notice when a chatbot takes three seconds instead of one. You may need to invest in optimizing your guardrail pipeline, running checks in parallel where possible, or using smaller, faster models for safety classification.

