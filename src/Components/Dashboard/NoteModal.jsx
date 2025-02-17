import React, { useState } from "react";
import { X, Star, Maximize2, Minimize2, Edit2, Save } from "lucide-react";

const NoteModal = ({
  note,
  isOpen,
  onClose,
  onToggleFavorite,
  isFullscreen,
  onToggleFullscreen,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(note?.title || "");
  const [editedContent, setEditedContent] = useState(note?.content || "");

  if (!isOpen || !note) return null;

  const handleSave = () => {
    onUpdate(note._id, {
      title: editedTitle,
      content: editedContent,
      imageUrl: note.imageUrl,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(note.title);
    setEditedContent(note.content);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-lg overflow-hidden flex flex-col ${
          isFullscreen ? "w-full h-full" : "w-full max-w-3xl max-h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-xl font-semibold px-2 py-1 border rounded"
              />
            ) : (
              <h2 className="text-xl font-semibold">{note.title}</h2>
            )}
            <span className="text-sm text-gray-500">
              {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                >
                  <Save size={20} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={onToggleFullscreen}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  {isFullscreen ? (
                    <Minimize2 size={20} />
                  ) : (
                    <Maximize2 size={20} />
                  )}
                </button>
                <button
                  onClick={() => onToggleFavorite(note)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Star
                    size={20}
                    className={
                      note.isFavorite
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-400"
                    }
                  />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full p-2 border rounded"
              rows={10}
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>
          )}
          {note.imageUrl && (
            <div className="mt-6 flex justify-center">
              <img
                src={note.imageUrl}
                alt="Note attachment"
                className="max-w-full h-auto max-h-64 object-contain rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
