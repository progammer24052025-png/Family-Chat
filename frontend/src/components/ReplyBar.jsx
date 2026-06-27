import { X } from "lucide-react";

function ReplyBar({ replyTo, onCancel }) {
  // Don't render if replyTo is null, undefined, or empty object
  if (!replyTo || !replyTo.messageId || !replyTo.senderName) {
    console.log("ReplyBar: Not rendering - invalid replyTo data:", replyTo);
    return null;
  }

  console.log("ReplyBar: Rendering with data:", replyTo);

  return (
    <div className="bg-slate-700 border-l-4 border-[#3B82F6] mx-6 px-3 py-2 rounded-lg rounded-bl-none">
      <div className="max-w-3xl mx-auto flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Sender name */}
          <p className="text-xs font-semibold text-cyan-400 mb-0.5">
            {replyTo.senderName}
          </p>
          
          {/* Message preview - WhatsApp style */}
          <div className="text-xs text-slate-200">
            {replyTo.hasImage && replyTo.image ? (
              <div className="flex items-center gap-2">
                <span className="text-xs">📷</span>
                <span className="italic">Photo</span>
                {replyTo.text && (
                  <span className="text-slate-300"> - {replyTo.text}</span>
                )}
              </div>
            ) : replyTo.text ? (
              <p className="line-clamp-2">{replyTo.text}</p>
            ) : (
              <span className="italic">📷 Photo</span>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onCancel}
          className="p-0.5 hover:bg-slate-600 rounded-full transition-colors flex-shrink-0"
          aria-label="Cancel reply"
        >
          <X size={16} className="text-slate-300" />
        </button>
      </div>
    </div>
  );
}

export default ReplyBar;
