import { addFavLLM } from "../types/fav";
import { Message, createConversation } from "../types/chat";

export const handleFavClick = async (
  modelId: string | undefined,
  setIsFav: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!modelId) {
    console.error("Missing modelId");
    return;
  }

  try {
    const data = await addFavLLM(modelId);
    console.log(data.message);
    setIsFav(true);
  } catch (err: any) {
    console.error("Failed to favorite LLM:", err.message);
  }
};

export const sendMessage = async ({
  input,
  setInput,
  messages,
  setMessages,
  currentConversationId,
  setCurrentConversationId,
  currentChunk,
  modelId,
}: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentConversationId: string | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  currentChunk: React.MutableRefObject<Message[]>;
  modelId: string;
}) => {
  if (!input.trim()) return;

  // 1️⃣ Conversation creation
  if (!currentConversationId) {
    const defaultTitle = `Conversation ${new Date().toLocaleString()}`;
    try {
      const conv = await createConversation(defaultTitle, modelId);
      setCurrentConversationId(conv.id);
    } catch (err) {
      console.error(err);
      return;
    }
  }

  // 2️⃣ Append user message
  const userMessage: Message = { role: "user", content: input };
  setMessages((prev) => [...prev, userMessage]);
  currentChunk.current.push(userMessage);
  setInput("");

  // 3️⃣ Flush chunk if needed
  if (currentChunk.current.length >= 5 && currentConversationId) {
    await fetch(
      `http://localhost:8000/conversation/${currentConversationId}/chunk`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(currentChunk.current),
      }
    );
    currentChunk.current = [];
  }

  // 4️⃣ Stream assistant response
  try {
    const response = await fetch("http://localhost:8000/llm/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, conversation: [...messages, userMessage] }),
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let partial = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        partial += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg?.role === "assistant") lastMsg.content = partial;
          else newMessages.push({ role: "assistant", content: partial });
          return newMessages;
        });
      }
    }

    // ✅ After streaming finishes, push final assistant message into the chunk
    const assistantMessage: Message = { role: "assistant", content: partial };
    currentChunk.current.push(assistantMessage);

    // Optional: flush chunk if it reaches threshold after assistant response
    if (currentChunk.current.length >= 5 && currentConversationId) {
      await fetch(
        `http://localhost:8000/conversation/${currentConversationId}/chunk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(currentChunk.current),
        }
      );
      currentChunk.current = [];
    }
  } catch (err) {
    console.error(err);
  }
};