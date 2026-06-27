import { useState, useEffect } from "react";
import { X, Search, Send, ArrowLeft } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

function ForwardModal({ isOpen, onClose, messageToForward }) {
  const { forwardMessage, getFriends } = useChatStore();
  const { authUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    setIsLoading(true);
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !messageToForward) return null;

  console.log("ForwardModal - friends:", friends);

  // Filter friends based on search
  const filteredFriends = friends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("ForwardModal - filteredFriends:", filteredFriends);

  const toggleContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleForward = async () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one friend");
      return;
    }

    setIsForwarding(true);
    try {
      await forwardMessage(messageToForward._id, selectedContacts);
      toast.success(`Message forwarded to ${selectedContacts.length} friend(s)`);
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };

  const handleClose = () => {
    setSelectedContacts([]);
    setSearchQuery("");
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              aria-label="Close"
            >
              <ArrowLeft size={20} className="text-slate-500" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Forward to
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Forwarding:</p>
          <div className="text-sm text-slate-700 dark:text-slate-200">
            {messageToForward.image && (
              <span className="italic">📷 Photo</span>
            )}
            {messageToForward.text && (
              <p className="line-clamp-2">{messageToForward.text}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border-0 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              Loading friends...
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {friends.length === 0 
                ? "No friends yet. Add friends from Contacts tab." 
                : "No friends found"}
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isSelected = selectedContacts.includes(friend._id);
              return (
                <button
                  key={friend._id}
                  onClick={() => toggleContact(friend._id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 ${
                    isSelected ? "bg-cyan-50 dark:bg-cyan-900/20" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "bg-cyan-500 border-cyan-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="avatar flex-shrink-0">
                    <div className="w-10 h-10 rounded-full">
                      <img
                        src={friend.profilePic || "/avatar.png"}
                        alt={friend.fullName}
                        className="size-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-left text-sm font-medium text-slate-900 dark:text-white truncate">
                    {friend.fullName}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer with Forward Button */}
        {selectedContacts.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={handleForward}
              disabled={isForwarding}
              className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {isForwarding ? "Forwarding..." : `Forward to ${selectedContacts.length} chat(s)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForwardModal;
