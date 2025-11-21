require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('API Key:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 20) + '...' : 'NOT FOUND');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Explain how AI works in a few words'
    });

    console.log('\n✅ Success!');
    console.log('Response:', response.text);
  } catch (error) {
    console.error('\n❌ Error:');
    console.error('Message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

testGemini();
