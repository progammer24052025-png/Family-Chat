import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  const tabs = [
    { key: "chats", label: "Chats" },
    { key: "contacts", label: "Contacts" },
  ];

  return (
    <div className="flex border-b border-[#E9EDEF] dark:border-slate-700 bg-[#FFFFFF] dark:bg-slate-800">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === key
              ? "text-[#3B82F6] dark:text-[#3B82F6]"
              : "text-[#8696A0] dark:text-slate-400 hover:text-[#111111] dark:hover:text-slate-300"
          }`}
        >
          {label}
          {activeTab === key && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />
          )}
        </button>
      ))}
    </div>
  );
}
export default ActiveTabSwitch;
