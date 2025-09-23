import { request } from "./auth";

export async function createConversation(title: string, modelId: string) {
  const data = await request("/conversation/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, llm_model: modelId }),
  });

  return data; // { id }
}