"use client";

import { useState, useEffect } from "react";
import { TrashIcon, ArrowDownTrayIcon, EyeIcon } from "@heroicons/react/24/outline";
import { saveAs } from "file-saver";
import { getUserId } from "@/lib/user";

interface HistoryItem {
  id: number;
  imageUrl: string;
  createdAt: string;
}

interface ImageHistoryProps {
  onImageSelect?: (item: HistoryItem) => void;
}

export default function ImageHistory({ onImageSelect }: ImageHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/images?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load image history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const removeFromHistory = (id: number) => {
    setHistory(history.filter((item) => item.id !== id));
  };

  const downloadImage = (imageUrl: string, filename?: string) => {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => saveAs(blob, filename || `design_${Date.now()}.png`))
      .catch((error) => console.error("Download failed:", error));
  };

  const clearHistory = () => setHistory([]);

  return (
    <>
      {/* History Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 bg-indigo-500 text-white p-3 rounded-full shadow-md hover:bg-indigo-600 transition-colors"
      >
        <EyeIcon className="w-5 h-5" />
        {history.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {history.length}
          </span>
        )}
      </button>

      {/* History Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-96 bg-neutral-900 border-l border-neutral-800 shadow-2xl overflow-y-auto text-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-100">Design History</h2>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-red-400 hover:text-red-500 text-sm transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {loading ? (
                <p className="text-gray-400 text-center py-8">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No designs yet</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="border border-neutral-800 bg-neutral-800/50 rounded-lg p-4 hover:bg-neutral-800 transition"
                    >
                      <div className="flex space-x-3">
                        <img
                          src={item.imageUrl}
                          alt="Generated Design"
                          className="w-20 h-20 object-cover rounded border border-neutral-700"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-100 truncate">
                            Design #{item.id}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()} at{" "}
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-3">
                        <button
                          onClick={() => onImageSelect?.(item)}
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => downloadImage(item.imageUrl)}
                          className="text-green-400 hover:text-green-300 transition"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromHistory(item.id)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { type HistoryItem };
