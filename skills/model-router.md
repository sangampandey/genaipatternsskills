---
name: model-router
description: >-
  Implement the Model Router pattern (Routing & Orchestration). Route queries to the right model tier based on estimated complexity to optimize cost without sacrificing quality on harder tasks. Use when working with: routing, cost-optimization, model-selection, classification.
---

# Model Router

> Category: Routing & Orchestration | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/routing/model-router

## What This Pattern Solves

**Model Router is** a pattern that directs queries to different LLMs based on task complexity, cost constraints, or capability requirements. Simple queries go to smaller, cheaper models while complex queries route to more capable ones, optimizing the cost-quality balance.

## When to Use This Skill

Model routing makes sense when you have meaningful cost or latency differences between available models and enough request volume for the savings to matter.

Good conditions for this pattern:

- Your traffic mix includes a wide range of query complexity
- You are spending significantly on LLM API costs and need to optimize
- Latency is important and you want simpler queries to resolve faster
- You have access to multiple models at different price points
- Your error tolerance allows occasional misrouting (a complex query hitting a simple model and getting a subpar answer)

Less compelling conditions:

- All your queries are roughly the same complexity
- You only have access to one model
- Cost is not a concern relative to the value each request generates
- You need guaranteed quality on every single request and cannot tolerate any degradation

## Architecture Rules

- Model routing makes sense when you have meaningful cost or latency differences b
- Good conditions for this pattern:
- Your traffic mix includes a wide range of query complexity
- You are spending significantly on LLM API costs and need to optimize
- Latency is important and you want simpler queries to resolve faster

## Implementation Steps

1. A model router sits between your users and your model pool. It examines each incoming request, classifies it by complexity or difficulty, and sends it to the appropriate model tier.
2. There are several ways to build the classifier.
3. *Rule-based routing** uses simple heuristics. If the query contains certain keywords (like "summarize" or "translate"), route to the cheap model.
4. *ML-based routing** trains a lightweight classifier on labeled examples. You take a dataset of queries, label each one with the model tier that should handle it, and train a small model (logistic regression, random forest, or a small neural network) to predict the right tier.
5. *LLM-based routing** uses a cheap, fast model to assess the complexity of the incoming query before routing it. You send the query to a small model with a prompt like "Rate the complexity of this question on a scale of 1 to 5.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/routing/model-router

## Verification Checklist

- [ ] Verified: *Misrouting complex queries to cheap models.
- [ ] Cost per request is estimated and within budget
- [ ] Verified: *Model tier boundaries that do not match your traffic.
- [ ] Data freshness is maintained — indexes/caches stay in sync with source
- [ ] Verified: *User experience inconsistency.
- [ ] Implementation follows the Model Router architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

**You gain** lower average cost per query, faster response times for simple requests, and the ability to scale more efficiently by reserving expensive compute for queries that genuinely need it.

**You pay** with system complexity (another component to build and maintain), the risk of quality degradation on misrouted queries, and the need for ongoing monitoring and tuning of the routing logic.

**Accuracy of routing determines the value.** A router that correctly identifies 90% of simple queries saves significantly more than one that only catches 60%. Invest in the quality of your classifier. Good labeled data makes a huge difference here.

**The pattern compounds well with caching.** If you cache responses for common queries, the router only needs to handle cache misses. This means the router primarily sees novel or unusual queries, which are often the harder ones. Keep this in mind when evaluating router accuracy, your test distribution might not match your production distribution after caching.

