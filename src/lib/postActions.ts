import { supabase } from "@/integrations/supabase/client";

export const getLikeCount = async (postId: string) => {
    const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

    return count || 0;
};

export const hasLiked = async (postId: string, userId: string) => {
    const { data } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

    return !!data;
};

export const toggleLike = async (postId: string, userId: string) => {
    const liked = await hasLiked(postId, userId);

    if (liked) {
        await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId);
        return false;
    } else {
        await supabase
            .from("post_likes")
            .insert({ post_id: postId, user_id: userId });
        return true;
    }
};

export const getComments = async (postId: string) => {
    const { data } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    return data || [];
};

export const addComment = async (postId: string, userId: string, comment: string) => {
    await supabase
        .from("post_comments")
        .insert({ post_id: postId, user_id: userId, comment });
};