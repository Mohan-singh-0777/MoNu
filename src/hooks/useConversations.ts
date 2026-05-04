import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, ConversationWithMeta, Message, Profile } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: parts } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    const convIds = (parts ?? []).map((p: any) => p.conversation_id);

    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("last_message_at", { ascending: false });

    const { data: allParts } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds);

    const userIds = Array.from(new Set((allParts ?? []).map((p: any) => p.user_id)));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p as Profile]));

    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });

    const lastByConv = new Map<string, Message>();
    (lastMsgs ?? []).forEach((m: any) => {
      if (!lastByConv.has(m.conversation_id)) {
        lastByConv.set(m.conversation_id, m as Message);
      }
    });

    const result: ConversationWithMeta[] = (convs ?? []).map((c: any) => {
      const cParts = (allParts ?? []).filter((p: any) => p.conversation_id === c.id);
      const ps = cParts.map((p: any) => profileMap.get(p.user_id)).filter(Boolean) as Profile[];

      return {
        ...(c as Conversation),
        participants: ps,
        last_message: lastByConv.get(c.id) ?? null,
        unread_count: 0,
      };
    });

    setConversations(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { conversations, loading, reload: load };
}

export async function findOrCreateDirectConversation(otherUserId: string) {
  const { data, error } = await (supabase as any).rpc("create_direct_conversation", {
    other_user_id: otherUserId,
  });

  if (error) throw error;
  return data as string;
}

export async function createGroupConversation(name: string, memberIds: string[]) {
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .insert({
      name,
      is_group: true,
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (convErr) throw convErr;

  const members = memberIds.map((uid) => ({
    conversation_id: conv.id,
    user_id: uid,
  }));

  const { data: me } = await supabase.auth.getUser();

  if (me.user) {
    members.push({
      conversation_id: conv.id,
      user_id: me.user.id,
    });
  }

  await supabase.from("conversation_members").insert(members);

  return conv.id as string;
}