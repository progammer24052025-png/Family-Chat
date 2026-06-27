import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import MessageBubble from "./MessageBubble";
import ReplyBar from "./ReplyBar";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
    replyTo,
    setReplyTo,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  // Track which user's messages we last rendered for — detects the gap between
  // selecting a new user and the useEffect firing to fetch their messages.
  const lastLoadedUserIdRef = useRef(null);
  const isTransitioning = lastLoadedUserIdRef.current !== selectedUser._id;

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    markMessagesAsRead(selectedUser._id); // clear unread badge when chat is opened
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead]);

  // Update the ref once messages finish loading for the current user
  useEffect(() => {
    if (!isMessagesLoading) {
      lastLoadedUserIdRef.current = selectedUser._id;
    }
  }, [isMessagesLoading, selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
      
      <ChatHeader />
      
      <div className="flex-1 px-6 overflow-y-auto py-8 overscroll-contain relative z-10">
        {!isMessagesLoading && messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg._id} message={msg} />
            ))}
            {/* scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading || isTransitioning ? (
          // Show skeleton while loading, AND during the brief gap before isMessagesLoading is set
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      {/* Reply Bar - Sticky above input field (WhatsApp-style) */}
      {replyTo && replyTo.messageId && (
        <ReplyBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />
      )}
      
      <MessageInput />
    </div>
  );
}

export default ChatContainer;
