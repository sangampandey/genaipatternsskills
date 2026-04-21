---
name: small-language-models
description: >-
  Implement the Small Language Models pattern (Cost & Performance). Reduce model size through distillation, quantization, or speculative decoding while preserving quality for cost-efficient deployment. Use when working with: distillation, quantization, speculative-decoding, efficiency.
---

# Small Language Models

> Category: Cost & Performance | Difficulty: advanced | Reference: https://www.genaipatterns.dev/patterns/cost-performance/small-language-models

## What This Pattern Solves

**Small Language Models (SLMs) is** a pattern that uses compact, task-specific models (1B to 13B parameters) instead of large general-purpose models for targeted tasks. Fine-tuned SLMs can match or exceed large model performance on narrow domains at a fraction of the cost and latency.

## When to Use This Skill

Distillation is the right choice when you have a well-defined, narrow use case and the resources to create a training dataset. It delivers the largest cost savings because you end up running a genuinely small model. But it requires upfront investment in dataset creation, training infrastructure, and ongoing model maintenance.

Quantization is the easiest to adopt. If you are self-hosting a model and memory is your bottleneck, quantization can be applied to an existing model with minimal effort. Tools like llama.cpp, GPTQ, and bitsandbytes make the process straightforward. This is often the first optimization teams try because the effort-to-impact ratio is favorable.

Speculative decoding is the right fit when you cannot tolerate any quality degradation but need lower latency. It requires running two models simultaneously, so it does not save memory. But it can reduce time-to-first-token and overall generation speed significantly, which matters for user-facing applications.

In practice, these techniques compose. You can distill a task-specific model, quantize it for deployment, and use it as the draft model in a speculative decoding setup with a larger verifier. Each technique addresses a different axis of the cost-quality-speed triangle.

## Architecture Rules

- Distillation is the right choice when you have a well-defined, narrow use case and the resources ...
- Quantization is the easiest to adopt
- Speculative decoding is the right fit when you cannot tolerate any quality degradation but need l...
- In practice, these techniques compose

## Implementation Steps

1. *Distillation** is the most intuitive approach. You have a large "teacher" model that performs well on your task.
2. A general-purpose 70B model knows how to write poetry, solve math problems, translate languages, and generate code. If your application is a customer service chatbot, the student model only needs to handle customer service.
3. *Quantization** takes a different approach. Instead of training a smaller model, you take the existing large model and reduce the precision of its numerical weights.
4. The surprising finding is that this precision reduction barely affects output quality for most tasks. Models are over-parameterized.
5. *Speculative decoding** is the most clever of the three. It does not compromise on quality at all.
6. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/cost-performance/small-language-models

## Verification Checklist

- [ ] Monitoring and logging are configured for production debugging
- [ ] Verified: Quantization has a quality floor.
- [ ] Verified: Speculative decoding adds system complexity.
- [ ] Verified: All three approaches require evaluation infrastructure.
- [ ] Implementation follows the Small Language Models architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Distillation requires the largest upfront investment but delivers the largest ongoing savings. You need to generate training data, train the model, evaluate it, and maintain a retraining pipeline. The operational complexity is real. But once deployed, a 7B distilled model is dramatically cheaper than a 70B API call.

Quantization is nearly free to apply but provides moderate savings. You reduce memory requirements, which may let you use cheaper hardware or increase throughput on existing hardware. The quality trade-off is small but present, and it accumulates. A slightly worse model producing slightly worse outputs across millions of requests has a cumulative impact on user experience.

Speculative decoding improves speed without sacrificing quality but does not reduce cost in terms of total compute. You are running two models instead of one. The benefit is latency, not efficiency. For applications where speed matters more than cost per request, this is the right trade-off.

