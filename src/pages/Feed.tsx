import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
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

    const senderIds = [...new Set((msgs ?? []).map((m: any) => m.sender_id))];

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
    <div className="min-h-screen bg-white pb-20">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/90 px-4 py-4 backdrop-blur-xl">
        <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
          MoNo
        </h1>
        <Send className="h-6 w-6 text-gray-700" />
      </header>

      {/* STORIES MOCK */}
      <div className="flex gap-4 overflow-x-auto border-b px-4 py-4">
        {["M", "A", "R", "S", "K"].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white font-bold">
                {s}
              </div>
            </div>
            <span className="text-xs text-gray-500">story</span>
          </div>
        ))}
      </div>

      {/* POSTS */}
      <div className="mx-auto max-w-xl">
        {posts.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No posts yet</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="mb-8 bg-white">
              
              {/* USER */}
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 font-bold text-white">
                  {post.user.slice(0, 1).toUpperCase()}
                </div>
                <span className="font-semibold">{post.user}</span>
              </div>

              {/* IMAGE */}
              <img
                src={post.image}
                className="w-full max-h-[520px] object-cover"
              />

              {/* ACTIONS */}
              <div className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <button onClick={() => doLike(post.id)}>
                      <Heart
                        className={`h-7 w-7 ${
                          post.liked ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </button>

                    <button onClick={() => setCommentPost(post.id)}>
                      <MessageCircle className="h-7 w-7" />
                    </button>

                    <Send className="h-6 w-6" />
                  </div>

                  <Bookmark className="h-6 w-6" />
                </div>

                <p className="mb-1 text-sm font-bold">{post.likes} likes</p>
                <p className="text-sm">
                  <span className="font-semibold mr-2">{post.user}</span>
                  {post.caption}
                </p>
              </div>

              <CommentModal
                postId={post.id}
                open={commentPost === post.id}
                onClose={() => setCommentPost(null)}
              />
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Feed;