const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function request(path: string, options: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || `Request failed with status ${res.status}`);
  }

  return data;
}

export async function checkAuth(): Promise<{ username: string; hf_token: string[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || `Request failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.username) return null;
    if (!data.hf_token) data.hf_token = [];

    return data;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("checkAuth failed:", error.message);
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
