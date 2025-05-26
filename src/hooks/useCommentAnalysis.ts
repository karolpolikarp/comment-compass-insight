
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Comment } from '@/pages/Index';

// Check if Supabase environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const useCommentAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeVideo = async (videoUrl: string): Promise<{
    comments: Comment[];
    videoTitle: string;
    analysisId: string;
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Supabase is configured
      if (!supabase) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      // Step 1: Scrape YouTube comments
      console.log('Scraping YouTube comments...');
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
        'scrape-youtube-comments',
        {
          body: { videoUrl }
        }
      );

      if (scrapeError || !scrapeData.success) {
        throw new Error(scrapeData?.error || 'Failed to scrape comments');
      }

      const { comments: rawComments, videoTitle, videoId } = scrapeData;

      if (!rawComments || rawComments.length === 0) {
        throw new Error('No comments found for this video');
      }

      // Step 2: Analyze sentiment with ChatGPT
      console.log('Analyzing sentiment with AI...');
      const { data: sentimentData, error: sentimentError } = await supabase.functions.invoke(
        'analyze-sentiment',
        {
          body: { comments: rawComments }
        }
      );

      if (sentimentError || !sentimentData.success) {
        throw new Error(sentimentData?.error || 'Failed to analyze sentiment');
      }

      const analyzedComments = sentimentData.analyzedComments;

      // Step 3: Save to database
      console.log('Saving analysis to database...');
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          video_id: videoId,
          video_title: videoTitle,
          video_url: videoUrl,
          total_comments: analyzedComments.length,
          positive_count: analyzedComments.filter(c => c.sentimentLabel === 'positive').length,
          negative_count: analyzedComments.filter(c => c.sentimentLabel === 'negative').length,
          neutral_count: analyzedComments.filter(c => c.sentimentLabel === 'neutral').length,
        })
        .select()
        .single();

      if (analysisError) {
        throw new Error('Failed to save analysis');
      }

      // Step 4: Save comments
      const commentsToInsert = analyzedComments.map(comment => ({
        analysis_id: analysisRecord.id,
        youtube_comment_id: comment.id,
        text: comment.text,
        author: comment.author,
        sentiment: comment.sentiment,
        sentiment_label: comment.sentimentLabel,
        like_count: comment.likeCount || 0,
        published_at: comment.publishedAt,
      }));

      const { error: commentsError } = await supabase
        .from('comments')
        .insert(commentsToInsert);

      if (commentsError) {
        console.error('Failed to save comments:', commentsError);
        // Don't throw here, analysis is still valid
      }

      return {
        comments: analyzedComments,
        videoTitle,
        analysisId: analysisRecord.id
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecentAnalyses = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error('Failed to fetch recent analyses');
    }

    return data;
  };

  return {
    analyzeVideo,
    getRecentAnalyses,
    isLoading,
    error,
    isSupabaseConfigured: !!supabase
  };
};
