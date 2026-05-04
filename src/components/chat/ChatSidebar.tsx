import { Search, SquarePen } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";
import { NewChatDialog } from "./NewChatDialog";
import { useState } from "react";

export function ChatSidebar() {
    const { conversations } = useConversations();
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const getTitle = (c: any) => {
        if (c.is_group) return c.name || "Group Chat";
        const other = c.participants?.find((p: any) => p.id !== user?.id);
        return other?.display_name || other?.username || "MoNo";
    };

    const getAvatar = (c: any) => {
        if (c.is_group) return "G";
        const other = c.participants?.find((p: any) => p.id !== user?.id);
        return (other?.username || "M").slice(0, 1).toUpperCase();
    };

    return (
        <>
            <div className="flex h-full w-full flex-col bg-gradient-to-br from-pink-50 via-white to-blue-50">

                {/* HEADER */}
                <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-lg font-bold text-white shadow-lg">
                            M
                        </div>
                        <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
                            MoNo
                        </h1>
                    </div>

                    <button
                        onClick={() => setOpen(true)}
                        className="rounded-full bg-white p-3 shadow-md"
                    >
                        <SquarePen className="h-5 w-5 text-pink-500" />
                    </button>
                </div>

                {/* SEARCH */}
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            placeholder="Search messages"
                            className="w-full bg-transparent text-sm outline-none"
                        />
                    </div>
                </div>

                {/* LIST */}
                <div className="flex-1 overflow-y-auto px-2 pb-24">
                    {conversations.length === 0 ? (
                        <div className="mt-20 text-center text-sm text-gray-400">
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map((c: any) => (
                            <div
                                key={c.id}
                                onClick={() => navigate(`/chat/${c.id}`)}
                                className={`mb-2 flex cursor-pointer items-center gap-3 rounded-3xl px-3 py-3 transition ${id === c.id
                                        ? "bg-white shadow-lg"
                                        : "hover:bg-white/70"
                                    }`}
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-lg font-bold text-white">
                                    {getAvatar(c)}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-semibold">{getTitle(c)}</div>
                                    <div className="truncate text-sm text-gray-500">
                                        {c.last_message?.content || "Start chatting..."}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <NewChatDialog open={open} onOpenChange={setOpen} />
        </>
    );
}