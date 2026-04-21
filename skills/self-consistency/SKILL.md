---
name: self-consistency
description: >-
  Implement the Self-Consistency pattern (Prompting). Generate multiple reasoning paths and take the majority answer to reduce errors from stochastic generation and improve reliability. Use when working with: sampling, majority-vote, consistency, reliability.
---

# Self-Consistency

> Category: Prompting | Difficulty: intermediate | Reference: https://www.genaipatterns.dev/patterns/prompting/self-consistency

## What This Pattern Solves

**Self-Consistency is** a decoding strategy that samples multiple chain-of-thought reasoning paths from the LLM and selects the final answer by majority vote. By generating diverse reasoning traces and aggregating results, it reduces errors from any single reasoning path.

## When to Use This Skill

Self-consistency is most valuable when the task has a clear, extractable answer. Math problems, multiple-choice questions, yes/no decisions, classifications with a fixed label set. Anything where you can unambiguously identify and compare the final answers across samples.

It is particularly effective for reasoning-heavy tasks where Chain-of-Thought is already improving accuracy. CoT gets you part of the way there by making the model show its work. Self-consistency gets you further by aggregating across multiple reasoning attempts.

Use it when correctness matters more than speed or cost. If a wrong answer has significant consequences and you can tolerate higher latency and API costs, self-consistency is a straightforward way to buy reliability.

It is less useful for open-ended generation tasks. If you ask the model to write an email, there is no single correct answer to vote on. Each sample will be different in legitimate ways, and "majority vote" does not have a clear meaning. Similarly, if the task is so easy that the model gets it right on the first try nearly every time, self-consistency adds cost without adding value.

## Architecture Rules

- Self-consistency is most valuable when the task has a clear, extractable answer
- It is particularly effective for reasoning-heavy tasks where Chain-of-Thought is already improvin...
- it when correctness matters more than speed or cost
- It is less useful for open-ended generation tasks

## Implementation Steps

1. Self-consistency takes a simple insight and applies it systematically. If you ask multiple people the same question independently and most of them agree on the answer, that answer is probably correct.
2. The process works like this. You send the same prompt to the model multiple times with a temperature above zero, generating several independent responses.
3. This works especially well when combined with Chain-of-Thought prompting. Each sample generates a full reasoning trace, not just a bare answer.
4. Think of it as error cancellation through diversity. A single wrong answer might be very convincing on its own.
5. Run the verification checklist before marking implementation complete

## Code Template

See the full pattern page for code examples: https://www.genaipatterns.dev/patterns/prompting/self-consistency

## Verification Checklist

- [ ] Verified: most fundamental failure is systematic bias.
- [ ] Verified: Answer extraction can be surprisingly tricky.
- [ ] Verified: number of samples matters and there is no universal right answer.
- [ ] Relevance filtering is in place — irrelevant results are filtered before reaching the model
- [ ] Implementation follows the Self-Consistency architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Cost scales linearly with the number of samples. If you generate seven samples, you pay for seven API calls. For high-volume applications, this can be prohibitive. It is worth calculating whether the accuracy improvement justifies the multiplied cost, and the answer depends entirely on what a wrong answer costs your users or your business.

Latency depends on your infrastructure. If you can make all the API calls in parallel, latency is roughly the same as a single call (bounded by the slowest response). If you must make them sequentially, latency multiplies just like cost. Parallel execution is strongly preferred.

Self-consistency does not improve the model's ceiling. It cannot produce correct answers that none of the individual samples would have produced. It filters noise from a distribution that already contains the right answer somewhere. If the model is fundamentally incapable of solving the problem, more samples will not help.

There is also an implementation complexity cost. You need to handle multiple API calls, extract answers from each response, normalize them for comparison, implement the voting logic, and handle edge cases like ties. None of this is difficult, but it is infrastructure that you need to build and maintain.

