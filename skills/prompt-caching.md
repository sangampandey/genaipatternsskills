# Prompt Caching

> Category: Cost & Performance | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/cost-performance/prompt-caching

## What This Pattern Solves

**Prompt Caching is** a pattern that stores and reuses the processed representation of common prompt prefixes to avoid redundant computation. When multiple requests share the same system prompt or context, the cached prefix eliminates re-processing, reducing both latency and cost.

## Architecture Rules

- Prompt caching eliminates redundant computation by reusing work that has already been done. There are two fundamentally different approaches, and they operate at different levels of the stack.
- Client-side caching works at the response level. You store the full response for a given prompt and serve it directly when you see the same (or sufficiently similar) prompt again. The simplest version is exact-match caching. Hash the prompt, check if you have a cached response, and return it if you do. This works well for FAQ-style workloads where the same questions recur frequently.
- Semantic caching extends this idea to handle paraphrases. Instead of hashing the raw prompt text, you compute an embedding vector and search for cached responses whose prompts are semantically similar. "What is your return policy?" matches "How do returns work?" because the embeddings are close in vector space. You set a similarity threshold, and any prompt within that threshold gets the cached response. This dramatically increases your cache hit rate but requires a vector store and an embedding model.
- Server-side caching works at the computation level, inside the model's inference pipeline. When a model processes a sequence of tokens, it builds up internal representations called key-value (KV) states for each token. Prefix caching, offered by providers like Anthropic and Google, saves these KV states for token sequences that appear at the start of your prompts. When a new request shares the same prefix (your system prompt, for example), the provider skips recomputing those states and starts from the cached intermediate result. You see this as reduced latency and lower per-token costs, often 50-90% cheaper for the cached portion.
- The two approaches are complementary. Server-side prefix caching reduces the cost of processing shared context. Client-side semantic caching eliminates the model call entirely for repeated queries. A production system can use both.

## Implementation Steps

1. Prompt caching eliminates redundant computation by reusing work that has already been done. There are two fundamentally different approaches, and they operate at different levels of the stack.
2. Client-side caching works at the response level. You store the full response for a given prompt and serve it directly when you see the same (or sufficiently similar) prompt again. The simplest version is exact-match caching. Hash the prompt, check if you have a cached response, and return it if you do. This works well for FAQ-style workloads where the same questions recur frequently.
3. Semantic caching extends this idea to handle paraphrases. Instead of hashing the raw prompt text, you compute an embedding vector and search for cached responses whose prompts are semantically similar. "What is your return policy?" matches "How do returns work?" because the embeddings are close in vector space. You set a similarity threshold, and any prompt within that threshold gets the cached response. This dramatically increases your cache hit rate but requires a vector store and an embedding model.
4. Server-side caching works at the computation level, inside the model's inference pipeline. When a model processes a sequence of tokens, it builds up internal representations called key-value (KV) states for each token. Prefix caching, offered by providers like Anthropic and Google, saves these KV states for token sequences that appear at the start of your prompts. When a new request shares the same prefix (your system prompt, for example), the provider skips recomputing those states and starts from the cached intermediate result. You see this as reduced latency and lower per-token costs, often 50-90% cheaper for the cached portion.
5. The two approaches are complementary. Server-side prefix caching reduces the cost of processing shared context. Client-side semantic caching eliminates the model call entirely for repeated queries. A production system can use both.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/cost-performance/prompt-caching

## Verification Checklist

- [ ] Verified: Stale caches are the primary risk. If the correct answer changes (your return policy updates, product information changes, prices shift) but the cache still holds the old response, users get outdated information. You need a cache invalidation strategy. Time-based expiration is the simplest approach. Event-driven invalidation (clearing relevant cache entries when underlying data changes) is more precise but harder to implement.
- [ ] Verified: Semantic cache matching can produce false positives. Two prompts that are semantically similar but require different answers will return the wrong cached response. "What is the price of Product A?" and "What is the price of Product B?" might have similar embeddings but need different answers. Your similarity threshold needs careful tuning, and you may need to include structured metadata (product ID, user segment) in your cache key alongside the semantic embedding.
- [ ] Verified: Cache poisoning is a concern in adversarial environments. If an attacker can craft a prompt that gets cached and then served to other users, they can influence the responses those users see. This is mainly a risk with shared caches across users. Per-user caches avoid this but reduce hit rates.
- [ ] Verified: Over-caching non-deterministic responses can hurt quality. If your application benefits from response variety (creative writing, brainstorming), caching kills that variety. Not every workload benefits from caching.

## Trade-offs

Semantic caching requires infrastructure. You need an embedding model, a vector store, and the operational overhead of maintaining both. For small-scale applications, this overhead may exceed the cost savings. Simple exact-match caching with a key-value store is often a better starting point.

Cache hit rate determines the value of the entire system. If your workload is highly diverse with few repeated patterns, your hit rate will be low and the infrastructure cost will not be justified. Measure your actual repetition rate before investing heavily in caching.

Freshness and cost savings are in tension. Shorter cache TTLs keep responses fresh but reduce hit rates. Longer TTLs maximize savings but increase the risk of serving stale data. The right balance depends on how frequently your underlying information changes.

Prefix caching is largely free of trade-offs if your provider offers it. The main consideration is prompt structure. You get maximum benefit when the shared prefix is long and the variable suffix is short. Reorganizing your prompts to front-load shared content is usually straightforward.

