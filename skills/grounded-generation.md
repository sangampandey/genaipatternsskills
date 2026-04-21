# Grounded Generation

> Category: RAG | Difficulty: advanced | Pattern: genaipatterns.dev/patterns/rag/grounded-generation

## What This Pattern Solves

**Grounded Generation is** a pattern that adds verification and attribution mechanisms to RAG outputs. It ensures generated answers are grounded in retrieved sources by citing specific passages, flagging unsupported claims, and providing confidence signals that users can verify.

## Architecture Rules

- Trustworthy generation is a set of techniques applied at the generation stage and across the full pipeline to ensure that outputs are grounded in retrieved evidence, that sources are properly attributed, and that the system recognizes when it cannot answer.
- **Out-of-domain detection** is the first line of defense. Before generating an answer, you check whether the retrieved chunks are relevant enough to answer the query. If the best retrieval score falls below a threshold, or if a classifier determines the query falls outside the knowledge base scope, the system returns an honest "I do not have enough information to answer this" rather than guessing. This single check prevents a large category of hallucinations, the ones where the LLM fills in gaps with its training data because the retrieval returned nothing useful.
- **Citations** come in multiple levels of granularity. Source-level citation is the simplest. The system lists which documents it drew from. This helps users verify the answer but does not tell them which specific claim came from which source. Classification-based citation maps each claim in the response to a specific retrieved chunk. The LLM generates the answer with inline references, and a verification step checks that each reference actually supports the claim it is attached to. Token-level attribution is the most precise. It traces individual tokens or phrases in the output back to specific spans in the source documents. This is computationally expensive but provides the strongest evidence of grounding.
- **Corrective RAG (CRAG)** addresses the case where retrieved documents are relevant but insufficient. After initial retrieval, a lightweight evaluator scores the quality of the retrieved set. If the score is high, generation proceeds normally. If the score is ambiguous, the system triggers a web search to supplement the knowledge base results. If the score is low, the system falls back entirely to web search or declines to answer. This adaptive approach prevents the system from generating answers based on weak evidence.
- **Self-RAG** adds a self-critique loop to the generation process. The LLM generates an answer, then evaluates its own output against the retrieved chunks. It checks whether each claim is supported, whether the answer is complete, and whether it introduced information not present in the sources. If the self-evaluation finds problems, the system can regenerate with stricter instructions, retrieve additional context, or flag the response as low-confidence. This iterative refinement catches errors that a single generation pass would miss.
- **Pipeline guardrails** apply checks at four stages. At the input stage, you validate and classify the query. At the retrieval stage, you verify chunk relevance. At the generation stage, you enforce grounding constraints in the prompt. At the output stage, you run a final verification pass that checks for unsupported claims, inconsistencies, and formatting compliance. Each stage catches different failure modes, and together they create defense in depth.

## Implementation Steps

1. Trustworthy generation is a set of techniques applied at the generation stage and across the full pipeline to ensure that outputs are grounded in retrieved evidence, that sources are properly attributed, and that the system recognizes when it cannot answer.
2. *Out-of-domain detection** is the first line of defense. Before generating an answer, you check whether the retrieved chunks are relevant enough to answer the query. If the best retrieval score falls below a threshold, or if a classifier determines the query falls outside the knowledge base scope, the system returns an honest "I do not have enough information to answer this" rather than guessing. This single check prevents a large category of hallucinations, the ones where the LLM fills in gaps with its training data because the retrieval returned nothing useful.
3. *Citations** come in multiple levels of granularity. Source-level citation is the simplest. The system lists which documents it drew from. This helps users verify the answer but does not tell them which specific claim came from which source. Classification-based citation maps each claim in the response to a specific retrieved chunk. The LLM generates the answer with inline references, and a verification step checks that each reference actually supports the claim it is attached to. Token-level attribution is the most precise. It traces individual tokens or phrases in the output back to specific spans in the source documents. This is computationally expensive but provides the strongest evidence of grounding.
4. *Corrective RAG (CRAG)** addresses the case where retrieved documents are relevant but insufficient. After initial retrieval, a lightweight evaluator scores the quality of the retrieved set. If the score is high, generation proceeds normally. If the score is ambiguous, the system triggers a web search to supplement the knowledge base results. If the score is low, the system falls back entirely to web search or declines to answer. This adaptive approach prevents the system from generating answers based on weak evidence.
5. *Self-RAG** adds a self-critique loop to the generation process. The LLM generates an answer, then evaluates its own output against the retrieved chunks. It checks whether each claim is supported, whether the answer is complete, and whether it introduced information not present in the sources. If the self-evaluation finds problems, the system can regenerate with stricter instructions, retrieve additional context, or flag the response as low-confidence. This iterative refinement catches errors that a single generation pass would miss.
6. *Pipeline guardrails** apply checks at four stages. At the input stage, you validate and classify the query. At the retrieval stage, you verify chunk relevance. At the generation stage, you enforce grounding constraints in the prompt. At the output stage, you run a final verification pass that checks for unsupported claims, inconsistencies, and formatting compliance. Each stage catches different failure modes, and together they create defense in depth.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/rag/grounded-generation

## Verification Checklist

- [ ] Verified: Out-of-domain detection can be too aggressive, refusing to answer questions that the system could handle. This is frustrating for users and requires careful threshold tuning. Setting the threshold too low, on the other hand, lets through the hallucinations you were trying to prevent.
- [ ] Verified: Citation verification is only as good as the verification model. If the model that checks whether a claim is supported by a chunk is itself unreliable, you get false confidence. The system looks trustworthy because it has citations, but the citations do not actually support the claims.
- [ ] Verified: Self-RAG loops can get stuck. If the self-critique consistently finds problems but regeneration does not fix them, you burn latency and tokens without improving quality. You need exit conditions: a maximum number of iterations and a fallback behavior when the loop does not converge.
- [ ] Verified: CRAG's web search fallback introduces its own risks. Web content is unvetted. If you supplement your curated knowledge base with arbitrary web results, you may trade one type of error for another. The web results need their own quality filtering before they reach the generation stage.

## Trade-offs

Every trust mechanism adds latency. Out-of-domain detection adds a classification step. Citation verification adds a post-generation check. Self-RAG can double or triple the total generation time. CRAG may trigger additional retrieval calls. For interactive applications, you need to decide which checks are worth the latency cost.

There is a tension between helpfulness and safety. A system that refuses to answer anything outside its strict domain is trustworthy but unhelpful. A system that always attempts an answer is helpful but risky. Finding the right balance is a product decision, not just a technical one.

Implementation complexity is high, especially for classification-based citations and Self-RAG. You need evaluation datasets to measure whether your trust mechanisms actually work. You need monitoring to detect when they fail in production. You need fallback behaviors for every failure mode. This is significantly more engineering work than basic RAG.

The payoff is user trust, which is hard to quantify but easy to lose. If your use case can tolerate occasional errors and users understand the system is not authoritative, lighter trust mechanisms may suffice. If users treat your system as a source of truth, invest heavily here.

