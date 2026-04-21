# Conversation Memory

> Category: Memory & State | Difficulty: beginner | Pattern: genaipatterns.dev/patterns/memory/conversation-memory

## What This Pattern Solves

**Conversation Memory is** a pattern that maintains context across multiple turns of a dialogue by storing and retrieving previous messages. It solves the statelessness of LLM APIs by explicitly managing conversation history, summarization, and context window limits.

## Architecture Rules

- Conversation memory is the set of techniques for deciding which parts of the conversation history to include in each API call. There are several strategies, each with distinct characteristics.
- **Full history** is the simplest approach. Include every message from the conversation in every request. This preserves complete context and is the right choice for short conversations where you will never approach the context limit. Most prototypes start here. The ceiling is obvious: eventually the history exceeds the context window and you need to truncate anyway. But for conversations where total history stays under roughly 20% of your model's context window (about 15-20 turns for a typical 128K-token model), full history is perfectly adequate and the simplest thing that works.
- **Sliding window** keeps only the most recent N turns. Older messages are dropped. This guarantees a fixed context size and works well for applications where recent context matters more than distant history. A coding assistant that helps you debug step by step mostly needs the last few exchanges. What you discussed 50 turns ago is rarely relevant to the current error message. The downside is abrupt information loss. If the user stated a critical constraint in turn 3 and you are now on turn 25 with a window of 10, that constraint is gone.
- **Summary memory** periodically compresses older turns into a condensed summary. You keep the recent turns in full and prepend a summary of everything that came before. When the history grows beyond a threshold, you ask the model to summarize the oldest unsummarized turns and replace them with that summary. The summary preserves the gist of earlier conversation while using far fewer tokens. This is more sophisticated than a sliding window because important information from early turns can survive in compressed form.
- **Entity memory** takes a structured approach. Instead of summarizing the conversation as prose, you extract and maintain a running record of entities mentioned, their attributes, and relationships. The user mentioned they work at Acme Corp on the billing team and their manager is Sarah. These facts get stored as structured entries and injected into the context as a factsheet, independent of the conversation turns. This works well when the conversation revolves around specific entities (people, projects, products) and you need to track evolving facts about them.
- **Hybrid approaches** combine multiple strategies. A common production setup uses summary memory for older turns, full history for the most recent turns, and entity memory for key facts. The summary provides general context. The recent turns provide conversational flow. The entity facts ensure critical details are not lost.

## Implementation Steps

1. Conversation memory is the set of techniques for deciding which parts of the conversation history to include in each API call. There are several strategies, each with distinct characteristics.
2. *Full history** is the simplest approach. Include every message from the conversation in every request. This preserves complete context and is the right choice for short conversations where you will never approach the context limit. Most prototypes start here. The ceiling is obvious: eventually the history exceeds the context window and you need to truncate anyway. But for conversations where total history stays under roughly 20% of your model's context window (about 15-20 turns for a typical 128K-token model), full history is perfectly adequate and the simplest thing that works.
3. *Sliding window** keeps only the most recent N turns. Older messages are dropped. This guarantees a fixed context size and works well for applications where recent context matters more than distant history. A coding assistant that helps you debug step by step mostly needs the last few exchanges. What you discussed 50 turns ago is rarely relevant to the current error message. The downside is abrupt information loss. If the user stated a critical constraint in turn 3 and you are now on turn 25 with a window of 10, that constraint is gone.
4. *Summary memory** periodically compresses older turns into a condensed summary. You keep the recent turns in full and prepend a summary of everything that came before. When the history grows beyond a threshold, you ask the model to summarize the oldest unsummarized turns and replace them with that summary. The summary preserves the gist of earlier conversation while using far fewer tokens. This is more sophisticated than a sliding window because important information from early turns can survive in compressed form.
5. *Entity memory** takes a structured approach. Instead of summarizing the conversation as prose, you extract and maintain a running record of entities mentioned, their attributes, and relationships. The user mentioned they work at Acme Corp on the billing team and their manager is Sarah. These facts get stored as structured entries and injected into the context as a factsheet, independent of the conversation turns. This works well when the conversation revolves around specific entities (people, projects, products) and you need to track evolving facts about them.
6. *Hybrid approaches** combine multiple strategies. A common production setup uses summary memory for older turns, full history for the most recent turns, and entity memory for key facts. The summary provides general context. The recent turns provide conversational flow. The entity facts ensure critical details are not lost.

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

- [ ] Verified: Summary compression loses information. The model decides what is "important" when generating the summary, and it does not always decide correctly. A detail that seemed minor at the time might become critical later. Once it is summarized away, it is gone. You can mitigate this by using conservative summarization prompts that err on the side of including more detail, but there is always a trade-off between compression ratio and information preservation.
- [ ] Verified: Sliding windows create a jarring experience when users reference things from before the window. "Remember when I said I needed the blue version?" The model has no memory of that exchange and either confesses ignorance or, worse, confabulates an answer. If your application uses a sliding window, consider informing users about the memory horizon or providing a way to pin important messages.
- [ ] Verified: Entity extraction is imperfect. The model may miss entities, extract incorrect attributes, or fail to update an entity when new information is provided. Entity memory requires validation and correction mechanisms to stay accurate over time.
- [ ] Verified: Context window cost is often underestimated. If you are using summary memory with a 2,000-token summary plus the last 10 turns plus a system prompt, you might be using 5,000 tokens of context before the model generates a single token. At API pricing, that adds up across millions of conversations.

## Trade-offs

Simpler strategies (full history, sliding window) are easier to implement but less effective at preserving important information over long conversations. Complex strategies (summary memory, entity memory, hybrids) preserve more information but require more engineering effort, more model calls for summarization and extraction, and more careful testing.

Summary memory costs extra because each summarization step is an additional model call. If you summarize every 10 turns, you add roughly 10% overhead in model calls. That is usually worth it for the context savings, but it is a real cost.

There is a latency component to any strategy that pre-processes history. Summarizing older turns or extracting entities before generating a response adds time. For applications where every millisecond of response time matters, you may need to run these processes asynchronously between turns rather than synchronously during generation.

No strategy perfectly solves the fundamental problem. Context windows are finite. Conversations can be infinite. Some information will always be lost or degraded. The goal is to lose the least important information first and preserve what matters most for the user's current needs.

