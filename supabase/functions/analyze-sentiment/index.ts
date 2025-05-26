
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { comments } = await req.json()
    
    // Get OpenAI API key from secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Process comments in batches to avoid token limits
    const analyzedComments = []
    const batchSize = 10

    for (let i = 0; i < comments.length; i += batchSize) {
      const batch = comments.slice(i, i + batchSize)
      const batchTexts = batch.map(c => c.text).join('\n---\n')
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Analyze the sentiment of each comment separated by "---". Return a JSON array with sentiment scores from -1 (most negative) to 1 (most positive) for each comment. Only return the JSON array, no other text.`
            },
            {
              role: 'user',
              content: batchTexts
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const sentimentScores = JSON.parse(data.choices[0].message.content)
      
      // Combine comments with sentiment scores
      batch.forEach((comment, index) => {
        const sentiment = sentimentScores[index] || 0
        analyzedComments.push({
          ...comment,
          sentiment,
          sentimentLabel: sentiment < -0.2 ? 'negative' : sentiment > 0.2 ? 'positive' : 'neutral'
        })
      })

      // Add delay to respect rate limits
      if (i + batchSize < comments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analyzedComments 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
