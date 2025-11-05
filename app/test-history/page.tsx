"use client";

import { useState, useEffect } from "react";
import { getUserId } from "@/lib/user";

interface ImageHistoryItem {
  id: number;
  imageUrl: string;
  createdAt: string;
}

export default function TestHistoryPage() {
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const currentUserId = getUserId();
    setUserId(currentUserId);
    loadHistory(currentUserId);
  }, []);

  const loadHistory = async (currentUserId: string) => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/images?userId=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load image history:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = () => {
    loadHistory(userId);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Image History Test Page</h1>
            <button
              onClick={refreshHistory}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>User ID:</strong> {userId}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Total Images:</strong> {history.length}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No images found in history.</p>
              <p className="text-sm text-gray-400 mt-2">
                Generate some images using the main app to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="aspect-square mb-4">
                    <img
                      src={item.imageUrl}
                      alt={`Design ${item.id}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Design #{item.id}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()} at{" "}
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = item.imageUrl;
                          link.download = `design_${item.id}.png`;
                          link.click();
                        }}
                        className="flex-1 bg-indigo-600 text-white text-sm py-1 px-3 rounded hover:bg-indigo-700"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => {
                          window.open(item.imageUrl, '_blank');
                        }}
                        className="flex-1 bg-gray-600 text-white text-sm py-1 px-3 rounded hover:bg-gray-700"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

