# Chain-of-Thought

> Category: Prompting | Difficulty: beginner | Pattern: genaipatterns.dev/patterns/prompting/chain-of-thought

## What This Pattern Solves

**Chain-of-Thought (CoT) prompting is** a technique that improves LLM reasoning by instructing the model to show its work step by step before giving a final answer. By decomposing complex problems into intermediate reasoning steps, the model produces more accurate results on math, logic, and multi-step tasks.

## Architecture Rules

- Chain-of-Thought prompting is deceptively simple. You ask the model to show its work. That is the entire technique at its most basic level. By generating intermediate reasoning steps before arriving at a final answer, the model allocates more computation to the problem and keeps track of partial results in its own output.
- There are three main variants worth knowing about. The first is zero-shot Chain-of-Thought, where you append something like "Let us think step by step" to your prompt. No examples needed. This alone can dramatically improve accuracy on reasoning tasks because it shifts the model out of its default shortcut behavior. The second variant is few-shot Chain-of-Thought. Here you provide a handful of worked examples that demonstrate the step-by-step reasoning format you want. The model picks up on the pattern and applies it to new inputs. This tends to be more reliable than zero-shot because the model has a concrete template to follow. The third variant, sometimes called auto-CoT, involves building a database of verified reasoning traces and selecting relevant ones dynamically based on the input. This is more infrastructure work but scales well when you are handling diverse problem types.
- The key insight is that you are not teaching the model new reasoning skills. You are unlocking capabilities it already has by changing the generation pattern. When the model writes out "First, I need to convert miles to kilometers" before doing the conversion, it is giving itself a working memory that persists across tokens. Each step constrains the next, reducing the chance of a wrong final answer.

## Implementation Steps

1. Chain-of-Thought prompting is deceptively simple. You ask the model to show its work. That is the entire technique at its most basic level. By generating intermediate reasoning steps before arriving at a final answer, the model allocates more computation to the problem and keeps track of partial results in its own output.
2. There are three main variants worth knowing about. The first is zero-shot Chain-of-Thought, where you append something like "Let us think step by step" to your prompt. No examples needed. This alone can dramatically improve accuracy on reasoning tasks because it shifts the model out of its default shortcut behavior. The second variant is few-shot Chain-of-Thought. Here you provide a handful of worked examples that demonstrate the step-by-step reasoning format you want. The model picks up on the pattern and applies it to new inputs. This tends to be more reliable than zero-shot because the model has a concrete template to follow. The third variant, sometimes called auto-CoT, involves building a database of verified reasoning traces and selecting relevant ones dynamically based on the input. This is more infrastructure work but scales well when you are handling diverse problem types.
3. The key insight is that you are not teaching the model new reasoning skills. You are unlocking capabilities it already has by changing the generation pattern. When the model writes out "First, I need to convert miles to kilometers" before doing the conversion, it is giving itself a working memory that persists across tokens. Each step constrains the next, reducing the chance of a wrong final answer.

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

- [ ] Verified: No most common failure mode is verbose but wrong reasoning. The model generates a plausible-looking chain of steps that contains a subtle error early on, and then the rest of the reasoning faithfully builds on that mistake. The step-by-step format can actually make this harder to catch because the output looks so thorough and confident.
- [ ] Verified: Another issue is faithfulness. The reasoning the model writes out is not necessarily the reasoning it is actually using internally. Sometimes the model arrives at an answer through pattern matching and then constructs a post-hoc justification. The steps might look logical but they are a narrative, not a computation trace.
- [ ] Verified: Over-reasoning is a real problem too. For simple tasks, forcing step-by-step output can lead the model down rabbit holes. It starts considering edge cases that do not apply, second-guessing itself, and eventually producing a worse answer than it would have with a direct response.
- [ ] Verified: Finally, watch out for prompt sensitivity. Small changes in how you phrase the CoT instruction can lead to very different reasoning patterns. "Think step by step" and "Break this down into steps" and "Show your work" can all produce different quality outputs depending on the model.

## Trade-offs

The obvious cost is token usage. A step-by-step response is typically three to ten times longer than a direct answer. That means higher latency and higher API costs. For a single query this is negligible, but at scale it adds up fast.

There is also a reliability trade-off. CoT improves average accuracy but introduces more variance in output format. You need to parse the final answer out of a longer response, which means you need either a reliable extraction step or a consistent output format.

The debugging advantage is real but comes with a caveat. You are debugging the model's stated reasoning, which may not reflect its actual reasoning process. Treat the chain of thought as a useful signal, not ground truth about the model's internals.

For latency-sensitive applications, the extra generation time may be a dealbreaker. Consider whether you can run CoT offline for prompt development and then distill the results into a more direct prompt for production.

