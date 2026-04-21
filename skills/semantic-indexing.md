---
name: semantic-indexing
description: >-
  Implement the Semantic Indexing pattern (RAG). Replace keyword matching with vector embeddings to find documents by meaning rather than exact words, enabling semantic similarity search. Use when working with: embeddings, vectors, similarity, search.
---

# Semantic Indexing

> Category: RAG | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/rag/semantic-indexing

## What This Pattern Solves

**Semantic Indexing is** a pattern that converts documents into dense vector embeddings so retrieval can match on meaning rather than keywords. By encoding chunks into a shared embedding space with the query, it finds conceptually relevant passages even when they use completely different terminology.

## When to Use This Skill

Semantic indexing is the right choice when your users ask questions in natural language and your documents do not use the same vocabulary. This is nearly always the case for customer-facing search, where users describe their problems in their own words. It is also the right choice when your corpus spans multiple languages and you want a single unified search experience without maintaining separate indexes per language.

It is worth reaching for whenever keyword search is producing too many empty result sets or low-quality matches. If you find yourself constantly tweaking synonym dictionaries and boost rules, that is a signal that you have outgrown keyword matching. Semantic indexing will not solve every retrieval problem, but it removes the class of failures caused by vocabulary mismatch.

## Architecture Rules

- Semantic indexing is the right choice when your users ask questions in natural language and your ...
- It is worth reaching for whenever keyword search is producing too many empty result sets or low-q...

## Implementation Steps

1. Embedding models convert text into dense numerical vectors, typically arrays of 384 to 1536 floating-point numbers. These vectors occupy a high-dimensional space where proximity corresponds to semantic similarity.
2. The indexing flow works like this: take each chunk from your document corpus and pass it through the embedding model. Store the resulting vector alongside the original text in a vector database.
3. The query flow mirrors this: take the user's question, pass it through the same embedding model to get a query vector, then find the nearest vectors in your index using a similarity metric like cosine distance. The chunks whose vectors are closest to the query vector are your retrieval results.
4. What makes this powerful is that the embedding model has learned, during its own training, that "cancel subscription" and "account termination" refer to similar concepts. The vectors it produces for these phrases will be close together.
5. Adapt the code template below to your specific requirements
6. Run the verification checklist before marking implementation complete

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

- [ ] Verified: most common mistake is using an embedding model that was not trained on text similar to your domain.
- [ ] Verified: Dimensionality is a practical concern.
- [ ] Relevance filtering is in place — irrelevant results are filtered before reaching the model
- [ ] Monitoring and logging are configured for production debugging
- [ ] Implementation follows the Semantic Indexing architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Semantic search is more expensive than keyword search at every layer. Embedding each chunk costs money (API calls or GPU time). Storing vectors costs more than storing inverted indexes. Query-time similarity search, while fast, still uses more compute than a BM25 lookup. For small corpora where keyword search works fine, the added cost and complexity of vector embeddings may not be justified.

Embedding model choice creates lock-in. If you index your entire corpus with model A and later want to switch to model B, you must re-embed everything. The vectors from different models are not compatible, they occupy different vector spaces with different semantics. This makes the initial model selection important and model migration expensive. Planning for re-indexing from the start (storing raw text alongside vectors, having a pipeline that can re-run) reduces the pain when you inevitably need to upgrade.

