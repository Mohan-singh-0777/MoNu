import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message, Profile } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages((msgs ?? []) as Message[]);

    const senderIds = [...new Set((msgs ?? []).map((m: any) => m.sender_id))];

    if (senderIds.length > 0) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("*")
        .in("id", senderIds);

      setProfiles(new Map((ps ?? []).map((p: any) => [p.id, p as Profile])));
    }

    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`room-${conversationId}-${Math.random()}`)

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const msg = payload.new as Message;

          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", msg.sender_id)
            .single();

          if (data) {
            setProfiles((prev) => {
              const n = new Map(prev);
              n.set(data.id, data as Profile);
              return n;
            });
          }
        }
      )

      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((m) => m.id !== (payload.old as any).id)
          );
        }
      )

      .subscribe((status) => {
        console.log("REALTIME STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (
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
        .update({
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    },
    [conversationId, user]
  );

  const deleteMessage = useCallback(async (id: string) => {
    await supabase.from("messages").delete().eq("id", id);
  }, []);

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
    typingUserIds: [],
  };
}