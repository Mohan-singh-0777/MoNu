import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Send, Volume2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

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

    const ids = [...new Set((data ?? []).map((r: any) => r.user_id))];

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
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll bg-black pb-16">
      {reels.length === 0 ? (
        <div className="flex h-screen items-center justify-center text-white">
          No reels uploaded
        </div>
      ) : (
        reels.map((reel) => (
          <div key={reel.id} className="relative h-screen w-full snap-start">
            <video
              src={reel.video_url}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />

            {/* TOP TITLE */}
            <div className="absolute left-5 top-5 text-2xl font-bold text-white">
              MoNo Reels
            </div>

            {/* RIGHT ACTIONS */}
            <div className="absolute bottom-32 right-4 flex flex-col items-center gap-6 text-white">
              <button>
                <Heart className="h-8 w-8" />
              </button>
              <button>
                <MessageCircle className="h-8 w-8" />
              </button>
              <button>
                <Send className="h-8 w-8" />
              </button>
              <button>
                <Volume2 className="h-8 w-8" />
              </button>
            </div>

            {/* BOTTOM INFO */}
            <div className="absolute bottom-24 left-5 right-20 text-white">
              <div className="mb-2 text-lg font-bold">@{reel.username}</div>
              <div className="max-w-sm text-sm leading-relaxed">{reel.caption}</div>
            </div>
          </div>
        ))
      )}

      <BottomNav />
    </div>
  );
};

export default Reels;