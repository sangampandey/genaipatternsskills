---
name: self-check
description: >-
  Implement the Self-Check pattern (Safety & Guardrails). Detect potential hallucinations by analyzing token probabilities and confidence scores in LLM outputs before they reach the user. Use when working with: hallucination, logprobs, confidence, perplexity.
---

# Self-Check

> Category: Safety & Guardrails | Difficulty: advanced | Reference: https://www.genaipatterns.dev/patterns/safety/self-check

## What This Pattern Solves

**Self-Check is** a pattern where the LLM evaluates its own output for correctness, safety, or policy compliance before returning it. The model generates an answer, then a second pass critiques that answer against specific criteria, and the system either accepts, revises, or rejects the response.

## When to Use This Skill

Self-check is most valuable when your application generates factual claims that users might act on. If the model is writing creative fiction or brainstorming ideas, hallucination is a feature, not a bug. If the model is producing legal summaries, medical recommendations, or financial reports, you need confidence scoring.

This pattern also makes sense when you cannot verify outputs against a ground-truth database in real time. If you have a database to check against, do that instead. Self-check is for situations where the facts are too diverse, too nuanced, or too numerous for simple lookup validation.

It is worth implementing when you have the engineering capacity to handle flagged outputs gracefully. Self-check tells you something might be wrong. You still need a plan for what happens next. That might mean routing to a human reviewer, falling back to a retrieval-based answer, or simply telling the user that the system is not confident in this particular response.

## Architecture Rules

- Self-check is most valuable when your application generates factual claims that users might act on
- pattern also makes sense when you cannot verify outputs against a ground-truth database in real time
- It is worth implementing when you have the engineering capacity to handle flagged outputs gracefully

## Implementation Steps

1. The self-check pattern exploits the fact that language models do expose their internal confidence, even if they do not express it in their text output. Most model APIs can return log probabilities (logprobs) for each generated token.
2. The simplest approach is to monitor logprobs on the tokens that matter most. In a structured output where the model produces key-value pairs, you often care about the values more than the keys.
3. A more robust method is to generate the same response multiple times (using a non-zero temperature) and compare the outputs. If the model produces consistent answers across five generations, it is likely drawing on well-represented training data.
4. You can also compute perplexity over a generated sequence as a normalized confidence metric. Perplexity aggregates token-level probabilities into a single number that represents how "surprised" the model was by its own output.
5. For production systems, some teams train a lightweight classifier on top of token probability features. You collect examples of verified correct outputs and known hallucinations, extract their probability profiles, and train a small model to distinguish between them.
6. Adapt the code template below to your specific requirements
7. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

def self_check(question: str, context: str = "") -> dict:
    """Generate a response, then verify it for accuracy."""
    # Step 1: Generate the initial response
    gen_messages = [{"role": "user", "content": question}]
    if context:
        gen_messages.insert(0, {"role": "system", "content": f"Answer based on this context:\n{context}"})

    response = client.chat.completions.create(
        model="gpt-4o", messages=gen_messages,
    )
    answer = response.choices[0].message.content

    # Step 2: Ask the model to verify its own claims
    verification = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"""Review this answer for accuracy. List any claims that might be wrong or unverifiable.

Question: {question}
Answer: {answer}

Reply in this format:
VERDICT: PASS or FAIL
ISSUES: (list any problems, or "none")""",
        }],
    )
    check_result = verification.choices[0].message.content

    return {
        "answer": answer,
        "verification": check_result,
        "passed": "VERDICT: PASS" in check_result,
    }

# Usage
result = self_check("What year was Python first released?")
print(f"Answer: {result['answer']}")
print(f"Passed: {result['passed']}")
```

## Verification Checklist

- [ ] Monitoring and logging are configured for production debugging
- [ ] Latency impact is measured and within acceptable bounds
- [ ] Security checks are in place against prompt injection and adversarial inputs
- [ ] Verified: There is also the risk of over-filtering.
- [ ] Implementation follows the Self-Check architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Cost increases with the sophistication of your self-check approach. Logprob monitoring is nearly free if the API already returns probabilities. Multi-generation consistency checks multiply your costs linearly. Training a custom classifier requires labeled data collection and model maintenance.

Latency is the other major cost. Any self-check that requires additional model calls adds time. For conversational applications where users expect sub-second responses, you may need to run checks asynchronously and surface confidence indicators after the initial response.

Self-check does not fix hallucination. It detects it, sometimes. You are adding a probabilistic detection layer on top of a probabilistic generation system. The combination is better than generation alone, but it is not a guarantee. Critical applications should combine self-check with retrieval-based grounding and human review for high-stakes outputs.

