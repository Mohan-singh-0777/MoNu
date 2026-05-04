import { useParams } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, SendHorizonal } from "lucide-react";

export function ConversationView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { messages, profiles, sendMessage } = useMessages(id || null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const otherProfile = messages.length
    ? profiles.get(messages.find((m) => m.sender_id !== user?.id)?.sender_id || "")
    : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async () => {
    if (!text.trim()) return;
    await sendMessage(text);
    setText("");
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-pink-50 via-white to-blue-50">
      
      {/* TOP HEADER desktop only */}
      <div className="hidden md:flex items-center gap-3 border-b bg-white px-5 py-4 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 font-bold text-white">
          {(otherProfile?.username || "M").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="font-bold">{otherProfile?.display_name || otherProfile?.username || "MoNo"}</div>
          <div className="text-xs text-green-500">online</div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-4 pb-32 md:px-6">
        {messages.map((m: any) => {
          const mine = m.sender_id === user?.id;
          return (
            <div
              key={m.id}
              className={`mb-4 flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`rounded-3xl px-4 py-3 text-sm shadow-md ${
                    mine
                      ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white"
                      : "bg-white text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
                <span className="mt-1 px-2 text-[10px] text-gray-400">
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* INPUT BAR */}
      <div className="fixed bottom-16 left-0 right-0 border-t bg-white/95 px-3 py-3 backdrop-blur-xl md:static md:bottom-0 md:px-5">
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-pink-50 p-3">
            <ImagePlus className="h-5 w-5 text-pink-500" />
          </button>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Send message..."
            className="flex-1 rounded-full bg-gray-100 px-5 py-3 text-sm outline-none"
          />

          <button
            onClick={submit}
            className="rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-3 text-white shadow-lg"
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}