import { supabase } from "@/integrations/supabase/client";

export const searchUsers = async (text: string) => {
    if (!text.trim()) return [];

    const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${text}%,display_name.ilike.%${text}%`)
        .limit(20);

    return data || [];
};

export const isFollowing = async (me: string, other: string) => {
    const { data } = await supabase
        .from("followers")
        .select("*")
        .eq("follower_id", me)
        .eq("following_id", other)
        .maybeSingle();

    return !!data;
};

export const toggleFollow = async (me: string, other: string) => {
    const { data } = await supabase
        .from("followers")
        .select("*")
        .eq("follower_id", me)
        .eq("following_id", other)
        .maybeSingle();

    if (data) {
        await supabase.from("followers").delete().eq("id", data.id);
        return false;
    } else {
        await supabase.from("followers").insert({
            follower_id: me,
            following_id: other,
        });
        return true;
    }
};

export const getFollowersCount = async (uid: string) => {
    const { count } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", uid);

    return count || 0;
};

export const getFollowingCount = async (uid: string) => {
    const { count } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", uid);

    return count || 0;
};

export const uploadAvatar = async (uid: string, file: File) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${uid}/avatar-${Date.now()}.${ext}`;

    await supabase.storage.from("avatars").upload(path, file, { upsert: true });

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase.from("profiles").update({
        avatar_url: data.publicUrl,
    }).eq("id", uid);

    return data.publicUrl;
};

export const uploadReelVideo = async (uid: string, file: File, caption: string) => {
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${uid}/reel-${Date.now()}.${ext}`;

    await supabase.storage.from("reels").upload(path, file, { upsert: true });

    const { data } = supabase.storage.from("reels").getPublicUrl(path);

    await supabase.from("reels").insert({
        user_id: uid,
        video_url: data.publicUrl,
        caption,
    });
};

export const createDirectChat = async (otherUserId: string) => {
    const { data, error } = await supabase.rpc("create_direct_conversation", {
        other_user_id: otherUserId,
    });

    if (error) throw error;

    return data;
};