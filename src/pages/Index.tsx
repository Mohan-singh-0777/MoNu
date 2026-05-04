import { useParams, useNavigate } from "react-router-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ConversationView } from "@/components/chat/ConversationView";
import { MessageCircle, ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-pink-50 via-white to-blue-50 pb-16 md:pb-0">
      
      {/* MOBILE VIEW */}
      <div className="md:hidden h-full">
        {!id ? (
          <div className="h-full">
            <ChatSidebar />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 border-b bg-white px-4 py-4 shadow-sm">
              <button
                onClick={() => navigate("/chat")}
                className="rounded-full bg-pink-50 p-2"
              >
                <ArrowLeft className="h-5 w-5 text-pink-500" />
              </button>
              <h2 className="font-bold text-lg">MoNo Chat</h2>
            </div>

            <div className="flex-1 overflow-hidden">
              <ConversationView />
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:flex h-full w-full">
        <div className="w-[340px] border-r border-gray-200 bg-white">
          <ChatSidebar />
        </div>

        <div className="flex-1">
          {id ? (
            <ConversationView />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border">
                  <MessageCircle className="h-7 w-7 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold">Your messages</h2>
                <p className="max-w-xs text-sm text-gray-500">
                  Send private messages and start group chats.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;