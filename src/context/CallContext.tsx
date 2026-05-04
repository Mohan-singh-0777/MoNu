import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Profile } from "@/types/chat";
import { CallType } from "@/hooks/useWebRTC";
import { CallDialog } from "@/components/call/CallDialog";
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { toast } from "sonner";

type ActiveCall = {
  callId: string;
  peer: Profile;
  isCaller: boolean;
  callType: CallType;
  ringing: boolean;
};

type IncomingCall = {
  callId: string;
  caller: Profile;
  callType: CallType;
};

type CallCtx = {
  startCall: (peer: Profile, conversationId: string, callType: CallType) => Promise<void>;
};

const Ctx = createContext<CallCtx>({ startCall: async () => {} });

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [active, setActive] = useState<ActiveCall | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`incoming-calls-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${user.id}` },
        async (payload: any) => {
          const call = payload.new;
          if (call.status !== "ringing") return;
          // Fetch caller profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", call.caller_id)
            .single();
          if (!profile) return;
          setIncoming({
            callId: call.id,
            caller: profile as Profile,
            callType: call.call_type as CallType,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls", filter: `callee_id=eq.${user.id}` },
        (payload: any) => {
          // If caller cancels, dismiss incoming dialog
          if (incoming && payload.new.id === incoming.callId &&
              ["ended", "declined", "missed"].includes(payload.new.status)) {
            setIncoming(null);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, incoming]);

  // Listen for caller-side acceptance to flip ringing=false
  useEffect(() => {
    if (!active || !active.isCaller || !active.ringing) return;
    const ch = supabase
      .channel(`caller-watch-${active.callId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls", filter: `id=eq.${active.callId}` },
        (payload: any) => {
          const status = payload.new.status;
          if (status === "accepted") {
            setActive((a) => (a ? { ...a, ringing: false } : a));
          } else if (["declined", "ended", "missed"].includes(status)) {
            toast.info(status === "declined" ? "Call declined" : "Call ended");
            setActive(null);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [active]);

  const startCall = useCallback(
    async (peer: Profile, conversationId: string, callType: CallType) => {
      if (!user) return;
      if (active) {
        toast.error("You are already in a call");
        return;
      }
      const { data, error } = await supabase
        .from("calls")
        .insert({
          conversation_id: conversationId,
          caller_id: user.id,
          callee_id: peer.id,
          call_type: callType,
          status: "ringing",
        })
        .select()
        .single();
      if (error || !data) {
        toast.error(error?.message ?? "Failed to start call");
        return;
      }
      setActive({
        callId: data.id,
        peer,
        isCaller: true,
        callType,
        ringing: true,
      });
    },
    [user, active]
  );

  const acceptIncoming = async () => {
    if (!incoming) return;
    await supabase
      .from("calls")
      .update({ status: "accepted", answered_at: new Date().toISOString() })
      .eq("id", incoming.callId);
    setActive({
      callId: incoming.callId,
      peer: incoming.caller,
      isCaller: false,
      callType: incoming.callType,
      ringing: false,
    });
    setIncoming(null);
  };

  const declineIncoming = async () => {
    if (!incoming) return;
    await supabase
      .from("calls")
      .update({ status: "declined", ended_at: new Date().toISOString() })
      .eq("id", incoming.callId);
    setIncoming(null);
  };

  return (
    <Ctx.Provider value={{ startCall }}>
      {children}
      {incoming && (
        <IncomingCallDialog
          open={!!incoming}
          caller={incoming.caller}
          callType={incoming.callType}
          onAccept={acceptIncoming}
          onDecline={declineIncoming}
        />
      )}
      {active && user && (
        <CallDialog
          open={!!active}
          callId={active.callId}
          selfId={user.id}
          peer={active.peer}
          isCaller={active.isCaller}
          callType={active.callType}
          ringing={active.ringing}
          onClose={() => setActive(null)}
        />
      )}
    </Ctx.Provider>
  );
};

export const useCall = () => useContext(Ctx);
