import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import GroupHeader from "./GroupHeader";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { ImageIcon, SendIcon, XIcon, RadioIcon } from "lucide-react";
import toast from "react-hot-toast";

function GroupContainer() {
  const {
    selectedGroup,
    getGroupMessages,
    groupMessages,
    isGroupMessagesLoading,
    sendGroupMessage,
    markGroupMessagesAsRead,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useGroupStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const isBroadcast = selectedGroup?.type === "broadcast";
  const isAdmin =
    selectedGroup?.admin === authUser._id ||
    selectedGroup?.admin?._id === authUser._id;
  // In broadcasts, only admin can send; in groups, all members can
  const canSend = isBroadcast ? isAdmin : true;

  useEffect(() => {
    getGroupMessages(selectedGroup._id);
    markGroupMessagesAsRead(selectedGroup._id);
    subscribeToGroupMessages();
    return () => unsubscribeFromGroupMessages();
  }, [selectedGroup, getGroupMessages, markGroupMessagesAsRead, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    sendGroupMessage({ text: text.trim(), image: imagePreview });
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col min-h-0 overflow-hidden h-full relative">
      {/* WhatsApp-style doodle background */}
      <div 
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.1] pointer-events-none"
        style={{
          backgroundImage: "url('/chat-bg.jpg')",
          backgroundSize: "400px",
          backgroundRepeat: "repeat",
        }}
      />
        
      <GroupHeader />
        
      <div className="flex-1 px-6 overflow-y-auto py-8 overscroll-contain relative z-10">
        {groupMessages.length > 0 && !isGroupMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {groupMessages.map((msg) => {
              const isOwnMessage = msg.senderId?._id === authUser._id || msg.senderId === authUser._id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
                >
                  <div className="max-w-[75%] md:max-w-[65%]">
                    {/* Sender name for group (not broadcast, not own message) */}
                    {!isBroadcast && !isOwnMessage && (
                      <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 ml-2">
                        {msg.senderId?.fullName || "Unknown"}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl relative ${
                        isOwnMessage
                          ? "bg-cyan-500 text-white rounded-br-md"
                          : "bg-[#FFFFFF] dark:bg-slate-800 text-[#111111] dark:text-slate-200 rounded-bl-md border border-[#E9EDEF] dark:border-slate-700"
                      }`}
                    >
                    {msg.image && (
                      <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                    )}
                    {msg.text && <p className="mt-2">{msg.text}</p>}
                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Reply privately button for broadcasts (non-admin, not own message) */}
                  {isBroadcast && !isOwnMessage && (
                    <div className="mt-1 ml-2">
                      <button
                        onClick={() => {
                          const admin = selectedGroup.admin;
                          useGroupStore.getState().setSelectedGroup(null);
                          useChatStore.getState().setActiveTab("chats");
                          useChatStore.getState().setSelectedUser(admin);
                        }}
                        className="text-xs text-cyan-500 hover:text-cyan-600 transition-colors"
                      >
                        ↩ Reply privately
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : isGroupMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="size-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
              <RadioIcon className="size-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              {isBroadcast ? "Broadcast: " : "Group: "}
              {selectedGroup.name}
            </h3>
            <p className="text-slate-400 text-sm max-w-md">
              {isBroadcast
                ? "Only the admin can send messages. Members can reply privately to the admin."
                : "Be the first to send a message in this group!"}
            </p>
          </div>
        )}
      </div>

      {/* Message input — only shown if user can send */}
      {canSend && (
        <div className="p-4 border-t border-slate-700/50">
          {imagePreview && (
            <div className="max-w-3xl mx-auto mb-3 flex items-center">
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                  type="button"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex space-x-4">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input flex-1"
              placeholder={isBroadcast ? "Send broadcast message..." : "Type a message..."}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${imagePreview ? "text-cyan-500" : ""}`}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!text.trim() && !imagePreview}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Broadcast non-admin notice */}
      {isBroadcast && !isAdmin && (
        <div className="p-3 border-t border-slate-700/50 text-center text-slate-400 text-sm bg-slate-800/30">
          <RadioIcon className="w-4 h-4 inline mr-1" />
          Only the admin can send messages in this broadcast. Tap "Reply privately" on a message to DM the admin.
        </div>
      )}
    </div>
  );
}

export default GroupContainer;
