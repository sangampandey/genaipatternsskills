# Agentic RAG

> Category: RAG | Difficulty: advanced | Pattern: genaipatterns.dev/patterns/rag/agentic-rag

## What This Pattern Solves

**Agentic RAG is** a pattern that gives an autonomous agent control over the retrieval process. The agent decides when to search, what queries to run, which sources to consult, and when it has gathered enough evidence to synthesize an answer, using a reasoning loop to drive retrieval decisions.

## Architecture Rules

- Agentic RAG gives an AI agent control over the retrieval process itself. Instead of a fixed pipeline, the agent decides at each step whether to search, what to search for, which tools to use, and when it has gathered enough information to answer. The retrieval strategy emerges from the agent's reasoning about the specific question rather than from a predetermined flow.
- The agent has access to a set of retrieval tools. A vector search tool for the knowledge base. A web search tool for current information. A SQL query tool for structured data. An API tool for pulling from internal systems. A code search tool for navigating repositories. Each tool has a description that tells the agent what kind of information it can provide and when it is useful.
- When a query arrives, the agent first reasons about what information it needs. For "What is our refund policy?" it might decide that a single vector search against the policy documents is sufficient. For the complex refund analysis question, it might plan a multi-step approach: first query the knowledge base for the current and previous refund policies, then run a SQL query to pull refund rate metrics, then search customer feedback data for sentiment about the policy change.
- The agent executes its plan iteratively. After each tool call, it evaluates the results and decides what to do next. If the vector search returns low-relevance chunks, it can reformulate the query and try again. If the SQL query reveals an unexpected spike in refunds during a specific week, it can search for internal communications from that week to understand why. This adaptive behavior is the key difference from a fixed pipeline.
- Routing is a simpler form of the same idea. Instead of giving the agent full autonomy, you let it choose which retrieval path to take based on query classification. A question about current events routes to web search. A question about internal processes routes to the knowledge base. A question about metrics routes to the analytics database. This is less flexible than full agent control but easier to implement and reason about.
- The agent can also decide not to retrieve at all. If the conversation already contains the necessary context, or if the question is about something the agent can reason about directly, skipping retrieval saves time and avoids introducing noise. This judgment call is something a fixed pipeline cannot make.
- Sub-query decomposition happens naturally in this pattern. The agent breaks complex questions into parts, addresses each part with the most appropriate tool, and synthesizes the results. Unlike Deep Search, where the iteration loop is a structural pattern, here the decomposition and iteration emerge from the agent's reasoning. The agent might decompose a question into two sub-queries or seven, depending on what it discovers along the way.

## Implementation Steps

1. Agentic RAG gives an AI agent control over the retrieval process itself. Instead of a fixed pipeline, the agent decides at each step whether to search, what to search for, which tools to use, and when it has gathered enough information to answer. The retrieval strategy emerges from the agent's reasoning about the specific question rather than from a predetermined flow.
2. The agent has access to a set of retrieval tools. A vector search tool for the knowledge base. A web search tool for current information. A SQL query tool for structured data. An API tool for pulling from internal systems. A code search tool for navigating repositories. Each tool has a description that tells the agent what kind of information it can provide and when it is useful.
3. When a query arrives, the agent first reasons about what information it needs. For "What is our refund policy?" it might decide that a single vector search against the policy documents is sufficient. For the complex refund analysis question, it might plan a multi-step approach: first query the knowledge base for the current and previous refund policies, then run a SQL query to pull refund rate metrics, then search customer feedback data for sentiment about the policy change.
4. The agent executes its plan iteratively. After each tool call, it evaluates the results and decides what to do next. If the vector search returns low-relevance chunks, it can reformulate the query and try again. If the SQL query reveals an unexpected spike in refunds during a specific week, it can search for internal communications from that week to understand why. This adaptive behavior is the key difference from a fixed pipeline.
5. Routing is a simpler form of the same idea. Instead of giving the agent full autonomy, you let it choose which retrieval path to take based on query classification. A question about current events routes to web search. A question about internal processes routes to the knowledge base. A question about metrics routes to the analytics database. This is less flexible than full agent control but easier to implement and reason about.
6. The agent can also decide not to retrieve at all. If the conversation already contains the necessary context, or if the question is about something the agent can reason about directly, skipping retrieval saves time and avoids introducing noise. This judgment call is something a fixed pipeline cannot make.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/rag/agentic-rag

## Verification Checklist

- [ ] Verified: No agent can make poor tool choices. If it decides to run a SQL query when a vector search would be faster and more appropriate, you get worse results at higher latency. Tool descriptions need to be clear and specific so the agent can make informed decisions. Vague descriptions lead to vague routing decisions.
- [ ] Verified: Unbounded exploration is a risk. Without cost and time limits, an agent can chain together dozens of tool calls, each one seeming reasonable in isolation but collectively burning through budget and patience. You need hard limits on total tool calls per query, total tokens consumed, and wall-clock time.
- [ ] Verified: Error handling gets complicated. When a tool call fails, the agent needs to recover gracefully. It might retry with different parameters, fall back to a different tool, or decide it cannot answer that part of the question. Each failure path needs to be handled. In a fixed pipeline, failure modes are predictable. With an agent, they are combinatorial.
- [ ] Verified: No agent can develop blind spots. If it learns that vector search usually works, it might default to vector search even when SQL would be better. Testing needs to cover diverse query types to ensure the agent actually uses the full range of tools available to it.
- [ ] Verified: Observability is harder than with fixed pipelines. Each query can take a different path through the system, making it difficult to aggregate metrics, identify bottlenecks, or reproduce issues. You need detailed tracing that captures every decision the agent makes and every tool call it executes.

## Trade-offs

Flexibility comes at the cost of predictability. A fixed pipeline produces consistent latency and consistent resource usage per query. An agentic system might answer one query in 500 milliseconds with a single tool call and another in 20 seconds with eight tool calls. This variability is hard to plan for in terms of infrastructure and user experience.

The LLM is in the hot path for every decision. Each routing choice, each query reformulation, each quality evaluation requires an LLM call. This means LLM costs scale with the complexity of queries, not just their volume. For simple queries that the agent handles with a single tool call, the overhead of the agent's reasoning step may exceed the cost of just running a fixed pipeline.

Building and maintaining the tool set is ongoing work. Each tool needs a clear interface, good error handling, and accurate documentation that the agent can understand. When you add a new data source, you add a new tool. When a data source changes its schema, you update the tool. The agent's effectiveness is bounded by the quality of its tools.

Testing is significantly more involved. You cannot just test that retrieval returns good results. You need to test that the agent chooses the right tools, decomposes queries appropriately, handles failures, respects budget limits, and produces good final answers across a wide range of question types. This requires comprehensive evaluation datasets that cover the full space of possible agent behaviors.

The reward for this complexity is a system that genuinely adapts to each question. When it works well, it feels like having a knowledgeable research assistant who knows where to look for every kind of information. When it works poorly, it feels like an unreliable system that takes too long and sometimes goes down rabbit holes.

