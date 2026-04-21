# Cascading

> Category: Routing & Orchestration | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/routing/cascading

## What This Pattern Solves

**Cascading is** a pattern that tries a cheaper or faster model first and only escalates to a more expensive model if the initial response fails a quality check. It reduces average cost and latency by handling easy queries with lightweight models.

## Architecture Rules

- Cascading takes a fundamentally different approach from upfront routing. Instead of deciding which model to use before generating a response, you start with the cheapest model and evaluate the result. If the result passes a quality gate, you return it. If it does not, you escalate to the next model tier and try again.
- Picture it as a series of attempts. The first tier is a small, fast, cheap model. It generates a response. A quality gate evaluates that response. Did the model express uncertainty? Are the logprobs below a confidence threshold? Does a quick consistency check pass? If yes, the response ships. If no, the query moves to the next tier.
- The second tier is a mid-range model. Same process. Generate, evaluate, decide. If this tier passes the quality gate, done. If not, escalate to the premium tier. The premium tier is your safety net, the most capable model you have access to. Its response goes to the user regardless of quality gate results (though you might flag low-confidence responses for human review).
- The quality gate is the critical component. There are several approaches to implementing it.
- **Logprob-based gates** look at the model's own confidence in its output. If the average token probability is below a threshold, the model was uncertain and escalation is warranted. This is cheap to compute because logprobs come back with the generation itself. The downside is that models can be confidently wrong, high logprobs do not guarantee correctness.
- **Self-check gates** ask the model to evaluate its own response. "Are you confident in this answer? Rate your confidence from 1 to 5." This uses an additional cheap LLM call but can catch some cases where the model was wrong despite high token probabilities. The model's self-assessment is imperfect but useful as one signal among several.
- **LLM-as-Judge gates** use a separate model (often the same cheap tier) to evaluate the response. "Does this response fully answer the question? Is it factually consistent?" This is more expensive than logprobs but more robust than self-assessment.
- **Deterministic gates** apply hard rules. If the response contains "I am not sure" or "I do not have enough information," escalate. If the response is suspiciously short for a question that should require a detailed answer, escalate. Simple but effective for catching obvious failures.

## Implementation Steps

1. Cascading takes a fundamentally different approach from upfront routing. Instead of deciding which model to use before generating a response, you start with the cheapest model and evaluate the result. If the result passes a quality gate, you return it. If it does not, you escalate to the next model tier and try again.
2. Picture it as a series of attempts. The first tier is a small, fast, cheap model. It generates a response. A quality gate evaluates that response. Did the model express uncertainty? Are the logprobs below a confidence threshold? Does a quick consistency check pass? If yes, the response ships. If no, the query moves to the next tier.
3. The second tier is a mid-range model. Same process. Generate, evaluate, decide. If this tier passes the quality gate, done. If not, escalate to the premium tier. The premium tier is your safety net, the most capable model you have access to. Its response goes to the user regardless of quality gate results (though you might flag low-confidence responses for human review).
4. The quality gate is the critical component. There are several approaches to implementing it.
5. *Logprob-based gates** look at the model's own confidence in its output. If the average token probability is below a threshold, the model was uncertain and escalation is warranted. This is cheap to compute because logprobs come back with the generation itself. The downside is that models can be confidently wrong, high logprobs do not guarantee correctness.
6. *Self-check gates** ask the model to evaluate its own response. "Are you confident in this answer? Rate your confidence from 1 to 5." This uses an additional cheap LLM call but can catch some cases where the model was wrong despite high token probabilities. The model's self-assessment is imperfect but useful as one signal among several.

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

- [ ] Verified: *Quality gates that are too lenient.** If the gate lets bad responses through, users get low-quality answers and you lose trust. A lenient gate saves money but at the cost of output quality. Err on the side of escalating too often during initial deployment, then tighten the gate as you gather data on what the cheap model handles well.
- [ ] Verified: *Quality gates that are too strict.** The opposite problem. If the gate escalates almost everything, you are paying for the cheap model's generation plus the expensive model's generation on most queries. Total cost is higher than just using the expensive model directly. Monitor your escalation rate. If it exceeds 50 to 60%, your cheap model is not capable enough or your gate is too aggressive.
- [ ] Verified: *Latency stacking.** Each tier adds latency. If a query falls through all tiers, the total response time is the sum of all generations plus all quality evaluations. For interactive applications, this cumulative latency can be unacceptable. Set a maximum number of tiers (three is typical) and consider parallel generation for the first two tiers if latency is critical.
- [ ] Verified: *Confidently wrong cheap models.** Some small models produce plausible but incorrect answers with high confidence. Logprob-based gates will not catch these because the model's token probabilities are high. This is the hardest failure mode to detect. LLM-as-Judge gates help but add cost. Domain-specific checks (like verifying calculations or checking facts against a database) are more reliable when available.
- [ ] Verified: *Inconsistent user experience across escalation levels.** Different models have different writing styles, different levels of detail, and different formatting preferences. Users might notice that some responses feel different from others. If consistency matters, consider post-processing all responses through a formatting step regardless of which tier generated them.

## Trade-offs

**You gain** significant cost reduction on easy queries, automatic quality assurance through the gating mechanism, and a system that gracefully handles the full spectrum of query difficulty.

**You pay** with added system complexity, potential latency on hard queries, the engineering effort of building and tuning quality gates, and the risk of quality gate failures in both directions.

**The savings curve is nonlinear.** If 80% of queries resolve at the cheapest tier, you save roughly 70 to 80% compared to using the expensive model for everything (accounting for quality gate overhead). If only 40% resolve cheaply, savings drop dramatically because you are paying for both the cheap attempt and the expensive escalation.

**Quality gates are the make-or-break component.** A good quality gate makes cascading highly effective. A bad one either costs you money (too strict) or costs you quality (too lenient). Plan to iterate on your gate logic extensively. It is not a set-and-forget component.

**Cascading and caching are complementary.** Cached responses for common queries bypass the cascade entirely, so the cascade only handles novel requests. This shifts the difficulty distribution of cascaded queries upward, meaning a higher fraction will escalate. Factor this into your escalation rate expectations.

