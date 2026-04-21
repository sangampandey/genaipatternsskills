---
name: reflection
description: >-
  Implement the Reflection pattern (Evaluation). Improve LLM outputs through iterative generate-evaluate-critique-regenerate loops that refine quality without retraining the model. Use when working with: critique, iteration, improvement, self-evaluation.
---

# Reflection

> Category: Evaluation | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/evaluation/reflection

## What This Pattern Solves

**Reflection is** a pattern where an LLM critiques and iteratively improves its own output. After generating an initial response, the model evaluates it against quality criteria, identifies weaknesses, and produces a revised version, repeating until the output meets the desired standard.

## When to Use This Skill

Reflection shines when output quality has a high ceiling and the first draft consistently falls short. Writing tasks, code generation, detailed analysis, and complex summarization all benefit from iterative refinement.

It is especially useful when you can define clear, checkable quality criteria. If you can say "the output must mention all five of these topics" or "the code must handle these three edge cases," those criteria become the evaluator's checklist. Each iteration brings the output closer to meeting all criteria.

Use reflection when the cost of a wrong or mediocre output exceeds the cost of multiple API calls. If you are generating a customer-facing report that will be read by executives, spending three iterations to get it right is a better investment than sending a first-draft quality output.

It is also valuable during development and prompt tuning. Running a reflection loop on sample inputs shows you what kinds of errors your prompts tend to produce, which informs how to improve the prompts themselves.

Avoid reflection for tasks where the first response is already good enough. Simple factual questions, straightforward formatting tasks, and basic classification do not need iterative refinement. The overhead is not justified.

## Architecture Rules

- Reflection shines when output quality has a high ceiling and the first draft consistently falls s...
- It is especially useful when you can define clear, checkable quality criteria
- reflection when the cost of a wrong or mediocre output exceeds the cost of multiple API calls
- It is also valuable during development and prompt tuning
- Avoid reflection for tasks where the first response is already good enough

## Implementation Steps

1. Reflection implements the draft-review-revise cycle that good human work goes through. The process has four stages that repeat.
2. The evaluator is the engine of the whole loop. It can be another LLM prompted with a rubric, a rule-based checker, an external tool that validates factual claims, or even a human reviewer inserted at a checkpoint.
3. A crucial design choice is whether the evaluator is the same model as the generator. Using the same model is simpler but creates a blind spot.
4. The loop converges because each iteration addresses specific identified issues rather than generating from scratch. The revised prompt carries forward what was good about the previous response and targets what was wrong.
5. Adapt the code template below to your specific requirements
6. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

def reflect_and_revise(task: str, max_rounds: int = 3) -> str:
    """Generate, critique, and revise in a loop."""
    # Step 1: Initial generation
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": task}],
    )
    draft = response.choices[0].message.content

    for round_num in range(max_rounds):
        # Step 2: Critique the current draft
        critique = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": f"Critique this response. List specific weaknesses and suggest improvements. If it's good enough, say 'NO ISSUES'.\n\nTask: {task}\nResponse:\n{draft}",
            }],
        )
        feedback = critique.choices[0].message.content

        if "NO ISSUES" in feedback:
            break

        # Step 3: Revise based on critique
        revision = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": f"Revise this response based on the feedback.\n\nOriginal task: {task}\nCurrent draft:\n{draft}\nFeedback:\n{feedback}",
            }],
        )
        draft = revision.choices[0].message.content

    return draft

# Usage
result = reflect_and_revise("Write a clear explanation of how HTTPS works for a non-technical audience.")
print(result)
```

## Verification Checklist

- [ ] Verified: most frustrating failure mode is oscillation.
- [ ] Verified: Over-iteration degrades quality instead of improving it.
- [ ] Maximum iteration limit is set to prevent infinite loops
- [ ] Context window usage is managed — retrieved content fits within model limits
- [ ] Implementation follows the Reflection architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Latency multiplies with each iteration. A three-round reflection loop takes roughly three times as long as a single generation. For real-time applications, this may be too slow. You can mitigate this by running reflection asynchronously and presenting an initial response while refinement happens in the background, but this adds complexity.

Cost scales linearly with the number of iterations, and potentially more if the evaluator is also an LLM. Each cycle involves at least one generation call and one evaluation call. For a three-round loop with separate evaluation, that is six API calls per output.

The quality ceiling depends on the weakest component. If the generator cannot produce good output even with perfect feedback, more iterations will not help. If the evaluator cannot identify the real problems, the generator has nothing useful to work with. Both components need to be good enough for the loop to converge on quality.

You gain predictable quality at the cost of predictable latency and cost. A single pass has variable quality and fixed cost. A reflection loop has more consistent quality but variable cost, since some inputs might converge in one iteration while others need the full maximum.

