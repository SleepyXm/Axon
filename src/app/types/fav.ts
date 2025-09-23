import { request } from "./auth";

export interface FavLLMRequest {
  llm_id: string;
}

export interface FavLLMResponse {
  status: "success" | "error";
  message: string;
}

export async function addFavLLM(llmId: string): Promise<FavLLMResponse> {
  try {
    const data: FavLLMResponse = await request("/user/add_fav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hf_id: llmId }), // backend expects hf_id
    });

    // If your request util throws on non-2xx, this line may never run
    return data;
  } catch (err: any) {
    // err might already be the parsed JSON error from the server
    console.error("Failed to favorite LLM:", err?.detail || err?.message || err);
    throw err; // rethrow so caller knows it failed
  }
}

export async function removeFavLLM(hfId: string): Promise<FavLLMResponse> {
  const res = await request("/user/remove_fav", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ hf_id: hfId }), // <-- matches backend
  });

  if (!res.ok) {
    // Try to parse JSON error, fallback to generic
    let errMsg = "Failed to add favorite";
    try {
      const errData = await res.json();
      errMsg = errData.detail || errMsg;
    } catch {
      // ignore parsing error
    }
    throw new Error(errMsg);
  }

  const data: FavLLMResponse = await res.json();
  return data;
}