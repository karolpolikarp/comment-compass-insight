
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Youtube } from 'lucide-react';

interface CommentScraperProps {
  onScrape: (videoUrl: string) => Promise<void>;
  isLoading: boolean;
}

export const CommentScraper: React.FC<CommentScraperProps> = ({ onScrape, isLoading }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL');
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(videoUrl)) {
      setError('Please enter a valid YouTube video URL');
      return;
    }

    try {
      await onScrape(videoUrl);
      setVideoUrl(''); // Clear input on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze comments');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Youtube className="h-6 w-6 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">
          Enter YouTube Video URL
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || !videoUrl.trim()}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Comments...
            </>
          ) : (
            'Analyze Comments'
          )}
        </Button>
      </form>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> This app fetches real YouTube comments using the YouTube Data API 
          and analyzes their sentiment using ChatGPT. Results are saved to your database for future reference.
        </p>
      </div>
    </div>
  );
};
