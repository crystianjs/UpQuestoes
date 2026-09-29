'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { Send, Bot, User, Loader2, Database, Trash2, PlusCircle } from 'lucide-react';
import { perguntarNvidiaAction } from '../actions/chatAction';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o teu mentor do UPQUEST-ES. Estou pronto para te ajudar com o concurso do TJSP (VUNESP). Clica no botão de atualizar panorama para carregar o teu raio-X de desempenho.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      const currentUserId = session.user.id;
      setUserId(currentUserId);

      const { data: historico, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: true });

      if (!error && historico && historico.length > 0) {
        setMessages(historico.map(m => ({ id: m.id, role: m.role, content: m.content })));
      }
    }
    initChat();
  }, [router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const salvarMensagemBanco = async (role: 'user' | 'assistant', content: string) => {
    if (!userId) return;
    await supabase.from('chat_mensagens').insert([
      { user_id: userId, role, content }
    ]);
  };

  const criarChatNovo = async () => {
    if (!userId || loading) return;
    await supabase.from('chat_mensagens').delete().eq('user_id', userId);

    const mensagemInicial: Message = {
      role: 'assistant',
      content: 'Novo chat iniciado! Sou o teu mentor do UPQUEST-ES para o concurso do TJSP (VUNESP). Como te posso ajudar hoje?'
    };

    setMessages([mensagemInicial]);
    await salvarMensagemBanco('assistant', mensagemInicial.content);
  };

  const handleGerarPanorama = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const [simRes, redRes, questoesRes, melRes] = await Promise.all([
        supabase.from('simulados').select('*').order('created_at', { ascending: false }),
        supabase.from('redaccoes').select('*').order('created_at', { ascending: false }),
        supabase.from('user_questions').select('*'),
        supabase.from('pontos_melhoria').select('*')
      ]);

      const simulados = simRes.data || [];
      const redaccoes = redRes.data || [];
      const questoes = questoesRes.data || [];
      const melhorias = melRes.data || [];

      const totalAcertos = questoes.reduce((acc, q) => acc + (q.acertos || 0), 0);
      const totalErros = questoes.reduce((acc, q) => acc + (q.erros || 0), 0);
      const totalQuestoesResolvidas = questoes.reduce((acc, q) => acc + (q.acertos || 0) + (q.erros || 0), 0);

      let relatorio = `PANORAMA DE DESEMPENHO ATUALIZADO (TJSP / VUNESP)\n\n`;
      
      relatorio += `SIMULADOS REALIZADOS (${simulados.length}):\n`;
      if (simulados.length > 0) {
        simulados.forEach((s: any) => {
          relatorio += `- ${s.titulo || 'Simulado'} | Acertos: ${s.acertos || 0}/${s.total_questoes || 0} | Nota: ${s.nota || 0}\n`;
        });
      } else {
        relatorio += `- Nenhum simulado registado ainda.\n`;
      }

      relatorio += `\nREDAÇÕES REGISTADAS (${redaccoes.length}):\n`;
      if (redaccoes.length > 0) {
        redaccoes.forEach((r: any, idx: number) => {
          const notaRedacao = r.nota !== null && r.nota !== undefined ? r.nota : 'Pendente';
          relatorio += `- Redação ${idx + 1} | Tema: ${r.tema || 'Geral'} | Nota: ${notaRedacao}\n`;
        });
      } else {
        relatorio += `- Nenhuma redação registada ainda.\n`;
      }

      relatorio += `\nESTATÍSTICAS DE QUESTÕES E ESTUDO:\n`;
      relatorio += `- Total de Registos de Questões: ${questoes.length}\n`;
      relatorio += `- Total Resolvido no Período: ${totalQuestoesResolvidas > 0 ? totalQuestoesResolvidas : questoes.length}\n`;
      relatorio += `- Acertos: ${totalAcertos} | Erros: ${totalErros}\n`;
      relatorio += `- Pontos de Melhoria Mapeados: ${melhorias.length}\n\n`;

      relatorio += `DIRETRIZ ESTRATÉGICA VUNESP:\nCom base nestes dados consolidados do teu sistema, deves manter o ritmo em Língua Portuguesa e Direito Processual, focando na correção rigorosa dos temas de redação.`;

      const userText = 'Quero atualizar o meu panorama de estudos com os dados mais recentes do sistema.';
      
      const novasMensagens: Message[] = [
        ...messages,
        { role: 'user', content: userText },
        { role: 'assistant', content: relatorio }
      ];

      setMessages(novasMensagens);

      await salvarMensagemBanco('user', userText);
      await salvarMensagemBanco('assistant', relatorio);

    } catch (error: any) {
      console.error('Erro ao consultar banco:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput('');

    const novasMensagens: Message[] = [...messages, { role: 'user', content: userMessageText }];
    setMessages(novasMensagens);
    setLoading(true);

    await salvarMensagemBanco('user', userMessageText);

    try {
      const historicoParaIa = novasMensagens.map(m => ({
        role: m.role,
        content: m.content
      }));

      const resultado = await perguntarNvidiaAction(historicoParaIa);
      const respostaIaTexto = resultado.response;

      setMessages(prev => [...prev, { role: 'assistant', content: respostaIaTexto }]);
      await salvarMensagemBanco('assistant', respostaIaTexto);
    } catch (error) {
      console.error('Erro ao comunicar com a IA:', error);
      const erroMsg = 'Desculpa, ocorreu um erro ao contactar o serviço de inteligência artificial.';
      setMessages(prev => [...prev, { role: 'assistant', content: erroMsg }]);
      await salvarMensagemBanco('assistant', erroMsg);
    } finally {
      setLoading(false);
    }
  };

  const limparHistorico = async () => {
    if (!userId) return;
    await supabase.from('chat_mensagens').delete().eq('user_id', userId);
    setMessages([
      {
        role: 'assistant',
        content: 'Histórico limpo. Olá! Sou o teu mentor do UPQUEST-ES. Clica no botão de atualizar panorama para carregar o teu raio-X de desempenho.'
      }
    ]);
  };

  return (
    <div className="h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-4 flex flex-col gap-4 overflow-hidden">
        
        <div className="flex justify-between items-center bg-zinc-950 border border-zinc-900 p-4 rounded-2xl shadow-lg shrink-0">
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Mentor IA - TJSP / VUNESP</h2>
            <p className="text-xs text-zinc-400">Histórico salvo e sincronizado no Supabase</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={criarChatNovo}
              title="Criar chat novo"
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 border border-zinc-800 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-red-500" />
              <span>Novo Chat</span>
            </button>
            <button
              onClick={limparHistorico}
              title="Limpar histórico de conversas"
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-500 p-2 rounded-xl text-xs transition-all flex items-center justify-center border border-zinc-800 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleGerarPanorama}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {loading ? 'A carregar dados...' : 'Atualizar Panorama de Dados'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-2xl">
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
                A processar resposta inteligente...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="relative shrink-0 pb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pede um tema de redação, tira dúvidas de português ou direito..."
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