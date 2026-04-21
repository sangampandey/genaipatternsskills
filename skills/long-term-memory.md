# Long-Term Memory

> Category: Memory & State | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/memory/long-term-memory

## What This Pattern Solves

**Long-Term Memory is** a pattern that persists information across separate conversations and sessions. It stores user preferences, learned facts, and interaction history in an external database, allowing the LLM to recall context from days, weeks, or months ago.

## Architecture Rules

- Long-term memory gives an LLM application the ability to remember things across sessions by storing important information in an external persistent store and retrieving it when relevant.
- The architecture has three components. A memory writer extracts noteworthy facts, preferences, and decisions from conversations and stores them. A memory store holds this information persistently. A memory retriever finds and injects relevant memories into the model's context when generating a response.
- The memory writer can work in several ways. The simplest approach is to use the LLM itself to identify what is worth remembering at the end of each conversation turn. You prompt the model with something like: "Based on this conversation, what facts about the user should be remembered for future sessions?" The model extracts structured memory entries that get written to your store. Alternatively, you can use rules-based extraction, pulling out entities, stated preferences, or explicit instructions from the conversation.
- The memory store can be a vector database, a key-value store, a relational database, or a knowledge graph. Vector databases are the most common choice because they enable semantic retrieval. You embed each memory entry as a vector and retrieve the most relevant ones based on semantic similarity to the current conversation. Key-value stores work well when memories are categorical (user preferences, settings, profile information). Knowledge graphs shine when the relationships between memories matter (this person manages that team, which works on this project).
- The memory retriever runs at the start of each conversation turn. It takes the current user message, searches the memory store for relevant entries, and injects them into the system prompt or the beginning of the conversation context. The model then generates its response with awareness of past interactions.
- This is conceptually similar to retrieval-augmented generation, but the corpus being searched is conversation history and extracted user facts rather than external documents. The retrieval mechanics are the same. The difference is what you are retrieving and why.

## Implementation Steps

1. Long-term memory gives an LLM application the ability to remember things across sessions by storing important information in an external persistent store and retrieving it when relevant.
2. The architecture has three components. A memory writer extracts noteworthy facts, preferences, and decisions from conversations and stores them. A memory store holds this information persistently. A memory retriever finds and injects relevant memories into the model's context when generating a response.
3. The memory writer can work in several ways. The simplest approach is to use the LLM itself to identify what is worth remembering at the end of each conversation turn. You prompt the model with something like: "Based on this conversation, what facts about the user should be remembered for future sessions?" The model extracts structured memory entries that get written to your store. Alternatively, you can use rules-based extraction, pulling out entities, stated preferences, or explicit instructions from the conversation.
4. The memory store can be a vector database, a key-value store, a relational database, or a knowledge graph. Vector databases are the most common choice because they enable semantic retrieval. You embed each memory entry as a vector and retrieve the most relevant ones based on semantic similarity to the current conversation. Key-value stores work well when memories are categorical (user preferences, settings, profile information). Knowledge graphs shine when the relationships between memories matter (this person manages that team, which works on this project).
5. The memory retriever runs at the start of each conversation turn. It takes the current user message, searches the memory store for relevant entries, and injects them into the system prompt or the beginning of the conversation context. The model then generates its response with awareness of past interactions.
6. This is conceptually similar to retrieval-augmented generation, but the corpus being searched is conversation history and extracted user facts rather than external documents. The retrieval mechanics are the same. The difference is what you are retrieving and why.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/memory/long-term-memory

## Verification Checklist

- [ ] Verified: Storing everything is tempting but counterproductive. If you write every conversational detail to memory, retrieval becomes noisy. The model's context fills up with marginally relevant memories that crowd out the important ones. You need a curation strategy. Not everything is worth remembering, and some memories should be updated or deleted as circumstances change.
- [ ] Verified: Stale memories cause problems. The user mentioned they were working on Project Alpha six months ago. They have since moved to Project Beta. If the old memory persists without being updated, the assistant will reference an outdated context. Memory management requires mechanisms for updating, archiving, or expiring entries.
- [ ] Verified: Privacy and data retention are serious concerns. Long-term memory is, by definition, a store of personal information. Users may have shared sensitive details in conversation that they did not intend to be permanently recorded. You need clear policies about what gets stored, how long it persists, and how users can view or delete their memories. In regulated environments, memory retention may conflict with data minimization requirements.
- [ ] Verified: Retrieval relevance is imperfect. Semantic search will sometimes surface memories that are topically related but not actually useful for the current query. A question about "Python" might retrieve memories about a snake identification project when the user is asking about the programming language. Including metadata (timestamps, categories, confidence scores) in your memory entries helps the retriever make better selections.

## Trade-offs

Long-term memory adds infrastructure. You need a persistent store, an embedding pipeline, and retrieval logic. This is manageable but not trivial. The operational burden scales with the number of users and the volume of memories.

Latency increases slightly because each turn requires a retrieval step before generation. For most applications, this adds 100-300 milliseconds, which is acceptable. For latency-critical applications, you may need to run retrieval in parallel with other preprocessing.

There is a quality ceiling imposed by your extraction and retrieval pipeline. Memories that are poorly extracted or poorly retrieved degrade the model's performance rather than improving it. Irrelevant memories waste context tokens and can confuse the model. The system is only as good as its weakest link, whether that is the writer, the store, or the retriever.

You are making a commitment to data management. Memories need to be updated, deduplicated, and sometimes deleted. Users need controls over their stored information. This is an ongoing operational responsibility, not a one-time implementation.

