# Few-Shot Prompting

> Category: Prompting | Difficulty: beginner | Pattern: genaipatterns.dev/patterns/prompting/few-shot-prompting

## What This Pattern Solves

**Few-Shot Prompting is** a technique that provides the LLM with a small number of input-output examples before the actual query. These demonstrations teach the model the expected format, reasoning style, and task boundaries without any fine-tuning or weight updates.

## Architecture Rules

- Instead of describing what you want, show it. Include a handful of input-output pairs in your prompt that demonstrate the exact behavior you expect. The model picks up on the pattern and generalizes it to new inputs. This is called in-context learning, and it is one of the most reliable techniques for getting consistent, correctly formatted output.
- Here is what makes few-shot prompting powerful. A single example communicates format, style, level of detail, and edge case handling all at once, without you having to articulate any of those things explicitly. Three to five well-chosen examples can replace paragraphs of instructions. The model learns not just what to output, but how to handle the subtle decisions that are hard to express in rules.
- The examples do real work. They anchor the model's behavior in concrete instances rather than abstract descriptions. If your examples all return JSON with snake_case keys, the model will use snake_case keys. If your examples handle ambiguous inputs by returning a default value, the model will do the same. You are programming by demonstration rather than by specification.
- Choosing good examples matters more than choosing many examples. Three diverse, representative examples typically outperform ten similar ones. You want your examples to cover the range of inputs the model will see, including at least one edge case or tricky input. If your task involves classification, include at least one example of each category.

## Implementation Steps

1. Instead of describing what you want, show it. Include a handful of input-output pairs in your prompt that demonstrate the exact behavior you expect. The model picks up on the pattern and generalizes it to new inputs. This is called in-context learning, and it is one of the most reliable techniques for getting consistent, correctly formatted output.
2. Here is what makes few-shot prompting powerful. A single example communicates format, style, level of detail, and edge case handling all at once, without you having to articulate any of those things explicitly. Three to five well-chosen examples can replace paragraphs of instructions. The model learns not just what to output, but how to handle the subtle decisions that are hard to express in rules.
3. The examples do real work. They anchor the model's behavior in concrete instances rather than abstract descriptions. If your examples all return JSON with snake_case keys, the model will use snake_case keys. If your examples handle ambiguous inputs by returning a default value, the model will do the same. You are programming by demonstration rather than by specification.
4. Choosing good examples matters more than choosing many examples. Three diverse, representative examples typically outperform ten similar ones. You want your examples to cover the range of inputs the model will see, including at least one edge case or tricky input. If your task involves classification, include at least one example of each category.

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

- [ ] Verified: No biggest risk is biased or unrepresentative examples. If all your examples involve short inputs and the real data has long inputs, the model may struggle with the length difference. If your examples all fall into one category, the model may be biased toward that category. Example selection shapes behavior more than most people realize.
- [ ] Verified: Order effects are real. The model pays more attention to examples that appear later in the prompt. If you put your easiest example last, the model may perform worse on hard inputs. Shuffle or deliberately order your examples if you notice inconsistent behavior.
- [ ] Verified: Overfitting to surface patterns is a subtle failure mode. The model might latch onto incidental features of your examples rather than the underlying logic. If all your positive classification examples happen to contain the word "excellent," the model might use that word as a shortcut rather than understanding the actual classification criteria.
- [ ] Verified: Too many examples can crowd out the actual input, especially with smaller context windows. Each example takes tokens that could be used for the input or for the model's response. There is a diminishing return curve, and you will hit it sooner than you think.

## Trade-offs

Token cost is the most obvious trade-off. Each example adds to your prompt length, which means higher latency and higher cost per request. For high-volume applications, this matters. Five examples at 200 tokens each adds a thousand tokens to every single request.

Maintenance is an underappreciated cost. When your requirements change, you need to update all your examples. If the output format evolves, every example needs to be revised. This is manageable with three examples but becomes a burden with more.

Few-shot prompting trades flexibility for consistency. A zero-shot prompt can handle a wider range of unexpected inputs because it relies on the model's general capabilities. A few-shot prompt constrains the model to behave like the examples, which is great when you want consistency but can be limiting when inputs diverge significantly from what the examples cover.

There is also the question of example curation effort. Finding or creating good examples takes time. For some tasks, this is trivial. For others, especially tasks requiring domain expertise, creating high-quality examples is a significant investment.

