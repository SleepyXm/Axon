"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Chat from "@/app/components/Chat";
import Conversation from "@/app/components/Conversations";
import Tooling from "@/app/components/Tooling";
import AuraBackground7 from "@/app/components/background7";

export default function ChatPage() {
  const params = useParams();

 return (
      <div
        className={[
          "flex",
          "items-center",
          "justify-center",
          "h-screen",
          "bg-gray-900/70",
          "p-4",
        ].join(" ")}
      >
        <AuraBackground7 />
        <Chat />
        <Tooling />
        <Conversation />
      </div>
    )}
