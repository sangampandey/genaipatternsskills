---
name: cascading
description: >-
  Implement the Cascading pattern (Routing & Orchestration). Try cheaper models first and escalate to more capable ones only when confidence is low, reducing costs while maintaining output quality. Use when working with: fallback, escalation, cost-optimization, confidence.
---

# Cascading

> Category: Routing & Orchestration | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/routing/cascading

## What This Pattern Solves

**Cascading is** a pattern that tries a cheaper or faster model first and only escalates to a more expensive model if the initial response fails a quality check. It reduces average cost and latency by handling easy queries with lightweight models.

## When to Use This Skill

Cascading works best when the cost difference between model tiers is significant and most of your traffic can be handled by cheap models.

Strong indicators:

- Your query distribution is heavy-tailed, lots of simple queries and a smaller number of hard ones
- The cost difference between your cheapest and most expensive model is 10x or more
- You can tolerate slightly higher latency on hard queries (they go through multiple tiers) in exchange for much lower latency on easy ones
- You have a reasonable way to assess response quality without human review
- Your application can handle the occasional retry transparently without confusing the user

Weaker indicators:

- Almost all your queries require the most capable model
- The latency of retrying through multiple tiers is unacceptable
- You cannot build a reliable quality gate for your domain
- The cost difference between model tiers is small

## Architecture Rules

- Cascading works best when the cost difference between model tiers is significant
- Strong indicators:
- Your query distribution is heavy-tailed, lots of simple queries and a smaller nu
- cost difference between your cheapest and most expensive model is 10x or mor
- You can tolerate slightly higher latency on hard queries (they go through multip

## Implementation Steps

1. Cascading takes a fundamentally different approach from upfront routing. Instead of deciding which model to use before generating a response, you start with the cheapest model and evaluate the result.
2. Picture it as a series of attempts. The first tier is a small, fast, cheap model.
3. The second tier is a mid-range model. Same process.
4. The quality gate is the critical component. There are several approaches to implementing it.
5. *Logprob-based gates** look at the model's own confidence in its output. If the average token probability is below a threshold, the model was uncertain and escalation is warranted.
6. Adapt the code template below to your specific requirements
7. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

def quality_gate(question: str, answer: str) -> bool:
    """Ask a cheap model whether the answer is good enough."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"Rate this answer's quality. Is it complete, accurate, and well-structured?\n\nQuestion: {question}\nAnswer: {answer}\n\nReply with only PASS or FAIL.",
        }],
    )
    return response.choices[0].message.content.strip().upper() == "PASS"

def cascading_query(question: str) -> dict:
    """Try cheap model first. Escalate to expensive model if quality is low."""
    # Tier 1: cheap model
    cheap_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": question}],
    )
    cheap_answer = cheap_response.choices[0].message.content

    if quality_gate(question, cheap_answer):
        return {"answer": cheap_answer, "model_used": "gpt-4o-mini", "escalated": False}

    # Tier 2: expensive model (only if cheap model fails quality gate)
    expensive_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": question}],
    )
    return {"answer": expensive_response.choices[0].message.content, "model_used": "gpt-4o", "escalated": True}

# Usage
result = cascading_query("Explain the CAP theorem in distributed systems.")
print(f"Model used: {result['model_used']} (escalated: {result['escalated']})")
print(result["answer"])
```

## Verification Checklist

- [ ] Cost per request is estimated and within budget
- [ ] Monitoring and logging are configured for production debugging
- [ ] Latency impact is measured and within acceptable bounds
- [ ] Verified: *Confidently wrong cheap models.
- [ ] Verified: *Inconsistent user experience across escalation levels.
- [ ] Implementation follows the Cascading architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

**You gain** significant cost reduction on easy queries, automatic quality assurance through the gating mechanism, and a system that gracefully handles the full spectrum of query difficulty.

**You pay** with added system complexity, potential latency on hard queries, the engineering effort of building and tuning quality gates, and the risk of quality gate failures in both directions.

**The savings curve is nonlinear.** If 80% of queries resolve at the cheapest tier, you save roughly 70 to 80% compared to using the expensive model for everything (accounting for quality gate overhead). If only 40% resolve cheaply, savings drop dramatically because you are paying for both the cheap attempt and the expensive escalation.

**Quality gates are the make-or-break component.** A good quality gate makes cascading highly effective. A bad one either costs you money (too strict) or costs you quality (too lenient). Plan to iterate on your gate logic extensively. It is not a set-and-forget component.

**Cascading and caching are complementary.** Cached responses for common queries bypass the cascade entirely, so the cascade only handles novel requests. This shifts the difficulty distribution of cascaded queries upward, meaning a higher fraction will escalate. Factor this into your escalation rate expectations.

