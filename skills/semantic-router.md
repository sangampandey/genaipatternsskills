---
name: semantic-router
description: >-
  Implement the Semantic Router pattern (Routing & Orchestration). Classify query intent using embeddings and route to the appropriate handler, tool, or agent pipeline without relying on keyword rules. Use when working with: intent, embeddings, classification, dispatch.
---

# Semantic Router

> Category: Routing & Orchestration | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/routing/semantic-router

## What This Pattern Solves

**Semantic Router is** a pattern that classifies incoming queries by meaning and routes them to the appropriate handler, model, or pipeline. It uses embedding similarity to match queries against predefined route descriptions, enabling intent-based routing without keyword rules.

## When to Use This Skill

Semantic routing works well when you have a known set of intent categories and need to classify incoming requests quickly and cheaply.

Good fit:

- Your application handles multiple distinct types of requests that require different processing paths
- You need sub-100ms routing decisions at scale
- The intent categories are relatively stable and well-defined
- You can provide 5 to 20 good example utterances per route
- Cost per request matters and you want to avoid an LLM call for every classification

Less ideal:

- Your intent categories overlap heavily and even humans would struggle to classify some messages
- You have hundreds of fine-grained intent categories (embedding similarity becomes less discriminative)
- The intent categories change frequently, requiring constant recomputation of route vectors
- The routing decision depends on conversation history, not just the current message

## Architecture Rules

- Semantic routing works well when you have a known set of intent categories and n
- Good fit:
- Your application handles multiple distinct types of requests that require differ
- You need sub-100ms routing decisions at scale
- intent categories are relatively stable and well-defined

## Implementation Steps

1. Semantic routing uses embedding models to classify intent based on meaning rather than keywords. The core insight is that text with similar meaning produces similar embedding vectors, and you can measure that similarity cheaply and quickly.
2. Here is how it works. You define a set of routes, where each route represents an intent category.
3. When a new user message arrives, you compute its embedding vector and compare it against all the stored route vectors using cosine similarity. The route with the highest similarity score wins.
4. This approach is fast because embedding models are much cheaper and faster than generative models. A typical embedding computation takes single-digit milliseconds, compared to hundreds of milliseconds or seconds for an LLM classification call.
5. The quality of routing depends heavily on the example utterances you provide for each route. These utterances define the "semantic territory" of each route.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/routing/semantic-router

## Verification Checklist

- [ ] Verified: *Overlapping intent categories.
- [ ] Verified: *Poor example utterances.
- [ ] Verified: *Embedding model limitations.
- [ ] Verified: *Missing intent categories.
- [ ] Verified: *Static routes in a dynamic world.
- [ ] Implementation follows the Semantic Router architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

**You gain** very fast classification (milliseconds, not seconds), low cost per routing decision, and a system that understands meaning rather than just keywords.

**You pay** with the upfront effort of defining routes and crafting example utterances, the need to choose and potentially fine-tune an embedding model, and ongoing maintenance as your intent categories evolve.

**Accuracy is good but not perfect.** Semantic routing handles the clear-cut majority of requests well but will misclassify edge cases. If misrouting has serious consequences (sending a refund request to the sales team, for example), add a confidence threshold and human review for low-confidence classifications.

**The approach does not handle multi-intent messages naturally.** If a user says "I want to cancel my subscription and also need help with an error I am seeing," the message has two intents. The router will pick one. You either need to handle this at the application level or add a pre-processing step that splits multi-intent messages.

**Embedding quality determines ceiling.** You cannot do better than your embedding model allows. If the model does not distinguish well between your intent categories, no amount of example tuning will fix it. Test multiple embedding models early to find one that works well for your domain.

