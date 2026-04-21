---
name: long-term-memory
description: >-
  Implement the Long-Term Memory pattern (Memory & State). Persist important facts and preferences in external memory stores and retrieve them to maintain continuity and personalization across sessions. Use when working with: persistence, retrieval, personalization, context.
---

# Long-Term Memory

> Category: Memory & State | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/memory/long-term-memory

## What This Pattern Solves

**Long-Term Memory is** a pattern that persists information across separate conversations and sessions. It stores user preferences, learned facts, and interaction history in an external database, allowing the LLM to recall context from days, weeks, or months ago.

## When to Use This Skill

Long-term memory is essential for any application that interacts with the same users repeatedly and where continuity improves the experience. Personal assistants, coaching applications, customer service systems, and productivity tools all benefit from remembering user context across sessions.

It is particularly valuable when users have complex, evolving needs. A project management assistant that remembers your team structure, current priorities, and past decisions can provide far more relevant suggestions than one that starts fresh every time.

Personalization is another strong signal. If your application recommends content, products, or actions, accumulated knowledge about user preferences makes those recommendations better over time. The first interaction is generic. The hundredth interaction should feel tailored.

Long-term memory also makes sense when re-establishing context is costly. If a consulting chatbot needs 10 minutes of back-and-forth to understand the user's situation before it can help, remembering that context across sessions saves time for both the user and the system.

## Architecture Rules

- Long-term memory is essential for any application that interacts with the same users repeatedly a...
- It is particularly valuable when users have complex, evolving needs
- Personalization is another strong signal
- Long-term memory also makes sense when re-establishing context is costly

## Implementation Steps

1. Long-term memory gives an LLM application the ability to remember things across sessions by storing important information in an external persistent store and retrieving it when relevant.
2. The architecture has three components. A memory writer extracts noteworthy facts, preferences, and decisions from conversations and stores them.
3. The memory writer can work in several ways. The simplest approach is to use the LLM itself to identify what is worth remembering at the end of each conversation turn.
4. The memory store can be a vector database, a key-value store, a relational database, or a knowledge graph. Vector databases are the most common choice because they enable semantic retrieval.
5. The memory retriever runs at the start of each conversation turn. It takes the current user message, searches the memory store for relevant entries, and injects them into the system prompt or the beginning of the conversation context.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/memory/long-term-memory

## Verification Checklist

- [ ] Verified: Storing everything is tempting but counterproductive.
- [ ] Data freshness is maintained — indexes/caches stay in sync with source
- [ ] Verified: Privacy and data retention are serious concerns.
- [ ] Relevance filtering is in place — irrelevant results are filtered before reaching the model
- [ ] Implementation follows the Long-Term Memory architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Long-term memory adds infrastructure. You need a persistent store, an embedding pipeline, and retrieval logic. This is manageable but not trivial. The operational burden scales with the number of users and the volume of memories.

Latency increases slightly because each turn requires a retrieval step before generation. For most applications, this adds 100-300 milliseconds, which is acceptable. For latency-critical applications, you may need to run retrieval in parallel with other preprocessing.

There is a quality ceiling imposed by your extraction and retrieval pipeline. Memories that are poorly extracted or poorly retrieved degrade the model's performance rather than improving it. Irrelevant memories waste context tokens and can confuse the model. The system is only as good as its weakest link, whether that is the writer, the store, or the retriever.

You are making a commitment to data management. Memories need to be updated, deduplicated, and sometimes deleted. Users need controls over their stored information. This is an ongoing operational responsibility, not a one-time implementation.

