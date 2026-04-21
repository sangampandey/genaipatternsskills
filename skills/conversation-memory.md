---
name: conversation-memory
description: >-
  Implement the Conversation Memory pattern (Memory & State). Manage conversation state across turns using sliding windows, summaries, or entity tracking strategies to maintain coherent multi-turn dialogue. Use when working with: conversation, history, sliding-window, summarization.
---

# Conversation Memory

> Category: Memory & State | Difficulty: beginner | Reference: https://www.genaipatterns.dev/patterns/memory/conversation-memory

## What This Pattern Solves

**Conversation Memory is** a pattern that maintains context across multiple turns of a dialogue by storing and retrieving previous messages. It solves the statelessness of LLM APIs by explicitly managing conversation history, summarization, and context window limits.

## When to Use This Skill

Every conversational LLM application needs some form of conversation memory. The question is which strategy fits your use case.

Start with full history if your conversations are typically short (total history stays under roughly 20% of your model's context window) and your context window is large. Do not over-engineer memory management for conversations that will never hit the limit.

Use a sliding window when recency is what matters. Customer support chats where each question is relatively self-contained, coding assistants where the current task is all that matters, and casual chatbots all work well with a window of the last 5-10 turns.

Use summary memory when conversations are long and the early context stays relevant. Consulting sessions, tutoring interactions, and project planning conversations all benefit from maintaining a compressed record of what was discussed earlier.

Use entity memory when your application revolves around tracking specific objects or people. CRM assistants, project management tools, and relationship management applications need to know facts about entities rather than the flow of conversation.

## Architecture Rules

- Every conversational LLM application needs some form of conversation memory
- Start with full history if your conversations are typically short (total history stays under roug...
- a sliding window when recency is what matters
- summary memory when conversations are long and the early context stays relevant
- entity memory when your application revolves around tracking specific objects or people

## Implementation Steps

1. Conversation memory is the set of techniques for deciding which parts of the conversation history to include in each API call. There are several strategies, each with distinct characteristics.
2. *Full history** is the simplest approach. Include every message from the conversation in every request.
3. *Sliding window** keeps only the most recent N turns. Older messages are dropped.
4. *Summary memory** periodically compresses older turns into a condensed summary. You keep the recent turns in full and prepend a summary of everything that came before.
5. *Entity memory** takes a structured approach. Instead of summarizing the conversation as prose, you extract and maintain a running record of entities mentioned, their attributes, and relationships.
6. Adapt the code template below to your specific requirements
7. Run the verification checklist before marking implementation complete

## Code Template

```python
# Using OpenAI SDK for illustration — swap client for any provider
from openai import OpenAI

client = OpenAI()

class SlidingWindowMemory:
    """Keep only the last N turns in the conversation history."""

    def __init__(self, window_size: int = 10, system_prompt: str = "You are a helpful assistant."):
        self.window_size = window_size
        self.system_message = {"role": "system", "content": system_prompt}
        self.messages: list[dict] = []

    def add_user_message(self, content: str):
        self.messages.append({"role": "user", "content": content})
        self._trim()

    def add_assistant_message(self, content: str):
        self.messages.append({"role": "assistant", "content": content})
        self._trim()

    def _trim(self):
        # Keep last window_size * 2 messages (each turn = user + assistant)
        max_messages = self.window_size * 2
        if len(self.messages) > max_messages:
            self.messages = self.messages[-max_messages:]

    def get_context(self) -> list[dict]:
        return [self.system_message] + self.messages

    def chat(self, user_input: str) -> str:
        self.add_user_message(user_input)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=self.get_context(),
        )
        reply = response.choices[0].message.content
        self.add_assistant_message(reply)
        return reply

# Usage
memory = SlidingWindowMemory(window_size=5)
print(memory.chat("My name is Alice."))
print(memory.chat("What's my name?"))  # Should remember: "Alice"
```

## Verification Checklist

- [ ] Verified: Summary compression loses information.
- [ ] Verified: Sliding windows create a jarring experience when users reference things from before the window.
- [ ] Verified: Entity extraction is imperfect.
- [ ] Context window usage is managed — retrieved content fits within model limits
- [ ] Implementation follows the Conversation Memory architecture rules above
- [ ] Code is tested with representative inputs

## Trade-offs

Simpler strategies (full history, sliding window) are easier to implement but less effective at preserving important information over long conversations. Complex strategies (summary memory, entity memory, hybrids) preserve more information but require more engineering effort, more model calls for summarization and extraction, and more careful testing.

Summary memory costs extra because each summarization step is an additional model call. If you summarize every 10 turns, you add roughly 10% overhead in model calls. That is usually worth it for the context savings, but it is a real cost.

There is a latency component to any strategy that pre-processes history. Summarizing older turns or extracting entities before generating a response adds time. For applications where every millisecond of response time matters, you may need to run these processes asynchronously between turns rather than synchronously during generation.

No strategy perfectly solves the fundamental problem. Context windows are finite. Conversations can be infinite. Some information will always be lost or degraded. The goal is to lose the least important information first and preserve what matters most for the user's current needs.

