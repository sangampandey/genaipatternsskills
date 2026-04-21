---
name: basic-rag
description: >-
  Implement the Basic RAG pattern (RAG). Ground LLM responses in external knowledge by retrieving relevant documents before generation to reduce hallucinations and stay current. Use when working with: retrieval, grounding, knowledge, context.
---

# Basic RAG

> Category: RAG | Difficulty: beginner | Reference: https://www.genaipatterns.dev/patterns/rag/basic-rag

## What This Pattern Solves

**Basic RAG (Retrieval-Augmented Generation) is** a design pattern that grounds LLM responses in external knowledge by retrieving relevant documents at query time and injecting them into the prompt. It solves the hallucination problem by giving the model factual source material instead of relying on training data alone.

## When to Use This Skill

Use basic RAG when you have a corpus of documents that contains the answers your users need, and the language model does not have access to that information through its training data. This covers most enterprise knowledge base scenarios: internal documentation search, customer support bots grounded in help articles, legal research over case files, medical reference systems over clinical guidelines.

The pattern works well when your latency budget can tolerate the retrieval step, which typically adds 100 to 500 milliseconds depending on your index. It also works best when the answers exist somewhere in your documents. RAG is not a reasoning pattern. If the answer requires multi-step inference that is not spelled out in any single document, basic RAG will struggle. You will need more advanced patterns like chain-of-thought prompting on top of retrieval for those cases.

## Architecture Rules

- basic RAG when you have a corpus of documents that contains the answers your users need, and the ...
- pattern works well when your latency budget can tolerate the retrieval step, which typically adds...

## Implementation Steps

1. RAG splits the work into two separate pipelines that run at different times.
2. The first is the indexing pipeline. You take your document corpus, whatever it may be (PDFs, Markdown files, database rows, Confluence pages), and break it into smaller chunks.
3. The second is the query pipeline. When a user asks a question, you first send that question to the search index and retrieve the top-k most relevant chunks.
4. The key insight is that the model is no longer guessing. It has the source material right there in its context window.
5. This two-stage approach also gives you an audit trail. You can show users which documents were used to generate the answer.
6. Adapt the code template below to your specific requirements
7. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

def basic_rag(query: str, documents: list[str], top_k: int = 3) -> str:
    # Step 1: Simple keyword overlap retrieval (not BM25 — see Semantic Indexing for embeddings)
    scored = []
    query_terms = set(query.lower().split())
    for doc in documents:
        doc_terms = set(doc.lower().split())
        overlap = len(query_terms & doc_terms)
        scored.append((overlap, doc))
    scored.sort(reverse=True)
    retrieved = [doc for _, doc in scored[:top_k]]

    # Step 2: Build prompt with retrieved context
    context = "\
\
".join(f"[Document {i+1}]: {doc}" for i, doc in enumerate(retrieved))
    prompt = f"""Answer the question using ONLY the provided documents.
If the documents don't contain the answer, say so.

{context}

Question: {query}"""

    # Step 3: Generate answer
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
```

## Verification Checklist

- [ ] Chunk size is tuned — not too large (wastes context) or too small (loses meaning)
- [ ] Relevance filtering is in place — irrelevant results are filtered before reaching the model
- [ ] Context window usage is managed — retrieved content fits within model limits
- [ ] Implementation follows the Basic RAG architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Every RAG query is at least two operations: a search call and a generation call. That extra network hop adds latency. For applications where sub-second response time matters, this overhead is significant and you need to optimize both your index performance and your chunk selection strategy. Caching frequent queries can help, but cache invalidation becomes another thing to manage as your documents change.

Index maintenance is the other ongoing cost. Documents get updated, deleted, and added. Your index must stay in sync with the source of truth. Stale indexes produce stale answers, and users lose trust quickly when the system confidently quotes outdated information. Building a reliable ingestion pipeline that keeps the index fresh is just as important as the retrieval and generation logic, and often more work than people expect.

