import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { Search, X, UserPlus, UserCheck, Clock } from "lucide-react";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, getFriends, sendFriendRequest } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    getAllContacts();
    loadFriends();
  }, [getAllContacts]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const friendsList = await getFriends();
      setFriends(friendsList.map(f => f._id));
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Filter contacts based on search
  const filteredContacts = allContacts.filter((contact) =>
    contact.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFriend = async (userId, e) => {
    e.stopPropagation(); // Prevent opening chat
    try {
      await sendFriendRequest(userId);
      // Add to sent requests list
      setSentRequests(prev => [...prev, userId]);
      // Refresh friends list
      const friendsList = await getFriends();
      setFriends(friendsList.map(f => f._id));
    } catch (error) {
      console.error("Failed to add friend:", error);
    }
  };

  const isFriend = (userId) => friends.includes(userId);
  const hasSentRequest = (userId) => sentRequests.includes(userId);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

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
            placeholder="Search contacts..."
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

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          {searchQuery ? "No contacts found" : "No contacts available"}
        </div>
      ) : (
        filteredContacts.map((contact) => {
          const friendStatus = isFriend(contact._id);
          
          return (
            <div
              key={contact._id}
              className="bg-[#FFFFFF] dark:bg-slate-700/30 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-[#F5F6F6] dark:hover:bg-slate-700/50 transition-colors border border-[#E9EDEF] dark:border-slate-700/50"
              onClick={() => {
                if (onSelectContact) {
                  onSelectContact(contact);
                } else {
                  setSelectedUser(contact);
                  useGroupStore.getState().setSelectedGroup(null);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={contact.profilePic || "/avatar.png"} 
                        alt={contact.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                      onlineUsers.includes(contact._id) ? "bg-[#3B82F6]" : "bg-[#8696A0]"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm md:text-base text-[#111111] dark:text-slate-200 font-medium">{contact.fullName}</h4>
                    {friendStatus && (
                      <p className="text-xs text-[#3B82F6] flex items-center gap-1 mt-0.5">
                        <UserCheck size={12} />
                        Friend
                      </p>
                    )}
                    {hasSentRequest(contact._id) && (
                      <p className="text-xs text-[#8696A0] flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        Request sent
                      </p>
                    )}
                  </div>
                </div>

                {/* Add Friend Button - Only show if not friend and no request sent */}
                {!friendStatus && !hasSentRequest(contact._id) && contact._id !== authUser?._id && (
                  <button
                    onClick={(e) => handleAddFriend(contact._id, e)}
                    className="px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus size={14} />
                    Add Friend
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
export default ContactList;
