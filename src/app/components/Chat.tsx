import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";
import { addFavLLM } from "../types/fav";
import { createConversation } from "../types/chat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const params = useParams();
  const modelId = `${params.author}/${params.model}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isFav, setIsFav] = useState(false);

  const handleFavClick = async () => {
    try {
      const data = await addFavLLM(`${params.author}/${params.model}`);
      console.log(data.message);
      setIsFav(true);
    } catch (err: any) {
      console.error("Failed to favorite LLM:", err.message);
    }
  };

  const CHUNK_SIZE = 5;
  const currentChunk = useRef<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 1️⃣ If no conversation exists, create one
    if (!currentConversationId) {
      const defaultTitle = `Conversation ${new Date().toLocaleString()}`;
      try {
        const conv = await createConversation(defaultTitle, modelId);
        setCurrentConversationId(conv.id);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return; // abort sending message
      }
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    currentChunk.current.push(userMessage);
    setInput("");

    // 2️⃣ Flush chunk if size reached
    if (currentChunk.current.length >= CHUNK_SIZE && currentConversationId) {
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

    // 3️⃣ Stream assistant response (unchanged)
    try {
      const response = await fetch("http://localhost:8000/llm/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: modelId,
          conversation: [...messages, userMessage],
        }),
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

            if (lastMsg?.role === "assistant") {
              lastMsg.content = partial;
            } else {
              newMessages.push({ role: "assistant", content: partial });
            }

            return newMessages;
          });
        }
      }
    } catch (err) {
      console.error("Error streaming assistant response:", err);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-2 shadow-2xl flex flex-col w-full max-w-[30vw] h-[80vh] mt-16">
      <h2 className="text-xl font-bold mt-4 text-white text-center flex items-center justify-center gap-2">
        {params.model}
        <button
          onClick={handleFavClick}
          className="text-white text-l cursor-pointer bg-transparent border-none"
        >
          {isFav ? "★" : "☆"}
        </button>
      </h2>

      <div className="flex-1 overflow-y-auto px-2 pb-2 mb-2 flex flex-col mt-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`my-1 p-2 rounded inline-block max-w-[70%] break-words mt-8 rounded-xl ${
              m.role === "user"
                ? "bg-gray-800 text-white ml-auto text-right"
                : "bg-white/0 text-white mr-auto text-left"
            }`}
          >
            {m.role === "user" ? (
              <div className="whitespace-pre-wrap">{m.content}</div>
            ) : (
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {m.content}
              </ReactMarkdown>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500 px-1 text-white"
          placeholder="Type a message..."
        />

        <button
          onClick={sendMessage}
          className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-blue-400 text-black hover:bg-blue-300 transition"
        >
          Send
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>
      </div>

      <div className="px-2 pb-2 mt-2">
        <p className="mt-2 text-[11px] text-gray-500">
          Tip: Press Enter to send
        </p>
      </div>
    </div>
  );
}
