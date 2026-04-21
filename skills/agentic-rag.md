---
name: agentic-rag
description: >-
  Implement the Agentic RAG pattern (RAG). Give an AI agent control over when, where, and how to retrieve information rather than using a fixed retrieval pipeline. Use when working with: agents, adaptive-retrieval, multi-source, orchestration.
---

# Agentic RAG

> Category: RAG | Difficulty: advanced | Reference: https://www.genaipatterns.dev/patterns/rag/agentic-rag

## What This Pattern Solves

**Agentic RAG is** a pattern that gives an autonomous agent control over the retrieval process. The agent decides when to search, what queries to run, which sources to consult, and when it has gathered enough evidence to synthesize an answer, using a reasoning loop to drive retrieval decisions.

## When to Use This Skill

Agentic RAG is the right pattern when your system needs to serve diverse query types that require fundamentally different retrieval strategies. If some questions need vector search, others need SQL, others need web search, and others need no retrieval at all, an agent that can choose the right approach per query will outperform any fixed pipeline.

It is also the right choice when your data lives in multiple systems that cannot be unified into a single index. Enterprise environments often have knowledge spread across wikis, databases, ticketing systems, code repositories, and cloud storage. An agent that can reach into each system as needed is more practical than trying to index everything into one vector store.

Consider Agentic RAG when your users ask unpredictable questions. If you can enumerate all the query types your system needs to handle, a fixed pipeline with routing might be simpler. But if users regularly surprise you with questions that do not fit your existing retrieval patterns, an agent's flexibility becomes valuable.

Do not start here. Basic RAG, then Hybrid Retrieval, then Retrieval Refinement, then consider whether you need agent-level control. Each step up adds complexity. Make sure the simpler patterns are genuinely insufficient before introducing an agent.

## Architecture Rules

- Agentic RAG is the right pattern when your system needs to serve diverse query types that require...
- It is also the right choice when your data lives in multiple systems that cannot be unified into ...
- Consider Agentic RAG when your users ask unpredictable questions
- Do not start here

## Implementation Steps

1. Agentic RAG gives an AI agent control over the retrieval process itself. Instead of a fixed pipeline, the agent decides at each step whether to search, what to search for, which tools to use, and when it has gathered enough information to answer.
2. The agent has access to a set of retrieval tools. A vector search tool for the knowledge base.
3. When a query arrives, the agent first reasons about what information it needs. For "What is our refund policy?
4. The agent executes its plan iteratively. After each tool call, it evaluates the results and decides what to do next.
5. Routing is a simpler form of the same idea. Instead of giving the agent full autonomy, you let it choose which retrieval path to take based on query classification.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/rag/agentic-rag

## Verification Checklist

- [ ] Latency impact is measured and within acceptable bounds
- [ ] Cost per request is estimated and within budget
- [ ] Errors are handled gracefully with appropriate fallbacks
- [ ] Verified: agent can develop blind spots.
- [ ] Monitoring and logging are configured for production debugging
- [ ] Implementation follows the Agentic RAG architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Flexibility comes at the cost of predictability. A fixed pipeline produces consistent latency and consistent resource usage per query. An agentic system might answer one query in 500 milliseconds with a single tool call and another in 20 seconds with eight tool calls. This variability is hard to plan for in terms of infrastructure and user experience.

The LLM is in the hot path for every decision. Each routing choice, each query reformulation, each quality evaluation requires an LLM call. This means LLM costs scale with the complexity of queries, not just their volume. For simple queries that the agent handles with a single tool call, the overhead of the agent's reasoning step may exceed the cost of just running a fixed pipeline.

Building and maintaining the tool set is ongoing work. Each tool needs a clear interface, good error handling, and accurate documentation that the agent can understand. When you add a new data source, you add a new tool. When a data source changes its schema, you update the tool. The agent's effectiveness is bounded by the quality of its tools.

Testing is significantly more involved. You cannot just test that retrieval returns good results. You need to test that the agent chooses the right tools, decomposes queries appropriately, handles failures, respects budget limits, and produces good final answers across a wide range of question types. This requires comprehensive evaluation datasets that cover the full space of possible agent behaviors.

The reward for this complexity is a system that genuinely adapts to each question. When it works well, it feels like having a knowledgeable research assistant who knows where to look for every kind of information. When it works poorly, it feels like an unreliable system that takes too long and sometimes goes down rabbit holes.

