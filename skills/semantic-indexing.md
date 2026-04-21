# Semantic Indexing

> Category: RAG | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/rag/semantic-indexing

## What This Pattern Solves

**Semantic Indexing is** a pattern that converts documents into dense vector embeddings so retrieval can match on meaning rather than keywords. By encoding chunks into a shared embedding space with the query, it finds conceptually relevant passages even when they use completely different terminology.

## Architecture Rules

- Embedding models convert text into dense numerical vectors, typically arrays of 384 to 1536 floating-point numbers. These vectors occupy a high-dimensional space where proximity corresponds to semantic similarity. Two pieces of text that mean roughly the same thing will end up near each other in this space, regardless of whether they share any words.
- The indexing flow works like this: take each chunk from your document corpus and pass it through the embedding model. Store the resulting vector alongside the original text in a vector database. This is a one-time cost per chunk, though you need to re-embed when content changes.
- The query flow mirrors this: take the user's question, pass it through the same embedding model to get a query vector, then find the nearest vectors in your index using a similarity metric like cosine distance. The chunks whose vectors are closest to the query vector are your retrieval results. This entire lookup is fast, typically single-digit milliseconds for databases with millions of vectors, because vector databases use approximate nearest neighbor algorithms optimized for this kind of search.
- What makes this powerful is that the embedding model has learned, during its own training, that "cancel subscription" and "account termination" refer to similar concepts. The vectors it produces for these phrases will be close together. You get synonym handling, paraphrase handling, and even cross-lingual matching for free, without writing a single rule. The trade-off is that you are now dependent on the quality and biases of the embedding model itself.

## Implementation Steps

1. Embedding models convert text into dense numerical vectors, typically arrays of 384 to 1536 floating-point numbers. These vectors occupy a high-dimensional space where proximity corresponds to semantic similarity. Two pieces of text that mean roughly the same thing will end up near each other in this space, regardless of whether they share any words.
2. The indexing flow works like this: take each chunk from your document corpus and pass it through the embedding model. Store the resulting vector alongside the original text in a vector database. This is a one-time cost per chunk, though you need to re-embed when content changes.
3. The query flow mirrors this: take the user's question, pass it through the same embedding model to get a query vector, then find the nearest vectors in your index using a similarity metric like cosine distance. The chunks whose vectors are closest to the query vector are your retrieval results. This entire lookup is fast, typically single-digit milliseconds for databases with millions of vectors, because vector databases use approximate nearest neighbor algorithms optimized for this kind of search.
4. What makes this powerful is that the embedding model has learned, during its own training, that "cancel subscription" and "account termination" refer to similar concepts. The vectors it produces for these phrases will be close together. You get synonym handling, paraphrase handling, and even cross-lingual matching for free, without writing a single rule. The trade-off is that you are now dependent on the quality and biases of the embedding model itself.

## Code Template

```python
from openai import OpenAI
import numpy as np

client = OpenAI()

def embed(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [e.embedding for e in response.data]

def cosine_similarity(a: list[float], b: list[float]) -> float:
    a_np, b_np = np.array(a), np.array(b)
    return float(np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np)))

def semantic_search(query: str, documents: list[str], top_k: int = 3):
    query_embedding = embed([query])[0]
    doc_embeddings = embed(documents)

    scores = [(cosine_similarity(query_embedding, de), doc)
              for de, doc in zip(doc_embeddings, documents)]
    scores.sort(reverse=True)
    return scores[:top_k]
```

## Verification Checklist

- [ ] Verified: No most common mistake is using an embedding model that was not trained on text similar to your domain. General-purpose embedding models perform well on conversational text but may struggle with highly specialized content like legal contracts, medical literature, or source code. The vectors they produce for domain-specific jargon may not capture the relationships you need. Fine-tuning on domain data or choosing a domain-specific model helps, but adds complexity to the pipeline.
- [ ] Verified: Dimensionality is a practical concern. Higher-dimensional embeddings (1536-d) capture more nuance but require more storage and compute for similarity search. Lower-dimensional embeddings (384-d) are cheaper but may conflate concepts that should remain distinct. Picking the right model and dimensionality involves testing on your actual queries, not trusting benchmark leaderboards.
- [ ] Verified: Semantic drift is a subtler problem. Embedding models can place semantically unrelated texts near each other if they share surface-level patterns. A query about "Python exceptions" might retrieve chunks about snake species if the model is confused by the word "python." This is rare with good models but happens often enough that you should always inspect retrieval results during development. Relevance scoring thresholds and re-ranking can mitigate this.
- [ ] Verified: Cold start is real. When you launch with a new embedding model and no user query logs, you have no way to validate that your vectors are actually capturing the right relationships for your use case. Building a small evaluation set of query-document pairs and measuring recall before going live is essential.

## Trade-offs

Semantic search is more expensive than keyword search at every layer. Embedding each chunk costs money (API calls or GPU time). Storing vectors costs more than storing inverted indexes. Query-time similarity search, while fast, still uses more compute than a BM25 lookup. For small corpora where keyword search works fine, the added cost and complexity of vector embeddings may not be justified.

Embedding model choice creates lock-in. If you index your entire corpus with model A and later want to switch to model B, you must re-embed everything. The vectors from different models are not compatible, they occupy different vector spaces with different semantics. This makes the initial model selection important and model migration expensive. Planning for re-indexing from the start (storing raw text alongside vectors, having a pipeline that can re-run) reduces the pain when you inevitably need to upgrade.

