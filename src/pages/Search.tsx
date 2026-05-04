import { useState } from "react";
import { searchUsers, createDirectChat } from "@/lib/socialSystem";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { MessageCircle } from "lucide-react";

const Search = () => {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const navigate = useNavigate();

    const doSearch = async (v: string) => {
        setQuery(v);
        const data = await searchUsers(v);
        setUsers(data);
    };

    const startChat = async (uid: string) => {
        const cid = await createDirectChat(uid);
        navigate(`/chat/${cid}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 pb-24">
            <div className="mx-auto max-w-2xl px-4 py-6">
                <h1 className="mb-6 text-3xl font-bold">Search Users</h1>

                <input
                    value={query}
                    onChange={(e) => doSearch(e.target.value)}
                    placeholder="Search any username..."
                    className="w-full rounded-2xl border bg-white p-4 shadow outline-none"
                />

                <div className="mt-8 space-y-4">
                    {users.map((u) => (
                        <div
                            key={u.id}
                            className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-lg"
                        >
                            <div
                                onClick={() => navigate(`/user/${u.id}`)}
                                className="flex cursor-pointer items-center gap-4"
                            >
                                {u.avatar_url ? (
                                    <img src={u.avatar_url} className="h-14 w-14 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-lg font-bold text-white">
                                        {(u.username || "U").slice(0, 2).toUpperCase()}
                                    </div>
                                )}

                                <div>
                                    <div className="font-bold">{u.display_name || u.username}</div>
                                    <div className="text-sm text-gray-500">@{u.username}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => startChat(u.id)}
                                className="rounded-full bg-pink-500 p-3 text-white"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Search;