import { useState, useRef, useEffect } from "react";
import { 
  LogOutIcon, 
  VolumeOffIcon, 
  Volume2Icon, 
  Star, 
  Settings, 
  Bell, 
  Moon, 
  Sun,
  X,
  Check,
  MessageSquare,
  Users
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import CreateGroupModal from "./CreateGroupModal";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { 
    isSoundEnabled, 
    toggleSound, 
    getStarredMessages, 
    setShowStarredMessages,
    getPendingFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest
  } = useChatStore();
  
  const [selectedImg, setSelectedImg] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  
  const settingsRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load pending requests when notifications panel opens
  useEffect(() => {
    if (showNotifications) {
      loadPendingRequests();
    }
  }, [showNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
        setShowNotifications(false);
      }
    };

    if (showSettings || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings, showNotifications]);

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  const loadPendingRequests = async () => {
    try {
      const requests = await getPendingFriendRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error("Failed to load pending requests:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleStarredMessages = async () => {
    mouseClickSound.currentTime = 0;
    mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
    await getStarredMessages();
    setShowStarredMessages(true);
    setShowSettings(false);
  };

  const handleSoundToggle = () => {
    mouseClickSound.currentTime = 0;
    mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
    toggleSound();
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      // Remove from list
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (error) {
      console.error("Failed to accept request:", error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      // Remove from list
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  return (
    <div className="p-6 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="avatar online">
            <button
              className="size-14 rounded-full overflow-hidden relative group"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="User image"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div>
            <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
              {authUser.fullName}
            </h3>
            <p className="text-slate-400 text-xs">Online</p>
          </div>
        </div>

        {/* SETTINGS GEAR BUTTON */}
        <div className="relative" ref={settingsRef}>
          {/* Settings Button */}
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
            onClick={() => {
              setShowSettings(!showSettings);
              setShowNotifications(false);
            }}
            title="Settings"
          >
            <Settings className="size-5" />
          </button>

          {/* NOTIFICATIONS DROPDOWN PANEL */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Friend Requests</h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Requests List */}
              <div className="max-h-80 overflow-y-auto">
                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending requests</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar offline flex-shrink-0">
                          <div className="size-10 rounded-full">
                            <img
                              src={request.from?.profilePic || "/avatar.png"}
                              alt={request.from?.fullName}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {request.from?.fullName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            wants to be your friend
                          </p>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          className="flex-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Check size={14} />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id)}
                          className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SETTINGS DROPDOWN MENU */}
          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#FFFFFF] dark:bg-slate-800 rounded-xl shadow-2xl border border-[#E9EDEF] dark:border-slate-700 overflow-hidden z-50">
              {/* Menu Header */}
              <div className="px-4 py-3 bg-[#075E54] dark:bg-[#075E54] border-b border-[#075E54] dark:border-slate-700">
                <h4 className="text-sm font-semibold text-white">Settings</h4>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {/* Notifications */}
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowSettings(false);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-slate-600 dark:text-slate-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {pendingRequests.length > 0 
                          ? `${pendingRequests.length} pending request(s)` 
                          : "View friend requests"}
                      </p>
                    </div>
                  </div>
                  {pendingRequests.length > 0 && (
                    <span className="bg-[#3B82F6] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>

                {/* Starred Messages */}
                <button
                  onClick={handleStarredMessages}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Star size={18} className="text-yellow-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Starred Messages</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">View all starred</p>
                  </div>
                </button>

                {/* Create New Group */}
                <button
                  onClick={() => {
                    setShowCreateGroup(true);
                    setShowSettings(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Users size={18} className="text-[#3B82F6]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Create New Group</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Start a group chat</p>
                  </div>
                </button>

                {/* Divider */}
                <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                {/* Typing Sounds Toggle */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isSoundEnabled ? (
                      <Volume2Icon size={18} className="text-slate-600 dark:text-slate-400" />
                    ) : (
                      <VolumeOffIcon size={18} className="text-slate-600 dark:text-slate-400" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Typing Sounds</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isSoundEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSoundToggle}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      isSoundEnabled ? "bg-[#3B82F6]" : "bg-[#8696A0] dark:bg-slate-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                        isSoundEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Theme Toggle */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Moon size={18} className="text-slate-600 dark:text-slate-400" />
                    ) : (
                      <Sun size={18} className="text-slate-600 dark:text-slate-400" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {isDarkMode ? "Dark Mode" : "Light Mode"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Toggle theme</p>
                    </div>
                  </div>
                  <button
                    onClick={handleThemeToggle}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      isDarkMode ? "bg-[#3B82F6]" : "bg-[#8696A0] dark:bg-slate-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                        isDarkMode ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Divider */}
                <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                {/* Logout */}
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOutIcon size={18} className="text-red-500" />
                  <p className="text-sm font-medium text-red-500">Logout</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </div>
  );
}

export default ProfileHeader;
