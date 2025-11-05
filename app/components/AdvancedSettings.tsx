"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface AdvancedSettingsProps {
  settings: {
    strength: number;
    guidanceScale: number;
    steps: number;
    seed: number;
    enableUpscaling: boolean;
    preserveColors: boolean;
    enhanceLighting: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export default function AdvancedSettings({ settings, onSettingsChange }: AdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-medium text-gray-900">Advanced Settings</span>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Transformation Strength */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transformation Strength: {settings.strength}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={settings.strength}
              onChange={(e) => updateSetting('strength', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Subtle</span>
              <span>Dramatic</span>
            </div>
          </div>

          {/* Guidance Scale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style Adherence: {settings.guidanceScale}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={settings.guidanceScale}
              onChange={(e) => updateSetting('guidanceScale', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Creative</span>
              <span>Precise</span>
            </div>
          </div>

          {/* Inference Steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Steps: {settings.steps}
            </label>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={settings.steps}
              onChange={(e) => updateSetting('steps', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast</span>
              <span>High Quality</span>
            </div>
          </div>

          {/* Seed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seed (for reproducible results)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={settings.seed}
                onChange={(e) => updateSetting('seed', parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Random seed"
              />
              <button
                onClick={() => updateSetting('seed', Math.floor(Math.random() * 1000000))}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Random
              </button>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enableUpscaling}
                onChange={(e) => updateSetting('enableUpscaling', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable 2x Upscaling</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.preserveColors}
                onChange={(e) => updateSetting('preserveColors', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Preserve Original Colors</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enhanceLighting}
                onChange={(e) => updateSetting('enhanceLighting', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enhanced Lighting</span>
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => onSettingsChange({
              strength: 0.8,
              guidanceScale: 7.5,
              steps: 20,
              seed: 0,
              enableUpscaling: false,
              preserveColors: false,
              enhanceLighting: true
            })}
            className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
}
