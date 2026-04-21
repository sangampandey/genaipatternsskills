---
name: prompt-chaining
description: >-
  Implement the Prompt Chaining pattern (Prompting). Break complex tasks into a sequence of focused prompts where each step's output feeds into the next for more reliable multi-step results. Use when working with: sequential, pipeline, decomposition, multi-step.
---

# Prompt Chaining

> Category: Prompting | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/prompting/prompt-chaining

## What This Pattern Solves

**Prompt Chaining is** a pattern that breaks a complex task into a sequence of simpler LLM calls, where each call's output feeds into the next call's input. This decomposition makes each step easier to debug, validate, and optimize independently.

## When to Use This Skill

The clearest signal is when you have a task with naturally separable stages. If you can draw a flowchart of the process with distinct boxes and arrows between them, prompt chaining is likely the right approach.

Another strong signal is when different parts of the task have different reliability requirements. If extraction needs to be exhaustive but summarization can be lossy, separating them lets you tune each step independently. You might retry the extraction step if it looks incomplete without re-running the summarization.

Prompt chaining also makes sense when you need deterministic control flow. If the second step should only run when the first step finds certain conditions, you need the ability to branch. A single prompt cannot conditionally skip parts of its own execution, but a pipeline can route outputs to different next steps based on intermediate results.

Avoid prompt chaining for tasks that genuinely are atomic. If you are asking the model to translate a paragraph or answer a simple question, splitting it into steps adds latency and complexity for no benefit.

## Architecture Rules

- clearest signal is when you have a task with naturally separable stages
- Another strong signal is when different parts of the task have different reliability requirements
- Prompt chaining also makes sense when you need deterministic control flow
- Avoid prompt chaining for tasks that genuinely are atomic

## Implementation Steps

1. Prompt chaining decomposes a complex task into a pipeline of simpler prompts. Each prompt handles one well-defined step.
2. Consider a content moderation pipeline. Step one extracts potentially problematic phrases from a piece of text.
3. The power of this approach goes beyond just splitting work. Because each step produces an explicit intermediate output, you get natural inspection points.
4. There is another advantage that is easy to overlook. Different steps in your pipeline can use different models.
5. Adapt the code template below to your specific requirements
6. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

def call_llm(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content

def extract_then_summarize(article: str) -> str:
    """Two-step chain: extract key facts, then summarize them."""
    # Step 1: Extract structured facts
    facts = call_llm(
        f"Extract the 5 most important facts from this article as a numbered list.\n\n{article}"
    )

    # Step 2: Summarize the extracted facts
    summary = call_llm(
        f"Write a 2-sentence executive summary based on these facts:\n\n{facts}"
    )
    return summary

# Usage
article = "OpenAI announced GPT-5 today with 2x performance improvements..."
print(extract_then_summarize(article))
```

## Verification Checklist

- [ ] Verified: Error propagation is the primary risk.
- [ ] Verified: Format coupling between steps is a common source of bugs.
- [ ] Latency impact is measured and within acceptable bounds
- [ ] Verified: Context loss is another failure mode.
- [ ] Implementation follows the Prompt Chaining architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

You trade simplicity for control. A single prompt is easy to understand and maintain. A pipeline has multiple prompts, data transformations between them, error handling at each step, and retry logic. The operational complexity is real, and it scales with the number of steps.

Cost is higher in terms of total tokens consumed but potentially lower in terms of cost per correct output. A single prompt that fails 30% of the time and needs re-running might actually cost more than a three-step chain that succeeds 95% of the time on the first try. It depends on your failure rates and retry strategies.

You gain debuggability but lose atomicity. A single prompt either works or it does not. A pipeline can partially succeed, which means you need to handle partial failures. What do you do when step three fails but steps one and two succeeded? Do you retry from step three or start over?

Development speed is slower upfront but faster for iteration. Changing one step in a pipeline does not require re-testing the entire chain from scratch. You can swap out the classification model, or adjust the extraction prompt, and only validate that specific step plus any downstream effects.

