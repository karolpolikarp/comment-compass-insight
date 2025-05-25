
// Simple sentiment analysis utility
// In a real app, you'd use a more sophisticated NLP library or API

interface SentimentWord {
  word: string;
  score: number;
}

// Basic sentiment lexicon (simplified for demo)
const positiveWords: SentimentWord[] = [
  { word: 'amazing', score: 0.8 },
  { word: 'awesome', score: 0.7 },
  { word: 'excellent', score: 0.8 },
  { word: 'fantastic', score: 0.8 },
  { word: 'great', score: 0.6 },
  { word: 'good', score: 0.5 },
  { word: 'love', score: 0.7 },
  { word: 'perfect', score: 0.8 },
  { word: 'wonderful', score: 0.7 },
  { word: 'outstanding', score: 0.8 },
  { word: 'brilliant', score: 0.7 },
  { word: 'superb', score: 0.7 },
  { word: 'helpful', score: 0.6 },
  { word: 'useful', score: 0.5 },
  { word: 'nice', score: 0.4 },
  { word: 'thanks', score: 0.4 },
  { word: 'appreciate', score: 0.5 }
];

const negativeWords: SentimentWord[] = [
  { word: 'terrible', score: -0.8 },
  { word: 'awful', score: -0.8 },
  { word: 'horrible', score: -0.8 },
  { word: 'bad', score: -0.6 },
  { word: 'worst', score: -0.9 },
  { word: 'hate', score: -0.8 },
  { word: 'sucks', score: -0.7 },
  { word: 'garbage', score: -0.7 },
  { word: 'boring', score: -0.5 },
  { word: 'useless', score: -0.6 },
  { word: 'waste', score: -0.6 },
  { word: 'disappointing', score: -0.6 },
  { word: 'poor', score: -0.5 },
  { word: 'stupid', score: -0.7 },
  { word: 'annoying', score: -0.5 }
];

export const analyzeSentiment = (text: string): number => {
  // Convert to lowercase and split into words
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  let totalScore = 0;
  let wordCount = 0;
  
  // Check for positive words
  words.forEach(word => {
    const positiveMatch = positiveWords.find(pw => word.includes(pw.word));
    if (positiveMatch) {
      totalScore += positiveMatch.score;
      wordCount++;
    }
    
    const negativeMatch = negativeWords.find(nw => word.includes(nw.word));
    if (negativeMatch) {
      totalScore += negativeMatch.score;
      wordCount++;
    }
  });
  
  // Handle negations (simple approach)
  const negationWords = ['not', 'no', 'never', 'nothing', 'nobody', 'nowhere', 'neither', 'nor'];
  let hasNegation = false;
  
  for (let i = 0; i < words.length - 1; i++) {
    if (negationWords.includes(words[i])) {
      // Check if the next word is positive/negative and flip it
      const nextWord = words[i + 1];
      const positiveMatch = positiveWords.find(pw => nextWord.includes(pw.word));
      const negativeMatch = negativeWords.find(nw => nextWord.includes(nw.word));
      
      if (positiveMatch || negativeMatch) {
        hasNegation = true;
        totalScore *= -0.5; // Flip and reduce intensity
      }
    }
  }
  
  // If no sentiment words found, analyze basic patterns
  if (wordCount === 0) {
    // Check for exclamation marks (slightly positive)
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 0) {
      totalScore += exclamationCount * 0.1;
    }
    
    // Check for question marks (neutral to slightly negative)
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount > 1) {
      totalScore -= 0.1;
    }
    
    // Check for all caps (could be positive or negative, assume slightly negative)
    if (text === text.toUpperCase() && text.length > 10) {
      totalScore -= 0.2;
    }
  }
  
  // Normalize score to -1 to 1 range
  let normalizedScore = wordCount > 0 ? totalScore / wordCount : totalScore;
  
  // Add some randomness for demo purposes to make it more interesting
  normalizedScore += (Math.random() - 0.5) * 0.3;
  
  // Clamp to -1 to 1 range
  return Math.max(-1, Math.min(1, normalizedScore));
};
