import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { ArrowLeft, MessageSquare } from "lucide-react";

import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import GroupsList from "../components/GroupsList";
import ChatContainer from "../components/ChatContainer";
import GroupContainer from "../components/GroupContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import StarredMessagesView from "../components/StarredMessagesView";

function ChatPage() {
  const { activeTab, selectedUser, showStarredMessages, setSelectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // Either a 1:1 chat or a group is open (mutual exclusion handled in child components)
  const isRightPanelOpen = selectedUser || selectedGroup;

  // Handle selecting a chat on mobile
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowMobileSidebar(false);
  };

  // Handle going back to contacts on mobile
  const handleBackToContacts = () => {
    setSelectedUser(null);
    useGroupStore.getState().setSelectedGroup(null);
    setShowMobileSidebar(true);
  };

  return (
    <div className="w-full h-screen bg-[#ECE5DD] dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* Mobile Header - Only visible when sidebar is shown */}
      <div className="md:hidden bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800 dark:from-cyan-700 dark:via-cyan-800 dark:to-cyan-900 border-b border-cyan-500/30 dark:border-cyan-600/30 px-5 py-3.5 flex items-center gap-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-7 drop-shadow-lg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 452.387">
              <path fill-rule="nonzero" d="M276.915 436.666c-32.989-9.896-62.965-28.911-87.618-55.815 6.175.567 12.783.958 19.819 1.159 32.31.949 63.167-3.3 91.339-11.815 29.561-8.937 56.687-22.776 79.927-40.41 23.979-18.196 43.56-40.301 57.238-65.17 12.232-22.234 19.84-46.769 21.81-72.836a195.403 195.403 0 0112.994 13.486c19.513 22.316 33.012 48.301 37.715 75.028 4.856 27.594.457 55.851-16.114 81.723-5.048 7.88-11.248 15.52-18.686 22.824l8.165 49.068a15.502 15.502 0 01-.8 8.562c-3.132 8.017-12.171 11.976-20.188 8.844l-55.504-21.826c-44.846 17.676-89.637 19.315-130.097 7.178z"/>
              <path fill="#D8F0F0" d="M212.522 382.09c51.415 47.307 122.9 61.072 194.383 30.61l61.283 24.098-9.593-57.651c57.022-49.859 43.787-119.134-1.727-167.884-3.555 18.854-10.111 36.745-19.248 53.352-13.678 24.869-33.259 46.974-57.238 65.17-23.24 17.634-50.366 31.473-79.927 40.41-27.181 8.215-56.861 12.459-87.933 11.895z"/>
              <path fill-rule="nonzero" d="M369.951 55.167c38.685 33.165 61.879 78.348 60.427 127.704l-.004.172c-1.516 49.407-27.413 93.189-68.065 124.036-39.713 30.136-93.646 47.911-152.383 46.183-15.058-.442-29.669-1.977-43.59-4.684-11.877-2.308-23.389-5.475-34.399-9.545L25.552 371.527l31.949-75.984c-17.241-15.38-31.223-33.198-41.066-52.706C5.175 220.521-.707 196.009.068 170.392 1.561 120.96 27.462 77.156 68.131 46.297c85.638-64.984 220.168-61.131 301.82 8.87z"/>
              <path fill="#50A9B7" d="M220.09 15.665c110.235 3.244 197.422 77.965 194.731 166.89-2.688 88.93-94.233 158.397-204.469 155.154-27.75-.815-54.238-5.665-77.796-15.126l-79.801 24.374 23.518-55.933c-38.601-30.58-62.068-73.422-60.651-120.205 2.685-88.93 94.233-158.395 204.468-155.154z"/>
              <path fill-rule="nonzero" d="M129.631 216.936c-5.368 0-9.72-4.352-9.72-9.72s4.352-9.72 9.72-9.72H249.43c5.368 0 9.72 4.352 9.72 9.72s-4.352 9.72-9.72 9.72H129.631zm0-68.927c-5.368 0-9.72-4.352-9.72-9.72 0-5.367 4.352-9.719 9.72-9.719h171.178c5.368 0 9.719 4.352 9.719 9.719 0 5.368-4.351 9.72-9.719 9.72H129.631z"/>
            </svg>
            <div className="absolute -inset-1 bg-cyan-400/20 rounded-full blur-md -z-10" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold text-white tracking-wide drop-shadow-sm">Family Chat</h1>
            <p className="text-[10px] text-cyan-100/80 font-medium tracking-wider uppercase">Stay Connected</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDE - Sidebar */}
        <div 
          className={`w-full md:w-80 lg:w-96 bg-[#FFFFFF] dark:bg-slate-800 flex-col min-h-0 overflow-hidden ${
            isRightPanelOpen || showStarredMessages ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Desktop Header with Branding */}
          <div className="hidden md:flex items-center gap-3 p-6 border-b border-[#E9EDEF] dark:border-slate-700 bg-cyan-700 dark:bg-cyan-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 452.387">
              <path fill-rule="nonzero" d="M276.915 436.666c-32.989-9.896-62.965-28.911-87.618-55.815 6.175.567 12.783.958 19.819 1.159 32.31.949 63.167-3.3 91.339-11.815 29.561-8.937 56.687-22.776 79.927-40.41 23.979-18.196 43.56-40.301 57.238-65.17 12.232-22.234 19.84-46.769 21.81-72.836a195.403 195.403 0 0112.994 13.486c19.513 22.316 33.012 48.301 37.715 75.028 4.856 27.594.457 55.851-16.114 81.723-5.048 7.88-11.248 15.52-18.686 22.824l8.165 49.068a15.502 15.502 0 01-.8 8.562c-3.132 8.017-12.171 11.976-20.188 8.844l-55.504-21.826c-44.846 17.676-89.637 19.315-130.097 7.178z"/>
              <path fill="#D8F0F0" d="M212.522 382.09c51.415 47.307 122.9 61.072 194.383 30.61l61.283 24.098-9.593-57.651c57.022-49.859 43.787-119.134-1.727-167.884-3.555 18.854-10.111 36.745-19.248 53.352-13.678 24.869-33.259 46.974-57.238 65.17-23.24 17.634-50.366 31.473-79.927 40.41-27.181 8.215-56.861 12.459-87.933 11.895z"/>
              <path fill-rule="nonzero" d="M369.951 55.167c38.685 33.165 61.879 78.348 60.427 127.704l-.004.172c-1.516 49.407-27.413 93.189-68.065 124.036-39.713 30.136-93.646 47.911-152.383 46.183-15.058-.442-29.669-1.977-43.59-4.684-11.877-2.308-23.389-5.475-34.399-9.545L25.552 371.527l31.949-75.984c-17.241-15.38-31.223-33.198-41.066-52.706C5.175 220.521-.707 196.009.068 170.392 1.561 120.96 27.462 77.156 68.131 46.297c85.638-64.984 220.168-61.131 301.82 8.87z"/>
              <path fill="#50A9B7" d="M220.09 15.665c110.235 3.244 197.422 77.965 194.731 166.89-2.688 88.93-94.233 158.397-204.469 155.154-27.75-.815-54.238-5.665-77.796-15.126l-79.801 24.374 23.518-55.933c-38.601-30.58-62.068-73.422-60.651-120.205 2.685-88.93 94.233-158.395 204.468-155.154z"/>
              <path fill-rule="nonzero" d="M129.631 216.936c-5.368 0-9.72-4.352-9.72-9.72s4.352-9.72 9.72-9.72H249.43c5.368 0 9.72 4.352 9.72 9.72s-4.352 9.72-9.72 9.72H129.631zm0-68.927c-5.368 0-9.72-4.352-9.72-9.72 0-5.367 4.352-9.719 9.72-9.719h171.178c5.368 0 9.719 4.352 9.719 9.719 0 5.368-4.351 9.72-9.719 9.72H129.631z"/>
            </svg>
            <h1 className="text-xl font-bold text-white">Family Chat</h1>
          </div>
          
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain">
            {activeTab === "chats" && (
              <>
                <ChatsList onSelectChat={handleSelectUser} />
                <GroupsList />
              </>
            )}
            {activeTab === "contacts" && <ContactList onSelectContact={handleSelectUser} />}
          </div>
        </div>

        {/* RIGHT SIDE - Chat Area */}
        <div 
          className={`flex-1 flex-col bg-[#ECE5DD] dark:bg-slate-900 min-h-0 overflow-hidden ${
            isRightPanelOpen || showStarredMessages ? "flex" : "hidden md:flex"
          }`}
        >


          {showStarredMessages && <StarredMessagesView />}
          {!showStarredMessages && selectedUser && <ChatContainer />}
          {!showStarredMessages && selectedGroup && !selectedUser && <GroupContainer />}
          {!showStarredMessages && !selectedUser && !selectedGroup && <NoConversationPlaceholder />}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
