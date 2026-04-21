# Code Execution

> Category: Agents | Difficulty: intermediate | Pattern: genaipatterns.dev/patterns/agents/code-execution

## What This Pattern Solves

**Code Execution is** a pattern that lets an LLM write and run code in a sandboxed environment during inference. Instead of reasoning about computations in natural language, the model generates executable code, runs it, and incorporates the output into its response.

## Architecture Rules

- The Code Execution pattern splits the work into two distinct phases. First, the LLM generates code that solves the problem. Second, a sandboxed runtime executes that code and returns the results. The LLM acts as the programmer. The sandbox acts as the computer.
- Think of it as giving the model a scratch pad that actually runs. When a user asks "show me a scatter plot of revenue vs. headcount for these 50 companies," the LLM writes a Python script using Matplotlib or Plotly, the sandbox executes it, and the rendered image comes back to the user. The model never tries to draw the chart itself. It writes the instructions and lets a real interpreter do the work.
- The sandbox is critical. You are executing LLM-generated code, which means you are executing code you did not write and did not review. The sandbox constrains what that code can do. No filesystem access beyond a temporary working directory. No network calls unless explicitly allowed. Resource limits on CPU time and memory. This is not optional. Running untrusted code without isolation is a security incident waiting to happen.
- This pattern works with many target languages. Python is the most common because of its ecosystem for data science and visualization. SQL is another natural fit, where the LLM writes a query and the sandbox executes it against a database connection. Graphviz DOT notation lets the model describe graph structures that get rendered into diagrams. The key insight is that the LLM does not need to understand rendering pipelines or database internals. It just needs to produce syntactically correct code in the target language.

## Implementation Steps

1. The Code Execution pattern splits the work into two distinct phases. First, the LLM generates code that solves the problem. Second, a sandboxed runtime executes that code and returns the results. The LLM acts as the programmer. The sandbox acts as the computer.
2. Think of it as giving the model a scratch pad that actually runs. When a user asks "show me a scatter plot of revenue vs. headcount for these 50 companies," the LLM writes a Python script using Matplotlib or Plotly, the sandbox executes it, and the rendered image comes back to the user. The model never tries to draw the chart itself. It writes the instructions and lets a real interpreter do the work.
3. The sandbox is critical. You are executing LLM-generated code, which means you are executing code you did not write and did not review. The sandbox constrains what that code can do. No filesystem access beyond a temporary working directory. No network calls unless explicitly allowed. Resource limits on CPU time and memory. This is not optional. Running untrusted code without isolation is a security incident waiting to happen.
4. This pattern works with many target languages. Python is the most common because of its ecosystem for data science and visualization. SQL is another natural fit, where the LLM writes a query and the sandbox executes it against a database connection. Graphviz DOT notation lets the model describe graph structures that get rendered into diagrams. The key insight is that the LLM does not need to understand rendering pipelines or database internals. It just needs to produce syntactically correct code in the target language.

## Code Template

See the full pattern page for code examples: genaipatterns.dev/patterns/agents/code-execution

## Verification Checklist

- [ ] Verified: No most common failure is generated code that does not run. Syntax errors, missing imports, incorrect API usage. The LLM might reference a library function that does not exist or pass arguments in the wrong order. This is especially common with less popular libraries where the model has seen fewer training examples.
- [ ] Verified: A subtler problem is code that runs but produces wrong results. The LLM might write a SQL query that returns data but applies the wrong join condition, giving you plausible looking numbers that are quietly incorrect. Unlike a runtime error, this failure mode is silent.
- [ ] Verified: Security is the big risk. If your sandbox has gaps, generated code could read sensitive files, make network requests to exfiltrate data, or consume excessive resources. Some teams have learned this the hard way by running LLM-generated code in a standard Docker container without resource limits, only to have a while-true loop consume all available CPU.
- [ ] Verified: There is also the latency consideration. Spinning up a sandbox, executing code, and returning results adds time compared to a direct LLM response. For interactive applications, this delay can feel sluggish if you are not careful about sandbox warm-up and pooling.
- [ ] Verified: Over-reliance on code execution for tasks where simpler approaches work is another anti-pattern. If the user asks "what is 15% of 200," generating and executing a Python script is overkill. A tool call to a calculator or even the LLM doing the arithmetic directly would be faster and cheaper.

## Trade-offs

**You gain** computational precision, the ability to produce real artifacts (images, files, query results), and access to the full ecosystem of a programming language.

**You pay** with added infrastructure complexity (you need a sandbox service), increased latency per interaction, and a new attack surface that requires ongoing security attention.

**Code quality varies.** The LLM-generated code is not production code. It is throwaway scripting meant to solve an immediate problem. Expecting clean, well-architected output is unrealistic. What matters is that it runs correctly for the specific input.

**Debugging gets harder.** When something goes wrong, you are debugging code you did not write. Good implementations return both the generated code and any error messages to the LLM so it can self-correct, but this means additional API calls and higher costs.

**Sandbox maintenance is real work.** You need to keep the sandbox environment updated with the right libraries, patch security vulnerabilities, and monitor resource usage. This is operational overhead that scales with usage.

