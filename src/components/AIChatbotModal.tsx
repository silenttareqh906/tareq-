import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, PhoneCall, Send, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isError?: boolean;
}

interface AIChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotline?: string;
  whatsapp?: string;
}

export function AIChatbotModal({
  isOpen,
  onClose,
  hotline = '01994618066',
  whatsapp = '8801994618066',
}: AIChatbotModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'bot',
      text: 'আসসালামু আলাইকুম! KYNZO Tech সাপোর্টে আপনাকে স্বাগতম। স্মার্টওয়াচ, ANC ইয়ারবাডস, GaN চার্জার, ওয়ারেন্টি অথবা অর্ডার বিষয়ে যেকোনো তথ্য জানতে আমাকে প্রশ্ন করতে পারেন।',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'ডেলিভারি চার্জ কত?',
    'বিকাশে পেমেন্ট কিভাবে করবো?',
    'ANC ইয়ারবাডসের দাম কত?',
    'অর্ডার ট্র্যাক করতে চাই',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const sendMessage = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = (await res.json()) as { reply?: string };
        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: data.reply as string,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          return;
        }
      }

      const errData = contentType.includes('application/json')
        ? ((await res.json()) as { error?: string })
        : {};
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text:
            errData.error ||
            'AI সাপোর্ট সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে সরাসরি কল অথবা WhatsApp করুন।',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'নেটওয়ার্ক সমস্যার কারণে উত্তর পাওয়া যায়নি। সরাসরি কল অথবা WhatsApp-এ যোগাযোগ করুন।',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-20 sm:right-6 z-50 w-[92vw] sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-6 duration-200">
      <div className="bg-gradient-to-r from-[#0B1120] to-[#1E293B] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2563EB]/30 border border-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm font-display">KYNZO Tech Support</h3>
            <p className="text-[10px] text-slate-300">স্মার্ট গ্যাজেট ও অর্ডার অ্যাসিস্ট্যান্ট</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC] text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'bot' && (
              <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#2563EB] text-white rounded-tr-xs'
                  : msg.isError
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-xs shadow-2xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              <span
                className={`text-[9px] block text-right mt-1 ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 italic text-[11px]">
            <Bot className="w-4 h-4 text-[#2563EB] animate-spin" />
            <span>KYNZO উত্তর লিখছে...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#2563EB] hover:text-white rounded-full text-[11px] font-semibold text-[#1D4ED8] transition-colors shrink-0 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="গ্যাজেট বা অর্ডার নিয়ে প্রশ্ন লিখুন..."
          className="flex-1 bg-slate-50 border border-slate-300 focus:border-[#2563EB] focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="px-3 py-1.5 bg-[#EFF6FF] text-[10px] text-slate-600 flex items-center justify-between border-t border-slate-200">
        <a
          href={`tel:${hotline}`}
          className="text-[#1D4ED8] font-bold hover:underline transition-colors flex items-center gap-1"
        >
          <PhoneCall className="w-3 h-3" />
          <span>Call For Order</span>
        </a>
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#15803D] font-bold flex items-center gap-1 hover:underline"
        >
          <MessageCircle className="w-3 h-3 fill-current" />
          <span>WhatsApp Live</span>
        </a>
      </div>
    </div>
  );
}
