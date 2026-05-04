import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { getComments, addComment } from "@/lib/postActions";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Props = {
    postId: string;
    open: boolean;
    onClose: () => void;
};

type Cmt = {
    id: string;
    user_id: string;
    comment: string;
};

export const CommentModal = ({ postId, open, onClose }: Props) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Cmt[]>([]);
    const [profiles, setProfiles] = useState<Record<string, string>>({});
    const [text, setText] = useState("");

    const load = async () => {
        const cmts = await getComments(postId);
        setComments(cmts as any);

        const ids = [...new Set(cmts.map((c: any) => c.user_id))];

        if (ids.length) {
            const { data } = await supabase.from("profiles").select("*").in("id", ids);
            const map: Record<string, string> = {};
            (data || []).forEach((p: any) => {
                map[p.id] = p.username;
            });
            setProfiles(map);
        }
    };

    const sendComment = async () => {
        if (!text.trim() || !user) return;
        await addComment(postId, user.id, text);
        setText("");
        load();
    };

    useEffect(() => {
        if (open) load();
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/50 md:items-center">
            <div className="flex h-[75vh] w-full max-w-lg flex-col rounded-t-3xl bg-white md:rounded-3xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h2 className="font-semibold">Comments</h2>
                    <button onClick={onClose}><X /></button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {comments.length === 0 ? (
                        <div className="pt-20 text-center text-gray-400">No comments yet</div>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id}>
                                <span className="mr-2 font-semibold">{profiles[c.user_id] || "user"}</span>
                                <span className="text-gray-600">{c.comment}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center gap-2 border-t p-4">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write comment..."
                        className="flex-1 rounded-full border px-4 py-2 outline-none"
                    />
                    <button
                        onClick={sendComment}
                        className="rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-3 text-white"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};