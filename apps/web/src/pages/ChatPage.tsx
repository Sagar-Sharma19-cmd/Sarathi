import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [i18n.language]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (message: string) => {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      return api.sendChatMessage(message, i18n.language as 'en' | 'hi', history);
    },
    onSuccess: data => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response, timestamp: new Date() },
      ]);
      // Speak the response
      speakText(data.response);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input.trim());
    setInput('');
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert(t('chat.voiceNotSupported') || 'Voice input not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const quickQuestions = i18n.language === 'hi'
    ? [
        'मेरा क्रेडिट स्कोर क्या है?',
        'मुझे कितना लोन मिल सकता है?',
        'SafeSend कैसे काम करता है?',
        'मेरा स्कोर कैसे बढ़ाएं?',
      ]
    : [
        'What is my credit score?',
        'How much loan can I get?',
        'How does SafeSend work?',
        'How to improve my score?',
      ];

  return (
    <Layout title={i18n.language === 'hi' ? 'AI सहायक 🤖' : 'AI Assistant 🤖'} showBack>
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="mb-4 card text-center">
            <div className="text-4xl mb-2">🤖💬</div>
            <h2 className="text-lg font-semibold mb-2">
              {i18n.language === 'hi' ? 'नमस्ते! मैं आपकी मदद के लिए यहाँ हूँ' : 'Hello! How can I help you today?'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {i18n.language === 'hi'
                ? 'मुझसे क्रेडिट स्कोर, लोन, बचत, SafeSend के बारे में पूछें'
                : 'Ask me about credit scores, loans, savings, or SafeSend'}
            </p>

            {/* Quick Questions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-xs px-3 py-2 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <button
              onClick={toggleVoiceInput}
              disabled={chatMutation.isPending}
              className={`btn ${isListening ? 'btn-primary animate-pulse' : 'btn-secondary'}`}
            >
              {isListening ? '🎤 ...' : '🎤'}
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder={i18n.language === 'hi' ? 'अपना सवाल यहाँ लिखें...' : 'Type your question...'}
              className="input flex-1"
              disabled={chatMutation.isPending}
            />
            {isSpeaking ? (
              <button onClick={stopSpeaking} className="btn btn-secondary">
                🔇
              </button>
            ) : null}
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="btn btn-primary"
            >
              {chatMutation.isPending ? '⏳' : '📤'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {i18n.language === 'hi'
              ? '🎤 माइक दबाएं बोलने के लिए • 🔊 जवाब सुनने के लिए स्पीकर ऑन करें'
              : '🎤 Press mic to speak • 🔊 Responses are read aloud automatically'}
          </p>
        </div>
      </div>
    </Layout>
  );
}

