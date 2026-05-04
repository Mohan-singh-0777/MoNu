import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWebRTC, CallType } from "@/hooks/useWebRTC";
import { UserAvatar } from "@/components/UserAvatar";
import { Profile } from "@/types/chat";

type Props = {
    open: boolean;
    callId: string;
    selfId: string;
    peer: Profile;
    isCaller: boolean;
    callType: CallType;
    ringing: boolean;
    onClose: () => void;
};

export const CallDialog = ({ open, callId, selfId, peer, isCaller, callType, ringing, onClose }: Props) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [elapsed, setElapsed] = useState(0);

    const startRTC = !ringing || isCaller;

    const { localStream, remoteStream, connected, muted, cameraOff, toggleMute, toggleCamera } = useWebRTC({
        callId: startRTC ? callId : null,
        selfId,
        peerId: peer.id,
        isCaller,
        callType,
        onEnd: onClose,
    });

    useEffect(() => {
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream]);

    useEffect(() => {
        if (!connected) return;
        const id = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(id);
    }, [connected]);

    useEffect(() => {
        const ch = supabase
            .channel(`call-state-${callId}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls", filter: `id=eq.${callId}` }, (payload: any) => {
                const status = payload.new.status;
                if (["ended", "declined", "missed"].includes(status)) onClose();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ch);
        };

    }, [callId, onClose]);

    const endCall = async () => {
        await supabase.from("calls").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", callId);
        onClose();
    };

    const fmt = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, "0");
        const ss = (s % 60).toString().padStart(2, "0");
        return `${m}:${ss}`;
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && endCall()}> <DialogContent className="max-w-4xl rounded-3xl border-0 bg-black p-0 text-white shadow-2xl"> <div className="relative aspect-video w-full overflow-hidden">
            {callType === "video" ? (<video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
            ) : (<div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-gradient-to-br from-pink-500 via-purple-600 to-blue-700"> <UserAvatar profile={peer} size="xl" /> <div className="text-3xl font-bold">{peer.display_name || peer.username}</div> </div>
            )}

            <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-6 text-center">
                <div className="text-sm text-white/80">
                    {ringing && isCaller ? "Ringing..." : connected ? fmt(elapsed) : "Connecting..."}
                </div>
                <div className="mt-1 text-xl font-semibold">{peer.display_name || peer.username}</div>
            </div>

            {callType === "video" && (
                <div className="absolute right-4 top-4 h-36 w-28 overflow-hidden rounded-2xl border border-white/20 shadow-xl">
                    <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent p-6">
                <Button onClick={toggleMute} size="icon" className="h-12 w-12 rounded-full bg-white/20">
                    {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {callType === "video" && (
                    <Button onClick={toggleCamera} size="icon" className="h-12 w-12 rounded-full bg-white/20">
                        {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                )}

                <Button onClick={endCall} size="icon" className="h-14 w-14 rounded-full bg-red-600">
                    <PhoneOff className="h-6 w-6" />
                </Button>
            </div>
        </div>
        </DialogContent>
        </Dialog>

    );
};
