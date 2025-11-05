"use client";

import { useState } from "react";
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ThreeDots } from "react-loader-spinner";

interface BatchFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

interface BatchProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  style: string;
  roomType: string;
}

export default function BatchProcessor({ isOpen, onClose, style, roomType }: BatchProcessorProps) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesDrop = (acceptedFiles: File[]) => {
    const newFiles: BatchFile[] = acceptedFiles.map(file => ({
      id: Date.now().toString() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ));

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file.file);
        });

        // Process the image
        const response = await fetch("/api/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            image: base64, 
            theme: style, 
            room: roomType 
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'completed', 
              result: result.output?.[1] 
            } : f
          ));
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Processing failed'
          } : f
        ));
      }
    }
    
    setIsProcessing(false);
  };

  const downloadAll = () => {
    files.forEach((file, index) => {
      if (file.result) {
        const link = document.createElement('a');
        link.href = file.result;
        link.download = `batch_design_${index + 1}.png`;
        link.click();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Batch Processing</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop multiple images here
            </p>
            <p className="text-gray-500">
              Process up to 10 images at once with the same style settings
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFilesDrop(Array.from(e.target.files))}
              className="hidden"
              id="batch-upload"
            />
            <label
              htmlFor="batch-upload"
              className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
            >
              Choose Files
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Files ({files.length})</h3>
                <div className="space-x-2">
                  <button
                    onClick={processBatch}
                    disabled={isProcessing || files.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Process All'}
                  </button>
                  <button
                    onClick={downloadAll}
                    disabled={!files.some(f => f.status === 'completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Download All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={file.preview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        
                        {/* Status */}
                        <div className="mt-2">
                          {file.status === 'pending' && (
                            <span className="text-gray-500 text-sm">Pending</span>
                          )}
                          {file.status === 'processing' && (
                            <div className="flex items-center space-x-2">
                              <ThreeDots height="20" width="30" color="#6366f1" />
                              <span className="text-indigo-600 text-sm">Processing...</span>
                            </div>
                          )}
                          {file.status === 'completed' && (
                            <span className="text-green-600 text-sm">✓ Completed</span>
                          )}
                          {file.status === 'error' && (
                            <span className="text-red-600 text-sm">✗ {file.error}</span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Result Preview */}
                    {file.result && (
                      <div className="mt-4">
                        <img
                          src={file.result}
                          alt="Result"
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
