---
name: few-shot-prompting
description: >-
  Implement the Few-Shot Prompting pattern (Prompting). Include input-output examples in your prompt so the model learns the expected format, tone, and behavior by demonstration. Use when working with: examples, in-context-learning, formatting, classification.
---

# Few-Shot Prompting

> Category: Prompting | Difficulty: beginner | Reference: https://www.genaipatterns.dev/patterns/prompting/few-shot-prompting

## What This Pattern Solves

**Few-Shot Prompting is** a technique that provides the LLM with a small number of input-output examples before the actual query. These demonstrations teach the model the expected format, reasoning style, and task boundaries without any fine-tuning or weight updates.

## When to Use This Skill

Few-shot prompting is the right choice when you need consistent output formatting. If the model keeps returning results in slightly different structures, examples will lock down the format faster than instructions will.

It works well for classification tasks where you have a fixed label set. Show the model a few inputs mapped to their correct labels and it will generalize the classification logic. This is often more reliable than explaining the classification criteria in words, especially when the categories involve subjective judgment.

Style matching is another strong use case. If you need the model to write in a particular voice, match a specific tone, or follow a house style, a few examples of the desired style teach the model more effectively than a style guide would.

Information extraction benefits enormously from few-shot examples. Show the model three inputs with the entities highlighted and the output structured, and it will consistently extract the same types of information from new text.

Skip few-shot prompting when the task is straightforward enough that zero-shot instructions work reliably, or when the context window is too limited to accommodate examples alongside the actual input.

## Architecture Rules

- Few-shot prompting is the right choice when you need consistent output formatting
- It works well for classification tasks where you have a fixed label set
- Style matching is another strong use case
- Information extraction benefits enormously from few-shot examples
- Skip few-shot prompting when the task is straightforward enough that zero-shot i

## Implementation Steps

1. Instead of describing what you want, show it. Include a handful of input-output pairs in your prompt that demonstrate the exact behavior you expect.
2. Here is what makes few-shot prompting powerful. A single example communicates format, style, level of detail, and edge case handling all at once, without you having to articulate any of those things explicitly.
3. The examples do real work. They anchor the model's behavior in concrete instances rather than abstract descriptions.
4. Choosing good examples matters more than choosing many examples. Three diverse, representative examples typically outperform ten similar ones.
5. Adapt the code template below to your specific requirements
6. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

def few_shot_classify(text: str) -> str:
    """Classify sentiment using few-shot examples."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Classify the sentiment as positive, negative, or neutral."},
            {"role": "user", "content": "The food was absolutely incredible, best meal I've had in years."},
            {"role": "assistant", "content": "positive"},
            {"role": "user", "content": "Waited 45 minutes and the order was wrong. Never coming back."},
            {"role": "assistant", "content": "negative"},
            {"role": "user", "content": "The restaurant is located on Main Street and opens at 11am."},
            {"role": "assistant", "content": "neutral"},
            {"role": "user", "content": text},
        ],
    )
    return response.choices[0].message.content

# Usage
print(few_shot_classify("The service was slow but the dessert made up for it."))
```

## Verification Checklist

- [ ] Verified: biggest risk is biased or unrepresentative examples.
- [ ] Verified: Order effects are real.
- [ ] Monitoring and logging are configured for production debugging
- [ ] Context window usage is managed — retrieved content fits within model limits
- [ ] Implementation follows the Few-Shot Prompting architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Token cost is the most obvious trade-off. Each example adds to your prompt length, which means higher latency and higher cost per request. For high-volume applications, this matters. Five examples at 200 tokens each adds a thousand tokens to every single request.

Maintenance is an underappreciated cost. When your requirements change, you need to update all your examples. If the output format evolves, every example needs to be revised. This is manageable with three examples but becomes a burden with more.

Few-shot prompting trades flexibility for consistency. A zero-shot prompt can handle a wider range of unexpected inputs because it relies on the model's general capabilities. A few-shot prompt constrains the model to behave like the examples, which is great when you want consistency but can be limiting when inputs diverge significantly from what the examples cover.

There is also the question of example curation effort. Finding or creating good examples takes time. For some tasks, this is trivial. For others, especially tasks requiring domain expertise, creating high-quality examples is a significant investment.

