
import React from 'react';
import { Slider } from '@/components/ui/slider';

interface SentimentSliderProps {
  value: number;
  onChange: (value: number) => void;
  totalComments: number;
  filteredComments: number;
}

export const SentimentSlider: React.FC<SentimentSliderProps> = ({
  value,
  onChange,
  totalComments,
  filteredComments
}) => {
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  const getFilterDescription = () => {
    if (value === 0) return 'All comments';
    if (value > 0) return `Comments with sentiment ≥ ${value}% (Most positive)`;
    return `Comments with sentiment ≤ ${value}% (Most negative)`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filter by Sentiment</h3>
        <span className="text-sm text-gray-600">
          Showing {filteredComments} of {totalComments} comments
        </span>
      </div>
      
      <div className="px-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Most Negative</span>
          <span>Neutral</span>
          <span>Most Positive</span>
        </div>
        
        <Slider
          value={[value]}
          onValueChange={handleValueChange}
          min={-100}
          max={100}
          step={5}
          className="w-full"
        />
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-red-600">-100%</span>
          <span className="text-xs text-gray-500">0%</span>
          <span className="text-xs text-green-600">+100%</span>
        </div>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Filter:</strong> {getFilterDescription()}
        </p>
        {value !== 0 && (
          <button
            onClick={() => onChange(0)}
            className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
          >
            Reset filter
          </button>
        )}
      </div>
    </div>
  );
};
