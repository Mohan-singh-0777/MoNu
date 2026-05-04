import { useParams } from "react-router-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ConversationView } from "@/components/chat/ConversationView";
import { MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const { id } = useParams();

  return (
    <div className="flex h-screen w-full overflow-hidden pb-20">
      <div className="flex w-[320px] border-r border-gray-200">
        <ChatSidebar />
      </div>

      <div className="flex-1">
        {id ? (
          <ConversationView />
        ) : (
          <div className="hidden h-full items-center justify-center bg-background md:flex">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border">
                <MessageCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Your messages</h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                Send private messages and start group chats with people you know.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;