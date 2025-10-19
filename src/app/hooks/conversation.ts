import { ConversationItem } from "../types/chat";
import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export const useConversations = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_BASE}/conversation/list`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(data.conversations);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        console.error("Error fetching conversations:", error.message);
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
    return data.messages;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Error fetching conversation:", error.message);
    return [];
  }
};

const conversationBus = new EventTarget();

export function emitConversationSelected(id: string) {
  conversationBus.dispatchEvent(new CustomEvent("conversationSelected", { detail: id }));
}

export function onConversationSelected(callback: (id: string) => void) {
  conversationBus.addEventListener(
    "conversationSelected",
    (e: Event) => {
      const event = e as CustomEvent;
      callback(event.detail);
    }
  );
}
