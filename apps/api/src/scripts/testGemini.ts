import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('API Key present:', !!env.GEMINI_API_KEY);
  console.log('API Key starts with:', env.GEMINI_API_KEY?.substring(0, 10));

  if (!env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment!');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    console.log('Trying model: gemini-1.5-flash-latest');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    console.log('Sending test message...');
    const result = await model.generateContent('Say hello in Hindi and English');
    const response = await result.response;
    const text = response.text();

    console.log('✅ SUCCESS! Gemini response:');
    console.log(text);
    console.log('\n🎉 Gemini is working! Your chatbot should work now.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ FAILED! Error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

testGemini();

