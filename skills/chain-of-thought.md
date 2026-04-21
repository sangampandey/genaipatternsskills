---
name: chain-of-thought
description: >-
  Implement the Chain-of-Thought pattern (Prompting). Prompt models to show their reasoning step by step to improve accuracy on multi-step problems like math, logic, and complex analysis. Use when working with: reasoning, step-by-step, zero-shot, few-shot.
---

# Chain-of-Thought

> Category: Prompting | Difficulty: beginner | Reference: https://www.genaipatterns.dev/patterns/prompting/chain-of-thought

## What This Pattern Solves

**Chain-of-Thought (CoT) prompting is** a technique that improves LLM reasoning by instructing the model to show its work step by step before giving a final answer. By decomposing complex problems into intermediate reasoning steps, the model produces more accurate results on math, logic, and multi-step tasks.

## When to Use This Skill

Chain-of-Thought works best when the task has a clear sequence of logical steps. Math problems, multi-hop question answering, code analysis, and planning tasks are all good candidates. If you find yourself thinking "the model should be able to do this" but it keeps getting the answer wrong, that is a strong signal to try CoT.

It is also useful when you need to audit the model's reasoning. A bare answer gives you nothing to debug. A step-by-step trace lets you see exactly where the logic went off track, which makes it far easier to fix your prompt or identify edge cases.

You probably do not need CoT for simple factual retrieval, straightforward classification, or tasks where the model already performs well. Adding "think step by step" to a sentiment analysis prompt is unlikely to help and will just burn extra tokens.

## Architecture Rules

- Chain-of-Thought works best when the task has a clear sequence of logical steps
- It is also useful when you need to audit the model's reasoning
- You probably do not need CoT for simple factual retrieval, straightforward classification, or tas...

## Implementation Steps

1. Chain-of-Thought prompting is deceptively simple. You ask the model to show its work.
2. There are three main variants worth knowing about. The first is zero-shot Chain-of-Thought, where you append something like "Let us think step by step" to your prompt.
3. The key insight is that you are not teaching the model new reasoning skills. You are unlocking capabilities it already has by changing the generation pattern.
4. Adapt the code template below to your specific requirements
5. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI
import re

client = OpenAI()

def chain_of_thought(question: str) -> str:
    """Zero-shot CoT: ask the model to think step by step."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"{question}\n\nThink step by step, then give your final answer after 'ANSWER:'."
        }],
    )
    full_response = response.choices[0].message.content

    # Extract the final answer after the reasoning
    match = re.search(r"ANSWER:\s*(.+)", full_response, re.DOTALL)
    return match.group(1).strip() if match else full_response

# Usage
result = chain_of_thought("If a store has 3 shelves with 8 books each, and 5 books are removed, how many remain?")
print(result)  # 19
```

## Verification Checklist

- [ ] Verified: most common failure mode is verbose but wrong reasoning.
- [ ] Monitoring and logging are configured for production debugging
- [ ] Verified: Over-reasoning is a real problem too.
- [ ] Verified: Finally, watch out for prompt sensitivity.
- [ ] Implementation follows the Chain-of-Thought architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

The obvious cost is token usage. A step-by-step response is typically three to ten times longer than a direct answer. That means higher latency and higher API costs. For a single query this is negligible, but at scale it adds up fast.

There is also a reliability trade-off. CoT improves average accuracy but introduces more variance in output format. You need to parse the final answer out of a longer response, which means you need either a reliable extraction step or a consistent output format.

The debugging advantage is real but comes with a caveat. You are debugging the model's stated reasoning, which may not reflect its actual reasoning process. Treat the chain of thought as a useful signal, not ground truth about the model's internals.

For latency-sensitive applications, the extra generation time may be a dealbreaker. Consider whether you can run CoT offline for prompt development and then distill the results into a more direct prompt for production.

