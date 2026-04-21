# Prompt Chaining

> Category: Prompting | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/prompting/prompt-chaining

## What This Pattern Solves

**Prompt Chaining is** a pattern that breaks a complex task into a sequence of simpler LLM calls, where each call's output feeds into the next call's input. This decomposition makes each step easier to debug, validate, and optimize independently.

## Architecture Rules

- Prompt chaining decomposes a complex task into a pipeline of simpler prompts. Each prompt handles one well-defined step. The output of one step becomes the input to the next. Instead of one prompt doing five things poorly, you have five prompts each doing one thing well.
- Consider a content moderation pipeline. Step one extracts potentially problematic phrases from a piece of text. Step two classifies each phrase according to your policy categories. Step three decides on an overall action based on the classifications. Each step has a clear input, a clear output, and a focused instruction set. The model at each stage can dedicate its full attention to a single task.
- The power of this approach goes beyond just splitting work. Because each step produces an explicit intermediate output, you get natural inspection points. You can look at the extracted phrases before classification happens. If the extraction missed something, you know exactly where the problem is. With a monolithic prompt, debugging means re-reading the entire output and guessing which part of the instruction the model mishandled.
- There is another advantage that is easy to overlook. Different steps in your pipeline can use different models. A cheap, fast model might handle straightforward extraction while a more capable model handles nuanced classification. You can also add non-LLM steps into the chain. A database lookup, a rules-based filter, a formatting function. The chain does not need to be LLM calls all the way through.

## Implementation Steps

1. Prompt chaining decomposes a complex task into a pipeline of simpler prompts. Each prompt handles one well-defined step. The output of one step becomes the input to the next. Instead of one prompt doing five things poorly, you have five prompts each doing one thing well.
2. Consider a content moderation pipeline. Step one extracts potentially problematic phrases from a piece of text. Step two classifies each phrase according to your policy categories. Step three decides on an overall action based on the classifications. Each step has a clear input, a clear output, and a focused instruction set. The model at each stage can dedicate its full attention to a single task.
3. The power of this approach goes beyond just splitting work. Because each step produces an explicit intermediate output, you get natural inspection points. You can look at the extracted phrases before classification happens. If the extraction missed something, you know exactly where the problem is. With a monolithic prompt, debugging means re-reading the entire output and guessing which part of the instruction the model mishandled.
4. There is another advantage that is easy to overlook. Different steps in your pipeline can use different models. A cheap, fast model might handle straightforward extraction while a more capable model handles nuanced classification. You can also add non-LLM steps into the chain. A database lookup, a rules-based filter, a formatting function. The chain does not need to be LLM calls all the way through.

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

- [ ] Verified: Error propagation is the primary risk. A mistake in step one cascades through every subsequent step. If the extraction misses a key entity, the classification step will never see it, and the summary will be incomplete. Each step trusts the output of the previous step completely, so one weak link compromises the whole chain.
- [ ] Verified: Format coupling between steps is a common source of bugs. Step one needs to output data in exactly the format step two expects. If the extraction step returns entities as a comma-separated list but the classification step expects JSON, the chain breaks silently. You end up spending significant effort on the interface contracts between steps.
- [ ] Verified: Latency adds up. Each step is a separate API call with its own round-trip time. A five-step chain might take five times as long as a single prompt, and if any step needs retrying, it takes even longer. For user-facing applications, this cumulative latency can push response times past acceptable limits.
- [ ] Verified: Context loss is another failure mode. Each step only sees its own input, not the full original context. If step three needs information from the original input that step one did not pass through, it is simply unavailable. You need to think carefully about what context each step requires and make sure it is carried forward.

## Trade-offs

You trade simplicity for control. A single prompt is easy to understand and maintain. A pipeline has multiple prompts, data transformations between them, error handling at each step, and retry logic. The operational complexity is real, and it scales with the number of steps.

Cost is higher in terms of total tokens consumed but potentially lower in terms of cost per correct output. A single prompt that fails 30% of the time and needs re-running might actually cost more than a three-step chain that succeeds 95% of the time on the first try. It depends on your failure rates and retry strategies.

You gain debuggability but lose atomicity. A single prompt either works or it does not. A pipeline can partially succeed, which means you need to handle partial failures. What do you do when step three fails but steps one and two succeeded? Do you retry from step three or start over?

Development speed is slower upfront but faster for iteration. Changing one step in a pipeline does not require re-testing the entire chain from scratch. You can swap out the classification model, or adjust the extraction prompt, and only validate that specific step plus any downstream effects.

