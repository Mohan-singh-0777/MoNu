import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Reel = {
    id: string;
    video_url: string;
    caption: string;
    user_id: string;
    username?: string;
};

const Reels = () => {
    const [reels, setReels] = useState<Reel[]>([]);

    const loadReels = async () => {
        const { data } = await supabase
            .from("reels")
            .select("*")
            .order("created_at", { ascending: false });

        const ids = [...new Set((data ?? []).map((r) => r.user_id))];

        const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", ids);

        const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));

        const finalReels = (data ?? []).map((r: any) => ({
            ...r,
            username: map.get(r.user_id)?.username || "user",
        }));

        setReels(finalReels);
    };

    useEffect(() => {
        loadReels();
    }, []);

    return (
        <div className="h-screen snap-y snap-mandatory overflow-y-scroll bg-black">
            {reels.map((reel) => (
                <div key={reel.id} className="relative h-screen w-full snap-start">
                    <video
                        src={reel.video_url}
                        className="h-full w-full object-cover"
                        controls
                        autoPlay
                        loop
                    />

                    <div className="absolute bottom-24 left-5 text-white">
                        <div className="mb-2 text-lg font-bold">@{reel.username}</div>
                        <div className="max-w-sm text-sm">{reel.caption}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Reels;