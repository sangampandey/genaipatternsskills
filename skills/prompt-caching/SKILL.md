---
name: prompt-caching
description: >-
  Implement the Prompt Caching pattern (Cost & Performance). Reuse responses for repeated or similar prompts through semantic and prefix caching strategies to cut latency and reduce API costs. Use when working with: caching, latency, cost-reduction, semantic-cache.
---

# Prompt Caching

> Category: Cost & Performance | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/cost-performance/prompt-caching

## What This Pattern Solves

**Prompt Caching is** a pattern that stores and reuses the processed representation of common prompt prefixes to avoid redundant computation. When multiple requests share the same system prompt or context, the cached prefix eliminates re-processing, reducing both latency and cost.

## When to Use This Skill

Start with prompt caching when your API costs are a concern and your workload has any repetition. Look at your logs. If more than 10-15% of requests are semantically similar, caching will pay for itself quickly.

Prefix caching is nearly free to adopt if your provider supports it. Many providers automatically cache prefixes beyond a certain length. You just need to structure your prompts so that the shared content (system instructions, knowledge base, few-shot examples) appears at the beginning. This is a prompt engineering change, not an infrastructure project.

Semantic caching makes sense when your users ask the same types of questions in different ways. Customer support, FAQ bots, and documentation assistants are ideal candidates. The investment is moderate: you need an embedding model and a vector store, but these are standard components in most AI stacks.

Exact-match caching is the lowest-effort option and works well for programmatic use cases where the same prompts recur literally. Batch processing jobs, automated report generation, and CI/CD pipelines that run the same analysis repeatedly all benefit from simple hash-based caching.

## Architecture Rules

- Start with prompt caching when your API costs are a concern and your workload has any repetition
- Prefix caching is nearly free to adopt if your provider supports it
- Semantic caching makes sense when your users ask the same types of questions in different ways
- Exact-match caching is the lowest-effort option and works well for programmatic use cases where t...

## Implementation Steps

1. Prompt caching eliminates redundant computation by reusing work that has already been done. There are two fundamentally different approaches, and they operate at different levels of the stack.
2. Client-side caching works at the response level. You store the full response for a given prompt and serve it directly when you see the same (or sufficiently similar) prompt again.
3. Semantic caching extends this idea to handle paraphrases. Instead of hashing the raw prompt text, you compute an embedding vector and search for cached responses whose prompts are semantically similar.
4. Server-side caching works at the computation level, inside the model's inference pipeline. When a model processes a sequence of tokens, it builds up internal representations called key-value (KV) states for each token.
5. The two approaches are complementary. Server-side prefix caching reduces the cost of processing shared context.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/cost-performance/prompt-caching

## Verification Checklist

- [ ] Data freshness is maintained — indexes/caches stay in sync with source
- [ ] Guardrails are calibrated — not too strict (blocking legitimate use) or too loose
- [ ] Security checks are in place against prompt injection and adversarial inputs
- [ ] Verified: Over-caching non-deterministic responses can hurt quality.
- [ ] Implementation follows the Prompt Caching architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Semantic caching requires infrastructure. You need an embedding model, a vector store, and the operational overhead of maintaining both. For small-scale applications, this overhead may exceed the cost savings. Simple exact-match caching with a key-value store is often a better starting point.

Cache hit rate determines the value of the entire system. If your workload is highly diverse with few repeated patterns, your hit rate will be low and the infrastructure cost will not be justified. Measure your actual repetition rate before investing heavily in caching.

Freshness and cost savings are in tension. Shorter cache TTLs keep responses fresh but reduce hit rates. Longer TTLs maximize savings but increase the risk of serving stale data. The right balance depends on how frequently your underlying information changes.

Prefix caching is largely free of trade-offs if your provider offers it. The main consideration is prompt structure. You get maximum benefit when the shared prefix is long and the variable suffix is short. Reorganizing your prompts to front-load shared content is usually straightforward.

