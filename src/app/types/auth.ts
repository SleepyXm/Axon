const API_BASE = "http://localhost:8000";

async function request(path: string, options: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // send/receive cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export async function checkAuth(): Promise<any | null> {
  try {
    const data = await request("/auth/me", {
      method: "GET",
      credentials: "include",
    });

    // Keep everything else exactly as it was
    if (!data.username) return null;

    // Only change: ensure hf_token exists as an array
    if (!data.hf_token) {
      data.hf_token = data.hf_tokens || [];
    }

    return data;
  } catch {
    return null;
  }
}

export async function signup(username: string, password: string) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string) {
  const res = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const userObj = await request("/auth/me", { method: "GET", credentials: "include" });
  
  return { ...res, user: userObj };
}

export async function logout() {
  await request("/auth/logout", { method: "POST" });

}

export function getProtected(path: string) {
  // Example: hit /profile or /conversations with cookie
  return request(path, { method: "GET" });
}

export async function addHfToken(token: string): Promise<string[]> {
  const res = await request("/auth/hf_token", {
    method: "POST",
    body: JSON.stringify({ hf_token: token }),
    credentials: "include",
  });

  if (!res) throw new Error("Failed to add HF token");

  return res.hf_token ?? [];
}

export async function deleteHfToken(token: string): Promise<string[]> {
  const res = await request("/auth/hf_token", {
    method: "DELETE",
    body: JSON.stringify({ hf_token: token }),
    credentials: "include",
  });

  // assume server returns the new list or at least a success flag
  if (!res) throw new Error("Failed to delete HF token");

  return res.hf_token ?? []; // fallback to empty array if undefined
}
/*
export async function pushToBackend(messages: Message[]) {
    await fetch("/llm/chat/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: currentUserId,
            llm_model: modelId,
            messages: messages,
        }),
    });
}

*/



export interface FavLLMRequest {
  llm_id: string;
}

export interface FavLLMResponse {
  status: "success" | "error";
  message: string;
}

export async function addFavLLM(llmId: string): Promise<FavLLMResponse> {
  try {
    const data: FavLLMResponse = await request("/auth/add_fav", {
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
  const res = await request("/auth/remove_fav", {
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