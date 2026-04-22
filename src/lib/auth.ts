import { supabase } from "@/integrations/supabase/client";

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@validavinho.app`;
}

export async function login(username: string, password: string) {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Invalid login")) throw new Error("Usuario ou senha incorretos.");
    throw new Error(error.message);
  }
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  firstName: string;
  role: "admin" | "franchisee";
  franchiseNumber: number | null;
}

export async function getProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    firstName: data.first_name ?? data.display_name?.split(" ")[0] ?? data.username,
    role: data.role as "admin" | "franchisee",
    franchiseNumber: data.franchise_number ?? null,
  };
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
