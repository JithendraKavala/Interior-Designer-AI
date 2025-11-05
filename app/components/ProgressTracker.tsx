"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  error?: string;
}

interface ProgressTrackerProps {
  isVisible: boolean;
  currentStep?: string;
  onComplete?: () => void;
}

const processingSteps: ProcessingStep[] = [
  { id: 'upload', name: 'Image Upload', status: 'pending' },
  { id: 'preprocessing', name: 'Image Preprocessing', status: 'pending' },
  { id: 'depth', name: 'Depth Map Generation', status: 'pending' },
  { id: 'ai_generation', name: 'AI Design Generation', status: 'pending' },
  { id: 'postprocessing', name: 'Image Enhancement', status: 'pending' },
  { id: 'complete', name: 'Ready for Download', status: 'pending' }
];

export default function ProgressTracker({ isVisible, currentStep, onComplete }: ProgressTrackerProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>(processingSteps);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(60); // seconds

  useEffect(() => {
    if (isVisible && !startTime) {
      setStartTime(new Date());
      // Reset steps
      setSteps(processingSteps.map(step => ({ ...step, status: 'pending' })));
    }
  }, [isVisible, startTime]);

  useEffect(() => {
    if (currentStep) {
      setSteps(prev => prev.map(step => {
        if (step.id === currentStep) {
          return { ...step, status: 'processing' };
        } else if (prev.findIndex(s => s.id === step.id) < prev.findIndex(s => s.id === currentStep)) {
          return { ...step, status: 'completed' };
        }
        return step;
      }));
    }
  }, [currentStep]);

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Processing Your Design
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {Math.round(progressPercentage)}% Complete
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              {getStepIcon(step)}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'processing' ? 'text-blue-700' :
                  step.status === 'error' ? 'text-red-700' :
                  'text-gray-500'
                }`}>
                  {step.name}
                </p>
                {step.status === 'processing' && (
                  <p className="text-xs text-gray-400">Processing...</p>
                )}
                {step.status === 'error' && step.error && (
                  <p className="text-xs text-red-500">{step.error}</p>
                )}
              </div>
              {step.duration && (
                <span className="text-xs text-gray-400">
                  {step.duration}s
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Estimated time remaining: {Math.max(0, estimatedTime - (completedSteps * 10))}s
          </p>
          <p className="text-xs text-gray-400 mt-1">
            💡 GPU processing is faster than CPU
          </p>
        </div>
      </div>
    </div>
  );
}
