# Semantic Router

> Category: Routing & Orchestration | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/routing/semantic-router

## What This Pattern Solves

**Semantic Router is** a pattern that classifies incoming queries by meaning and routes them to the appropriate handler, model, or pipeline. It uses embedding similarity to match queries against predefined route descriptions, enabling intent-based routing without keyword rules.

## Architecture Rules

- Semantic routing uses embedding models to classify intent based on meaning rather than keywords. The core insight is that text with similar meaning produces similar embedding vectors, and you can measure that similarity cheaply and quickly.
- Here is how it works. You define a set of routes, where each route represents an intent category. For each route, you create a few example utterances that capture what a user might say when they have that intent. You compute the embedding vectors for all these example utterances and store them.
- When a new user message arrives, you compute its embedding vector and compare it against all the stored route vectors using cosine similarity. The route with the highest similarity score wins. The message gets dispatched to the handler, tool, or agent pipeline associated with that route.
- This approach is fast because embedding models are much cheaper and faster than generative models. A typical embedding computation takes single-digit milliseconds, compared to hundreds of milliseconds or seconds for an LLM classification call. At scale, this difference is substantial.
- The quality of routing depends heavily on the example utterances you provide for each route. These utterances define the "semantic territory" of each route. If your billing route examples only cover invoice questions, a user asking about payment methods might not match well. Spend time crafting diverse examples that cover the range of ways users express each intent.
- You can also use a hybrid approach. Define a confidence threshold for the semantic router. If the highest similarity score exceeds the threshold, route directly. If it falls below, escalate to an LLM for more careful classification. This gives you the speed of embeddings for clear-cut cases and the intelligence of an LLM for ambiguous ones.

## Implementation Steps

1. Semantic routing uses embedding models to classify intent based on meaning rather than keywords. The core insight is that text with similar meaning produces similar embedding vectors, and you can measure that similarity cheaply and quickly.
2. Here is how it works. You define a set of routes, where each route represents an intent category. For each route, you create a few example utterances that capture what a user might say when they have that intent. You compute the embedding vectors for all these example utterances and store them.
3. When a new user message arrives, you compute its embedding vector and compare it against all the stored route vectors using cosine similarity. The route with the highest similarity score wins. The message gets dispatched to the handler, tool, or agent pipeline associated with that route.
4. This approach is fast because embedding models are much cheaper and faster than generative models. A typical embedding computation takes single-digit milliseconds, compared to hundreds of milliseconds or seconds for an LLM classification call. At scale, this difference is substantial.
5. The quality of routing depends heavily on the example utterances you provide for each route. These utterances define the "semantic territory" of each route. If your billing route examples only cover invoice questions, a user asking about payment methods might not match well. Spend time crafting diverse examples that cover the range of ways users express each intent.
6. You can also use a hybrid approach. Define a confidence threshold for the semantic router. If the highest similarity score exceeds the threshold, route directly. If it falls below, escalate to an LLM for more careful classification. This gives you the speed of embeddings for clear-cut cases and the intelligence of an LLM for ambiguous ones.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/routing/semantic-router

## Verification Checklist

- [ ] Verified: *Overlapping intent categories.** If "billing support" and "account management" share a lot of semantic territory, the router will struggle to distinguish between them. Messages like "I need to update my payment information" could reasonably belong to either. When categories overlap, you get inconsistent routing that frustrates users. The fix is either to merge overlapping categories or to make the example utterances more distinctive.
- [ ] Verified: *Poor example utterances.** If your examples are too narrow or too similar to each other, the route's semantic territory will be small and many valid user messages will not match well. If your examples are too broad or generic, different routes will overlap. Good examples are diverse in phrasing but consistent in intent.
- [ ] Verified: *Embedding model limitations.** Not all embedding models handle all types of text equally well. Some perform poorly on short messages, others on domain-specific jargon. The embedding model you choose will have blind spots. Test with real user messages, not just the clean examples you crafted during development.
- [ ] Verified: *Missing intent categories.** If a user's message does not match any route well, the router will still pick the closest one, which will be wrong. You need an "other" or "unknown" category with a confidence threshold below which the message gets sent to a fallback handler rather than forced into an ill-fitting route.
- [ ] Verified: *Static routes in a dynamic world.** User behavior evolves. New product features create new intent categories. If your routes are defined once and never updated, the router gradually becomes less accurate. Build a review process that periodically checks routing accuracy against real traffic and updates routes as needed.

## Trade-offs

**You gain** very fast classification (milliseconds, not seconds), low cost per routing decision, and a system that understands meaning rather than just keywords.

**You pay** with the upfront effort of defining routes and crafting example utterances, the need to choose and potentially fine-tune an embedding model, and ongoing maintenance as your intent categories evolve.

**Accuracy is good but not perfect.** Semantic routing handles the clear-cut majority of requests well but will misclassify edge cases. If misrouting has serious consequences (sending a refund request to the sales team, for example), add a confidence threshold and human review for low-confidence classifications.

**The approach does not handle multi-intent messages naturally.** If a user says "I want to cancel my subscription and also need help with an error I am seeing," the message has two intents. The router will pick one. You either need to handle this at the application level or add a pre-processing step that splits multi-intent messages.

**Embedding quality determines ceiling.** You cannot do better than your embedding model allows. If the model does not distinguish well between your intent categories, no amount of example tuning will fix it. Test multiple embedding models early to find one that works well for your domain.

