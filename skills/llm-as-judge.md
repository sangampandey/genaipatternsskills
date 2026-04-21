# LLM-as-Judge

> Category: Evaluation | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/evaluation/llm-as-judge

## What This Pattern Solves

**LLM-as-Judge is** a pattern that uses one language model to evaluate the output quality of another. A judge model scores or ranks generated responses against criteria like relevance, factual accuracy, helpfulness, or safety, providing scalable evaluation without human annotators.

## Architecture Rules

- LLM-as-Judge uses a language model as the evaluator. You give it the output to evaluate, a rubric describing what good and bad look like, and it returns a score with an explanation. The model acts as a proxy for human judgment, applying the same kind of qualitative assessment that a person would, but at the speed and scale of an API call.
- The rubric is the critical piece. A vague instruction like "rate this output from 1 to 5" produces inconsistent, unreliable scores. A well-designed rubric defines each score level with concrete anchor descriptions. What does a 5 look like? What specific qualities distinguish a 3 from a 4? The more precise your anchors, the more consistent the judge's scores will be.
- There are three main approaches to building an LLM judge. The simplest is prompting: write a scoring prompt with your rubric and call it on each output. This is quick to set up but has some inconsistency. The second approach combines LLM scoring with outcome data. You collect the judge's scores alongside real-world signals like user satisfaction or task completion, and train a lightweight model that integrates both signals. The third approach fine-tunes a model on human expert annotations, creating a dedicated evaluation model that closely mimics expert judgment. Each approach trades setup effort for reliability.
- The judge does not need to be the same model that generated the output. In fact, using a different model is often better. It avoids a subtle bias where models rate their own outputs more favorably than outputs from other models. A different model brings a different perspective and is less likely to share the same blind spots as the generator.

## Implementation Steps

1. LLM-as-Judge uses a language model as the evaluator. You give it the output to evaluate, a rubric describing what good and bad look like, and it returns a score with an explanation. The model acts as a proxy for human judgment, applying the same kind of qualitative assessment that a person would, but at the speed and scale of an API call.
2. The rubric is the critical piece. A vague instruction like "rate this output from 1 to 5" produces inconsistent, unreliable scores. A well-designed rubric defines each score level with concrete anchor descriptions. What does a 5 look like? What specific qualities distinguish a 3 from a 4? The more precise your anchors, the more consistent the judge's scores will be.
3. There are three main approaches to building an LLM judge. The simplest is prompting: write a scoring prompt with your rubric and call it on each output. This is quick to set up but has some inconsistency. The second approach combines LLM scoring with outcome data. You collect the judge's scores alongside real-world signals like user satisfaction or task completion, and train a lightweight model that integrates both signals. The third approach fine-tunes a model on human expert annotations, creating a dedicated evaluation model that closely mimics expert judgment. Each approach trades setup effort for reliability.
4. The judge does not need to be the same model that generated the output. In fact, using a different model is often better. It avoids a subtle bias where models rate their own outputs more favorably than outputs from other models. A different model brings a different perspective and is less likely to share the same blind spots as the generator.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/evaluation/llm-as-judge

## Verification Checklist

- [ ] Verified: Leniency bias is the most well-documented problem. LLM judges tend to give higher scores than human evaluators would. They are reluctant to give low ratings and will often find something positive to say about even mediocre outputs. You can mitigate this with rubric design, explicitly describing what a low score looks like and including negative examples, but the bias never fully disappears.
- [ ] Verified: Self-preference bias occurs when the judge model evaluates outputs from the same model family. The judge tends to prefer outputs that match its own generation style, regardless of actual quality. Using a different model family for judging helps, but introduces its own stylistic biases.
- [ ] Verified: Positional bias affects pairwise comparisons. When you ask a judge to compare two outputs, the order in which they appear in the prompt influences the verdict. Output A presented first might win when presented second it loses. The standard mitigation is to evaluate both orderings and check for consistency, but this doubles the cost.
- [ ] Verified: Rubric drift is a subtle problem. As your application evolves and your understanding of quality changes, the rubric can become misaligned with what you actually care about. The judge keeps faithfully scoring against the old criteria while your real quality bar has shifted. Regular rubric reviews and recalibration against fresh human annotations catch this before it becomes a problem.
- [ ] Verified: Calibration across score levels is rarely uniform. The judge might reliably distinguish excellent from terrible output but struggle to differentiate between good and very good. If your decisions depend on fine-grained distinctions in the middle of the scale, test calibration carefully at those levels.

## Trade-offs

The fundamental trade-off is accuracy versus scale. An LLM judge is less accurate than a careful human evaluator but can process thousands of examples in minutes. For most use cases, the slight accuracy loss is worth the massive throughput gain.

Cost is lower than human evaluation but higher than simple metrics. Each evaluation is an API call, and if you are scoring on multiple dimensions or running pairwise comparisons, the calls multiply. For high-volume evaluation, the cost is significant enough to warrant budgeting.

You trade ground truth for coverage. Human annotations on 100 examples are more trustworthy than LLM judgments on 10,000, but the broader coverage catches patterns and edge cases that a small human sample would miss. The ideal approach uses both: human annotations for calibration and validation, LLM judge for scale.

Rubric development is a real investment. A good rubric takes multiple iterations to develop, with testing against examples where you know the correct score. This upfront effort pays off in evaluation quality, but it is not trivial and requires domain expertise.

