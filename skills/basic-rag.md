# Basic RAG

> Category: RAG | Difficulty: beginner | Pattern: genaipatterns.dev/patterns/rag/basic-rag

## What This Pattern Solves

**Basic RAG (Retrieval-Augmented Generation) is** a design pattern that grounds LLM responses in external knowledge by retrieving relevant documents at query time and injecting them into the prompt. It solves the hallucination problem by giving the model factual source material instead of relying on training data alone.

## Architecture Rules

- RAG splits the work into two separate pipelines that run at different times.
- The first is the indexing pipeline. You take your document corpus, whatever it may be (PDFs, Markdown files, database rows, Confluence pages), and break it into smaller chunks. Each chunk should be a self-contained unit of information, typically a few hundred tokens. You then store these chunks in a searchable index. In the simplest version this could be a full-text search engine. In more advanced setups you would use vector embeddings, but the basic pattern does not require them.
- The second is the query pipeline. When a user asks a question, you first send that question to the search index and retrieve the top-k most relevant chunks. You then construct a prompt that includes both the user question and the retrieved chunks as context. The language model generates its answer based on this assembled context rather than relying on its parametric memory alone.
- The key insight is that the model is no longer guessing. It has the source material right there in its context window. The quality of the generated answer depends heavily on the quality of what you retrieved. If you retrieve the right passages, the model will synthesize a good answer. If you retrieve irrelevant noise, the model will either ignore it or weave it into a misleading response.
- This two-stage approach also gives you an audit trail. You can show users which documents were used to generate the answer. You can log retrieval results separately from generation results. You can debug failures by asking: was the retrieval bad, or was the generation bad? That separation of concerns makes the system much easier to operate.

## Implementation Steps

1. RAG splits the work into two separate pipelines that run at different times.
2. The first is the indexing pipeline. You take your document corpus, whatever it may be (PDFs, Markdown files, database rows, Confluence pages), and break it into smaller chunks. Each chunk should be a self-contained unit of information, typically a few hundred tokens. You then store these chunks in a searchable index. In the simplest version this could be a full-text search engine. In more advanced setups you would use vector embeddings, but the basic pattern does not require them.
3. The second is the query pipeline. When a user asks a question, you first send that question to the search index and retrieve the top-k most relevant chunks. You then construct a prompt that includes both the user question and the retrieved chunks as context. The language model generates its answer based on this assembled context rather than relying on its parametric memory alone.
4. The key insight is that the model is no longer guessing. It has the source material right there in its context window. The quality of the generated answer depends heavily on the quality of what you retrieved. If you retrieve the right passages, the model will synthesize a good answer. If you retrieve irrelevant noise, the model will either ignore it or weave it into a misleading response.
5. This two-stage approach also gives you an audit trail. You can show users which documents were used to generate the answer. You can log retrieval results separately from generation results. You can debug failures by asking: was the retrieval bad, or was the generation bad? That separation of concerns makes the system much easier to operate.

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

- [ ] Verified: Chunk size is the first thing people get wrong. If your chunks are too large, you waste context window space on irrelevant surrounding text and risk pushing out other relevant chunks. If your chunks are too small, each chunk lacks enough context to be useful on its own. A chunk that says "see the table above" is worthless when the table is in a different chunk. Finding the right granularity takes experimentation, and the optimal size varies by document type.
- [ ] Verified: No second failure mode is poor relevance filtering. If your retrieval returns ten chunks but only two are relevant, the other eight are noise that the model must wade through. Worse, the model may anchor on an irrelevant chunk and produce a wrong answer with high confidence. Setting a relevance threshold (a minimum similarity score below which you discard results) helps, but calibrating that threshold is tricky.
- [ ] Verified: Context window overflow is the third risk. If you stuff too many retrieved chunks into the prompt, you hit the model's token limit and either truncate content or fail entirely. Even before hitting hard limits, models tend to lose track of information buried in the middle of very long contexts. Keeping retrieved context focused and concise matters more than volume.

## Trade-offs

Every RAG query is at least two operations: a search call and a generation call. That extra network hop adds latency. For applications where sub-second response time matters, this overhead is significant and you need to optimize both your index performance and your chunk selection strategy. Caching frequent queries can help, but cache invalidation becomes another thing to manage as your documents change.

Index maintenance is the other ongoing cost. Documents get updated, deleted, and added. Your index must stay in sync with the source of truth. Stale indexes produce stale answers, and users lose trust quickly when the system confidently quotes outdated information. Building a reliable ingestion pipeline that keeps the index fresh is just as important as the retrieval and generation logic, and often more work than people expect.

