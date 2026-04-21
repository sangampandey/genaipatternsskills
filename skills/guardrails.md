# Guardrails

> Category: Safety & Guardrails | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/safety/guardrails

## What This Pattern Solves

**Guardrails is** a pattern that wraps LLM inputs and outputs with validation rules to enforce safety, format, and policy constraints. Input guardrails filter harmful or off-topic prompts before they reach the model. Output guardrails check generated text for policy violations, hallucinations, or format errors before returning it to the user.

## Architecture Rules

- Guardrails are dedicated processing layers that sit between the components of your LLM pipeline. Think of them as middleware for AI applications. They intercept data at specific points, evaluate it against your policies, and either pass it through, modify it, or reject it entirely.
- There are four natural insertion points. Input guardrails sit between the user and the model. They screen incoming prompts for injection attempts, toxic content, or out-of-scope requests before the model ever sees them. Output guardrails sit between the model's response and the user. They catch hallucinated claims, inappropriate content, or leaked sensitive data before it reaches the end user. Retrieval guardrails sit between your knowledge base and the model. When you are doing retrieval-augmented generation, these layers filter or redact retrieved documents to prevent sensitive information from entering the context window. Execution guardrails sit between the model and any tools or APIs it can call. They validate that proposed function calls are within allowed parameters and do not perform destructive operations.
- Each guardrail layer can perform three actions. It can pass the data through unchanged, modify the data (for example, redacting PII or rewriting a response), or reject the request entirely with an appropriate error message. The key insight is that these layers operate independently of the model. They can use simple rules, regex patterns, classification models, or even a second LLM call to make their decisions.

## Implementation Steps

1. Guardrails are dedicated processing layers that sit between the components of your LLM pipeline. Think of them as middleware for AI applications. They intercept data at specific points, evaluate it against your policies, and either pass it through, modify it, or reject it entirely.
2. There are four natural insertion points. Input guardrails sit between the user and the model. They screen incoming prompts for injection attempts, toxic content, or out-of-scope requests before the model ever sees them. Output guardrails sit between the model's response and the user. They catch hallucinated claims, inappropriate content, or leaked sensitive data before it reaches the end user. Retrieval guardrails sit between your knowledge base and the model. When you are doing retrieval-augmented generation, these layers filter or redact retrieved documents to prevent sensitive information from entering the context window. Execution guardrails sit between the model and any tools or APIs it can call. They validate that proposed function calls are within allowed parameters and do not perform destructive operations.
3. Each guardrail layer can perform three actions. It can pass the data through unchanged, modify the data (for example, redacting PII or rewriting a response), or reject the request entirely with an appropriate error message. The key insight is that these layers operate independently of the model. They can use simple rules, regex patterns, classification models, or even a second LLM call to make their decisions.

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

- [ ] Verified: No most common failure is building guardrails that are too rigid. If your input filter rejects anything that mentions a sensitive topic, you will block legitimate use cases. A medical chatbot that refuses to discuss symptoms because the word "pain" triggered a content filter is useless. Calibrating the sensitivity of each layer requires iteration and real user data.
- [ ] Verified: Another failure mode is treating guardrails as a one-time setup. Adversarial techniques evolve. New prompt injection methods appear regularly. Your guardrail rules need ongoing maintenance, just like any other security infrastructure.
- [ ] Verified: Over-reliance on LLM-based guardrails introduces a circular problem. If you are using a language model to check the output of another language model, both can fail in correlated ways. A prompt injection that fools your primary model might also fool your guardrail model. Combining rule-based checks with model-based checks provides better coverage than either approach alone.
- [ ] Verified: Finally, guardrails add latency. Each layer is an additional processing step. If you chain multiple LLM calls for safety checks, response times can double or triple. You need to balance safety requirements against user experience, possibly running some checks in parallel or using faster classification models for the guardrail layers.

## Trade-offs

Guardrails increase system complexity. You are adding multiple processing stages, each with its own logic, configuration, and failure modes. This means more code to maintain, more tests to write, and more things that can break during deployment.

There is a real tension between safety and utility. Every guardrail that blocks harmful content will occasionally block legitimate content. The tighter your filters, the more false positives you generate. Finding the right threshold is an ongoing process, not a one-time decision.

Cost is a factor when guardrail layers involve additional model calls. Running a classifier on every input and output doubles your inference costs at minimum. Rule-based and regex-based checks are essentially free, but they catch fewer edge cases.

Latency increases with each guardrail layer. Users notice when a chatbot takes three seconds instead of one. You may need to invest in optimizing your guardrail pipeline, running checks in parallel where possible, or using smaller, faster models for safety classification.

