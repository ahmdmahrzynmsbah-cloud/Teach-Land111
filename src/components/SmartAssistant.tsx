import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, Loader2, Sparkles, BookOpen, Calculator, BrainCircuit } from 'lucide-react';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SmartAssistantProps {
  userData: any;
}

export default function SmartAssistant({ userData }: SmartAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `أهلاً بك ${userData?.name?.split(' ')[0] || 'يا صديقي'}! 👋\nأنا المساعد الذكي الخاص بك. يمكنني مساعدتك في شرح الدروس، حل المسائل المعقدة، أو تلخيص أي موضوع.\nكيف يمكنني مساعدتك اليوم؟`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const historyContext = messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));

      const sysContext = `أنت مساعد ذكي لطلاب المدارس. اسم المستخدم هو ${userData?.name || 'طالب'}. يجب أن تكون إجاباتك باللغة العربية، واضحة، سهلة الفهم، ومشجعة. استخدم تنسيق Markdown (عناوين، قوائم، كود) عند الحاجة لتنظيم الشرح.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMessage,
          history: historyContext,
          context: sysContext
        })
      });

      const data = await response.json();
      
      if (response.ok && data.text) {
        setMessages(prev => [
          ...prev, 
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.text,
            timestamp: new Date()
          }
        ]);
      } else {
        throw new Error(data.error || 'فشل الاتصال بالمساعد الذكي');
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'عذراً، حدث خطأ أثناء الاتصال. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { text: 'اشرح لي درس حساب المثلثات بطريقة مبسطة', icon: Calculator },
    { text: 'لخص لي أسباب الثورة الفرنسية', icon: BookOpen },
    { text: 'كيف أنظم وقتي للمذاكرة بفعالية؟', icon: BrainCircuit }
  ];

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-xl overflow-hidden relative" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00B4D8]/10 to-indigo-500/10 dark:from-[#D4AF37]/10 dark:to-amber-500/10 p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#00B4D8] to-indigo-500 dark:from-[#D4AF37] dark:to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              المساعد الذكي <Sparkles className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
            </h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">مدعوم بتقنية الذكاء الاصطناعي لمساعدتك في كل خطوة</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/50 dark:bg-[#0D0D12]/50">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gray-200 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300'
                : 'bg-gradient-to-tr from-[#00B4D8] to-indigo-500 dark:from-[#D4AF37] dark:to-amber-500 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user'
                ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white rounded-tl-none'
                : 'bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2D3D] text-gray-800 dark:text-gray-200 rounded-tr-none shadow-sm'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
              ) : (
                <div className="markdown-body text-sm font-medium leading-relaxed prose dark:prose-invert max-w-none">
                  <Markdown>{msg.content}</Markdown>
                </div>
              )}
              <div className={`text-[10px] mt-2 font-bold opacity-60 ${msg.role === 'user' ? 'text-white' : 'text-gray-500'}`}>
                {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-[#00B4D8] to-indigo-500 dark:from-[#D4AF37] dark:to-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2D3D] rounded-2xl rounded-tr-none p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">جاري التفكير...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-[#1A1A24] border-t border-gray-100 dark:border-[#2D2D3D] shrink-0">
        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => setInput(sug.text)}
                className="text-xs font-bold bg-gray-50 hover:bg-gray-100 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D4D] text-gray-600 dark:text-gray-300 py-2 px-4 rounded-full transition-colors flex items-center gap-2 border border-gray-200 dark:border-gray-700"
              >
                <sug.icon className="w-3 h-3 text-[#00B4D8] dark:text-[#D4AF37]" />
                {sug.text}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3 relative">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl py-3 px-4 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] text-gray-900 dark:text-white font-medium resize-none min-h-[50px] max-h-[150px] transition-all"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-[50px] w-[50px] shrink-0 bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -translate-x-0.5" />}
          </button>
        </form>
        <div className="text-center mt-3">
            <span className="text-[10px] text-gray-400 font-bold">يمكن للذكاء الاصطناعي ارتكاب أخطاء. يرجى التحقق من المعلومات الهامة.</span>
        </div>
      </div>
    </div>
  );
}
