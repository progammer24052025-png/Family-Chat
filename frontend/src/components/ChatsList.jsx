import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { Search, X, UserCheck, MessageCircle } from "lucide-react";

function ChatsList({ onSelectChat }) {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, unreadCounts, getFriends } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [friendsList, setFriendsList] = useState([]);

  useEffect(() => {
    getMyChatPartners();
    loadFriends();
  }, [getMyChatPartners]);

  const loadFriends = async () => {
    try {
      const friends = await getFriends();
      setFriendsList(friends);
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  };

  // Get friends who don't have chats yet
  const chatUserIds = new Set(chats.map(c => c._id));
  const friendsWithoutChats = friendsList.filter(f => !chatUserIds.has(f._id));

  // Filter based on search
  const filteredChats = chats.filter((chat) =>
    chat.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFriends = friendsWithoutChats.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0 && friendsWithoutChats.length === 0) return <NoChatsFound />;

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#F6F6F6] dark:bg-slate-700/50 border border-[#E9EDEF] dark:border-slate-600 text-[#111111] dark:text-slate-200 placeholder-[#8696A0] dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Active Conversations */}
      {filteredChats.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-[#8696A0] dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
            Active Conversations
          </h3>
          <div className="space-y-2">
            {filteredChats.map((chat) => {
              const unreadCount = unreadCounts[chat._id] || 0;
              
              return (
                <div
                  key={chat._id}
                  className="bg-[#FFFFFF] dark:bg-slate-700/30 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-[#F5F6F6] dark:hover:bg-slate-700/50 transition-colors border border-[#E9EDEF] dark:border-slate-700/50"
                  onClick={() => {
                    if (onSelectChat) {
                      onSelectChat(chat);
                    } else {
                      setSelectedUser(chat);
                      useGroupStore.getState().setSelectedGroup(null);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={chat.profilePic || "/avatar.png"} 
                          alt={chat.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                        onlineUsers.includes(chat._id) ? "bg-[#3B82F6]" : "bg-[#8696A0]"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm md:text-base text-[#111111] dark:text-slate-200 font-medium truncate">{chat.fullName}</h4>
                        <UserCheck size={14} className="text-[#3B82F6] flex-shrink-0" />
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-[#3B82F6] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends Ready to Chat */}
      {filteredFriends.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#8696A0] dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
            Friends
          </h3>
          <div className="space-y-2">
            {filteredFriends.map((friend) => (
              <div
                key={friend._id}
                className="bg-[#FFFFFF] dark:bg-slate-700/30 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-[#F5F6F6] dark:hover:bg-slate-700/50 transition-colors border border-[#E9EDEF] dark:border-slate-700/50"
                onClick={() => {
                  if (onSelectChat) {
                    onSelectChat(friend);
                  } else {
                    setSelectedUser(friend);
                    useGroupStore.getState().setSelectedGroup(null);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={friend.profilePic || "/avatar.png"} 
                        alt={friend.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                      onlineUsers.includes(friend._id) ? "bg-[#3B82F6]" : "bg-[#8696A0]"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm md:text-base text-[#111111] dark:text-slate-200 font-medium truncate">{friend.fullName}</h4>
                      <UserCheck size={14} className="text-[#3B82F6] flex-shrink-0" />
                    </div>
                    <p className="text-xs text-[#8696A0] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MessageCircle size={12} />
                      Ready to chat
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredChats.length === 0 && filteredFriends.length === 0 && searchQuery && (
        <div className="text-center py-8 text-[#8696A0] dark:text-slate-400">
          No conversations found
        </div>
      )}
    </>
  );
}

export default ChatsList;
