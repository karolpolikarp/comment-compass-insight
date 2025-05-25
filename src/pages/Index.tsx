
import React, { useState, useMemo } from 'react';
import { CommentScraper } from '@/components/CommentScraper';
import { CommentCard } from '@/components/CommentCard';
import { SentimentSlider } from '@/components/SentimentSlider';
import { analyzeSentiment } from '@/utils/sentimentAnalysis';

export interface Comment {
  id: string;
  text: string;
  author: string;
  sentiment: number; // -1 to 1 scale
  sentimentLabel: 'negative' | 'neutral' | 'positive';
}

const Index = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [sentimentFilter, setSentimentFilter] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string>('');

  // Mock function to simulate YouTube comment scraping
  const mockScrapeComments = async (videoUrl: string) => {
    setIsLoading(true);
    
    // Extract video ID from URL (basic implementation)
    const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock comments with varied sentiment
    const mockComments = [
      "This video is absolutely amazing! Best content I've seen all year!",
      "Great explanation, really helped me understand the concept better.",
      "Not bad, could be improved though.",
      "This is terrible, waste of time.",
      "Love this channel, keep up the good work!",
      "I disagree with some points but overall decent video.",
      "Boring content, didn't learn anything new.",
      "Fantastic tutorial! Exactly what I was looking for.",
      "Could have been shorter, too much fluff.",
      "Outstanding work, very professional and informative!",
      "This sucks, terrible audio quality.",
      "Pretty good video, thanks for sharing.",
      "Amazing content as always! Subscribed!",
      "Not my cup of tea but I can see why others like it.",
      "Worst video ever, complete garbage.",
      "Nice video, learned something new today.",
      "Excellent presentation and clear explanations!",
      "Okay video, nothing special though.",
      "Horrible content, clickbait title.",
      "Great job! Really appreciate the effort you put in."
    ];

    const processedComments: Comment[] = mockComments.map((text, index) => {
      const sentiment = analyzeSentiment(text);
      return {
        id: `comment-${index}`,
        text,
        author: `User${index + 1}`,
        sentiment,
        sentimentLabel: sentiment < -0.2 ? 'negative' : sentiment > 0.2 ? 'positive' : 'neutral'
      };
    });

    setComments(processedComments);
    setVideoTitle(`Sample Video ${videoId}`);
    setIsLoading(false);
  };

  // Filter comments based on sentiment slider
  const filteredComments = useMemo(() => {
    return comments
      .filter(comment => {
        if (sentimentFilter === 0) return true;
        if (sentimentFilter > 0) return comment.sentiment >= sentimentFilter * 0.01;
        return comment.sentiment <= sentimentFilter * 0.01;
      })
      .sort((a, b) => {
        if (sentimentFilter === 0) return b.sentiment - a.sentiment;
        return sentimentFilter > 0 ? b.sentiment - a.sentiment : a.sentiment - b.sentiment;
      });
  }, [comments, sentimentFilter]);

  const sentimentStats = useMemo(() => {
    const total = comments.length;
    const positive = comments.filter(c => c.sentimentLabel === 'positive').length;
    const negative = comments.filter(c => c.sentimentLabel === 'negative').length;
    const neutral = total - positive - negative;
    
    return {
      total,
      positive,
      negative,
      neutral,
      positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
      negativePercent: total > 0 ? Math.round((negative / total) * 100) : 0,
      neutralPercent: total > 0 ? Math.round((neutral / total) * 100) : 0
    };
  }, [comments]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            YouTube Comment Sentiment Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Analyze the sentiment of YouTube comments with AI-powered insights
          </p>
        </div>

        {/* Comment Scraper */}
        <CommentScraper onScrape={mockScrapeComments} isLoading={isLoading} />

        {/* Results Section */}
        {comments.length > 0 && (
          <div className="mt-8 space-y-6">
            {/* Video Info & Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Analysis Results for: {videoTitle}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{sentimentStats.total}</div>
                  <div className="text-sm text-gray-600">Total Comments</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{sentimentStats.positivePercent}%</div>
                  <div className="text-sm text-gray-600">Positive</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{sentimentStats.neutralPercent}%</div>
                  <div className="text-sm text-gray-600">Neutral</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{sentimentStats.negativePercent}%</div>
                  <div className="text-sm text-gray-600">Negative</div>
                </div>
              </div>

              {/* Sentiment Slider */}
              <SentimentSlider 
                value={sentimentFilter} 
                onChange={setSentimentFilter}
                totalComments={comments.length}
                filteredComments={filteredComments.length}
              />
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Comments ({filteredComments.length})
              </h3>
              
              {filteredComments.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">No comments match the current filter.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredComments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
