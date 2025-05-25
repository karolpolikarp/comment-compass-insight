
import React from 'react';
import { Comment } from '@/pages/Index';

interface CommentCardProps {
  comment: Comment;
}

export const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) return 'text-green-600 bg-green-50 border-green-200';
    if (sentiment < -0.2) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getSentimentEmoji = (sentiment: number) => {
    if (sentiment > 0.4) return '😊';
    if (sentiment > 0.2) return '🙂';
    if (sentiment > -0.2) return '😐';
    if (sentiment > -0.4) return '🙁';
    return '😠';
  };

  const formatSentimentScore = (sentiment: number) => {
    return sentiment > 0 ? `+${(sentiment * 100).toFixed(0)}` : `${(sentiment * 100).toFixed(0)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{comment.author}</span>
          <span className="text-2xl">{getSentimentEmoji(comment.sentiment)}</span>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(comment.sentiment)}`}>
          {formatSentimentScore(comment.sentiment)}%
        </div>
      </div>
      
      <p className="text-gray-700 leading-relaxed">{comment.text}</p>
      
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <span className="capitalize">{comment.sentimentLabel} sentiment</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              comment.sentiment > 0 ? 'bg-green-500' : comment.sentiment < 0 ? 'bg-red-500' : 'bg-gray-400'
            }`}
            style={{ 
              width: `${Math.abs(comment.sentiment) * 100}%`,
              marginLeft: comment.sentiment < 0 ? `${100 - Math.abs(comment.sentiment) * 100}%` : '0'
            }}
          />
        </div>
      </div>
    </div>
  );
};
