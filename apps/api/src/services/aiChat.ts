import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { ScoreModel } from '../models/Score.js';
import { LoanModel } from '../models/Loan.js';
import { TransactionModel } from '../models/Transaction.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

const genAI = env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(env.GEMINI_API_KEY)
  : null;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getChatResponse(
  userId: string,
  userMessage: string,
  language: 'en' | 'hi',
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  // Try Gemini first, fallback to simple responses if it fails
  if (genAI && env.GEMINI_API_KEY) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
      }

      const latestScore = await ScoreModel.findOne({ userId }).sort({ createdAt: -1 });
      const activeLoan = await LoanModel.findOne({ userId, status: { $in: ['approved', 'disbursed'] } });
      const recentTransactions = await TransactionModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);

      const systemPrompt = buildSystemPrompt(language, {
        user,
        score: latestScore,
        loan: activeLoan,
        transactions: recentTransactions,
      });

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const fullPrompt = `${systemPrompt}\n\n---\n\nUser Question: ${userMessage}`;

      console.log('Sending message to Gemini:', userMessage);
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      console.log('✅ Gemini response received:', text?.substring(0, 100));
      
      return text || (language === 'hi' ? 'माफ़ करें, मैं जवाब नहीं दे सका।' : 'I apologize, I could not generate a response.');
    } catch (error: any) {
      console.warn('⚠️ Gemini failed, using fallback:', error.message);
      // Fallback to simple responses
      return getSimpleResponse(userId, userMessage, language);
    }
  }

  // No Gemini configured, use fallback
  console.log('Using fallback responses (Gemini not configured)');
  return getSimpleResponse(userId, userMessage, language);
}

function buildSystemPrompt(
  language: 'en' | 'hi',
  context: {
    user: any;
    score: any;
    loan: any;
    transactions: any[];
  }
): string {
  const { user, score, loan, transactions } = context;

  if (language === 'hi') {
    return `आप Sarathi के AI सहायक हैं, जो भारतीय प्रवासी मज़दूरों की मदद करते हैं। आप हिंदी में विनम्रता से जवाब दें।

**उपयोगकर्ता का डेटा:**
- फ़ोन: ${user.phoneE164}
- राज्य: ${user.stateCode}
- क्रेडिट स्कोर: ${score ? `${score.score} (बैंड ${score.band})` : 'अभी तक नहीं'}
- सक्रिय लोन: ${loan ? `₹${loan.principal} (${loan.status})` : 'नहीं'}
- हाल के लेन-देन: ${transactions.length} लेन-देन

**आपकी भूमिका:**
1. वित्तीय सवालों का जवाब आसान भाषा में दें
2. क्रेडिट स्कोर, लोन, बचत के बारे में समझाएं
3. SafeSend का उपयोग कैसे करें बताएं
4. व्यक्तिगत सलाह दें (उनके डेटा के आधार पर)
5. प्रोत्साहित करें और सकारात्मक रहें

**महत्वपूर्ण नियम:**
- छोटे, स्पष्ट वाक्य (2-3 लाइन)
- संख्याओं में ₹ का उपयोग करें
- अगर आप निश्चित नहीं हैं तो स्पष्ट रूप से कहें
- कभी गलत जानकारी न दें

**उदाहरण सवाल और जवाब:**
Q: "मेरा क्रेडिट स्कोर कैसे बढ़ेगा?"
A: "आपका स्कोर ${score?.score || '---'} है। इसे बढ़ाने के लिए: 1) हर महीने ₹2000+ का remittance करें, 2) समय पर लोन चुकाएं, 3) लगातार transactions करें।"

Q: "मुझे कितना लोन मिल सकता है?"
A: "आपके बैंड ${score?.band || 'N/A'} के आधार पर, आप ${score?.band === 'A' ? '₹5,000' : score?.band === 'B' ? '₹3,000' : '₹1,000'} तक का लोन ले सकते हैं। ब्याज दर 18% APR है।"`;
  }

  return `You are Sarathi's AI assistant, helping Indian migrant workers with financial queries. Be empathetic, clear, and action-oriented.

**User Context:**
- Phone: ${user.phoneE164}
- State: ${user.stateCode}
- Credit Score: ${score ? `${score.score} (Band ${score.band})` : 'Not yet available'}
- Active Loan: ${loan ? `₹${loan.principal} (${loan.status})` : 'None'}
- Recent Transactions: ${transactions.length} transactions

**Your Role:**
1. Answer financial questions in simple terms
2. Explain credit scores, loans, savings, insurance
3. Guide on using SafeSend feature
4. Provide personalized advice based on their data
5. Be encouraging and positive

**Important Rules:**
- Keep responses short and clear (2-3 sentences max)
- Use ₹ for amounts
- If unsure, say so clearly and suggest contacting support
- Never provide incorrect information
- Be culturally sensitive to migrant workers

**Example Q&A:**
Q: "How can I improve my credit score?"
A: "Your score is ${score?.score || '---'}. To improve: 1) Send ₹2000+ monthly remittances consistently, 2) Repay loans on time, 3) Build transaction history over 3-6 months."

Q: "How much loan can I get?"
A: "Based on your Band ${score?.band || 'N/A'}, you qualify for up to ${score?.band === 'A' ? '₹5,000' : score?.band === 'B' ? '₹3,000' : '₹1,000'} at 18% APR. Apply in the Loan section!"`;
}

// Simple rule-based fallback responses
async function getSimpleResponse(userId: string, message: string, language: 'en' | 'hi'): Promise<string> {
  const user = await UserModel.findById(userId);
  const score = await ScoreModel.findOne({ userId }).sort({ createdAt: -1 });
  const loan = await LoanModel.findOne({ userId, status: { $in: ['approved', 'disbursed'] } });

  const lower = message.toLowerCase();

  if (language === 'hi') {
    if (lower.includes('स्कोर') || lower.includes('score')) {
      return score
        ? `आपका क्रेडिट स्कोर ${score.score} है (बैंड ${score.band})। ${score.band === 'A' ? 'बहुत बढ़िया!' : 'अच्छा है!'} स्कोर बढ़ाने के लिए नियमित रूप से ₹2000+ भेजें।`
        : 'अभी आपका स्कोर उपलब्ध नहीं है। कुछ लेन-देन करें और फिर देखें।';
    }
    if (lower.includes('लोन') || lower.includes('loan')) {
      return loan
        ? `आपका ₹${loan.principal} का लोन ${loan.status === 'disbursed' ? 'चालू' : 'स्वीकृत'} है।`
        : `बैंड ${score?.band || 'N/A'} के आधार पर आप ${score?.band === 'A' ? '₹5,000' : score?.band === 'B' ? '₹3,000' : '₹1,000'} तक लोन ले सकते हैं।`;
    }
    if (lower.includes('safesend')) {
      return 'SafeSend से आप सुरक्षित रूप से merchant को पैसे भेज सकते हैं। पैसा तब तक लॉक रहता है जब तक proof verify नहीं हो जाता।';
    }
    return 'मैं आपकी क्रेडिट स्कोर, लोन और SafeSend में मदद कर सकता हूं। कोई specific सवाल पूछें।';
  }

  // English responses
  if (lower.includes('score') || lower.includes('credit')) {
    return score
      ? `Your credit score is ${score.score} (Band ${score.band}). ${score.band === 'A' ? 'Excellent!' : 'Good!'} To improve, send ₹2000+ regularly.`
      : 'Your score is not available yet. Complete some transactions to generate your score.';
  }
  if (lower.includes('loan')) {
    return loan
      ? `You have an active loan of ₹${loan.principal} (${loan.status}).`
      : `Based on Band ${score?.band || 'N/A'}, you can get up to ${score?.band === 'A' ? '₹5,000' : score?.band === 'B' ? '₹3,000' : '₹1,000'} at 18% APR.`;
  }
  if (lower.includes('safesend')) {
    return 'SafeSend lets you send money safely to merchants. Funds are locked in escrow until proof is verified by admin.';
  }
  return 'I can help with credit scores, loans, and SafeSend. Ask me a specific question!';
}

