---
name: prompt-optimization
description: >-
  Implement the Prompt Optimization pattern (Prompting). Automatically optimize prompts against evaluation datasets instead of relying on manual trial-and-error tuning of instructions. Use when working with: dspy, optimization, automated, evaluation.
---

# Prompt Optimization

> Category: Prompting | Difficulty: advanced | Reference: https://www.genaipatterns.dev/patterns/prompting/prompt-optimization

## What This Pattern Solves

**Prompt Optimization is** a pattern that systematically improves prompt effectiveness through iterative testing, evaluation, and refinement. It treats prompts as code artifacts that should be versioned, benchmarked against test cases, and optimized for specific quality metrics.

## When to Use This Skill

Prompt optimization becomes worthwhile when you have a stable task with measurable quality criteria and enough volume to justify the setup cost. A classification pipeline processing thousands of inputs per day is a perfect candidate. A one-off analysis task is not.

It is especially valuable when the model changes. If you are building on a foundation model that gets updated periodically, your manually tuned prompts will drift. An optimization framework lets you re-run the optimization against the new model and get updated prompts without manual effort.

Complex pipelines with multiple interacting prompts benefit the most. Tuning each step in isolation misses interactions between steps. An optimizer can evaluate the full pipeline end-to-end and find step-level configurations that work well together even if they would not seem optimal in isolation.

Skip this pattern if you are still exploring what your task looks like. Optimization requires a stable objective, and if you are still changing the output format or the evaluation criteria, the optimization results will be invalid by the time they converge.

## Architecture Rules

- Prompt optimization becomes worthwhile when you have a stable task with measurable quality criter...
- It is especially valuable when the model changes
- Complex pipelines with multiple interacting prompts benefit the most
- Skip this pattern if you are still exploring what your task looks like

## Implementation Steps

1. Prompt optimization replaces the manual tweak-and-test cycle with a systematic search. You define four components: a pipeline of prompt steps, a dataset of examples with expected outputs, an evaluator that scores outputs, and an optimizer that explores variations and selects the best performers.
2. The pipeline describes the structure of your prompts. It might be a single prompt template with variable slots, or it might be a multi-step chain where each step has its own template.
3. The dataset provides ground truth. You need a representative set of inputs paired with correct outputs, or at least with enough annotation to evaluate quality.
4. The evaluator scores each candidate prompt against the dataset. This can be an exact-match metric, a custom scoring function, or an LLM-as-Judge that rates outputs on a rubric.
5. The optimizer explores the space of prompt variations. Different frameworks use different strategies.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/prompting/prompt-optimization

## Verification Checklist

- [ ] Verified: Overfitting to your evaluation set is the most common failure.
- [ ] Verified: Evaluation quality bottlenecks the entire process.
- [ ] Security checks are in place against prompt injection and adversarial inputs
- [ ] Cost per request is estimated and within budget
- [ ] Implementation follows the Prompt Optimization architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

The upfront investment is substantial. You need to build an evaluation dataset, implement or configure an evaluator, set up the optimization framework, and run the search. For a simple single-prompt task, this overhead may not be justified compared to an hour of manual tuning.

You trade interpretability for performance. An optimized prompt may contain phrasing that seems strange or counterintuitive to a human reader. It works because it works, not because it makes sense to you. This can make it harder to maintain or debug when something goes wrong.

Prompt optimization creates a dependency on your evaluation infrastructure. If the evaluation set becomes stale, or the evaluation metric drifts from actual quality, the optimized prompts degrade silently. You need ongoing maintenance of the evaluation pipeline, not just the prompts.

The payoff is reproducibility and measurability. You can rerun the optimization, compare versions quantitatively, track improvements over time, and respond to model changes systematically. For production systems, this rigor is worth the investment.

