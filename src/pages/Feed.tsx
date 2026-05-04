import { Heart, MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalFeedConversation } from "@/lib/socialFeed";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { getLikeCount, hasLiked, toggleLike } from "@/lib/postActions";
import { CommentModal } from "@/components/CommentModal";

type FeedPost = {
    id: string;
    user: string;
    image: string;
    caption: string;
    likes: number;
    liked: boolean;
};

const Feed = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [commentPost, setCommentPost] = useState<string | null>(null);

    const loadPosts = async () => {
        const feedId = await getGlobalFeedConversation();

        const { data: msgs } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", feedId)
            .eq("message_type", "image")
            .order("created_at", { ascending: false });

        const senderIds = [...new Set((msgs ?? []).map((m) => m.sender_id))];

        const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", senderIds);

        const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));

        const finalPosts: FeedPost[] = await Promise.all(
            (msgs ?? []).map(async (m: any) => ({
                id: m.id,
                user: map.get(m.sender_id)?.username || "user",
                image: m.attachment_url || "",
                caption: m.content || "",
                likes: await getLikeCount(m.id),
                liked: user ? await hasLiked(m.id, user.id) : false,
            }))
        );

        setPosts(finalPosts);
    };

    const doLike = async (postId: string) => {
        if (!user) return;
        await toggleLike(postId, user.id);
        loadPosts();
    };

    useEffect(() => {
        loadPosts();
    }, [user]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 pb-24">
            <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/80 px-5 py-4 backdrop-blur-xl">
                <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
                    Pulse
                </h1>
                <Send className="h-5 w-5 text-gray-700" />
            </header>

            <div className="mx-auto max-w-xl space-y-8 px-4 py-6">
                {posts.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">No posts yet</div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="overflow-hidden rounded-3xl bg-white shadow-lg">
                            <div className="flex items-center gap-3 px-4 py-4">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
                                <span className="font-semibold text-gray-800">{post.user}</span>
                            </div>

                            <img src={post.image} className="h-[420px] w-full object-cover" />

                            <div className="px-4 py-4">
                                <div className="mb-2 flex items-center gap-5">
                                    <button onClick={() => doLike(post.id)}>
                                        <Heart
                                            className={`h-6 w-6 ${post.liked ? "fill-red-500 text-red-500" : ""}`}
                                        />
                                    </button>

                                    <button onClick={() => setCommentPost(post.id)}>
                                        <MessageCircle className="h-6 w-6" />
                                    </button>
                                </div>

                                <p className="mb-1 text-sm font-semibold">{post.likes} likes</p>
                                <p className="text-sm font-medium">{post.user}</p>
                                <p className="text-sm text-gray-600">{post.caption}</p>

                                <CommentModal
                                    postId={post.id}
                                    open={commentPost === post.id}
                                    onClose={() => setCommentPost(null)}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default Feed;