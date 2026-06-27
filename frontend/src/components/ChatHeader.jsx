import { XIcon, ArrowLeftIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div
      className="flex justify-between items-center bg-cyan-700 dark:bg-cyan-700 border-b border-[#075E54] dark:border-slate-700 px-6 py-3 flex-shrink-0"
    >
      <div className="flex items-center space-x-3">
        {/* Back button — visible on mobile only */}
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden text-white hover:text-slate-200 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <img 
              src={selectedUser.profilePic || "/avatar.png"} 
              alt={selectedUser.fullName}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#075E54] ${
            isOnline ? "bg-[#3B82F6]" : "bg-[#8696A0]"
          }`} />
        </div>

        <div>
          <h3 className="text-white font-medium">{selectedUser.fullName}</h3>
          <p className="text-slate-300 text-sm">{isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>

      {/* Close button — desktop only (mobile uses back arrow above) */}
      <button onClick={() => setSelectedUser(null)} className="hidden md:block">
        <XIcon className="w-5 h-5 text-white hover:text-slate-200 transition-colors cursor-pointer" />
      </button>
    </div>
  );
}
export default ChatHeader;
