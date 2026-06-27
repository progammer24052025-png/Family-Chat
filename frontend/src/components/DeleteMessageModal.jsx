import { Trash2, X } from "lucide-react";

function DeleteMessageModal({ isOpen, onClose, onDelete, isOwnMessage }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Trash2 className="text-red-500" size={20} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isOwnMessage ? "Delete message?" : "Delete this message?"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isOwnMessage ? (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                Choose how you want to delete this message:
              </p>

              {/* Delete for Everyone - Red primary button */}
              <button
                onClick={() => {
                  onDelete(true);
                  onClose();
                }}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete for everyone
              </button>

              {/* Delete for Me - Ghost/secondary button */}
              <button
                onClick={() => {
                  onDelete(false);
                  onClose();
                }}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete for me
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                This message will be deleted only for you. Other people in the chat will still be able to see it.
              </p>

              {/* Delete for Me only (for messages you didn't send) */}
              <button
                onClick={() => {
                  onDelete(false);
                  onClose();
                }}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete for me
              </button>
            </div>
          )}
        </div>

        {/* Footer - Cancel */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteMessageModal;
