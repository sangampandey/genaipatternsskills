---
name: hybrid-retrieval
description: >-
  Implement the Hybrid Retrieval pattern (RAG). Bridge the vocabulary gap between user queries and knowledge base content using hypothetical answers, query expansion, and hybrid search. Use when working with: retrieval, hyde, query-expansion, hybrid-search.
---

# Hybrid Retrieval

> Category: RAG | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/rag/hybrid-retrieval

## What This Pattern Solves

**Hybrid Retrieval is** a pattern that adapts the retrieval strategy based on the structure and metadata of the underlying index. Instead of treating all queries the same, it uses filters, hybrid search, or multi-index routing to narrow the search space before ranking.

## When to Use This Skill

Start with basic vector search and measure your retrieval quality. If you notice that relevant documents frequently appear outside the top-k results, or that users rephrase questions multiple times before getting a good answer, you have a vocabulary gap problem.

HyDE works well when your knowledge base uses specialized terminology and your users do not. It adds one LLM call per query, so it is best suited for use cases where latency tolerance is moderate and retrieval accuracy matters more than speed.

Query expansion is a lighter touch. It works well when users tend to ask short, ambiguous questions. If your average query is three to five words, expansion helps fill in the missing context.

Hybrid search should be your default in production. The cost of running BM25 alongside vector search is minimal, and the accuracy improvement is consistent across domains. There is rarely a good reason not to use it.

Graph-based retrieval makes sense when your knowledge base has strong entity relationships, when questions often require connecting information across documents, or when you have a well-structured corpus like technical documentation with cross-references.

## Architecture Rules

- Start with basic vector search and measure your retrieval quality
- HyDE works well when your knowledge base uses specialized terminology and your users do not
- Query expansion is a lighter touch
- Hybrid search should be your default in production
- Graph-based retrieval makes sense when your knowledge base has strong entity rel

## Implementation Steps

1. Index-aware retrieval is a family of techniques that reshape either the query or the search mechanism to account for how information is actually stored in your index. Instead of hoping the user's words land close enough to the right embeddings, you actively bridge the gap.
2. *HyDE (Hypothetical Document Embeddings)** flips the retrieval problem on its head. Before searching, you ask an LLM to generate a hypothetical answer to the user's question.
3. *Query expansion** takes a different approach. Rather than generating a full answer, you rewrite the original query into multiple variations that cover different phrasings.
4. *Hybrid search** attacks the problem from the retrieval engine side. Pure vector search captures semantic meaning but can miss exact keyword matches.
5. *Graph-based retrieval** adds structural relationships between chunks. Instead of treating every chunk as an independent point in vector space, you build a graph where chunks link to related chunks, parent documents, entities, and concepts.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/rag/hybrid-retrieval

## Verification Checklist

- [ ] Monitoring and logging are configured for production debugging
- [ ] Relevance filtering is in place — irrelevant results are filtered before reaching the model
- [ ] Verified: Hybrid search requires tuning the alpha parameter per domain.
- [ ] Cost per request is estimated and within budget
- [ ] Implementation follows the Hybrid Retrieval architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Every technique here adds latency, complexity, or both. HyDE adds an LLM call before retrieval. Query expansion multiplies your search load. Hybrid search requires maintaining two index types. Graph retrieval requires building and updating a knowledge graph.

The question is always whether your retrieval quality problems justify the added complexity. If basic vector search gives you 90% accuracy on your evaluation set, adding HyDE to get to 93% may not be worth the extra 500ms per query. If basic search gives you 60% accuracy, these techniques are essential.

Start with hybrid search because the cost is low and the benefit is broad. Add query expansion if short queries are common. Reserve HyDE for domains with severe vocabulary mismatch. Consider graph retrieval only when your questions genuinely require multi-document reasoning and you have the engineering capacity to maintain the graph.

