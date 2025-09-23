import { useState, useEffect } from "react";
import { createConversation } from "../types/chat";

interface ConversationItem {
  id: string;
}

export default function Conversation({
  onSelectConversation,
}: {
  onSelectConversation: (id: string) => void;
}) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("http://localhost:8000/conversation/list", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(data.conversations);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };

    fetchConversations();
  }, []);

  return (
    <div className="absolute right-[calc(50%+15vw)] rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-2 shadow-2xl flex flex-col w-[25vw] h-[80vh] mt-16">
      <h3 className="text-sm font-bold text-white text-center mt-6">
        Conversations
      </h3>
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-[12px] text-gray-400 text-center mt-2">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="rounded-lg bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex items-center p-1 text-xs font-semibold"
              onClick={() => onSelectConversation(conv.id)}
            >
              {conv.id}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
