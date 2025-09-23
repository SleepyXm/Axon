import { request } from "./auth";

export async function addHfToken(token: string): Promise<string[]> {
  const res = await request("/tokens/hf_token", {
    method: "POST",
    body: JSON.stringify({ hf_token: token }),
    credentials: "include",
  });

  if (!res) throw new Error("Failed to add HF token");

  return res.hf_token ?? [];
}

export async function deleteHfToken(token: string): Promise<string[]> {
  const res = await request("/tokens/hf_token", {
    method: "DELETE",
    body: JSON.stringify({ hf_token: token }),
    credentials: "include",
  });

  // assume server returns the new list or at least a success flag
  if (!res) throw new Error("Failed to delete HF token");

  return res.hf_token ?? []; // fallback to empty array if undefined
}