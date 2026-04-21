# Hybrid Retrieval

> Category: RAG | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/rag/hybrid-retrieval

## What This Pattern Solves

**Hybrid Retrieval is** a pattern that adapts the retrieval strategy based on the structure and metadata of the underlying index. Instead of treating all queries the same, it uses filters, hybrid search, or multi-index routing to narrow the search space before ranking.

## Architecture Rules

- Index-aware retrieval is a family of techniques that reshape either the query or the search mechanism to account for how information is actually stored in your index. Instead of hoping the user's words land close enough to the right embeddings, you actively bridge the gap.
- **HyDE (Hypothetical Document Embeddings)** flips the retrieval problem on its head. Before searching, you ask an LLM to generate a hypothetical answer to the user's question. You do not show this answer to the user. Instead, you embed the hypothetical answer and use that embedding as your search vector. The intuition is that a plausible answer will use vocabulary much closer to what exists in your knowledge base than the original question did. A hypothetical answer to "fix a flaky deploy" might mention "intermittent failures," "retry logic," and "pipeline stability," which are exactly the terms your indexed documents contain.
- **Query expansion** takes a different approach. Rather than generating a full answer, you rewrite the original query into multiple variations that cover different phrasings. "Fix a flaky deploy" becomes three or four queries: "resolve intermittent deployment failures," "CI/CD pipeline instability troubleshooting," "unreliable release process." You run all of them and merge the results. This casts a wider net without inventing a hypothetical answer.
- **Hybrid search** attacks the problem from the retrieval engine side. Pure vector search captures semantic meaning but can miss exact keyword matches. Traditional keyword search (BM25) catches exact terms but misses semantic similarity. Hybrid search runs both in parallel and combines their scores with a tunable weight, often called alpha. At alpha=0 you get pure keyword search. At alpha=1, pure vector. Most production systems land somewhere around 0.5 to 0.7, leaning toward semantic but keeping keyword matching as a safety net.
- **Graph-based retrieval** adds structural relationships between chunks. Instead of treating every chunk as an independent point in vector space, you build a graph where chunks link to related chunks, parent documents, entities, and concepts. When a query matches one chunk, the graph lets you pull in neighboring chunks that share entities or belong to the same topic cluster. This is especially powerful for questions that span multiple documents or require connecting information from different sections.

## Implementation Steps

1. Index-aware retrieval is a family of techniques that reshape either the query or the search mechanism to account for how information is actually stored in your index. Instead of hoping the user's words land close enough to the right embeddings, you actively bridge the gap.
2. *HyDE (Hypothetical Document Embeddings)** flips the retrieval problem on its head. Before searching, you ask an LLM to generate a hypothetical answer to the user's question. You do not show this answer to the user. Instead, you embed the hypothetical answer and use that embedding as your search vector. The intuition is that a plausible answer will use vocabulary much closer to what exists in your knowledge base than the original question did. A hypothetical answer to "fix a flaky deploy" might mention "intermittent failures," "retry logic," and "pipeline stability," which are exactly the terms your indexed documents contain.
3. *Query expansion** takes a different approach. Rather than generating a full answer, you rewrite the original query into multiple variations that cover different phrasings. "Fix a flaky deploy" becomes three or four queries: "resolve intermittent deployment failures," "CI/CD pipeline instability troubleshooting," "unreliable release process." You run all of them and merge the results. This casts a wider net without inventing a hypothetical answer.
4. *Hybrid search** attacks the problem from the retrieval engine side. Pure vector search captures semantic meaning but can miss exact keyword matches. Traditional keyword search (BM25) catches exact terms but misses semantic similarity. Hybrid search runs both in parallel and combines their scores with a tunable weight, often called alpha. At alpha=0 you get pure keyword search. At alpha=1, pure vector. Most production systems land somewhere around 0.5 to 0.7, leaning toward semantic but keeping keyword matching as a safety net.
5. *Graph-based retrieval** adds structural relationships between chunks. Instead of treating every chunk as an independent point in vector space, you build a graph where chunks link to related chunks, parent documents, entities, and concepts. When a query matches one chunk, the graph lets you pull in neighboring chunks that share entities or belong to the same topic cluster. This is especially powerful for questions that span multiple documents or require connecting information from different sections.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/rag/hybrid-retrieval

## Verification Checklist

- [ ] Verified: HyDE can backfire if the LLM generates a confidently wrong hypothetical answer. If the hypothetical mentions incorrect terminology, you will retrieve documents related to the wrong concept entirely. This is especially risky in specialized domains where the LLM lacks deep knowledge.
- [ ] Verified: Query expansion can introduce noise. If your rewritten queries drift too far from the original intent, you pull in irrelevant results that dilute the good ones. Five expanded queries that each return ten results means fifty candidates to process, and many of them may be off-topic.
- [ ] Verified: Hybrid search requires tuning the alpha parameter per domain. A value that works for legal documents may perform poorly for code documentation. If you set it once and forget it, you lose much of the benefit.
- [ ] Verified: Graph-based approaches carry the highest implementation cost. Building and maintaining the graph requires entity extraction, relationship mapping, and ongoing updates as your knowledge base changes. If your corpus is flat and unstructured, the graph adds complexity without proportional benefit.

## Trade-offs

Every technique here adds latency, complexity, or both. HyDE adds an LLM call before retrieval. Query expansion multiplies your search load. Hybrid search requires maintaining two index types. Graph retrieval requires building and updating a knowledge graph.

The question is always whether your retrieval quality problems justify the added complexity. If basic vector search gives you 90% accuracy on your evaluation set, adding HyDE to get to 93% may not be worth the extra 500ms per query. If basic search gives you 60% accuracy, these techniques are essential.

Start with hybrid search because the cost is low and the benefit is broad. Add query expansion if short queries are common. Reserve HyDE for domains with severe vocabulary mismatch. Consider graph retrieval only when your questions genuinely require multi-document reasoning and you have the engineering capacity to maintain the graph.

