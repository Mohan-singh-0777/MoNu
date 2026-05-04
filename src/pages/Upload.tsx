import { ImagePlus, Film } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { getGlobalFeedConversation } from "@/lib/socialFeed";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { uploadReelVideo } from "@/lib/socialSystem";

const Upload = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState<"post" | "reel">("post");
    const [preview, setPreview] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);

    const shareContent = async () => {
        if (!file || !user) return toast.error("Select file first");

        setLoading(true);

        try {
            if (mode === "post") {
                const ext = file.name.split(".").pop() || "jpg";
                const path = `${user.id}/post-${Date.now()}.${ext}`;

                const { error: upErr } = await supabase.storage
                    .from("chat-attachments")
                    .upload(path, file, { upsert: true });

                if (upErr) throw upErr;

                const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);
                const feedId = await getGlobalFeedConversation();

                await supabase.from("messages").insert({
                    conversation_id: feedId,
                    sender_id: user.id,
                    content: caption,
                    attachment_url: pub.publicUrl,
                    attachment_name: file.name,
                    message_type: "image",
                });

                toast.success("Post shared");
                navigate("/");
            } else {
                await uploadReelVideo(user.id, file, caption);
                toast.success("Reel uploaded");
                navigate("/reels");
            }
        } catch (e: any) {
            toast.error(e.message);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 p-6 pb-24">
            <h1 className="mb-8 text-center text-2xl font-bold">
                {mode === "post" ? "Create Post" : "Upload Reel"}
            </h1>

            <div className="mb-6 flex justify-center gap-4">
                <button
                    onClick={() => { setMode("post"); setPreview(""); setFile(null); }}
                    className={`rounded-full px-5 py-2 ${mode === "post" ? "bg-pink-500 text-white" : "bg-white"}`}
                >
                    <ImagePlus className="inline h-4 w-4 mr-2" />
                    Post
                </button>

                <button
                    onClick={() => { setMode("reel"); setPreview(""); setFile(null); }}
                    className={`rounded-full px-5 py-2 ${mode === "reel" ? "bg-purple-500 text-white" : "bg-white"}`}
                >
                    <Film className="inline h-4 w-4 mr-2" />
                    Reel
                </button>
            </div>

            <label className="mx-auto flex h-72 max-w-lg cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-pink-300 bg-white shadow-lg overflow-hidden">
                {preview ? (
                    mode === "post" ? (
                        <img src={preview} className="h-full w-full object-cover" />
                    ) : (
                        <video src={preview} className="h-full w-full object-cover" controls />
                    )
                ) : (
                    <>
                        {mode === "post" ? <ImagePlus className="mb-3 h-10 w-10 text-pink-500" /> : <Film className="mb-3 h-10 w-10 text-purple-500" />}
                        <p className="text-gray-500">{mode === "post" ? "Upload Photo" : "Upload Reel Video"}</p>
                    </>
                )}

                <input
                    hidden
                    type="file"
                    accept={mode === "post" ? "image/*" : "video/*"}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setFile(f);
                        setPreview(URL.createObjectURL(f));
                    }}
                />
            </label>

            <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="mt-6 h-28 w-full rounded-3xl bg-white p-4 shadow-md outline-none"
            />

            <button
                onClick={shareContent}
                disabled={loading}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 py-3 font-semibold text-white shadow-lg"
            >
                {loading ? "Uploading..." : mode === "post" ? "Share Post" : "Upload Reel"}
            </button>

            <BottomNav />
        </div>
    );
};

export default Upload;