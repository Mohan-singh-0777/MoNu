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

    setPosts(
      (msgs || []).map((m: any) => ({
        id: m.id,
        image: m.attachment_url || "",
      }))
    );

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
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-2xl">
        
        {/* TOP */}
        <div className="px-5 py-8 text-center">
          <label className="cursor-pointer">
            {avatar ? (
              <img
                src={avatar}
                className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-pink-400"
              />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-3xl font-bold text-white">
                {username.slice(0, 2).toUpperCase()}
              </div>
            )}

            {isMine && (
              <input hidden type="file" accept="image/*" onChange={uploadNewAvatar} />
            )}
          </label>

          <h1 className="mt-4 text-2xl font-bold">{displayName}</h1>
          <p className="text-gray-500">@{username}</p>

          {!isMine && <p className="mt-2 text-sm">{bio}</p>}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 border-y py-4 text-center">
          <div>
            <div className="text-xl font-bold">{posts.length}</div>
            <div className="text-xs text-gray-500">Posts</div>
          </div>
          <div>
            <div className="text-xl font-bold">{followers}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div>
            <div className="text-xl font-bold">{following}</div>
            <div className="text-xs text-gray-500">Following</div>
          </div>
        </div>

        {/* BUTTONS / EDIT */}
        <div className="px-5 py-5">
          {isMine ? (
            <>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="mb-3 w-full rounded-2xl bg-gray-100 p-3"
              />

              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="display name"
                className="mb-3 w-full rounded-2xl bg-gray-100 p-3"
              />

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="bio..."
                className="mb-3 h-24 w-full rounded-2xl bg-gray-100 p-3"
              />

              <button
                onClick={saveProfile}
                className="w-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 py-3 font-semibold text-white"
              >
                Save Profile
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleFollow}
                className="flex-1 rounded-full bg-pink-500 py-3 font-semibold text-white"
              >
                {followed ? "Unfollow" : "Follow"}
              </button>

              <button
                onClick={handleMessage}
                className="flex-1 rounded-full border py-3 font-semibold"
              >
                Message
              </button>
            </div>
          )}
        </div>

        {/* POSTS GRID */}
        <div className="grid grid-cols-3 gap-[2px]">
          {posts.map((post) => (
            <img
              key={post.id}
              src={post.image}
              className="aspect-square w-full object-cover"
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;