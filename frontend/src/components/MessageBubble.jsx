import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit2, Trash2, Reply, Star, Forward } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import DeleteMessageModal from "./DeleteMessageModal";
import ForwardModal from "./ForwardModal";
import toast from "react-hot-toast";

const FIFTEEN_MINUTES = 15 * 60 * 1000; // 15 minutes in milliseconds

function MessageBubble({ message }) {
  const { authUser } = useAuthStore();
  const { deleteMessage, editMessage, setReplyTo, toggleStarMessage } = useChatStore();
  
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  
  const menuRef = useRef(null);
  const longPressTimer = useRef(null);
  
  const isOwnMessage = message.senderId === authUser._id;
  const isDeleted = message.isDeleted;
  // Enhanced check: Ensure replyTo has valid data, not just an empty object
  const hasReply = message.replyTo && message.replyTo.messageId && message.replyTo.senderName;
  const isStarred = message.isStarred || false;
  
  // Check if message can be edited (within 15 minutes)
  const canEdit = isOwnMessage && !isDeleted && (Date.now() - new Date(message.createdAt).getTime()) < FIFTEEN_MINUTES;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Handle long press for mobile
  const handleTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = async (deleteForEveryone) => {
    try {
      await deleteMessage(message._id, deleteForEveryone);
      setShowDeleteModal(false);
      toast.success(deleteForEveryone ? "Message deleted for everyone" : "Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      await editMessage(message._id, editText);
      setIsEditing(false);
      toast.success("Message edited");
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  const handleCancelEdit = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  if (isDeleted) {
    return (
      <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`px-4 py-2 rounded-lg ${isOwnMessage ? "bg-cyan-100 dark:bg-cyan-900/30" : "bg-slate-100 dark:bg-slate-800/30"}`}>
          <p className="text-sm italic opacity-60">🚫 This message was deleted</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4 relative group`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`max-w-[75%] md:max-w-[65%] px-4 py-2.5 rounded-2xl relative ${
          isOwnMessage
            ? "bg-cyan-500 text-white rounded-br-md"
            : "bg-[#FFFFFF] dark:bg-slate-800 text-[#111111] dark:text-slate-200 rounded-bl-md border border-[#E9EDEF] dark:border-slate-700"
        }`}
      >
        {/* Three-dot menu button - shows on hover for ALL messages (sent and received) */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-full p-1 hover:bg-slate-700 z-10"
          aria-label="Message options"
        >
          <MoreVertical size={16} className="text-white" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute top-8 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-20 min-w-[180px]"
          >
            {/* Reply */}
            <button
              onClick={() => {
                console.log("Reply clicked for message:", message);
                setReplyTo({
                  messageId: message._id,
                  senderId: message.senderId,
                  senderName: isOwnMessage ? "You" : (message.senderName || "Contact"),
                  text: message.text || "", // Full text, not truncated
                  hasImage: !!message.image,
                  image: message.image || null, // Include image URL if exists
                });
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3"
            >
              <Reply size={16} />
              <span>Reply</span>
            </button>

            {/* Edit - only if can edit */}
            {canEdit && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3"
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
            )}

            {/* Forward */}
            <button
              onClick={() => {
                setShowMenu(false);
                setShowForwardModal(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3"
            >
              <Forward size={16} />
              <span>Forward</span>
            </button>

            {/* Star */}
            <button
              onClick={async () => {
                await toggleStarMessage(message._id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3"
            >
              <Star size={16} fill={isStarred ? "currentColor" : "none"} />
              <span>{isStarred ? "Unstar" : "Star"}</span>
            </button>

            {/* Delete */}
            <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
              >
                <Trash2 size={16} />
                <span>Delete for Everyone</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3"
              >
                <Trash2 size={16} />
                <span>Delete for Me</span>
              </button>
            </div>
          </div>
        )}

        {/* Edit mode */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 rounded bg-white/10 border border-white/20 text-inherit resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
              maxLength={2000}
              rows={3}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="opacity-75">{editText.length}/2000</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Quoted reply block */}
            {hasReply && (
              <div className={`mb-2 p-2 rounded border-l-2 ${
                isOwnMessage 
                  ? "bg-white/10 border-white/50" 
                  : "bg-black/20 border-slate-500"
              }`}>
                <p className={`text-xs font-semibold mb-0.5 ${
                  isOwnMessage ? "text-cyan-200" : "text-slate-400"
                }`}>
                  {message.replyTo.senderName}
                </p>
                <p className="text-xs opacity-75">
                  {message.replyTo.hasImage && message.replyTo.image ? (
                    <span className="italic">📷 Photo</span>
                  ) : (
                    message.replyTo.text || <span className="italic">📷 Photo</span>
                  )}
                </p>
              </div>
            )}

            {/* Message content */}
            {message.image && (
              <img
                src={message.image}
                alt="Shared"
                className="rounded-lg h-48 object-cover"
              />
            )}
            
            {/* Forwarded label */}
            {message.isForwarded && (
              <p className={`text-xs italic mb-1 ${isOwnMessage ? "text-cyan-200" : "text-slate-400"}`}>
                ↪️ Forwarded
              </p>
            )}
            
            {message.text && <p className="mt-2">{message.text}</p>}
            
            {/* Timestamp and edit label */}
            <p className="text-xs mt-1 opacity-75 flex items-center gap-1 justify-end">
              {new Date(message.createdAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {message.editedAt && (
                <span className="italic">(edited)</span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteMessageModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
        isOwnMessage={isOwnMessage}
      />

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        messageToForward={message}
      />
    </div>
  );
}

export default MessageBubble;
