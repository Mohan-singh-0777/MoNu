import { Message, Profile } from "@/types/chat";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Trash2 } from "lucide-react";

type Props = {
  message: Message;
  sender: Profile | undefined;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  isGroup: boolean;
  onDelete: (id: string) => void;
};

export const MessageBubble = ({
  message,
  sender,
  isOwn,
  showAvatar,
  showName,
  isGroup,
  onDelete,
}: Props) => {
  const isImage = message.message_type === "image" && message.attachment_url;
  const isFile = message.message_type === "file" && message.attachment_url;

  return (
    <div className={cn("flex w-full items-end gap-2 py-1", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (<div className="w-8 shrink-0">
        {showAvatar && <UserAvatar profile={sender ?? null} size="sm" />} </div>
      )}

      <div className={cn("max-w-[78%] sm:max-w-[62%] flex flex-col", isOwn ? "items-end" : "items-start")}>
        {showName && !isOwn && isGroup && (
          <span className="mb-1 ml-2 text-[11px] font-medium text-gray-400">
            {sender?.display_name || sender?.username || "Unknown"}
          </span>
        )}

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "rounded-3xl px-4 py-3 text-sm shadow-md backdrop-blur-lg",
                isOwn
                  ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-br-md"
                  : "bg-white text-gray-800 rounded-bl-md border border-gray-100",
                isImage && "p-1"
              )}
            >
              {isImage && (
                <img
                  src={message.attachment_url!}
                  alt={message.attachment_name ?? "image"}
                  className="max-h-80 rounded-2xl object-cover"
                />
              )}

              {isFile && (
                <a
                  href={message.attachment_url!}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:underline"
                >
                  📎 {message.attachment_name ?? "file"}
                </a>
              )}

              {message.content && (
                <p className={cn("whitespace-pre-wrap break-words", isImage && "px-2 pb-1 pt-2")}>
                  {message.content}
                </p>
              )}
            </div>
          </ContextMenuTrigger>

          {isOwn && (
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onDelete(message.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          )}
        </ContextMenu>

        <span className={cn("mt-1 px-2 text-[10px] text-gray-400", isOwn ? "self-end" : "self-start")}>
          {format(new Date(message.created_at), "h:mm a")}
        </span>
      </div>
    </div>

  );
};
