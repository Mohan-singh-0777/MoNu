import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message, Profile } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages((data ?? []) as Message[]);

    const senderIds = Array.from(new Set((data ?? []).map((m: any) => m.sender_id)));

    if (senderIds.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("*")
        .in("id", senderIds);

      setProfiles(new Map((ps ?? []).map((p: any) => [p.id, p as Profile])));
    }

    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-live-${conversationId}`)

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          await load();
        }
      )

      .subscribe((status) => {
        console.log("REALTIME STATUS:", status);
      });

    const poll = setInterval(() => {
      load();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [conversationId, load]);

  const sendMessage = useCallback(async (
    content: string,
    attachment?: { url: string; name: string; type: "image" | "file" }
  ) => {
    if (!conversationId || !user) return;

    const trimmed = content.trim();
    if (!trimmed && !attachment) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed || null,
      message_type: attachment?.type ?? "text",
      attachment_url: attachment?.url ?? null,
      attachment_name: attachment?.name ?? null,
    });

    if (error) throw error;

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    await load();
  }, [conversationId, user, load]);

  const deleteMessage = useCallback(async (id: string) => {
    await supabase.from("messages").delete().eq("id", id);
    await load();
  }, [load]);

  const setTyping = useCallback(async () => {
    return;
  }, []);

  return {
    messages,
    profiles,
    loading,
    sendMessage,
    deleteMessage,
    setTyping,
    typingUserIds
  };
}