# Model Router

> Category: Routing & Orchestration | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/routing/model-router

## What This Pattern Solves

**Model Router is** a pattern that directs queries to different LLMs based on task complexity, cost constraints, or capability requirements. Simple queries go to smaller, cheaper models while complex queries route to more capable ones, optimizing the cost-quality balance.

## Architecture Rules

- A model router sits between your users and your model pool. It examines each incoming request, classifies it by complexity or difficulty, and sends it to the appropriate model tier. Simple requests go to fast, inexpensive models. Complex requests go to powerful, expensive models. Everything in between goes to a mid-tier option.
- There are several ways to build the classifier.
- **Rule-based routing** uses simple heuristics. If the query contains certain keywords (like "summarize" or "translate"), route to the cheap model. If the token count exceeds a threshold, route to the expensive model. If the query references code or asks for multi-step reasoning, route to the powerful model. Rules are easy to implement and debug, but they are brittle. Users will phrase things in ways your rules do not anticipate.
- **ML-based routing** trains a lightweight classifier on labeled examples. You take a dataset of queries, label each one with the model tier that should handle it, and train a small model (logistic regression, random forest, or a small neural network) to predict the right tier. This is more robust than rules but requires labeled training data, which means you need some period of sending everything to the best model and evaluating which queries actually needed it.
- **LLM-based routing** uses a cheap, fast model to assess the complexity of the incoming query before routing it. You send the query to a small model with a prompt like "Rate the complexity of this question on a scale of 1 to 5." Based on the score, you route to the appropriate tier. This is surprisingly effective and does not require training data. The overhead of one extra cheap LLM call is usually small compared to the savings from avoiding unnecessary expensive calls.
- The model tiers themselves can be organized however makes sense for your application. A common setup is three tiers. The fast tier handles factual lookups, simple formatting, and straightforward instructions. The standard tier handles moderate reasoning, summarization, and most conversational tasks. The premium tier handles complex analysis, creative tasks requiring nuance, and multi-step reasoning.

## Implementation Steps

1. A model router sits between your users and your model pool. It examines each incoming request, classifies it by complexity or difficulty, and sends it to the appropriate model tier. Simple requests go to fast, inexpensive models. Complex requests go to powerful, expensive models. Everything in between goes to a mid-tier option.
2. There are several ways to build the classifier.
3. *Rule-based routing** uses simple heuristics. If the query contains certain keywords (like "summarize" or "translate"), route to the cheap model. If the token count exceeds a threshold, route to the expensive model. If the query references code or asks for multi-step reasoning, route to the powerful model. Rules are easy to implement and debug, but they are brittle. Users will phrase things in ways your rules do not anticipate.
4. *ML-based routing** trains a lightweight classifier on labeled examples. You take a dataset of queries, label each one with the model tier that should handle it, and train a small model (logistic regression, random forest, or a small neural network) to predict the right tier. This is more robust than rules but requires labeled training data, which means you need some period of sending everything to the best model and evaluating which queries actually needed it.
5. *LLM-based routing** uses a cheap, fast model to assess the complexity of the incoming query before routing it. You send the query to a small model with a prompt like "Rate the complexity of this question on a scale of 1 to 5." Based on the score, you route to the appropriate tier. This is surprisingly effective and does not require training data. The overhead of one extra cheap LLM call is usually small compared to the savings from avoiding unnecessary expensive calls.
6. The model tiers themselves can be organized however makes sense for your application. A common setup is three tiers. The fast tier handles factual lookups, simple formatting, and straightforward instructions. The standard tier handles moderate reasoning, summarization, and most conversational tasks. The premium tier handles complex analysis, creative tasks requiring nuance, and multi-step reasoning.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/routing/model-router

## Verification Checklist

- [ ] Verified: *Misrouting complex queries to cheap models.** This is the primary failure mode. A query that looks simple on the surface might actually require deep reasoning. The cheap model produces a confident but wrong answer, and the user never knows a better model would have gotten it right. Build in feedback mechanisms so you can detect and correct misrouting over time.
- [ ] Verified: *Overhead exceeding savings.** If your router itself is expensive (perhaps it uses an LLM call for classification), the cost of routing must be less than the cost savings from model selection. For very cheap queries, the routing overhead might actually increase total cost. Consider caching routing decisions for similar queries or using a rule-based fast path for obviously simple requests.
- [ ] Verified: *Model tier boundaries that do not match your traffic.** If you set up three tiers but 95% of your traffic falls into one tier, the router is doing very little useful work. Analyze your actual query distribution before designing your tiers.
- [ ] Verified: *Stale routing logic.** As models improve and pricing changes, your routing rules need to be updated. A model that was too weak for complex queries six months ago might handle them fine now. Review your routing logic regularly.
- [ ] Verified: *User experience inconsistency.** Different models produce different writing styles and quality levels. Users who send a mix of simple and complex queries in the same session might notice jarring quality shifts between responses. Consider whether consistent experience matters more than cost savings for your use case.

## Trade-offs

**You gain** lower average cost per query, faster response times for simple requests, and the ability to scale more efficiently by reserving expensive compute for queries that genuinely need it.

**You pay** with system complexity (another component to build and maintain), the risk of quality degradation on misrouted queries, and the need for ongoing monitoring and tuning of the routing logic.

**Accuracy of routing determines the value.** A router that correctly identifies 90% of simple queries saves significantly more than one that only catches 60%. Invest in the quality of your classifier. Good labeled data makes a huge difference here.

**The pattern compounds well with caching.** If you cache responses for common queries, the router only needs to handle cache misses. This means the router primarily sees novel or unusual queries, which are often the harder ones. Keep this in mind when evaluating router accuracy, your test distribution might not match your production distribution after caching.

