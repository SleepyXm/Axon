"use client";

import Chat from "@/app/components/Chat";
import Conversation from "@/app/components/Conversations";
import Tooling from "@/app/components/Tooling";

export default function ChatPage() {
  

 return (
      <div
        className={[
          "flex",
          "items-center",
          "justify-center",
          "h-screen",
        ].join(" ")}
      >
        <Conversation />
        <Chat /> 
        
        <Tooling />
      </div>
    )
  }
