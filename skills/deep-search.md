# Deep Search

> Category: RAG | Difficulty: advanced | Pattern: genaipatterns.dev/patterns/rag/deep-search

## What This Pattern Solves

**Deep Search is** a pattern that runs multiple retrieval passes with query reformulation, branching, and aggregation to find information that a single retrieval step would miss. It trades latency for recall by exploring the document space more thoroughly than basic RAG.

## Architecture Rules

- Deep Search replaces the single retrieve-generate cycle with an iterative loop. The system retrieves, reasons about what it found, identifies gaps, and retrieves again. It keeps going until it has gathered enough information to produce a complete answer, or until it exhausts its budget of retrieval rounds.
- The loop works like this. First, the system decomposes the original question into sub-questions. "Which microservices had the most incidents last quarter?" becomes one sub-query. "What root causes were identified?" becomes another. "What architectural changes were proposed?" becomes a third. Each sub-question can target different data sources and use different retrieval strategies.
- After the first retrieval round, a reasoning step evaluates the results. This is where Deep Search diverges from basic RAG. Instead of passing everything to the generator immediately, the system asks: Do I have enough to answer each sub-question? Are there contradictions in what I found? Are there references to other documents I should follow? This evaluation produces a quality assessment and, critically, a list of information gaps.
- If gaps exist, the system formulates new queries to fill them. These follow-up queries are informed by what was already retrieved. If the first round found incident reports for three services, the follow-up might specifically search for post-mortems related to those three services. If a post-mortem references an RFC, the follow-up retrieves that RFC. Each round builds on the previous one.
- The loop has exit conditions. The obvious one is that all sub-questions are answered with sufficient evidence. A budget limit prevents runaway costs, typically measured in total retrieval calls or elapsed time. A diminishing returns check stops the loop when new retrievals are not adding meaningful information.
- Cross-document reasoning happens throughout the process. As the system accumulates chunks from different sources, it looks for connections, contradictions, and patterns. If two post-mortems identify different root causes for the same service, that contradiction is noted and included in the final answer rather than silently resolved.
- The retrieval sources are not limited to a single vector index. Deep Search can query your knowledge base, call web search APIs, run SQL queries against structured databases, or hit internal APIs. Each sub-question routes to whichever source is most likely to have the answer. The system acts less like a search engine and more like a researcher working through a problem methodically.

## Implementation Steps

1. Deep Search replaces the single retrieve-generate cycle with an iterative loop. The system retrieves, reasons about what it found, identifies gaps, and retrieves again. It keeps going until it has gathered enough information to produce a complete answer, or until it exhausts its budget of retrieval rounds.
2. The loop works like this. First, the system decomposes the original question into sub-questions. "Which microservices had the most incidents last quarter?" becomes one sub-query. "What root causes were identified?" becomes another. "What architectural changes were proposed?" becomes a third. Each sub-question can target different data sources and use different retrieval strategies.
3. After the first retrieval round, a reasoning step evaluates the results. This is where Deep Search diverges from basic RAG. Instead of passing everything to the generator immediately, the system asks: Do I have enough to answer each sub-question? Are there contradictions in what I found? Are there references to other documents I should follow? This evaluation produces a quality assessment and, critically, a list of information gaps.
4. If gaps exist, the system formulates new queries to fill them. These follow-up queries are informed by what was already retrieved. If the first round found incident reports for three services, the follow-up might specifically search for post-mortems related to those three services. If a post-mortem references an RFC, the follow-up retrieves that RFC. Each round builds on the previous one.
5. The loop has exit conditions. The obvious one is that all sub-questions are answered with sufficient evidence. A budget limit prevents runaway costs, typically measured in total retrieval calls or elapsed time. A diminishing returns check stops the loop when new retrievals are not adding meaningful information.
6. Cross-document reasoning happens throughout the process. As the system accumulates chunks from different sources, it looks for connections, contradictions, and patterns. If two post-mortems identify different root causes for the same service, that contradiction is noted and included in the final answer rather than silently resolved.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/rag/deep-search

## Verification Checklist

- [ ] Verified: No biggest risk is scope creep during the research loop. Each reasoning step can identify new gaps, and each new retrieval can surface references to more documents. Without strict budget controls, the system can spiral into an expensive research session that retrieves dozens of documents for a question that did not warrant it.
- [ ] Verified: Query decomposition can go wrong in subtle ways. If the system breaks a question into sub-questions that miss an important dimension, no amount of iterative retrieval will find the missing piece. The decomposition step needs to be thorough, and it helps to have the system explicitly state its sub-questions so they can be inspected.
- [ ] Verified: Contradiction handling is hard. When two authoritative sources disagree, the system needs a strategy. Presenting both viewpoints is often the right choice, but it requires the system to detect the contradiction in the first place, which is not trivial.
- [ ] Verified: Information staleness compounds across retrieval rounds. If the first round retrieves a document from last year and the third round retrieves an update from last month, the system needs to recognize the temporal relationship and prefer the newer information. Without date awareness, it might synthesize an answer that mixes outdated and current information without distinguishing between them.

## Trade-offs

Cost scales linearly with the number of retrieval rounds and the number of sub-queries per round. A five-round deep search with three sub-queries per round means fifteen retrieval calls plus the reasoning overhead. For high-volume applications, this cost can be significant. Consider reserving Deep Search for a subset of queries or offering it as a premium feature.

Latency is the most visible trade-off. Users conditioned by instant search results may not wait 15 seconds for an answer, even if that answer is dramatically better. The user experience needs to communicate that deeper research is happening. Progress indicators, streaming partial results, and explicit "researching..." states help manage expectations.

Debugging is harder than with basic RAG. When the final answer is wrong, you need to trace through multiple retrieval rounds, reasoning steps, and query reformulations to find where the process went astray. Good logging at every step is essential.

The engineering investment is substantial. You need query decomposition, iterative retrieval orchestration, quality evaluation at each step, cross-document reasoning, budget management, and result synthesis. This is closer to building an agent than building a search pipeline. Make sure the complexity is justified by your use case before committing to it.

