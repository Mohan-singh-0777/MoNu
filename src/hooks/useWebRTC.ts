import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export type CallType = "audio" | "video";

type Args = {
  callId: string | null;
  selfId: string;
  peerId: string;
  isCaller: boolean;
  callType: CallType;
  onEnd: () => void;
};

/** Manages a single 1:1 WebRTC peer connection using Supabase as signaling. */
export function useWebRTC({ callId, selfId, peerId, isCaller, callType, onEnd }: Args) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(callType === "audio");
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const remoteSet = useRef(false);

  const sendSignal = useCallback(
    async (signal_type: string, payload: any) => {
      if (!callId) return;
      await supabase.from("call_signals").insert({
        call_id: callId,
        from_user: selfId,
        to_user: peerId,
        signal_type,
        payload,
      });
    },
    [callId, selfId, peerId]
  );

  // Initialize peer connection + media
  useEffect(() => {
    if (!callId) return;
    let cancelled = false;

    const init = async () => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      const remote = new MediaStream();
      setRemoteStream(remote);

      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((t) => remote.addTrack(t));
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) sendSignal("ice", e.candidate.toJSON());
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setConnected(true);
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          // let UI decide; don't auto-end on transient disconnect
        }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      } catch (err) {
        console.error("getUserMedia failed", err);
        onEnd();
        return;
      }

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal("offer", offer);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  // Subscribe to incoming signals
  useEffect(() => {
    if (!callId) return;
    const channel = supabase
      .channel(`call-signals-${callId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_signals", filter: `call_id=eq.${callId}` },
        async (payload: any) => {
          const sig = payload.new;
          if (sig.to_user !== selfId) return;
          const pc = pcRef.current;
          if (!pc) return;

          if (sig.signal_type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
            remoteSet.current = true;
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal("answer", answer);
            for (const ice of pendingIce.current) {
              await pc.addIceCandidate(new RTCIceCandidate(ice));
            }
            pendingIce.current = [];
          } else if (sig.signal_type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
            remoteSet.current = true;
            for (const ice of pendingIce.current) {
              await pc.addIceCandidate(new RTCIceCandidate(ice));
            }
            pendingIce.current = [];
          } else if (sig.signal_type === "ice") {
            if (remoteSet.current) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(sig.payload));
              } catch (e) {
                console.warn("ice add failed", e);
              }
            } else {
              pendingIce.current.push(sig.payload);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId, selfId, sendSignal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pcRef.current?.close();
      pcRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  const toggleMute = () => {
    const s = localStreamRef.current;
    if (!s) return;
    const next = !muted;
    s.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  };

  const toggleCamera = () => {
    const s = localStreamRef.current;
    if (!s) return;
    const next = !cameraOff;
    s.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCameraOff(next);
  };

  return { localStream, remoteStream, connected, muted, cameraOff, toggleMute, toggleCamera };
}
