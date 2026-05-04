import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { useParams, useNavigate } from "react-router-dom";
import {
    getFollowersCount,
    getFollowingCount,
    isFollowing,
    toggleFollow,
    uploadAvatar,
    createDirectChat,
} from "@/lib/socialSystem";
import { toast } from "sonner";

type MyPost = {
    id: string;
    image: string;
};

const Profile = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    const profileId = id || user?.id;
    const isMine = !id || id === user?.id;

    const [posts, setPosts] = useState<MyPost[]>([]);
    const [username, setUsername] = useState("user");
    const [displayName, setDisplayName] = useState("user");
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState("");
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [followed, setFollowed] = useState(false);

    const loadProfile = async () => {
        if (!profileId) return;

        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", profileId)
            .single();

        if (profile) {
            setUsername(profile.username || "user");
            setDisplayName(profile.display_name || "user");
            setBio(profile.bio || "");
            setAvatar(profile.avatar_url || "");
        }

        const { data: msgs } = await supabase
            .from("messages")
            .select("*")
            .eq("sender_id", profileId)
            .eq("message_type", "image")
            .order("created_at", { ascending: false });

        setPosts((msgs || []).map((m) => ({
            id: m.id,
            image: m.attachment_url || "",
        })));

        setFollowers(await getFollowersCount(profileId));
        setFollowing(await getFollowingCount(profileId));

        if (user && !isMine) {
            setFollowed(await isFollowing(user.id, profileId));
        }
    };

    useEffect(() => {
        loadProfile();
    }, [profileId]);

    const saveProfile = async () => {
        if (!user || !isMine) return;

        const { error } = await supabase
            .from("profiles")
            .update({
                username,
                display_name: displayName,
                bio,
                avatar_url: avatar,
            })
            .eq("id", user.id);

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Profile updated");
        loadProfile();
    };

    const uploadNewAvatar = async (e: any) => {
        if (!user) return;
        const file = e.target.files?.[0];
        if (!file) return;

        const url = await uploadAvatar(user.id, file);
        setAvatar(url);
    };

    const handleFollow = async () => {
        if (!user || !profileId) return;

        const state = await toggleFollow(user.id, profileId);
        setFollowed(state);
        loadProfile();
    };

    const handleMessage = async () => {
        if (!profileId) return;
        const cid = await createDirectChat(profileId);
        navigate(`/chat/${cid}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 pb-24">
            <div className="mx-auto max-w-4xl px-4 py-8">

                <div className="rounded-3xl bg-white p-8 shadow-xl">
                    <div className="flex flex-col gap-8 md:flex-row">

                        <div className="flex flex-col items-center">
                            <label className="cursor-pointer">
                                {avatar ? (
                                    <img src={avatar} className="h-32 w-32 rounded-full object-cover ring-4 ring-pink-400" />
                                ) : (
                                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-4xl font-bold text-white">
                                        {username.slice(0, 2).toUpperCase()}
                                    </div>
                                )}

                                {isMine && (
                                    <input hidden type="file" accept="image/*" onChange={uploadNewAvatar} />
                                )}
                            </label>
                        </div>

                        <div className="flex-1">
                            {isMine ? (
                                <>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="mb-3 w-full rounded-2xl border p-3"
                                        placeholder="username"
                                    />

                                    <input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="mb-3 w-full rounded-2xl border p-3"
                                        placeholder="display name"
                                    />

                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="mb-4 h-24 w-full rounded-2xl border p-3"
                                        placeholder="bio..."
                                    />

                                    <button
                                        onClick={saveProfile}
                                        className="rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 px-8 py-3 font-semibold text-white"
                                    >
                                        Save Profile
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold">{displayName}</h1>
                                    <p className="text-gray-500">@{username}</p>
                                    <p className="mt-3">{bio}</p>

                                    <div className="mt-5 flex gap-4">
                                        <button
                                            onClick={handleFollow}
                                            className="rounded-full bg-pink-500 px-6 py-2 font-semibold text-white"
                                        >
                                            {followed ? "Unfollow" : "Follow"}
                                        </button>

                                        <button
                                            onClick={handleMessage}
                                            className="rounded-full border px-6 py-2 font-semibold"
                                        >
                                            Message
                                        </button>
                                    </div>
                                </>
                            )}

                            <div className="mt-8 flex gap-10">
                                <div>
                                    <div className="text-2xl font-bold">{posts.length}</div>
                                    <div className="text-gray-500">Posts</div>
                                </div>

                                <div>
                                    <div className="text-2xl font-bold">{followers}</div>
                                    <div className="text-gray-500">Followers</div>
                                </div>

                                <div>
                                    <div className="text-2xl font-bold">{following}</div>
                                    <div className="text-gray-500">Following</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="mb-4 mt-10 text-2xl font-bold">Posts</h2>

                {posts.length === 0 ? (
                    <div className="rounded-3xl bg-white py-24 text-center text-gray-400 shadow">
                        No posts uploaded
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        {posts.map((post) => (
                            <img
                                key={post.id}
                                src={post.image}
                                className="h-64 w-full rounded-3xl object-cover shadow-lg"
                            />
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default Profile;