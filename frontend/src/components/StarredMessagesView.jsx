import { Star, ArrowLeft, MessageSquare } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

function StarredMessagesView() {
  const { starredMessages, showStarredMessages, setShowStarredMessages, setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  if (!showStarredMessages) return null;

  const handleBack = () => {
    setShowStarredMessages(false);
  };

  const handleNavigateToChat = (message) => {
    // Determine the other user in the conversation
    const otherUser = message.senderId._id === authUser._id 
      ? message.receiverId 
      : message.senderId;
    
    setSelectedUser(otherUser);
    setShowStarredMessages(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Back to chat"
          >
            <ArrowLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <Star size={20} className="text-yellow-500" fill="currentColor" />
            <h2 className="text-lg font-semibold text-white">Starred Messages</h2>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {starredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Star size={64} className="text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No starred messages</h3>
            <p className="text-sm text-slate-500">
              Star important messages to find them easily later
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {starredMessages.map((message) => {
              const isOwnMessage = message.senderId._id === authUser._id;
              const chatPartner = isOwnMessage ? message.receiverId : message.senderId;

              return (
                <div
                  key={message._id}
                  className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors cursor-pointer border border-slate-700"
                  onClick={() => handleNavigateToChat(message)}
                >
                  {/* Chat partner info */}
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} className="text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-400">
                      {chatPartner.fullName}
                    </span>
                  </div>

                  {/* Message content */}
                  {message.replyTo && (
                    <div className="mb-2 p-2 rounded bg-slate-700/50 border-l-2 border-slate-500">
                      <p className="text-xs font-semibold text-slate-400 mb-0.5">
                        {message.replyTo.senderName}
                      </p>
                      <p className="text-xs opacity-75">
                        {message.replyTo.hasImage ? "📷 Photo" : message.replyTo.text}
                      </p>
                    </div>
                  )}

                  {message.image && (
                    <img
                      src={message.image}
                      alt="Shared"
                      className="rounded-lg h-32 object-cover mb-2"
                    />
                  )}
                  
                  {message.text && (
                    <p className="text-sm text-slate-200">{message.text}</p>
                  )}

                  {message.isDeleted && (
                    <p className="text-sm italic opacity-60">🚫 This message was deleted</p>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(message.createdAt).toLocaleDateString()} at{" "}
                    {new Date(message.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StarredMessagesView;
