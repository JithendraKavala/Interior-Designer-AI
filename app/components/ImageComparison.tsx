"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ImageComparison({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-300 bg-gray-100">
      {/* Before Image */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-4 top-4 rounded-md bg-black bg-opacity-70 px-3 py-1 text-sm font-medium text-white">
          {beforeLabel}
        </div>
      </div>

      {/* After Image */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterImage}
          alt={afterLabel}
          className="h-full w-full object-cover"
        />
        <div className="absolute right-4 top-4 rounded-md bg-black bg-opacity-70 px-3 py-1 text-sm font-medium text-white">
          {afterLabel}
        </div>
      </div>

      {/* Slider */}
      <div
        className="absolute inset-0 cursor-col-resize"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute bottom-0 top-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-white shadow-lg">
            <ChevronLeftIcon className="absolute left-1 h-3 w-3 text-gray-600" />
            <ChevronRightIcon className="absolute right-1 h-3 w-3 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
