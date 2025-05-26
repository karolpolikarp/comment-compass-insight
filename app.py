
from flask import Flask, render_template, request, jsonify
import os
import requests
from datetime import datetime
import sqlite3
from textblob import TextBlob
import openai
from googleapiclient.discovery import build
import re

app = Flask(__name__)

# Configuration
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Initialize OpenAI
openai.api_key = OPENAI_API_KEY

# Initialize YouTube API
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY) if YOUTUBE_API_KEY else None

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect('comments.db')
    cursor = conn.cursor()
    
    # Create analyses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT NOT NULL,
            video_title TEXT NOT NULL,
            video_url TEXT NOT NULL,
            total_comments INTEGER DEFAULT 0,
            positive_count INTEGER DEFAULT 0,
            negative_count INTEGER DEFAULT 0,
            neutral_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create comments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id INTEGER,
            youtube_comment_id TEXT NOT NULL,
            text TEXT NOT NULL,
            author TEXT NOT NULL,
            sentiment REAL NOT NULL,
            sentiment_label TEXT NOT NULL,
            like_count INTEGER DEFAULT 0,
            published_at TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (analysis_id) REFERENCES analyses (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def extract_video_id(url):
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
        r'youtube\.com\/embed\/([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_youtube_comments(video_id, max_results=100):
    """Fetch comments from YouTube API"""
    if not youtube:
        raise Exception("YouTube API not configured")
    
    try:
        # Get video details
        video_response = youtube.videos().list(
            part='snippet',
            id=video_id
        ).execute()
        
        if not video_response['items']:
            raise Exception("Video not found")
        
        video_title = video_response['items'][0]['snippet']['title']
        
        # Get comments
        comments_response = youtube.commentThreads().list(
            part='snippet',
            videoId=video_id,
            maxResults=max_results,
            order='relevance'
        ).execute()
        
        comments = []
        for item in comments_response['items']:
            comment = item['snippet']['topLevelComment']['snippet']
            comments.append({
                'id': item['snippet']['topLevelComment']['id'],
                'text': comment['textDisplay'],
                'author': comment['authorDisplayName'],
                'published_at': comment['publishedAt'],
                'like_count': comment.get('likeCount', 0)
            })
        
        return comments, video_title
        
    except Exception as e:
        raise Exception(f"Failed to fetch YouTube comments: {str(e)}")

def analyze_sentiment_openai(comments):
    """Analyze sentiment using OpenAI API"""
    if not OPENAI_API_KEY:
        # Fallback to TextBlob if OpenAI is not configured
        return analyze_sentiment_textblob(comments)
    
    analyzed_comments = []
    batch_size = 10
    
    for i in range(0, len(comments), batch_size):
        batch = comments[i:i + batch_size]
        batch_texts = '\n---\n'.join([c['text'] for c in batch])
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "Analyze the sentiment of each comment separated by '---'. Return a JSON array with sentiment scores from -1 (most negative) to 1 (most positive) for each comment. Only return the JSON array, no other text."
                    },
                    {
                        "role": "user",
                        "content": batch_texts
                    }
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            sentiment_scores = eval(response.choices[0].message.content)
            
            for j, comment in enumerate(batch):
                sentiment = sentiment_scores[j] if j < len(sentiment_scores) else 0
                sentiment_label = 'negative' if sentiment < -0.2 else 'positive' if sentiment > 0.2 else 'neutral'
                
                analyzed_comments.append({
                    **comment,
                    'sentiment': sentiment,
                    'sentiment_label': sentiment_label
                })
                
        except Exception as e:
            print(f"OpenAI API error: {e}")
            # Fallback to TextBlob for this batch
            for comment in batch:
                blob = TextBlob(comment['text'])
                sentiment = blob.sentiment.polarity
                sentiment_label = 'negative' if sentiment < -0.2 else 'positive' if sentiment > 0.2 else 'neutral'
                
                analyzed_comments.append({
                    **comment,
                    'sentiment': sentiment,
                    'sentiment_label': sentiment_label
                })
    
    return analyzed_comments

def analyze_sentiment_textblob(comments):
    """Analyze sentiment using TextBlob (fallback)"""
    analyzed_comments = []
    
    for comment in comments:
        blob = TextBlob(comment['text'])
        sentiment = blob.sentiment.polarity
        sentiment_label = 'negative' if sentiment < -0.2 else 'positive' if sentiment > 0.2 else 'neutral'
        
        analyzed_comments.append({
            **comment,
            'sentiment': sentiment,
            'sentiment_label': sentiment_label
        })
    
    return analyzed_comments

def save_analysis(video_id, video_title, video_url, analyzed_comments):
    """Save analysis to database"""
    conn = sqlite3.connect('comments.db')
    cursor = conn.cursor()
    
    # Calculate stats
    total_comments = len(analyzed_comments)
    positive_count = len([c for c in analyzed_comments if c['sentiment_label'] == 'positive'])
    negative_count = len([c for c in analyzed_comments if c['sentiment_label'] == 'negative'])
    neutral_count = total_comments - positive_count - negative_count
    
    # Insert analysis
    cursor.execute('''
        INSERT INTO analyses (video_id, video_title, video_url, total_comments, 
                            positive_count, negative_count, neutral_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (video_id, video_title, video_url, total_comments, positive_count, negative_count, neutral_count))
    
    analysis_id = cursor.lastrowid
    
    # Insert comments
    for comment in analyzed_comments:
        cursor.execute('''
            INSERT INTO comments (analysis_id, youtube_comment_id, text, author, 
                                sentiment, sentiment_label, like_count, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (analysis_id, comment['id'], comment['text'], comment['author'],
              comment['sentiment'], comment['sentiment_label'], 
              comment['like_count'], comment['published_at']))
    
    conn.commit()
    conn.close()
    
    return analysis_id

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        video_url = data.get('video_url')
        
        if not video_url:
            return jsonify({'error': 'Video URL is required'}), 400
        
        # Extract video ID
        video_id = extract_video_id(video_url)
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        # Get comments
        comments, video_title = get_youtube_comments(video_id)
        if not comments:
            return jsonify({'error': 'No comments found for this video'}), 400
        
        # Analyze sentiment
        analyzed_comments = analyze_sentiment_openai(comments)
        
        # Save to database
        analysis_id = save_analysis(video_id, video_title, video_url, analyzed_comments)
        
        # Calculate stats
        total_comments = len(analyzed_comments)
        positive_count = len([c for c in analyzed_comments if c['sentiment_label'] == 'positive'])
        negative_count = len([c for c in analyzed_comments if c['sentiment_label'] == 'negative'])
        neutral_count = total_comments - positive_count - negative_count
        
        return jsonify({
            'success': True,
            'analysis_id': analysis_id,
            'video_title': video_title,
            'comments': analyzed_comments,
            'stats': {
                'total': total_comments,
                'positive': positive_count,
                'negative': negative_count,
                'neutral': neutral_count,
                'positive_percent': round((positive_count / total_comments) * 100) if total_comments > 0 else 0,
                'negative_percent': round((negative_count / total_comments) * 100) if total_comments > 0 else 0,
                'neutral_percent': round((neutral_count / total_comments) * 100) if total_comments > 0 else 0
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recent-analyses')
def recent_analyses():
    """Get recent analyses"""
    conn = sqlite3.connect('comments.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM analyses 
        ORDER BY created_at DESC 
        LIMIT 10
    ''')
    
    analyses = []
    for row in cursor.fetchall():
        analyses.append({
            'id': row[0],
            'video_id': row[1],
            'video_title': row[2],
            'video_url': row[3],
            'total_comments': row[4],
            'positive_count': row[5],
            'negative_count': row[6],
            'neutral_count': row[7],
            'created_at': row[8]
        })
    
    conn.close()
    return jsonify(analyses)

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)
