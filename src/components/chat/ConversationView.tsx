import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { UserAvatar } from "@/components/UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Video } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { useCall } from "@/context/CallContext";

export const ConversationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations } = useConversations();
  const { messages, profiles, loading, sendMessage, deleteMessage, setTyping, typingUserIds } = useMessages(id ?? null);
  const { startCall } = useCall();

  const conv = conversations.find((c) => c.id === id);
  const other = conv?.type === "direct" ? conv.participants.find((p) => p.id !== user?.id) : null;

  const headerName =
    conv?.type === "group"
      ? conv.name || "Group"
      : other?.display_name || other?.username || "Chat";

  const subtitle =
    conv?.type === "group"
      ? `${conv.participants.length} members`
      : other?.is_online
        ? "Active now"
        : other
          ? `Last seen ${formatDistanceToNowStrict(new Date(other.last_seen), { addSuffix: true })}`
          : "";

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typingUserIds.length]);

  if (!id) return null;

  return (<section className="flex h-full min-w-0 flex-1 flex-col bg-gradient-to-br from-pink-50 via-white to-blue-50"> <header className="flex items-center gap-3 border-b border-gray-200 bg-white/80 backdrop-blur-xl px-5 py-4 shadow-sm">
    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate("/")}> <ArrowLeft className="h-5 w-5" /> </Button>

    <UserAvatar
      profile={
        conv?.type === "group"
          ? {
            avatar_url: conv.avatar_url,
            display_name: conv.name,
            username: conv.name ?? "g",
            is_online: false,
          }
          : other ?? null
      }
      size="md"
      showStatus={conv?.type === "direct"}
    />

    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-bold text-gray-800">{headerName}</div>
      <div className="truncate text-xs text-gray-500">{subtitle}</div>
    </div>

    {conv?.type === "direct" && other && (
      <div className="flex items-center gap-2">
        <Button
          onClick={() => startCall(other, conv.id, "audio")}
          className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
        >
          <Phone className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => startCall(other, conv.id, "video")}
          className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
    )}
  </header>

    <ScrollArea ref={scrollRef} className="flex-1">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Start the conversation 💬
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const isOwn = m.sender_id === user?.id;
            const sender = profiles.get(m.sender_id);
            const showAvatar = !next || next.sender_id !== m.sender_id;
            const showName = !prev || prev.sender_id !== m.sender_id;

            return (
              <MessageBubble
                key={m.id}
                message={m}
                sender={sender}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showName={showName}
                isGroup={conv?.type === "group"}
                onDelete={deleteMessage}
              />
            );
          })
        )}

        {typingUserIds.length > 0 && (
          <div className="mt-2 flex items-center gap-2 px-2">
            <div className="rounded-full bg-white px-4 py-2 shadow">
              typing...
            </div>
          </div>
        )}
      </div>
    </ScrollArea>

    <MessageComposer onSend={sendMessage} onTyping={setTyping} />
  </section>

  );
};
