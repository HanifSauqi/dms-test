const geminiService = require('../services/geminiService');
const ollamaService = require('../services/ollamaService');

function optimizeContent(text) {
  if (!text) return '';

  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .replace(/\t/g, ' ')
    .trim();
}

async function extractNouns(query) {
  try {
    const aiProvider = process.env.AI_PROVIDER || 'gemini';
    const aiService = aiProvider === 'ollama' ? ollamaService : geminiService;

    if (!aiService.isEnabled()) {
      return fallbackExtraction(query);
    }

    const prompt = `Extract ONLY NOUNS and NUMBERS from this search query. Remove all verbs, adjectives, prepositions, and connectors.

Query: "${query}"

Return ONLY a JSON array of nouns/numbers, nothing else:
["noun1", "noun2", "number1", ...]

Examples:
Input: "CV dengan pengalaman 5 tahun di bidang teknik"
Output: ["CV", "pengalaman", "5", "tahun", "bidang", "teknik"]

Input: "invoice yang belum dibayar bulan ini"
Output: ["invoice", "bulan"]

Now extract from the query above:`;

    let nouns = [];

    if (aiProvider === 'ollama') {
      const response = await aiService.executeWithRetry(async () => {
        return await axios.post(`${aiService.baseUrl}/api/analyze`, {
          prompt,
          system: "Extract only nouns and numbers as a JSON array.",
          model: aiService.model
        });
      });
      nouns = response.data.data;
    } else {
      const response = await aiService.ai.models.generateContent({
        model: aiService.config.defaultModels.search,
        contents: prompt
      });
      const text = response.text;
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (!jsonMatch) throw new Error('Failed to parse nouns from Gemini');
      nouns = JSON.parse(jsonMatch[0]);
    }

    if (!nouns || nouns.length === 0) {
      console.warn('Failed to parse nouns from AI, using fallback');
      return fallbackExtraction(query);
    }

    return nouns;

  } catch (error) {
    console.error('Noun extraction error:', error.message);
    return fallbackExtraction(query);
  }
}

function fallbackExtraction(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2);
}

async function extractKeywords(text) {
  // OPTIMIZATION: Use fallback directly instead of AI to save quota
  // This saves 1 API call per search (50% reduction in quota usage)
  const nouns = fallbackExtraction(text);
  return [...new Set(nouns)];
}

function calculateKeywordScore(content, keywords) {
  if (!content || keywords.length === 0) return 0;

  const contentLower = content.toLowerCase();
  let matchCount = 0;

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = contentLower.match(regex);
    if (matches) {
      matchCount += matches.length;
    }
  });

  const normalizedScore = Math.min(100, (matchCount / keywords.length) * 50);
  return normalizedScore;
}

module.exports = {
  optimizeContent,
  extractNouns,
  extractKeywords,
  calculateKeywordScore
};
