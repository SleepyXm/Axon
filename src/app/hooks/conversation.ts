import { ConversationItem } from "../types/chat";
import { useState, useEffect } from "react";


export const useConversations = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_BASE}/conversation/list`, {
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

  return { conversations };
};

export const fetchConversations = async (conversationId: string) => {
  try {
    const res = await fetch(`${API_BASE}/conversation/${conversationId}/chunk`, {
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch conversation");

    const data = await res.json();
    return data.messages; // array of decompressed messages
  } catch (err) {
    console.error("Error fetching conversation:", err);
    return [];
  }
};



const conversationBus = new EventTarget();

export function emitConversationSelected(id: string) {
  conversationBus.dispatchEvent(new CustomEvent("conversationSelected", { detail: id }));
}

export function onConversationSelected(callback: (id: string) => void) {
  conversationBus.addEventListener("conversationSelected", (e: any) => callback(e.detail));
}
