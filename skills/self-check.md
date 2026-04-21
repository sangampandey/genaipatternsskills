# Self-Check

> Category: Safety & Guardrails | Difficulty: advanced | Pattern: genaipatterns.dev/patterns/safety/self-check

## What This Pattern Solves

**Self-Check is** a pattern where the LLM evaluates its own output for correctness, safety, or policy compliance before returning it. The model generates an answer, then a second pass critiques that answer against specific criteria, and the system either accepts, revises, or rejects the response.

## Architecture Rules

- The self-check pattern exploits the fact that language models do expose their internal confidence, even if they do not express it in their text output. Most model APIs can return log probabilities (logprobs) for each generated token. These numbers tell you how likely the model considered each token before selecting it. A high probability means the model was fairly certain. A low probability means it was choosing among many plausible alternatives, which is exactly the situation where hallucinations tend to occur.
- The simplest approach is to monitor logprobs on the tokens that matter most. In a structured output where the model produces key-value pairs, you often care about the values more than the keys. If the model generates "capital: Nairobi" with high confidence on "Nairobi" but generates "population: 4,397,073" with low confidence on the numeric tokens, that second fact deserves scrutiny. You can set a threshold and flag any claim where the relevant tokens fall below it.
- A more robust method is to generate the same response multiple times (using a non-zero temperature) and compare the outputs. If the model produces consistent answers across five generations, it is likely drawing on well-represented training data. If each generation gives a different answer, the model is guessing. This consistency check does not require access to logprobs at all, which makes it work with APIs that do not expose them.
- You can also compute perplexity over a generated sequence as a normalized confidence metric. Perplexity aggregates token-level probabilities into a single number that represents how "surprised" the model was by its own output. Lower perplexity means higher confidence. Sequences with unusually high perplexity relative to your application's baseline are candidates for human review or rejection.
- For production systems, some teams train a lightweight classifier on top of token probability features. You collect examples of verified correct outputs and known hallucinations, extract their probability profiles, and train a small model to distinguish between them. This gives you a fast, automated hallucination detector tuned to your specific domain.

## Implementation Steps

1. The self-check pattern exploits the fact that language models do expose their internal confidence, even if they do not express it in their text output. Most model APIs can return log probabilities (logprobs) for each generated token. These numbers tell you how likely the model considered each token before selecting it. A high probability means the model was fairly certain. A low probability means it was choosing among many plausible alternatives, which is exactly the situation where hallucinations tend to occur.
2. The simplest approach is to monitor logprobs on the tokens that matter most. In a structured output where the model produces key-value pairs, you often care about the values more than the keys. If the model generates "capital: Nairobi" with high confidence on "Nairobi" but generates "population: 4,397,073" with low confidence on the numeric tokens, that second fact deserves scrutiny. You can set a threshold and flag any claim where the relevant tokens fall below it.
3. A more robust method is to generate the same response multiple times (using a non-zero temperature) and compare the outputs. If the model produces consistent answers across five generations, it is likely drawing on well-represented training data. If each generation gives a different answer, the model is guessing. This consistency check does not require access to logprobs at all, which makes it work with APIs that do not expose them.
4. You can also compute perplexity over a generated sequence as a normalized confidence metric. Perplexity aggregates token-level probabilities into a single number that represents how "surprised" the model was by its own output. Lower perplexity means higher confidence. Sequences with unusually high perplexity relative to your application's baseline are candidates for human review or rejection.
5. For production systems, some teams train a lightweight classifier on top of token probability features. You collect examples of verified correct outputs and known hallucinations, extract their probability profiles, and train a small model to distinguish between them. This gives you a fast, automated hallucination detector tuned to your specific domain.

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

- [ ] Verified: Logprob thresholds are not universal. A probability that indicates high confidence on one topic might indicate low confidence on another. Rare but correct tokens (unusual proper nouns, technical terminology) will naturally have lower probabilities even when the model is right. You need domain-specific calibration, and that takes labeled data.
- [ ] Verified: No multi-generation consistency check is expensive. Generating five responses instead of one multiplies your inference cost by five and your latency by roughly the same factor unless you can run generations in parallel. For high-throughput applications, this cost may be prohibitive for every request. A common compromise is to run consistency checks only on outputs that the logprob analysis flags as uncertain.
- [ ] Verified: Self-check can create a false sense of security. High confidence does not guarantee correctness. Models can be confidently wrong, especially on topics that are well-represented in training data but where the training data itself contains errors. Self-check catches uncertainty. It does not catch confident mistakes.
- [ ] Verified: There is also the risk of over-filtering. If your thresholds are too aggressive, you will flag correct outputs as potentially hallucinated, undermining user trust and reducing the utility of the system. Calibrating thresholds requires ongoing monitoring with real production data.

## Trade-offs

Cost increases with the sophistication of your self-check approach. Logprob monitoring is nearly free if the API already returns probabilities. Multi-generation consistency checks multiply your costs linearly. Training a custom classifier requires labeled data collection and model maintenance.

Latency is the other major cost. Any self-check that requires additional model calls adds time. For conversational applications where users expect sub-second responses, you may need to run checks asynchronously and surface confidence indicators after the initial response.

Self-check does not fix hallucination. It detects it, sometimes. You are adding a probabilistic detection layer on top of a probabilistic generation system. The combination is better than generation alone, but it is not a guarantee. Critical applications should combine self-check with retrieval-based grounding and human review for high-stakes outputs.

