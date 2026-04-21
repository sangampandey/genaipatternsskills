---
name: deep-search
description: >-
  Implement the Deep Search pattern (RAG). Answer complex multi-hop questions through iterative cycles of retrieval, reasoning, and gap analysis across multiple sources. Use when working with: multi-hop, iterative, research, deep-research.
---

# Deep Search

> Category: RAG | Difficulty: advanced | Reference: https://www.genaipatterns.dev/patterns/rag/deep-search

## What This Pattern Solves

**Deep Search is** a pattern that runs multiple retrieval passes with query reformulation, branching, and aggregation to find information that a single retrieval step would miss. It trades latency for recall by exploring the document space more thoroughly than basic RAG.

## When to Use This Skill

Deep Search is designed for questions that require synthesis across multiple documents or data sources. If your users regularly ask questions that start with "compare," "analyze the trend," "what is the relationship between," or "summarize all," you likely need iterative retrieval.

It is also the right pattern when your knowledge base is large and heterogeneous. A corpus of 10,000 documents spanning multiple domains, formats, and time periods is almost guaranteed to require multi-hop reasoning for non-trivial questions.

Do not reach for Deep Search when simple questions dominate your workload. If 90% of queries can be answered from a single chunk, the overhead of iterative retrieval is not justified. Use it selectively, either as a separate "deep research" mode that users can invoke explicitly, or triggered automatically when the system detects that a question is complex.

The latency profile is very different from basic RAG. A single retrieval round might take 200 milliseconds. Three to five rounds of retrieval with reasoning in between can take 5 to 30 seconds. Users need to understand that they are waiting for a more thorough answer, not experiencing a bug.

## Architecture Rules

- Deep Search is designed for questions that require synthesis across multiple documents or data so...
- It is also the right pattern when your knowledge base is large and heterogeneous
- Do not reach for Deep Search when simple questions dominate your workload
- latency profile is very different from basic RAG

## Implementation Steps

1. Deep Search replaces the single retrieve-generate cycle with an iterative loop. The system retrieves, reasons about what it found, identifies gaps, and retrieves again.
2. The loop works like this. First, the system decomposes the original question into sub-questions.
3. After the first retrieval round, a reasoning step evaluates the results. This is where Deep Search diverges from basic RAG.
4. If gaps exist, the system formulates new queries to fill them. These follow-up queries are informed by what was already retrieved.
5. The loop has exit conditions. The obvious one is that all sub-questions are answered with sufficient evidence.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/rag/deep-search

## Verification Checklist

- [ ] Maximum iteration limit is set to prevent infinite loops
- [ ] Verified: Query decomposition can go wrong in subtle ways.
- [ ] Verified: Contradiction handling is hard.
- [ ] Data freshness is maintained — indexes/caches stay in sync with source
- [ ] Implementation follows the Deep Search architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Cost scales linearly with the number of retrieval rounds and the number of sub-queries per round. A five-round deep search with three sub-queries per round means fifteen retrieval calls plus the reasoning overhead. For high-volume applications, this cost can be significant. Consider reserving Deep Search for a subset of queries or offering it as a premium feature.

Latency is the most visible trade-off. Users conditioned by instant search results may not wait 15 seconds for an answer, even if that answer is dramatically better. The user experience needs to communicate that deeper research is happening. Progress indicators, streaming partial results, and explicit "researching..." states help manage expectations.

Debugging is harder than with basic RAG. When the final answer is wrong, you need to trace through multiple retrieval rounds, reasoning steps, and query reformulations to find where the process went astray. Good logging at every step is essential.

The engineering investment is substantial. You need query decomposition, iterative retrieval orchestration, quality evaluation at each step, cross-document reasoning, budget management, and result synthesis. This is closer to building an agent than building a search pipeline. Make sure the complexity is justified by your use case before committing to it.

