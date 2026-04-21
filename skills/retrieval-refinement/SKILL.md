---
name: retrieval-refinement
description: >-
  Implement the Retrieval Refinement pattern (RAG). Improve retrieval quality by reranking, compressing, and filtering retrieved chunks between the vector search step and LLM generation. Use when working with: reranking, compression, filtering, relevance.
---

# Retrieval Refinement

> Category: RAG | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/rag/retrieval-refinement

## What This Pattern Solves

**Retrieval Refinement is** a pattern that refines retrieved chunks after the initial search but before they reach the LLM. Techniques include re-ranking by relevance, deduplicating near-identical passages, filtering by recency or metadata, and compressing context to fit token budgets.

## When to Use This Skill

If your retrieval accuracy is below 80% on your evaluation set and you have already tuned your embedding model and chunking strategy, postprocessing is the next lever to pull. Reranking alone often yields a 10 to 25 percentage point improvement in relevance metrics.

Use reranking when you can tolerate an additional 100 to 300 milliseconds of latency per query. Cross-encoder models are slower than bi-encoder retrieval but still fast enough for most interactive use cases.

Use contextual compression when your chunks are large, say 500 tokens or more, and you are concerned about context window usage or LLM distraction from irrelevant content.

Use metadata filtering when your knowledge base has clear freshness requirements, when documents have reliable source quality indicators, or when entity ambiguity is a known issue.

Skip postprocessing if your retrieval is already highly accurate, if latency requirements are extremely tight (under 200ms total), or if your knowledge base is small enough that retrieved chunks are almost always relevant.

## Architecture Rules

- If your retrieval accuracy is below 80% on your evaluation set and you have already tuned your em...
- reranking when you can tolerate an additional 100 to 300 milliseconds of latency per query
- contextual compression when your chunks are large, say 500 tokens or more, a
- metadata filtering when your knowledge base has clear freshness requirements
- Skip postprocessing if your retrieval is already highly accurate, if latency req

## Implementation Steps

1. Node postprocessing is a processing stage that sits between retrieval and generation. It takes the raw retrieved chunks and transforms them into a refined set that is actually useful for the LLM.
2. *Reranking** is the most impactful technique. You take your initial retrieved set, typically 20 to 50 chunks, and pass them through a cross-encoder model that scores each chunk against the original query.
3. *Contextual compression** addresses the problem of chunks that contain the answer alongside a lot of noise. Instead of passing the entire chunk to the LLM, you use a smaller model to extract only the sentences or passages that are relevant to the query.
4. *Disambiguation** handles the entity collision problem. When your knowledge base contains documents about multiple entities that share a name, retrieved chunks can mix them together.
5. *Metadata filtering** applies hard constraints based on chunk metadata. You might filter by recency, keeping only documents updated in the last year.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/rag/retrieval-refinement

## Verification Checklist

- [ ] Monitoring and logging are configured for production debugging
- [ ] Verified: Contextual compression can accidentally remove important context.
- [ ] Verified: Over-filtering is a real risk.
- [ ] Verified: Stacking too many postprocessing steps creates a pipeline that is hard to debug.
- [ ] Implementation follows the Retrieval Refinement architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Reranking adds latency and requires hosting or calling an additional model. Cross-encoder models are more expensive to run than bi-encoder retrieval because they process the query-document pair together rather than using pre-computed embeddings. For high-throughput systems, this cost adds up.

Compression reduces the information available to the LLM. This is usually a good thing, but it means you are making an irreversible decision about what is relevant before the LLM sees the content. If the compression model gets it wrong, the LLM has no way to recover.

The overall engineering cost is moderate. Reranking is a well-understood pattern with good library support. Compression and disambiguation require more custom work. The testing and evaluation burden increases because you now need to measure quality at multiple pipeline stages, not just the final output.

The biggest trade-off is complexity versus quality. A simple retrieve-and-generate pipeline is easy to build, easy to debug, and easy to explain. Each postprocessing step makes the system smarter but harder to maintain. Add them incrementally and measure the impact of each one independently.

