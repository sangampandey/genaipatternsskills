# Self-Consistency

> Category: Prompting | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/prompting/self-consistency

## What This Pattern Solves

**Self-Consistency is** a decoding strategy that samples multiple chain-of-thought reasoning paths from the LLM and selects the final answer by majority vote. By generating diverse reasoning traces and aggregating results, it reduces errors from any single reasoning path.

## Architecture Rules

- Self-consistency takes a simple insight and applies it systematically. If you ask multiple people the same question independently and most of them agree on the answer, that answer is probably correct. The same logic applies to multiple samples from a language model.
- The process works like this. You send the same prompt to the model multiple times with a temperature above zero, generating several independent responses. Each response follows its own reasoning path and arrives at its own answer. You extract the final answer from each response and pick the one that appears most frequently. The majority wins.
- This works especially well when combined with Chain-of-Thought prompting. Each sample generates a full reasoning trace, not just a bare answer. Different samples will take different reasoning paths. Some paths will contain errors, but the errors tend to be different across samples. The correct answer, on the other hand, can be reached through many valid reasoning paths. So the correct answer shows up more often than any particular wrong answer.
- Think of it as error cancellation through diversity. A single wrong answer might be very convincing on its own. But when five out of seven samples agree on a different answer, you have strong evidence that the majority is right. The stochastic nature of generation, which was the problem, becomes the solution. Randomness generates the diversity you need for the vote to be meaningful.

## Implementation Steps

1. Self-consistency takes a simple insight and applies it systematically. If you ask multiple people the same question independently and most of them agree on the answer, that answer is probably correct. The same logic applies to multiple samples from a language model.
2. The process works like this. You send the same prompt to the model multiple times with a temperature above zero, generating several independent responses. Each response follows its own reasoning path and arrives at its own answer. You extract the final answer from each response and pick the one that appears most frequently. The majority wins.
3. This works especially well when combined with Chain-of-Thought prompting. Each sample generates a full reasoning trace, not just a bare answer. Different samples will take different reasoning paths. Some paths will contain errors, but the errors tend to be different across samples. The correct answer, on the other hand, can be reached through many valid reasoning paths. So the correct answer shows up more often than any particular wrong answer.
4. Think of it as error cancellation through diversity. A single wrong answer might be very convincing on its own. But when five out of seven samples agree on a different answer, you have strong evidence that the majority is right. The stochastic nature of generation, which was the problem, becomes the solution. Randomness generates the diversity you need for the vote to be meaningful.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/prompting/self-consistency

## Verification Checklist

- [ ] Verified: No most fundamental failure is systematic bias. If the model consistently gets a particular type of problem wrong, generating more samples will not help. You will get a confident majority vote on the wrong answer. Self-consistency corrects for random errors, not systematic ones. If there is a flaw in how the model understands the problem, all samples will share that flaw.
- [ ] Verified: Answer extraction can be surprisingly tricky. Different samples may express the same answer in different ways. "42," "the answer is 42," "forty-two," and "approximately 42.0" are all the same answer, but naive string matching will treat them as four different responses. You need a robust extraction and normalization step, and getting this wrong silently undermines the entire technique.
- [ ] Verified: No number of samples matters and there is no universal right answer. Too few samples and the vote is unreliable. Too many and you are burning tokens for diminishing returns. For most tasks, five to ten samples is a reasonable starting point, but the optimal number depends on the difficulty of the task and the baseline accuracy of the model.
- [ ] Verified: Temperature selection is another tuning knob. Too low and all samples will be nearly identical, defeating the purpose. Too high and the samples become unreliable individually, which can reduce the quality of the aggregate. You want enough diversity for different reasoning paths without introducing so much noise that the samples are nonsensical.

## Trade-offs

Cost scales linearly with the number of samples. If you generate seven samples, you pay for seven API calls. For high-volume applications, this can be prohibitive. It is worth calculating whether the accuracy improvement justifies the multiplied cost, and the answer depends entirely on what a wrong answer costs your users or your business.

Latency depends on your infrastructure. If you can make all the API calls in parallel, latency is roughly the same as a single call (bounded by the slowest response). If you must make them sequentially, latency multiplies just like cost. Parallel execution is strongly preferred.

Self-consistency does not improve the model's ceiling. It cannot produce correct answers that none of the individual samples would have produced. It filters noise from a distribution that already contains the right answer somewhere. If the model is fundamentally incapable of solving the problem, more samples will not help.

There is also an implementation complexity cost. You need to handle multiple API calls, extract answers from each response, normalize them for comparison, implement the voting logic, and handle edge cases like ties. None of this is difficult, but it is infrastructure that you need to build and maintain.

