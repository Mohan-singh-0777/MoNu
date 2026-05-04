import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Phone, PhoneOff, Video } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Profile } from "@/types/chat";
import { CallType } from "@/hooks/useWebRTC";

type Props = {
    open: boolean;
    caller: Profile | null;
    callType: CallType;
    onAccept: () => void;
    onDecline: () => void;
};

export const IncomingCallDialog = ({ open, caller, callType, onAccept, onDecline }: Props) => {
    if (!caller) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onDecline()}> <DialogContent className="max-w-sm rounded-3xl border-0 bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 p-0 text-white shadow-2xl"> <div className="flex flex-col items-center gap-5 px-8 py-10 text-center"> <div className="text-xs uppercase tracking-[3px] text-white/80">
            Incoming {callType} call </div>

            <div className="rounded-full p-2 ring-4 ring-white/30 animate-pulse">
                <UserAvatar profile={caller} size="xl" />
            </div>

            <div className="text-2xl font-bold">
                {caller.display_name || caller.username}
            </div>

            <div className="text-sm text-white/80">@{caller.username}</div>

            <div className="mt-5 flex w-full items-center justify-around">
                <button onClick={onDecline} className="flex flex-col items-center gap-2">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-xl">
                        <PhoneOff className="h-7 w-7" />
                    </span>
                    <span className="text-xs">Decline</span>
                </button>

                <button onClick={onAccept} className="flex flex-col items-center gap-2">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-xl">
                        {callType === "video" ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
                    </span>
                    <span className="text-xs">Accept</span>
                </button>
            </div>
        </div>
        </DialogContent>
        </Dialog>

    );
};
