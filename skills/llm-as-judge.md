---
name: llm-as-judge
description: >-
  Implement the LLM-as-Judge pattern (Evaluation). Use an LLM with a custom scoring rubric to evaluate open-ended outputs at scale, replacing expensive human review with consistent automated grading. Use when working with: evaluation, scoring, rubric, quality.
---

# LLM-as-Judge

> Category: Evaluation | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/evaluation/llm-as-judge

## What This Pattern Solves

**LLM-as-Judge is** a pattern that uses one language model to evaluate the output quality of another. A judge model scores or ranks generated responses against criteria like relevance, factual accuracy, helpfulness, or safety, providing scalable evaluation without human annotators.

## When to Use This Skill

LLM-as-Judge is the right choice when you need to evaluate open-ended output at a scale that exceeds human bandwidth. If you are running prompt optimization over hundreds of examples, monitoring quality in production across thousands of requests, or comparing multiple model configurations, you need automated evaluation that understands semantics.

It works well for multi-dimensional evaluation. A single output might need to be rated on accuracy, completeness, clarity, and tone separately. A rubric-based judge can provide scores on each dimension, giving you a granular quality profile rather than a single number.

Use it when your evaluation criteria are stable enough to define in a rubric but too nuanced for simple metrics. "Is this summary factually accurate?" is too subtle for ROUGE but perfectly expressible as a rubric. "Does this response maintain a professional tone?" is inherently subjective but a well-anchored rubric can make the judgment consistent.

Avoid LLM-as-Judge for tasks where exact-match or simple metrics work fine. If you can evaluate with string comparison, regular expressions, or unit tests, do that instead. Simpler evaluation is more reliable and cheaper.

## Architecture Rules

- LLM-as-Judge is the right choice when you need to evaluate open-ended output at a scale that exce...
- It works well for multi-dimensional evaluation
- it when your evaluation criteria are stable enough to define in a rubric but too nuanced for simp...
- Avoid LLM-as-Judge for tasks where exact-match or simple metrics work fine

## Implementation Steps

1. LLM-as-Judge uses a language model as the evaluator. You give it the output to evaluate, a rubric describing what good and bad look like, and it returns a score with an explanation.
2. The rubric is the critical piece. A vague instruction like "rate this output from 1 to 5" produces inconsistent, unreliable scores.
3. There are three main approaches to building an LLM judge. The simplest is prompting: write a scoring prompt with your rubric and call it on each output.
4. The judge does not need to be the same model that generated the output. In fact, using a different model is often better.
5. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/evaluation/llm-as-judge

## Verification Checklist

- [ ] Verified: Leniency bias is the most well-documented problem.
- [ ] Verified: Self-preference bias occurs when the judge model evaluates outputs from the same model family.
- [ ] Cost per request is estimated and within budget
- [ ] Verified: Rubric drift is a subtle problem.
- [ ] Verified: Calibration across score levels is rarely uniform.
- [ ] Implementation follows the LLM-as-Judge architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

The fundamental trade-off is accuracy versus scale. An LLM judge is less accurate than a careful human evaluator but can process thousands of examples in minutes. For most use cases, the slight accuracy loss is worth the massive throughput gain.

Cost is lower than human evaluation but higher than simple metrics. Each evaluation is an API call, and if you are scoring on multiple dimensions or running pairwise comparisons, the calls multiply. For high-volume evaluation, the cost is significant enough to warrant budgeting.

You trade ground truth for coverage. Human annotations on 100 examples are more trustworthy than LLM judgments on 10,000, but the broader coverage catches patterns and edge cases that a small human sample would miss. The ideal approach uses both: human annotations for calibration and validation, LLM judge for scale.

Rubric development is a real investment. A good rubric takes multiple iterations to develop, with testing against examples where you know the correct score. This upfront effort pays off in evaluation quality, but it is not trivial and requires domain expertise.

