'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { perguntarNvidiaAction } from '../actions/chatAction';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o teu mentor de IA do UPQUEST-ES. Estou pronto para te ajudar com dúvidas sobre o concurso do TJSP (VUNESP) e analisar o teu progresso em tempo real. O que gostarias de estudar hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function carregarSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setUserId(session.user.id);
    }

    carregarSessao();
  }, [router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput('');

    const novasMensagens: Message[] = [...messages, { role: 'user', content: userMessageText }];
    setMessages(novasMensagens);
    setLoading(true);

    try {
      // Passamos o array de mensagens e o ID do utilizador para que a Server Action aceda diretamente ao Supabase
      const res = await perguntarNvidiaAction(novasMensagens, userId || undefined);
      setMessages([...novasMensagens, { role: 'assistant', content: res.response }]);
    } catch (error: any) {
      setMessages([
        ...novasMensagens,
        { role: 'assistant', content: 'Ocorreu um erro inesperado ao comunicar com o mentor. Tenta novamente.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col justify-between">
        
        {/* Container do Chat */}
        <div className="space-y-6 overflow-y-auto pr-2 pb-6 flex-1 max-h-[calc(100vh-240px)]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center shrink-0 text-red-500 shadow-lg">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-xl ${
                  msg.role === 'user'
                    ? 'bg-red-600 text-white rounded-br-sm font-medium'
                    : 'bg-zinc-950 border border-zinc-800/80 text-zinc-200 rounded-bl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                  {msg.content}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-300 shadow-lg">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center shrink-0 text-red-500 shadow-lg">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-2xl px-4 py-3 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                A analisar os simulados e o teu progresso...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Envio */}
        <form onSubmit={handleSend} className="mt-4 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo sobre o seu desempenho, direito, redação..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-4 pr-14 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-all shadow-xl"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </main>
    </div>
  );
}