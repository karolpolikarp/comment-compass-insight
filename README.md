
# YouTube Comment Sentiment Analyzer (Python)

A Flask web application that analyzes the sentiment of YouTube comments using AI.

## Features

- Fetch real YouTube comments using the YouTube Data API
- Analyze sentiment using OpenAI's ChatGPT (with TextBlob fallback)
- Interactive web interface with real-time filtering
- SQLite database for storing analysis results
- Sentiment visualization with charts

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get API Keys

#### YouTube Data API Key (Required)
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key

#### OpenAI API Key (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the API key

Note: If you don't provide an OpenAI API key, the app will use TextBlob for sentiment analysis (less accurate but free).

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API keys:

```
YOUTUBE_API_KEY=your_actual_youtube_api_key
OPENAI_API_KEY=your_actual_openai_api_key
```

### 4. Run the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

## How to Use

1. Open your browser and go to `http://localhost:5000`
2. Enter a YouTube video URL in the input field
3. Click "Analyze Comments" 
4. Wait for the analysis to complete
5. View the results:
   - Sentiment statistics (positive, negative, neutral percentages)
   - Interactive sentiment chart
   - Filterable list of comments with sentiment scores
6. Use the sentiment slider to filter comments by sentiment

## Project Structure

```
├── app.py              # Main Flask application
├── templates/
│   └── index.html      # Web interface
├── requirements.txt    # Python dependencies
├── .env.example       # Environment variables template
├── .env              # Your actual environment variables (create this)
├── comments.db       # SQLite database (created automatically)
└── README.md         # This file
```

## Database Schema

The app uses SQLite with two tables:

- `analyses`: Stores analysis metadata (video info, stats)
- `comments`: Stores individual comments with sentiment scores

## API Endpoints

- `GET /`: Main web interface
- `POST /analyze`: Analyze video comments
- `GET /recent-analyses`: Get recent analysis history

## Troubleshooting

### Common Issues

1. **"YouTube API not configured"**
   - Make sure you have set the `YOUTUBE_API_KEY` in your `.env` file
   - Verify the API key is valid and YouTube Data API v3 is enabled

2. **"Video not found"**
   - Check that the YouTube URL is valid and public
   - Some videos may have comments disabled

3. **OpenAI API errors**
   - If you get OpenAI errors, the app will automatically fall back to TextBlob
   - Check your OpenAI API key and usage limits

4. **Port already in use**
   - If port 5000 is busy, change the port in `app.py`: `app.run(port=5001)`

## Notes

- The app analyzes up to 100 comments per video (YouTube API limit)
- Sentiment scores range from -1 (most negative) to 1 (most positive)
- Analysis results are saved locally in SQLite database
- The web interface is responsive and works on mobile devices
