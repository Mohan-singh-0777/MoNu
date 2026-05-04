import { Heart, MessageCircle, PlusSquare, Search, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeClass = "text-pink-500";
    const normalClass = "text-gray-700";

    const isChat = location.pathname.startsWith("/chat");
    const isSearch = location.pathname.startsWith("/search") || location.pathname.startsWith("/user");

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-white/95 py-3 backdrop-blur-xl">
            <button onClick={() => navigate("/")}>
                <Heart className={`h-6 w-6 ${location.pathname === "/" ? activeClass : normalClass}`} />
            </button>

            <button onClick={() => navigate("/chat")}>
                <MessageCircle className={`h-6 w-6 ${isChat ? activeClass : normalClass}`} />
            </button>

            <button onClick={() => navigate("/upload")}>
                <PlusSquare className={`h-6 w-6 ${location.pathname === "/upload" ? activeClass : normalClass}`} />
            </button>

            <button onClick={() => navigate("/search")}>
                <Search className={`h-6 w-6 ${isSearch ? activeClass : normalClass}`} />
            </button>

            <button onClick={() => navigate("/profile")}>
                <User className={`h-6 w-6 ${location.pathname === "/profile" ? activeClass : normalClass}`} />
            </button>
        </nav>
    );
};

export default BottomNav;