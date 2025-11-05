"use client";

import Dropzone from "react-dropzone";
import { saveAs } from "file-saver";
import { useState, useEffect } from "react";
import { FileRejection } from "react-dropzone";
import { ThreeDots } from "react-loader-spinner";
import { FaTrashAlt } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { CogIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { SelectMenu } from "@/app/selectmenu";
import { ImageAreaProps } from "@/types";
import ImageComparison from "./components/ImageComparison";
import ImageHistory, { type HistoryItem } from "./components/ImageHistory";
import AdvancedSettings from "./components/AdvancedSettings";
import BatchProcessor from "./components/BatchProcessor";
import StylePresets from "./components/StylePresets";
import { getUserId } from "@/lib/user";

type ErrorNotificationProps = {
  errorMessage: string;
};

type ActionPanelProps = {
  isLoading: boolean;
  submitImage(): void;
};

type UploadedImageProps = {
  image: File;
  removeImage(): void;
  file: {
    name: string;
    size: string;
  };
};

type ImageOutputProps = ImageAreaProps & {
  loading: boolean;
  outputImage: string | null;
  downloadOutputImage(): void;
  onViewImage?(): void;
};

const themes = [
  "Modern",
  "Traditional",
  "Minimalist",
  "Industrial",
  "Scandinavian",
  "Bohemian",
];
const rooms = [
  "Living Room",
  "Dining Room",
  "Bedroom",
  "Bathroom",
  "Office",
  "Kitchen",
  "Study",
  "Nursery",
];

const acceptedFileTypes = {
  "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
};

const maxFileSize = 10 * 1024 * 1024; // 10MB

/**
 * Display an error notification
 * @param {ErrorNotificationProps} props The component props
 */
function ErrorNotification({ errorMessage }: ErrorNotificationProps) {
  return (
    <div className="mx-4 mb-10 rounded-md bg-red-50 p-4 lg:mx-6 xl:mx-8">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Display the action panel
 * @param {ActionPanelProps} props The component props
 */
function ActionPanel({ isLoading, submitImage }: ActionPanelProps) {
  const isDisabled = isLoading;

  return (
    <section className="mx-4 bg-gray-900 shadow sm:rounded-lg lg:mx-6 xl:mx-8">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold leading-6 text-gray-300 lg:text-xl">
              Upload a photo or image
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Upload an image of a room and let our AI generate a new design.
              </p>
            </div>
          </div>
          <div className="mt-5 sm:ml-6 sm:mt-0 sm:flex sm:flex-shrink-0 sm:items-center">
            <button
              type="button"
              disabled={isDisabled}
              onClick={submitImage}
              className={`${
                isDisabled
                  ? "cursor-not-allowed bg-indigo-300 text-gray-300 hover:bg-indigo-300 hover:text-gray-300"
                  : "bg-indigo-600 text-white"
              } inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-300 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:px-3.5 lg:py-2.5`}
            >
              Design this room
              <SparklesIcon className="ml-2 h-4 w-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Display the image output
 * @param {ImageOutputProps} props The component props
 */
function ImageOutput(props: ImageOutputProps) {
  return (
    <section className="relative min-h-[206px] w-full">
      {props.loading ? (
        <div className="relative block flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <span className="flex flex-col items-center">
            <ThreeDots
              height="50"
              width="60"
              color="#eee"
              ariaLabel="three-dots-loading"
              visible={props.loading}
            />
            <span className="block text-sm font-semibold text-gray-300">
              Processing the output image...
            </span>
            <span className="mt-2 block text-xs text-gray-500">
              This may take 1-2 minutes on CPU
            </span>
          </span>
        </div>
      ) : props.outputImage ? (
        <div className="relative h-[600px] w-full">
          <img
            src={props.outputImage}
            alt="AI Generated Design"
            className="h-full w-full rounded-lg border-2 border-gray-300 object-contain shadow-lg"
          />
          <div className="absolute bottom-2 left-2 rounded bg-green-500 px-2 py-1 text-xs font-semibold text-white">
            ✨ Style Applied
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="relative block h-full w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <props.icon className="mx-auto h-12 w-12 text-gray-400" />
          <span className="mt-2 block text-sm font-semibold text-gray-300">
            {props.title}
          </span>
        </button>
      )}

      {!props.loading && props.outputImage ? (
        <div className="absolute right-1 top-1 flex flex-col space-y-2">
          <button
            onClick={props.downloadOutputImage}
            className="group rounded bg-yellow-500 p-2 text-black transition-colors hover:bg-yellow-400"
            title="Download"
          >
            <FaDownload className="h-4 w-4 duration-300 group-hover:scale-110" />
          </button>
          {props.onViewImage && (
            <button
              onClick={props.onViewImage}
              className="group rounded bg-blue-500 p-2 text-white transition-colors hover:bg-blue-400"
              title="View Full Size"
            >
              <svg
                className="h-4 w-4 duration-300 group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Display the uploaded image
 * @param {UploadedImageProps} props The component props
 */
function UploadedImage({ file, image, removeImage }: UploadedImageProps) {
  return (
    <section className="relative min-h-[500px] w-full">
      <button className="relative block h-full w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        <img
          src={URL.createObjectURL(image)}
          alt={image.name}
          className="h-full w-full rounded-lg object-contain shadow-md"
        />
      </button>

      <button
        className="group absolute right-1 top-1 rounded bg-yellow-500 p-2 text-black"
        onClick={removeImage}
      >
        <FaTrashAlt className="h-4 w-4 duration-300 group-hover:scale-110" />
      </button>

      <div className="text-md absolute left-0 top-0 bg-opacity-50 p-2 pl-3.5 text-white">
        {file.name} ({file.size})
      </div>
    </section>
  );
}

/**
 * Display the image dropzone
 * @param {ImageAreaProps} props The component props
 */
function ImageDropzone(
  props: ImageAreaProps & {
    onImageDrop(acceptedFiles: File[], rejectedFiles: FileRejection[]): void;
  }
) {
  return (
    <Dropzone
      onDrop={(acceptedFiles, rejectedFiles, event) => {
        props.onImageDrop(acceptedFiles, rejectedFiles);
      }}
      accept={acceptedFileTypes}
      maxSize={maxFileSize}
      multiple={false}
      noClick={false}
      noKeyboard={false}
    >
      {({ getRootProps, getInputProps, isDragActive, isDragReject }) => {
        return (
          <div
            {...getRootProps()}
            className={`relative block min-h-[206px] w-full cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all duration-200 ${
              isDragActive
                ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                : isDragReject
                ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <input {...getInputProps()} />
            <props.icon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold text-gray-300">
              {isDragReject
                ? "Invalid file type"
                : isDragActive
                ? "Drop the image here"
                : props.title}
            </span>
          </div>
        );
      }}
    </Dropzone>
  );
}

/**
 * Display the home page
 */
export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(themes[0]);
  const [room, setRoom] = useState<string>(rooms[0]);
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState<boolean>(false);
  const [showImageViewer, setShowImageViewer] = useState<boolean>(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    strength: 0.8,
    guidanceScale: 7.5,
    steps: 20,
    seed: 0,
    enableUpscaling: false,
    preserveColors: false,
    enhanceLighting: true,
  });
  const [processingMode, setProcessingMode] = useState<
    "single" | "variations" | "batch"
  >("single");
  const [variations, setVariations] = useState<string[]>([]);

  // Handle Ctrl+V paste functionality
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      console.log("Paste event triggered");
      console.log("Clipboard items:", event.clipboardData?.items);

      const items = event.clipboardData?.items;
      if (!items) {
        console.log("No clipboard items found");
        setPasteStatus("No clipboard data found");
        setTimeout(() => setPasteStatus(null), 2000);
        return;
      }

      let imageFound = false;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log("Checking item:", item.type);

        // Check for various image types
        if (
          item.type.indexOf("image") !== -1 ||
          item.type === "image/png" ||
          item.type === "image/jpeg" ||
          item.type === "image/jpg" ||
          item.type === "image/gif" ||
          item.type === "image/webp"
        ) {
          const file = item.getAsFile();
          if (file) {
            console.log("Pasted image file:", file.name, file.size, file.type);
            setPasteStatus("Image pasted successfully!");
            setTimeout(() => setPasteStatus(null), 2000);
            handleImageFile(file);
            event.preventDefault(); // Prevent default paste behavior
            imageFound = true;
            break;
          }
        }
      }

      // Also check for clipboard data as base64
      if (!imageFound && event.clipboardData) {
        const clipboardText = event.clipboardData.getData("text");
        if (clipboardText && clipboardText.startsWith("data:image/")) {
          console.log("Found base64 image in clipboard");
          try {
            // Convert base64 to file
            const response = fetch(clipboardText);
            response
              .then((res) => res.blob())
              .then((blob) => {
                const file = new File([blob], "pasted-image.png", {
                  type: "image/png",
                });
                console.log(
                  "Converted base64 to file:",
                  file.name,
                  file.size,
                  file.type
                );
                setPasteStatus("Image pasted successfully!");
                setTimeout(() => setPasteStatus(null), 2000);
                handleImageFile(file);
              });
            event.preventDefault();
            imageFound = true;
          } catch (error) {
            console.error("Error converting base64 to file:", error);
          }
        }
      }

      if (!imageFound) {
        console.log("No image found in clipboard");
        setPasteStatus("No image found in clipboard");
        setTimeout(() => setPasteStatus(null), 2000);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Handle image file (from drop or paste)
  const handleImageFile = (imageFile: File) => {
    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    // Validate file size
    if (imageFile.size > maxFileSize) {
      setError("Please upload an image less than 5MB.");
      return;
    }

    removeImage();
    setError("");
    setFile(imageFile);
    convertImageToBase64(imageFile);
  };

  /**
   * Handle the image drop event
   * @param {Array<File>} acceptedFiles The accepted files
   * @param {Array<FileRejection>} rejectedFiles The rejected files
   * @returns void
   */
  function onImageDrop(
    acceptedFiles: File[],
    rejectedFiles: FileRejection[]
  ): void {
    // Check if any of the uploaded files are not valid
    if (rejectedFiles.length > 0) {
      setError("Please upload a PNG or JPEG image less than 5MB.");
      return;
    }

    if (acceptedFiles.length > 0) {
      handleImageFile(acceptedFiles[0]);
    }
  }

  /**
   * Convert the image to base64
   * @param {File} file The file to convert
   * @returns void
   */
  function convertImageToBase64(file: File): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const binaryStr = reader.result as string;
      setBase64Image(binaryStr);
    };
  }

  /**
   * Convert the file size to a human-readable format
   * @param {number} size The file size
   * @returns {string}
   */
  function fileSize(size: number): string {
    if (size === 0) {
      return "0 Bytes";
    }

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));

    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Remove the uploaded image
   * @returns void
   */
  function removeImage(): void {
    setFile(null);
    setOutputImage(null);
  }

  /**
   * Download the output image
   * @returns void
   */
  function downloadOutputImage(): void {
    if (!outputImage) return;

    // Direct download - create a link and click it immediately
    const link = document.createElement("a");
    link.href = outputImage;
    link.download = "interior-design.png";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Submit the image to the server
   * @returns {Promise<void>}
   */
  async function submitImage(): Promise<void> {
    if (!file) {
      setError("Please upload an image.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      // Prepare the request based on processing mode
      let endpoint = "/api/design";
      let requestBody: any = {
        image: base64Image,
        theme,
        room,
        userId: getUserId(),
        settings: JSON.stringify({
          ...advancedSettings,
          style: theme,
          roomType: room,
        }),
      };

      if (processingMode === "variations") {
        endpoint = "/api/generate/variations";
        requestBody.num_variations = 3;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        // Try to get the error message from the response
        try {
          const errorData = await response.json();
          setError(errorData.error || `HTTP error! status: ${response.status}`);
        } catch {
          // If we can't parse JSON, show a generic message based on status
          if (response.status === 402 || response.status === 429) {
            setError(
              "Rate limit exceeded. Please wait a few minutes and try again."
            );
          } else if (response.status === 401) {
            setError(
              "Authentication error. Please refresh the page and try again."
            );
          } else if (response.status === 403) {
            setError("Access denied. Please try again later.");
          } else if (response.status === 503) {
            setError(
              "AI service temporarily unavailable. Please try again in a moment."
            );
          } else if (response.status === 400) {
            setError("Invalid request. Please check your image and try again.");
          } else {
            setError(
              `Service error! status: ${response.status}. Please try again.`
            );
          }
        }
        setLoading(false);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const result = await response.json();
      console.log(result);

      if (!result.success) {
        setError(result.error || "Failed to generate image");
        setLoading(false);
        return;
      }

      // Handle different response types based on processing mode
      if (processingMode === "variations" && result.variations) {
        setVariations(result.variations);
        setOutputImage(result.variations[0]); // Show first variation as main output
      } else if (result.output) {
        // Standard single image output
        setOutputImage(result.output[1] || result.output[0]);
      }

      // Add to history if we have both original and generated images
      if (file && outputImage) {
        const historyItem = {
          originalImage: base64Image!,
          generatedImage: outputImage,
          style: theme,
          roomType: room,
          filename: file.name,
        };
        // This would be handled by the ImageHistory component
      }

      setLoading(false);
    } catch (error) {
      console.error("Error submitting image:", error);
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError(
            "Request timed out. The image processing is taking too long. Please try again."
          );
        } else if (error.message.includes("Failed to fetch")) {
          setError(
            "Network error. Please check your internet connection and try again."
          );
        } else if (error.message.includes("non-JSON response")) {
          setError("Server error. Please try again later.");
        } else {
          setError(error.message);
        }
      } else {
        setError("Failed to process image. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col py-10 lg:pl-72">
      {error ? <ErrorNotification errorMessage={error} /> : null}
      {pasteStatus ? (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-blue-500 px-4 py-2 text-white shadow-lg">
          {pasteStatus}
        </div>
      ) : null}
      <ActionPanel isLoading={loading} submitImage={submitImage} />

      <div className="mx-4 mt-4 text-center text-xs text-gray-400 lg:mx-6 xl:mx-8">
        📐 Output image will maintain the same dimensions as your input image
      </div>

      {/* Enhanced Controls Section */}
      <section className="mx-4 mt-9 space-y-6 lg:mx-6 xl:mx-8">
        {/* Processing Mode Selection */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setProcessingMode("single")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                processingMode === "single"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Single Design
            </button>
            <button
              onClick={() => setProcessingMode("variations")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                processingMode === "variations"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              3 Variations
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowBatchProcessor(true)}
              className="flex items-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              <RectangleStackIcon className="h-4 w-4" />
              <span>Batch Process</span>
            </button>
          </div>
        </div>

        {/* Style Presets */}
        {/* <StylePresets
          onPresetSelect={(preset) => {
            setTheme(preset.settings.style);
            setRoom(preset.settings.roomType);
            setAdvancedSettings(prev => ({
              ...prev,
              strength: preset.settings.strength,
              guidanceScale: preset.settings.guidanceScale,
              enhanceLighting: preset.settings.enhanceLighting
            }));
          }}
          currentStyle={theme}
          currentRoom={room}
        /> */}

        {/* Basic Controls */}
        <div className="flex w-fit flex-col space-y-4 lg:flex-row lg:space-x-8 lg:space-y-0">
          <SelectMenu
            label="Style"
            options={themes}
            selected={theme}
            onChange={setTheme}
          />
          <SelectMenu
            label="Room type"
            options={rooms}
            selected={room}
            onChange={setRoom}
          />
        </div>

        {/* Advanced Settings */}
        <AdvancedSettings
          settings={advancedSettings}
          onSettingsChange={setAdvancedSettings}
        />
      </section>

      {/* Main Image Processing Section */}
      <section className="mt-10 px-4 lg:px-6 xl:px-8">
        {!file ? (
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-500">
              💡 Tip: You can also press{" "}
              <kbd className="rounded bg-gray-200 px-2 py-1 font-mono text-xs">
                Ctrl+V
              </kbd>{" "}
              to paste an image from your clipboard
            </div>
            <div className="text-center text-xs text-gray-400">
              📋 Copy an image to clipboard first, then paste here
            </div>
            <ImageDropzone
              title={`Drag 'n drop your image here, click to upload, or press Ctrl+V to paste`}
              onImageDrop={onImageDrop}
              icon={PhotoIcon}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Image Comparison or Side-by-Side View */}
            {outputImage && showComparison ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Before & After Comparison
                  </h3>
                  <button
                    onClick={() => setShowComparison(false)}
                    className="text-sm hover:text-indigo-800"
                  >
                    Switch to Side-by-Side
                  </button>
                </div>
                <ImageComparison
                  beforeImage={base64Image!}
                  afterImage={outputImage}
                  beforeLabel="Original"
                  afterLabel={`${theme} ${room}`}
                />
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2 xl:gap-8">
                {/* Original Image */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Original Image</h3>
                    {outputImage && (
                      <button
                        onClick={() => setShowComparison(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Compare View
                      </button>
                    )}
                  </div>
                  <UploadedImage
                    image={file}
                    removeImage={removeImage}
                    file={{ name: file.name, size: fileSize(file.size) }}
                  />
                </div>

                {/* Generated Image */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">AI-Generated Design</h3>
                  <ImageOutput
                    title={`${theme} ${room} Design`}
                    downloadOutputImage={downloadOutputImage}
                    outputImage={outputImage}
                    icon={SparklesIcon}
                    loading={loading}
                    onViewImage={() => setShowImageViewer(true)}
                  />
                </div>
              </div>
            )}

            {/* Variations Display */}
            {variations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Design Variations</h3>
                <div className="grid cursor-pointer grid-cols-1 gap-4 hover:opacity-80 md:grid-cols-3">
                  {variations.map((variation, index) => (
                    <div
                      key={index}
                      className="group relative"
                      onClick={() => {
                        setOutputImage(variation);
                        setShowComparison(false); // Switch to side-by-side view
                      }}
                    >
                      <img
                        src={variation}
                        alt={`Variation ${index + 1}`}
                        className="h-full w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-80"
                        onClick={() => {
                          setOutputImage(variation);
                          setShowComparison(false); // Switch to side-by-side view
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-0 transition-all group-hover:bg-opacity-20">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Direct download
                            const link = document.createElement("a");
                            link.href = variation;
                            link.download = `variation_${index + 1}.png`;
                            link.target = "_blank";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="rounded-md bg-white px-3 py-1 text-sm font-medium text-gray-800 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          Download
                        </button>
                      </div>
                      <div className="absolute left-2 top-2 rounded bg-black bg-opacity-70 px-2 py-1 text-xs text-white">
                        Variation {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Image History Component */}
      <ImageHistory
        onImageSelect={(item) => {
          // Handle image selection from history
          setOutputImage(item.imageUrl);
        }}
      />

      {/* Batch Processor Modal */}
      <BatchProcessor
        isOpen={showBatchProcessor}
        onClose={() => setShowBatchProcessor(false)}
        style={theme}
        roomType={room}
      />

      {/* Image Viewer Modal */}
      {showImageViewer && outputImage && (
        <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative flex h-full max-h-full w-full max-w-[70%] items-center justify-center">
            <img
              src={outputImage}
              alt="Full Size View"
              className="h-full max-h-full w-full max-w-full rounded-lg object-contain"
            />
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute right-4 top-4 rounded-full bg-white p-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
              <button
                onClick={downloadOutputImage}
                className="flex items-center rounded-md bg-yellow-500 px-6 py-2 text-black transition-colors hover:bg-yellow-400"
              >
                <FaDownload className="mr-2 h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => setShowImageViewer(false)}
                className="rounded-md bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
