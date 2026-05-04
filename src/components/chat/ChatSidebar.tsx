import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationWithMeta } from "@/types/chat";
import { MessageCircle, Search, PenSquare, LogOut, Shield, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { NewChatDialog } from "./NewChatDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ChatSidebar = () => {
    const { conversations, loading } = useConversations();
    const { user, signOut } = useAuth();
    const isAdmin = useIsAdmin();
    const navigate = useNavigate();
    const { id: activeId } = useParams();
    const [query, setQuery] = useState("");
    const [newOpen, setNewOpen] = useState(false);

    const labelFor = (c: ConversationWithMeta) => {
        if (c.type === "group") return c.name || "Group";
        const other = c.participants.find((p) => p.id !== user?.id);
        return other?.display_name || other?.username || "Direct message";
    };

    const filtered = conversations.filter((c) =>
        labelFor(c).toLowerCase().includes(query.toLowerCase())
    );

    return (<aside className="flex h-full w-full flex-col border-r border-gray-200 bg-white/90 backdrop-blur-xl md:w-80 lg:w-96"> <div className="flex items-center justify-between px-5 pt-5 pb-4"> <div className="flex items-center gap-3"> <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg"> <MessageCircle className="h-5 w-5" /> </div> <h1 className="text-xl font-bold tracking-tight text-gray-800">MoNu</h1> </div>

        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setNewOpen(true)}
                className="rounded-full hover:bg-pink-50"
            >
                <PenSquare className="h-4 w-4 text-gray-700" />
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button>
                        <UserAvatar
                            profile={
                                user
                                    ? {
                                        avatar_url: null,
                                        display_name: user.email ?? "Me",
                                        username: "me",
                                        is_online: true,
                                    }
                                    : null
                            }
                            size="sm"
                        />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                        <Settings className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                            <Shield className="mr-2 h-4 w-4" /> Admin
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>

        <div className="px-4 pb-4">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search messages"
                    className="h-11 rounded-full border-0 bg-gray-100 pl-10 shadow-inner focus-visible:ring-pink-400"
                />
            </div>
        </div>

        <ScrollArea className="flex-1 px-2">
            {loading ? (
                <div className="space-y-3 p-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-2xl p-3">
                            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-400">No conversations yet</p>
                    <Button
                        onClick={() => setNewOpen(true)}
                        className="mt-4 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white"
                    >
                        Start Chat
                    </Button>
                </div>
            ) : (
                <ul className="space-y-2 pb-4">
                    {filtered.map((c) => {
                        const isActive = c.id === activeId;
                        const other =
                            c.type === "direct"
                                ? c.participants.find((p) => p.id !== user?.id)
                                : null;

                        const preview =
                            c.last_message?.content ??
                            (c.last_message?.message_type === "image"
                                ? "📷 Photo"
                                : c.last_message?.message_type === "file"
                                    ? "📎 File"
                                    : "No messages yet");

                        return (
                            <li key={c.id}>
                                <button
                                    onClick={() => navigate(`/chat/${c.id}`)}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-300",
                                        isActive
                                            ? "bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 shadow-md"
                                            : "hover:bg-gray-50"
                                    )}
                                >
                                    <UserAvatar
                                        profile={
                                            c.type === "direct"
                                                ? other ?? null
                                                : {
                                                    avatar_url: c.avatar_url,
                                                    display_name: c.name,
                                                    username: c.name ?? "g",
                                                    is_online: false,
                                                }
                                        }
                                        size="lg"
                                        showStatus={c.type === "direct"}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="truncate text-sm font-semibold text-gray-800">
                                                {labelFor(c)}
                                            </span>

                                            {c.last_message && (
                                                <span className="text-[11px] text-gray-400">
                                                    {formatDistanceToNowStrict(new Date(c.last_message.created_at))}
                                                </span>
                                            )}
                                        </div>

                                        <p className="truncate text-xs text-gray-500">{preview}</p>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </ScrollArea>

        <NewChatDialog open={newOpen} onOpenChange={setNewOpen} />
    </aside>

    );
};
