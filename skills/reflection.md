# Reflection

> Category: Evaluation | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/evaluation/reflection

## What This Pattern Solves

**Reflection is** a pattern where an LLM critiques and iteratively improves its own output. After generating an initial response, the model evaluates it against quality criteria, identifies weaknesses, and produces a revised version, repeating until the output meets the desired standard.

## Architecture Rules

- Reflection implements the draft-review-revise cycle that good human work goes through. The process has four stages that repeat. First, generate an initial response. Second, send that response to an evaluator that identifies specific problems, gaps, or areas for improvement. Third, use the critique to construct a revised prompt that asks the model to fix the identified issues. Fourth, generate an improved response. Repeat until the output meets your quality bar or you hit a maximum number of iterations.
- The evaluator is the engine of the whole loop. It can be another LLM prompted with a rubric, a rule-based checker, an external tool that validates factual claims, or even a human reviewer inserted at a checkpoint. What matters is that it produces specific, actionable critique rather than a generic quality score. "The second paragraph incorrectly states that Python uses static typing" is useful feedback. "Score: 3 out of 5" is not, because the generator has nothing concrete to act on.
- A crucial design choice is whether the evaluator is the same model as the generator. Using the same model is simpler but creates a blind spot. The model may not catch its own mistakes because it has the same biases and knowledge gaps that produced those mistakes in the first place. Using a different model, or a different evaluation approach entirely, introduces a genuinely independent perspective. A fact-checking tool that verifies claims against a database catches errors that no language model would notice through text analysis alone.
- The loop converges because each iteration addresses specific identified issues rather than generating from scratch. The revised prompt carries forward what was good about the previous response and targets what was wrong. Progress is cumulative. The first iteration might fix factual errors. The second might improve structure. The third might add missing details. Each cycle makes the output strictly better along the dimensions the evaluator checks.

## Implementation Steps

1. Reflection implements the draft-review-revise cycle that good human work goes through. The process has four stages that repeat. First, generate an initial response. Second, send that response to an evaluator that identifies specific problems, gaps, or areas for improvement. Third, use the critique to construct a revised prompt that asks the model to fix the identified issues. Fourth, generate an improved response. Repeat until the output meets your quality bar or you hit a maximum number of iterations.
2. The evaluator is the engine of the whole loop. It can be another LLM prompted with a rubric, a rule-based checker, an external tool that validates factual claims, or even a human reviewer inserted at a checkpoint. What matters is that it produces specific, actionable critique rather than a generic quality score. "The second paragraph incorrectly states that Python uses static typing" is useful feedback. "Score: 3 out of 5" is not, because the generator has nothing concrete to act on.
3. A crucial design choice is whether the evaluator is the same model as the generator. Using the same model is simpler but creates a blind spot. The model may not catch its own mistakes because it has the same biases and knowledge gaps that produced those mistakes in the first place. Using a different model, or a different evaluation approach entirely, introduces a genuinely independent perspective. A fact-checking tool that verifies claims against a database catches errors that no language model would notice through text analysis alone.
4. The loop converges because each iteration addresses specific identified issues rather than generating from scratch. The revised prompt carries forward what was good about the previous response and targets what was wrong. Progress is cumulative. The first iteration might fix factual errors. The second might improve structure. The third might add missing details. Each cycle makes the output strictly better along the dimensions the evaluator checks.

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

- [ ] Verified: No most frustrating failure mode is oscillation. The evaluator flags an issue, the generator fixes it, and in doing so introduces a different issue that the next evaluation round flags. The output bounces between two imperfect states without converging on a good one. This usually indicates that the evaluation criteria are conflicting or that the generator cannot satisfy all criteria simultaneously.
- [ ] Verified: Over-iteration degrades quality instead of improving it. After a certain number of rounds, the model starts making changes for the sake of change rather than genuine improvement. It might add unnecessary hedging language, restructure paragraphs without benefit, or introduce new errors while trying to address minor critique points. Setting a maximum iteration count and stopping when improvements become marginal prevents this.
- [ ] Verified: Evaluator quality is the ceiling for the entire loop. If the evaluator misses a class of errors, no amount of iteration will fix them. If the evaluator flags things that are not actually problems, the generator will waste cycles making unnecessary changes. The evaluator needs to be at least as discerning as the quality bar you are trying to meet.
- [ ] Verified: Context window pressure builds with each iteration. The revised prompt needs to include the previous output plus the critique plus new instructions. After several rounds, the accumulated context can crowd out important details or push past the model's effective context length. Summarizing previous feedback rather than including it verbatim helps manage this.

## Trade-offs

Latency multiplies with each iteration. A three-round reflection loop takes roughly three times as long as a single generation. For real-time applications, this may be too slow. You can mitigate this by running reflection asynchronously and presenting an initial response while refinement happens in the background, but this adds complexity.

Cost scales linearly with the number of iterations, and potentially more if the evaluator is also an LLM. Each cycle involves at least one generation call and one evaluation call. For a three-round loop with separate evaluation, that is six API calls per output.

The quality ceiling depends on the weakest component. If the generator cannot produce good output even with perfect feedback, more iterations will not help. If the evaluator cannot identify the real problems, the generator has nothing useful to work with. Both components need to be good enough for the loop to converge on quality.

You gain predictable quality at the cost of predictable latency and cost. A single pass has variable quality and fixed cost. A reflection loop has more consistent quality but variable cost, since some inputs might converge in one iteration while others need the full maximum.

