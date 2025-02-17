import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Star,
  Search,
  Image,
  Mic,
  Copy,
  Trash2,
  Sun,
  Moon,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import { useTheme } from "../../context/ThemeContext";

import NoteModal from "./NoteModal";

const API_BASE_URL = "http://localhost:5000";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const { darkMode, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const mediaRecorder = useRef(null);
  const recognition = useRef(null);
  const recordingTimer = useRef(null);
  const audioChunks = useRef([]);
  const fileInputRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.split(" ");
    let initials = "";
    for (let i = 0; i < Math.min(words.length, 2); i++) {
      if (words[i][0]) {
        initials += words[i][0];
      }
    }
    return initials.toUpperCase();
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch user info
    fetchUserInfo();

    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window) {
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join(" ");
        setTranscribedText(transcript);
        setNoteContent(transcript);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        stopRecording();
      };
    }

    fetchNotes();

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (
        mediaRecorder.current &&
        mediaRecorder.current.state === "recording"
      ) {
        mediaRecorder.current.stop();
      }
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [navigate]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }
      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error("Error fetching user info:", error);
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Logout failed");

      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out. Please try again.");
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const startRecording = async () => {
    try {
      setRecordingTime(0);
      setTranscribedText("");
      audioChunks.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
      };

      mediaRecorder.current.start();
      recognition.current.start();
      setIsRecording(true);

      recordingTimer.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= 60) {
            stopRecording();
            return prevTime;
          }
          return prevTime + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "Error accessing microphone. Please ensure microphone permissions are granted."
      );
    }
  };

  const stopRecording = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    if (recognition.current) {
      recognition.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const createNote = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent || transcribedText,
          isAudioNote: isRecording,
          imageUrl,
        }),
      });
      const data = await response.json();
      setNotes([data, ...notes]);
      setNoteTitle("");
      setNoteContent("");
      setTranscribedText("");
      setImageUrl("");
      toast.success("Note created successfully!");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note. Please try again.");
    }
  };

  const updateNote = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          imageUrl: selectedNote.imageUrl,
        }),
      });
      const updatedNote = await response.json();
      setNotes(notes.map((note) => (note._id === id ? updatedNote : note)));
      setIsEditing(false);
      toast.success("Note updated successfully!");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note. Please try again.");
    }
  };

  const deleteNote = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/notes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setNotes(notes.filter((note) => note._id !== id));
      setShowModal(false);
      toast.success("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note. Please try again.");
    }
  };

  const toggleFavorite = async (note) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${note._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...note,
          isFavorite: !note.isFavorite,
        }),
      });
      const updatedNote = await response.json();
      setNotes(notes.map((n) => (n._id === note._id ? updatedNote : n)));
      toast.success(
        note.isFavorite ? "Removed from favorites!" : "Added to favorites!"
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status. Please try again.");
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard!");
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());

    if (showFavorites) {
      return matchesSearch && note.isFavorite;
    }
    return matchesSearch;
  });

  // Function to determine what message to show in empty states
  const getEmptyStateMessage = () => {
    if (notes.length === 0) {
      return (
        <>
          <p
            className={`text-lg mb-2 ${
              darkMode ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            No notes yet
          </p>
          <p className={darkMode ? "text-zinc-400" : "text-zinc-600"}>
            Create a new note using the form below
          </p>
        </>
      );
    }

    if (showFavorites && !filteredNotes.some((note) => note.isFavorite)) {
      return (
        <>
          <p
            className={`text-lg mb-2 ${
              darkMode ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            No favorite notes yet
          </p>
          <p className={darkMode ? "text-zinc-400" : "text-zinc-600"}>
            Star your notes to see them here
          </p>
        </>
      );
    }

    if (searchTerm && filteredNotes.length === 0) {
      return (
        <p className={darkMode ? "text-zinc-400" : "text-zinc-600"}>
          No notes found matching "{searchTerm}"
        </p>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">AI</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">
              AI Notes
            </span>
          </div>

          {/* User Profile Section */}
          {userInfo && (
            <div className="flex items-center gap-3 py-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-950 font-medium">
                {getInitials(userInfo.fullName)}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {userInfo.fullName}
                </p>
                <button
                  className="text-sm text-white bg-purple-600 px-[6px] py-1 text-[12px] rounded-sm hover:bg-purple-700"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-2">
          <button
            onClick={() => setShowFavorites(false)}
            className={`flex items-center gap-3 p-2 w-full rounded-lg ${
              !showFavorites
                ? "bg-purple-900/50 text-purple-400"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            <Home size={20} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setShowFavorites(true)}
            className={`flex items-center gap-3 p-2 w-full rounded-lg ${
              showFavorites
                ? "bg-purple-900/50 text-purple-400"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            <Star size={20} />
            <span>Favorites</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 p-2 w-full rounded-lg mt-2 text-zinc-600 dark:text-zinc-400 hover:bg-purple-900/20"
          >
            {darkMode ? (
              <>
                <Sun size={20} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={20} />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex justify-between items-center">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-600 dark:text-zinc-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 rounded-lg border-none bg-zinc-100/50 dark:bg-white/7.5 placeholder-zinc-400 text-zinc-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Sort
          </button>
        </div>

        {/* Notes Grid */}
        <div className="flex-1 overflow-auto p-4">
          {filteredNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <p className="text-lg mb-2 text-zinc-600 dark:text-zinc-400">
                {getEmptyStateMessage()}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note._id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50/50 dark:bg-white/5 transition-colors"
                  onClick={() => {
                    setSelectedNote(note);
                    setEditedTitle(note.title);
                    setEditedContent(note.content);
                    setShowModal(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {note.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(note);
                      }}
                      className={`text-2xl ${
                        note.isFavorite
                          ? "text-yellow-500"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      ★
                    </button>
                  </div>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                    {note.content}
                  </p>
                  {note.imageUrl && (
                    <img
                      src={note.imageUrl}
                      alt="Note attachment"
                      className="mt-2 max-h-32 rounded"
                    />
                  )}
                  <div className="mt-4 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      {note.isAudioNote && <Mic size={16} />}
                      {note.imageUrl && <Image size={16} />}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyContent(note.content);
                        }}
                        className="p-1 hover:bg-white/7.5 rounded"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note._id);
                        }}
                        className="p-1 hover:bg-white/7.5 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creation Bar */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-800 flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Note title"
              className="w-full p-2 rounded-lg border-none bg-zinc-100/50 dark:bg-white/7.5 placeholder-zinc-400 text-zinc-900 dark:text-white mb-2"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <textarea
              placeholder="Start typing..."
              className="w-full p-2 rounded-lg border-none bg-zinc-100/50 dark:bg-white/7.5 placeholder-zinc-400 text-zinc-900 dark:text-white"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current.click()}
              className="p-2 hover:bg-white/7.5 rounded-lg text-zinc-500 dark:text-zinc-400"
            >
              <Image size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg hover:bg-white/7.5 ${
                isRecording
                  ? "text-red-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Mic size={20} />
              {isRecording && (
                <span className="ml-2">
                  {`${Math.floor(recordingTime / 60)}:${String(
                    recordingTime % 60
                  ).padStart(2, "0")}`}
                </span>
              )}
            </button>
            <button
              onClick={createNote}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create
            </button>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {showModal && selectedNote && (
        <NoteModal
          note={selectedNote}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onToggleFavorite={toggleFavorite}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onUpdate={updateNote}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
