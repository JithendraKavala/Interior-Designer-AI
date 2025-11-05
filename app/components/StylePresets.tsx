"use client";

import { useState } from "react";

interface StylePreset {
  id: string;
  name: string;
  description: string;
  preview: string;
  settings: {
    style: string;
    roomType: string;
    strength: number;
    guidanceScale: number;
    enhanceLighting: boolean;
  };
}

const presets: StylePreset[] = [
  {
    id: "modern-living",
    name: "Modern Living",
    description: "Clean lines, neutral colors, minimalist furniture",
    preview: "/presets/modern-living.jpg",
    settings: {
      style: "Modern",
      roomType: "Living Room",
      strength: 0.8,
      guidanceScale: 7.5,
      enhanceLighting: true
    }
  },
  {
    id: "cozy-bedroom",
    name: "Cozy Bedroom",
    description: "Warm colors, soft textures, comfortable atmosphere",
    preview: "/presets/cozy-bedroom.jpg",
    settings: {
      style: "Traditional",
      roomType: "Bedroom",
      strength: 0.7,
      guidanceScale: 6.0,
      enhanceLighting: true
    }
  },
  {
    id: "luxury-bathroom",
    name: "Luxury Bathroom",
    description: "High-end finishes, spa-like atmosphere",
    preview: "/presets/luxury-bathroom.jpg",
    settings: {
      style: "Modern",
      roomType: "Bathroom",
      strength: 0.9,
      guidanceScale: 8.0,
      enhanceLighting: true
    }
  },
  {
    id: "minimalist-office",
    name: "Minimalist Office",
    description: "Clean workspace, productivity-focused design",
    preview: "/presets/minimalist-office.jpg",
    settings: {
      style: "Minimalist",
      roomType: "Office",
      strength: 0.8,
      guidanceScale: 7.0,
      enhanceLighting: true
    }
  },
  {
    id: "elegant-dining",
    name: "Elegant Dining",
    description: "Sophisticated dining space for entertaining",
    preview: "/presets/elegant-dining.jpg",
    settings: {
      style: "Traditional",
      roomType: "Dining Room",
      strength: 0.8,
      guidanceScale: 7.5,
      enhanceLighting: true
    }
  }
];

interface StylePresetsProps {
  onPresetSelect: (preset: StylePreset) => void;
  currentStyle: string;
  currentRoom: string;
}

export default function StylePresets({ onPresetSelect, currentStyle, currentRoom }: StylePresetsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetClick = (preset: StylePreset) => {
    setSelectedPreset(preset.id);
    onPresetSelect(preset);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Style Presets</h3>
      <p className="text-sm text-gray-600 mb-6">
        Quick start with popular design combinations
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={`cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
              selectedPreset === preset.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="aspect-video bg-gray-100 rounded-t-lg relative overflow-hidden">
              {/* Placeholder for preset preview image */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Preview</span>
              </div>
              
              {/* Style and Room Type Badge */}
              <div className="absolute top-2 left-2">
                <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {preset.settings.style}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {preset.settings.roomType}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">{preset.name}</h4>
              <p className="text-sm text-gray-600">{preset.description}</p>
              
              {/* Settings Preview */}
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Strength: {preset.settings.strength}
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Guidance: {preset.settings.guidanceScale}
                </span>
                {preset.settings.enhanceLighting && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Enhanced Lighting
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Custom Preset Option */}
      <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-sm text-gray-600 mb-2">
          Don't see what you're looking for?
        </p>
        <button
          onClick={() => setSelectedPreset(null)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Create Custom Settings
        </button>
      </div>
    </div>
  );
}
