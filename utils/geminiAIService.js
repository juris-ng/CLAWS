// utils/geminiAIService.js
import axios from 'axios';
import Constants from 'expo-constants';

// Get Gemini API key from environment variables
const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const makeRequestWithRetry = async (payload, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        GEMINI_API_URL,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
          },
          timeout: 30000
        }
      );
      return response;
    } catch (error) {
      if (error.response?.status === 503 && attempt < maxRetries) {
        const waitTime = attempt * 2000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
};

function handleGeminiError(error, contextMsg) {
  if (error.code === 'ECONNABORTED') {
    return { success: false, error: `Request timeout (${contextMsg})` };
  }
  if (error.response?.status === 429) {
    return { success: false, error: `Rate limit exceeded for Gemini AI (${contextMsg})` };
  }
  if (error.response?.status === 503) {
    return { success: false, error: `Gemini AI service overloaded, try again soon (${contextMsg})` };
  }
  if (error.response?.status === 400) {
    return { success: false, error: 'Invalid API key. See https://aistudio.google.com/apikey' };
  }
  return { 
    success: false, 
    error: error.response?.data?.error?.message || `Failed to connect to AI service (${contextMsg})`
  };
}

export const GeminiAIService = {
  // 1. Improve Petition
  improvePetition: async (petitionText) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `You are a petition writing expert. Rewrite this petition to be more compelling, clear, and professional.
- Provide ONLY ONE improved version, not multiple options.
- Start directly with the improved petition text.
Original petition:
${petitionText}

Improved petition:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        improvedText: response.data.candidates[0].content.parts[0].text
      };
    } catch (error) {
      return handleGeminiError(error, 'improving the petition');
    }
  },

  // 2. Suggest Petition Titles
  suggestTitles: async (description) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `Based on this petition description, suggest exactly 3 compelling titles (maximum 60 characters each).
RULES:
- Only the titles, numbered 1, 2, 3
- No explanations
Petition description:
${description}
Titles:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        titles: response.data.candidates[0].content.parts[0].text
      };
    } catch (error) {
      return handleGeminiError(error, 'suggesting titles');
    }
  },

  // 3. Analyze Sentiment
  analyzeSentiment: async (text) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `Analyze the sentiment of this text.
- Respond with ONLY ONE WORD: positive, neutral, or negative.
Text: ${text}
Sentiment:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      const sentiment = response.data.candidates[0].content.parts[0].text.trim().toLowerCase().replace(/[^a-z]/g, '');
      return { success: true, sentiment };
    } catch (error) {
      return handleGeminiError(error, 'analyzing sentiment');
    }
  },

  // 4. Categorize Petition
  categorizePetition: async (petitionText) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `Categorize this petition into ONE category.
- Respond with ONLY ONE WORD: education, health, environment, justice, infrastructure, governance, economy, or other.
Petition: ${petitionText}
Category:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      const category = response.data.candidates[0].content.parts[0].text.trim().toLowerCase().replace(/[^a-z]/g, '');
      return { success: true, category };
    } catch (error) {
      return handleGeminiError(error, 'categorizing petition');
    }
  },

  // 5. Summarize Texts
  summarizeText: async (text, maxLength = 3) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `Summarize the following text in ${maxLength} sentences. Only give the summary.
Text: ${text}
Summary:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        summary: response.data.candidates[0].content.parts[0].text.trim()
      };
    } catch (error) {
      return handleGeminiError(error, 'summarizing text');
    }
  },

  // 6. Generate Dashboard Insight/Recommendation
  generateInsight: async (context) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `You are an analytics and governance expert. Based on this JSON data, generate ONE actionable insight, and a short ("do this next") recommendation.
Data: ${JSON.stringify(context)}
Insight:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        insight: response.data.candidates[0].content.parts[0].text.trim()
      };
    } catch (error) {
      return handleGeminiError(error, 'generating insight');
    }
  },

  // 7. Predict Trends/Simulate Scenarios
  predictTrend: async (historicalData, metric, intervention) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `Given the following trend data in JSON and hypothetical intervention, predict (in a couple of sentences) the change in ${metric} over the next 30 days.
Past data: ${JSON.stringify(historicalData)}
Intervention: "${intervention}"
Prediction:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        prediction: response.data.candidates[0].content.parts[0].text.trim()
      };
    } catch (error) {
      return handleGeminiError(error, 'predicting trend');
    }
  },

  // 8. Toxicity/Content Moderation
  detectToxicity: async (text) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `Analyze this text and respond with ONLY one word: "toxic" or "clean".
Text: ${text}
Label:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        label: response.data.candidates[0].content.parts[0].text.trim().toLowerCase()
      };
    } catch (error) {
      return handleGeminiError(error, 'detecting toxicity');
    }
  },

  // 9. Assistant Q&A
  answerQuestion: async (question, context = null) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const prompt = context
      ? `Context: ${JSON.stringify(context)}\nQuestion: ${question}\nAnswer:`
      : `Question: ${question}\nAnswer:`;
    const payload = {
      contents: [{
        parts: [{ text: `You are a helpful analytics and governance assistant. ${prompt}` }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        answer: response.data.candidates[0].content.parts[0].text.trim()
      };
    } catch (error) {
      return handleGeminiError(error, 'answering question');
    }
  },

  // 10. Personalized Nudge
  generateNudge: async (userStats) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `Given this user's recent activity as JSON, suggest ONE actionable, specific AI nudge to increase positive engagement.
User stats: ${JSON.stringify(userStats)}
Nudge:`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        nudge: response.data.candidates[0].content.parts[0].text.trim()
      };
    } catch (error) {
      return handleGeminiError(error, 'generating nudge');
    }
  },

  // 11. AI Policy Drafting
  draftPolicy: async (topic, context = null) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const prompt = context
      ? `Policy topic: ${topic}\nContext: ${context}\nPolicy:`
      : `Policy topic: ${topic}\nPolicy:`;
    const payload = {
      contents: [{
        parts: [{
          text: `Draft a brief, clear, actionable organizational policy.
${prompt}`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      return {
        success: true,
        policy: response.data.candidates[0].content.parts[0].text.trim()
      };
    } catch (error) {
      return handleGeminiError(error, 'drafting policy');
    }
  },

  // 12. Personalized Petition Feed Ranking
  rankPetitions: async ({ profile, petitions }) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `
You are an expert petition recommender system. Given this member's profile and a list of petitions, output ONLY a JSON array of the petition IDs re-ordered from most to least relevant for this user. 

- Consider: category match, topics, prior activity, popular/trending petitions, and relevance to user's interests.
- Respond ONLY with the array of IDs, nothing else.

Member profile (JSON): ${JSON.stringify(profile)}
Petitions (JSON): ${JSON.stringify(petitions.map(p => ({
  id: p.id,
  title: p.title,
  category: p.category,
  tags: p.tags,
  upvotes: p.upvotes,
  region: p.region
})))} 

RankedPetitionIds:
`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      let rankedIds = [];
      try {
        rankedIds = JSON.parse(response.data.candidates[0].content.parts[0].text.trim());
      } catch (e) {
        // fallback: manual split or log error
      }
      return { success: true, rankedIds };
    } catch (error) {
      return handleGeminiError(error, 'personalizing petition feed');
    }
  },

  // 13. Personalized Smart Filter/Search Suggestions
  suggestPetitionFilters: async (profile, petitions, recentSearches = []) => {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'AI service not configured. Please add your API key to environment variables' };
    }
    const payload = {
      contents: [{
        parts: [{
          text: `
Given this user's profile and the list of existing petitions, suggest 3 personalized filter or smart search ideas for them (short phrases only).

RULES:
- Respond as an array of 3 JSON strings (no explanations)
- Filters can be topics, regions, urgency, trending tags, or things based on past activity.
- Example output: ["Urgent in my county", "Health with most upvotes", "Similar to my past signatures"]

Member profile: ${JSON.stringify(profile)}
Recent searches: ${JSON.stringify(recentSearches)}
Current petitions: ${JSON.stringify(petitions.map(p => ({
  title: p.title,
  category: p.category,
  tags: p.tags,
  region: p.region,
})))} 

PersonalizedFilters:
`
        }]
      }]
    };
    try {
      const response = await makeRequestWithRetry(payload);
      let filters = [];
      try {
        filters = JSON.parse(response.data.candidates[0].content.parts[0].text.trim());
      } catch (e) {
        // fallback: plain text, possibly split on new lines
      }
      return { success: true, filters };
    } catch (error) {
      return handleGeminiError(error, 'suggesting personalized filters');
    }
  },

};
