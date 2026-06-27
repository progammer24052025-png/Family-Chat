import { ArrowLeftIcon, RadioIcon, UsersIcon } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";

function GroupHeader() {
  const { selectedGroup, setSelectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const isAdmin = selectedGroup?.admin?._id === authUser._id || selectedGroup?.admin === authUser._id;

  return (
    <div className="flex justify-between items-center bg-cyan-700 dark:bg-cyan-700 border-b border-[#075E54] dark:border-slate-700 px-6 py-3 flex-shrink-0">
      <div className="flex items-center space-x-3">
        {/* Back button — mobile only */}
        <button
          onClick={() => setSelectedGroup(null)}
          className="md:hidden text-white hover:text-slate-200 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        {/* Group avatar */}
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {selectedGroup.avatar ? (
            <img src={selectedGroup.avatar} alt={selectedGroup.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-white font-bold text-lg">
              {selectedGroup.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium">{selectedGroup.name}</h3>
            {selectedGroup.type === "broadcast" && (
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <RadioIcon className="w-3 h-3" />
                Broadcast
              </span>
            )}
            {isAdmin && (
              <span className="text-xs bg-[#3B82F6]/20 text-[#3B82F6] px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm flex items-center gap-1">
            <UsersIcon className="w-3.5 h-3.5" />
            {selectedGroup.members?.length || 0} member{(selectedGroup.members?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Close button — desktop only */}
      <button
        onClick={() => setSelectedGroup(null)}
        className="hidden md:block text-white hover:text-slate-200 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

export default GroupHeader;
