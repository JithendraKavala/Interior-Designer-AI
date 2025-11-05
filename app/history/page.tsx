"use client";

import { useState, useEffect } from "react";
import { getUserId } from "@/lib/user";
import { saveAs } from "file-saver";
import { ArrowDownTrayIcon, EyeIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ImageHistoryItem {
  id: number;
  imageUrl: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
  function downloadImage(url: string, filename = "image.png") {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  

  const removeFromHistory = async (id: number) => {
    // For now, just remove from local state
    // In a full implementation, you'd want to add a DELETE endpoint
    setHistory(history.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };
  

  return (
    <main className="flex min-h-screen flex-col py-10 lg:pl-72">
      {/* Header Section */}
      <section className="mx-4 bg-gray-900 shadow sm:rounded-lg lg:mx-6 xl:mx-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold leading-6 text-gray-300 lg:text-xl">
                Your Design History
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  View and download all your previously generated interior designs.
                </p>
              </div>
            </div>
            <div className="mt-5 sm:ml-6 sm:mt-0 sm:flex sm:flex-shrink-0 sm:items-center">
              <button
                type="button"
                onClick={() => loadHistory(userId)}
                className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-300 bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:px-3.5 lg:py-2.5"
              >
                <EyeIcon className="ml-2 h-4 w-4 text-gray-300" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="mx-4 mt-4 text-center text-xs text-gray-400 lg:mx-6 xl:mx-8">
        📊 {history.length} designs saved • User ID: {userId}
      </div>

      {/* Main Content */}
      <section className="mt-10 px-4 lg:px-6 xl:px-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading your design history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No designs yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Generate some interior designs using the main app to see them here.
            </p>
            <div className="mt-6">
              <a
                href="/"
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
              >
                Start Designing
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clear All Button */}
            <div className="flex justify-end">
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All History
              </button>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {history.map((item) => (
                <div key={item.id} className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="aspect-square">
                    <img
                      src={item.imageUrl}
                      alt={`Design ${item.id}`}
                      className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => setSelectedImage(item.imageUrl)}
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedImage(item.imageUrl)}
                          className="rounded-md bg-white px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100"
                        >
                          <EyeIcon className="h-4 w-4 inline mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => downloadImage(item.imageUrl, `design_${item.id}.png`)}
                          className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Design #{item.id}
                      </h3>
                      <button
                        onClick={() => removeFromHistory(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()} at{" "}
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 w-full h-full">
          <div className="relative max-w-[70%] max-h-full w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Selected Design"
              className="max-w-full max-h-full object-contain rounded-lg w-full h-full"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 text-gray-600 hover:text-gray-800"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <button
                onClick={() => downloadImage(selectedImage)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

