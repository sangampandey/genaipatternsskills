# Retrieval Refinement

> Category: RAG | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/rag/retrieval-refinement

## What This Pattern Solves

**Retrieval Refinement is** a pattern that refines retrieved chunks after the initial search but before they reach the LLM. Techniques include re-ranking by relevance, deduplicating near-identical passages, filtering by recency or metadata, and compressing context to fit token budgets.

## Architecture Rules

- Node postprocessing is a processing stage that sits between retrieval and generation. It takes the raw retrieved chunks and transforms them into a refined set that is actually useful for the LLM. Think of it as a quality control checkpoint.
- **Reranking** is the most impactful technique. You take your initial retrieved set, typically 20 to 50 chunks, and pass them through a cross-encoder model that scores each chunk against the original query. Unlike the embedding model used during retrieval, a cross-encoder sees the query and the chunk together and can make fine-grained relevance judgments. It can distinguish between "this chunk is about the same topic" and "this chunk directly answers this question." After reranking, you take the top-k results from the reranked list, typically 3 to 5 chunks. The improvement is often dramatic. Documents that were buried at position 15 in the original ranking jump to position 1.
- **Contextual compression** addresses the problem of chunks that contain the answer alongside a lot of noise. Instead of passing the entire chunk to the LLM, you use a smaller model to extract only the sentences or passages that are relevant to the query. A 500-token chunk might get compressed down to 80 tokens of highly relevant content. This saves context window space and reduces the chance that the LLM latches onto irrelevant parts of the chunk.
- **Disambiguation** handles the entity collision problem. When your knowledge base contains documents about multiple entities that share a name, retrieved chunks can mix them together. A postprocessing step can detect when chunks refer to different entities and filter out the ones that do not match the user's intent. This often requires looking at metadata like document source, category, or timestamp to resolve the ambiguity.
- **Metadata filtering** applies hard constraints based on chunk metadata. You might filter by recency, keeping only documents updated in the last year. You might filter by source, preferring official documentation over community posts. You might filter by confidence score, dropping anything below a threshold. These filters are simple but they prevent entire categories of bad results from reaching the LLM.
- These techniques compose well. A typical production pipeline retrieves a broad initial set, applies metadata filters to remove obviously irrelevant chunks, reranks the remainder, compresses the top results, and passes the compressed output to the LLM.

## Implementation Steps

1. Node postprocessing is a processing stage that sits between retrieval and generation. It takes the raw retrieved chunks and transforms them into a refined set that is actually useful for the LLM. Think of it as a quality control checkpoint.
2. *Reranking** is the most impactful technique. You take your initial retrieved set, typically 20 to 50 chunks, and pass them through a cross-encoder model that scores each chunk against the original query. Unlike the embedding model used during retrieval, a cross-encoder sees the query and the chunk together and can make fine-grained relevance judgments. It can distinguish between "this chunk is about the same topic" and "this chunk directly answers this question." After reranking, you take the top-k results from the reranked list, typically 3 to 5 chunks. The improvement is often dramatic. Documents that were buried at position 15 in the original ranking jump to position 1.
3. *Contextual compression** addresses the problem of chunks that contain the answer alongside a lot of noise. Instead of passing the entire chunk to the LLM, you use a smaller model to extract only the sentences or passages that are relevant to the query. A 500-token chunk might get compressed down to 80 tokens of highly relevant content. This saves context window space and reduces the chance that the LLM latches onto irrelevant parts of the chunk.
4. *Disambiguation** handles the entity collision problem. When your knowledge base contains documents about multiple entities that share a name, retrieved chunks can mix them together. A postprocessing step can detect when chunks refer to different entities and filter out the ones that do not match the user's intent. This often requires looking at metadata like document source, category, or timestamp to resolve the ambiguity.
5. *Metadata filtering** applies hard constraints based on chunk metadata. You might filter by recency, keeping only documents updated in the last year. You might filter by source, preferring official documentation over community posts. You might filter by confidence score, dropping anything below a threshold. These filters are simple but they prevent entire categories of bad results from reaching the LLM.
6. These techniques compose well. A typical production pipeline retrieves a broad initial set, applies metadata filters to remove obviously irrelevant chunks, reranks the remainder, compresses the top results, and passes the compressed output to the LLM.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/rag/retrieval-refinement

## Verification Checklist

- [ ] Verified: Reranking models have their own biases. They can prefer longer chunks over shorter ones, favor formal language over casual documentation, or struggle with domain-specific terminology they were not trained on. If you use a general-purpose reranker on a highly specialized corpus, the reranking might make things worse.
- [ ] Verified: Contextual compression can accidentally remove important context. If a chunk says "unlike the previous approach, this method uses connection pooling," the compression step might extract "this method uses connection pooling" and drop the contrast with the previous approach. That lost context can change the meaning of the extracted passage.
- [ ] Verified: Over-filtering is a real risk. If your metadata filters are too aggressive, you might filter out the only chunk that contains the answer. A strict recency filter will drop older documents that are still accurate. A strict source filter might exclude community-written content that happens to have the best explanation.
- [ ] Verified: Stacking too many postprocessing steps creates a pipeline that is hard to debug. When the final answer is wrong, you need to trace back through compression, reranking, filtering, and retrieval to find where the relevant information was lost. Each step is a potential point of failure.

## Trade-offs

Reranking adds latency and requires hosting or calling an additional model. Cross-encoder models are more expensive to run than bi-encoder retrieval because they process the query-document pair together rather than using pre-computed embeddings. For high-throughput systems, this cost adds up.

Compression reduces the information available to the LLM. This is usually a good thing, but it means you are making an irreversible decision about what is relevant before the LLM sees the content. If the compression model gets it wrong, the LLM has no way to recover.

The overall engineering cost is moderate. Reranking is a well-understood pattern with good library support. Compression and disambiguation require more custom work. The testing and evaluation burden increases because you now need to measure quality at multiple pipeline stages, not just the final output.

The biggest trade-off is complexity versus quality. A simple retrieve-and-generate pipeline is easy to build, easy to debug, and easy to explain. Each postprocessing step makes the system smarter but harder to maintain. Add them incrementally and measure the impact of each one independently.

