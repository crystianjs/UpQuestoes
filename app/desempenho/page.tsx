'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { BarChart3, Award, CheckCircle2, XCircle, Clock, Calendar, Filter, Brain, HelpCircle, FileText } from 'lucide-react';

interface QuestaoRegistro {
  id: string;
  materia: string;
  total_feitas: number;
  acertos: number;
  erros: number;
  created_at: string;
}

interface RedacaoRegistro {
  id: string;
  tema: string;
  tempo_gasto_segundos: number;
  nota?: number | null;
  created_at: string;
}

interface SimuladoRegistro {
  id: string;
  titulo: string;
  acertos: number;
  total_questoes: number;
  nota: number;
  created_at: string;
}

const PROMPT_MESTRE_FLASHCARDS = `Com base no assunto de estudo fornecido, transforme-o estritamente no seguinte formato JSON válido (sem markdown extra fora das chaves). 
IMPORTANTE: Gere cartões focados em memorização ativa para concurso público (padrão VUNESP), contendo ID único, assunto, tag curta, classes de estilo para a tag, pergunta, respostaResumida, macete de detalhes e icone (ex: fa-brain, fa-book, fa-bolt).

{
  "disciplina": "Nome exato da Disciplina do Edital TJSP",
  "titulo": "Título descritivo do Deck de Flashcards",
  "banca": "VUNESP",
  "cards": [
    {
      "id": "fc-identificador-unico",
      "assunto": "Subtema ou Tópico",
      "tag": "Palavra Chave",
      "tagClasses": "bg-amber-500/20 text-amber-300 border-amber-500/30",
      "pergunta": "Pergunta direta e desafiadora estimulando a lembrança ativa?",
      "respostaResumida": "Resposta clara, objetiva e direta que aparece ao virar o cartão.",
      "detalhes": "Detalhe complementar, macete ou pegadinha clássica da banca VUNESP sobre o tema.",
      "icone": "fa-brain"
    }
  ]
}`;

export default function DesempenhoPage() {
  const router = useRouter();
  const [questoes, setQuestoes] = useState<QuestaoRegistro[]>([]);
  const [redacoes, setRedacoes] = useState<RedacaoRegistro[]>([]);
  const [simulados, setSimulados] = useState<SimuladoRegistro[]>([]);
  
  // Estado para armazenar os flashcards e o progresso vindos do localStorage
  const [flashcardsListados, setFlashcardsListados] = useState<Array<{ id: string; assunto: string; disciplina: string; status: string; pergunta: string }>>([]);
  const [flashcardsStats, setFlashcardsStats] = useState({ bom: 0, medio: 0, ruim: 0, total: 0 });

  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todas' | 'semana' | 'mes'>('todas');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);

  useEffect(() => {
    async function carregarDados() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const userId = session.user.id;

      const { data: qData } = await supabase
        .from('user_questions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: rData } = await supabase
        .from('redaccoes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: sData } = await supabase
        .from('simulados')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (qData) setQuestoes(qData);
      if (rData) setRedacoes(rData);
      if (sData) setSimulados(sData);

      // Leitura robusta do localStorage para os Flashcards e Progresso
      try {
        const savedDecks = localStorage.getItem('upquest_flashcards');
        const savedProgresso = localStorage.getItem('upquest_flashcards_progresso');

        let listaCards: Array<{ id: string; assunto: string; disciplina: string; status: string; pergunta: string }> = [];
        let b = 0, m = 0, r = 0;

        if (savedDecks) {
          const decksObj = JSON.parse(savedDecks);
          const progressoObj = savedProgresso ? JSON.parse(savedProgresso) : {};

          Object.keys(decksObj).forEach((discKey) => {
            const deck = decksObj[discKey];
            if (deck && deck.cards && Array.isArray(deck.cards)) {
              deck.cards.forEach((card: any) => {
                const statusCard = progressoObj[card.id] || 'pendente';
                if (statusCard === 'bom') b++;
                if (statusCard === 'medio') m++;
                if (statusCard === 'ruim') r++;

                listaCards.push({
                  id: card.id,
                  assunto: card.assunto || 'Assunto Geral',
                  disciplina: deck.disciplina || discKey,
                  status: statusCard,
                  pergunta: card.pergunta
                });
              });
            }
          });
        }

        setFlashcardsListados(listaCards);
        setFlashcardsStats({ bom: b, medio: m, ruim: r, total: b + m + r });
      } catch (e) {
        console.error("Erro ao carregar flashcards do localStorage", e);
      }

      setLoading(false);
    }

    carregarDados();
  }, [router]);

  const questoesFiltradas = useMemo(() => {
    const agora = new Date();
    return questoes.filter((q) => {
      const dataQ = new Date(q.created_at);
      if (filtroPeriodo === 'semana') {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(agora.getDate() - 7);
        return dataQ >= umaSemanaAtras;
      } else if (filtroPeriodo === 'mes') {
        return (
          dataQ.getMonth() === agora.getMonth() &&
          dataQ.getFullYear() === agora.getFullYear()
        );
      }
      return true;
    });
  }, [questoes, filtroPeriodo]);

  const totalFeitas = questoesFiltradas.reduce((acc, q) => acc + q.total_feitas, 0);
  const totalAcertos = questoesFiltradas.reduce((acc, q) => acc + q.acertos, 0);
  const totalErros = questoesFiltradas.reduce((acc, q) => acc + q.erros, 0);
  const aproveitamento = totalFeitas > 0 ? ((totalAcertos / totalFeitas) * 100).toFixed(1) : '0';

  const mediaSimulados = simulados.length > 0
    ? (simulados.reduce((acc, s) => acc + Number(s.nota), 0) / simulados.length).toFixed(1)
    : '0.0';

  const formatarTempoRedacao = (segundosTotais: number) => {
    if (!segundosTotais || segundosTotais === 0) return '0s';
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;
    if (horas > 0) return `${horas}h ${minutos}m`;
    if (minutos > 0) return `${minutos}m ${segundos > 0 ? `${segundos}s` : ''}`.trim();
    return `${segundos}s`;
  };

  // Função para renderizar a nota da redação com cores dinâmicas (0-5 Vermelho, 5-7 Azul, 7-10 Verde)
  const renderizarBadgeNota = (nota?: number | null) => {
    if (nota === null || nota === undefined) {
      return <span className="text-zinc-600 italic text-[11px]">Sem nota</span>;
    }

    let estilos = 'bg-zinc-900/60 border-zinc-700/40 text-zinc-300';

    if (nota >= 0 && nota < 5) {
      estilos = 'bg-rose-950/60 border-rose-600/40 text-rose-400';
    } else if (nota >= 5 && nota < 7) {
      estilos = 'bg-blue-950/60 border-blue-600/40 text-blue-400';
    } else if (nota >= 7 && nota <= 10) {
      estilos = 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400';
    }

    return (
      <span className={`px-2 py-0.5 rounded-md font-bold border text-xs ${estilos}`}>
        {nota.toFixed(1)}
      </span>
    );
  };

  const copiarPromptMestre = () => {
    navigator.clipboard.writeText(PROMPT_MESTRE_FLASHCARDS);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 3000);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-red-500" />
              Desempenho e Estatísticas — UPQUESTOES
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Acompanhe a sua evolução para o concurso do TJSP (VUNESP).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
            <Filter className="w-4 h-4 text-zinc-400 ml-2" />
            <button 
              onClick={() => setFiltroPeriodo('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroPeriodo === 'todas' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Geral
            </button>
            <button 
              onClick={() => setFiltroPeriodo('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroPeriodo === 'semana' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Esta Semana
            </button>
            <button 
              onClick={() => setFiltroPeriodo('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroPeriodo === 'mes' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Este Mês
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 text-sm">A carregar métricas...</div>
        ) : (
          <>
            {/* Cards de Métricas Principais (5 colunas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Questões no Período</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{totalFeitas}</h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">Filtro: <strong className="text-zinc-300 uppercase">{filtroPeriodo}</strong></span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Taxa de Acerto</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{aproveitamento}%</h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">{totalAcertos} acertos / {totalErros} erros</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total de Redações</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{redacoes.length}</h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">Treinos cronometrados</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Média em Simulados</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{mediaSimulados} <span className="text-xs font-normal text-zinc-500">/ 10</span></h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">{simulados.length} simulados registados</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Flashcards Revistos</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{flashcardsStats.total}</h3>
                <span className="text-[10px] text-emerald-400 mt-1 block">🟢 {flashcardsStats.bom} | 🟡 {flashcardsStats.medio} | 🔴 {flashcardsStats.ruim}</span>
              </div>

            </div>

            {/* SEÇÃO DEDICADA E EXCLUSIVA PARA OS FLASHCARDS (RUIM, MÉDIO, BOM) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <h2 className="text-lg font-bold text-white">Caderno de Revisão: Status Detalhado por Assunto</h2>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-600/30 font-semibold">🟢 Bom: {flashcardsStats.bom}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/50 text-amber-400 border border-amber-600/30 font-semibold">🟡 Médio: {flashcardsStats.medio}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-950/50 text-rose-400 border border-rose-600/30 font-semibold">🔴 Ruim: {flashcardsStats.ruim}</span>
                </div>
              </div>

              {flashcardsListados.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <HelpCircle className="w-10 h-10 text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-400">Nenhum flashcard gerado ou avaliado no Caderno de Revisão ainda.</p>
                  <button 
                    onClick={() => router.push('/caderno-revisao')}
                    className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition-all shadow"
                  >
                    Ir para Caderno de Revisão
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-1">
                  {flashcardsListados.map((fc) => (
                    <div key={fc.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-inner">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 truncate max-w-[140px]">
                            {fc.disciplina}
                          </span>
                          <span className="text-xs font-bold text-amber-300 truncate max-w-[150px]">{fc.assunto}</span>
                        </div>
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{fc.pergunta}</p>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">Sua avaliação:</span>
                        <div>
                          {fc.status === 'bom' && (
                            <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1 shadow">
                              🟢 Bom
                            </span>
                          )}
                          {fc.status === 'medio' && (
                            <span className="px-3 py-1 bg-amber-950/80 border border-amber-600/40 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1 shadow">
                              🟡 Médio
                            </span>
                          )}
                          {fc.status === 'ruim' && (
                            <span className="px-3 py-1 bg-rose-950/80 border border-rose-600/40 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1 shadow">
                              🔴 Precisa Revisar
                            </span>
                          )}
                          {fc.status === 'pendente' && (
                            <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-500 text-[11px] font-medium rounded-xl">
                              ⚪ Não Avaliado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Secção de Listagens Detalhadas (Questões, Simulados e Redações) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Histórico de Questões */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-red-500" />
                  Questões ({filtroPeriodo.toUpperCase()})
                </h2>

                {questoesFiltradas.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum registo de questões.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {questoesFiltradas.map((q) => (
                      <div key={q.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-white">{q.materia}</h4>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(q.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-400 flex items-center gap-0.5 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />{q.acertos}</span>
                          <span className="text-red-400 flex items-center gap-0.5 font-semibold"><XCircle className="w-3.5 h-3.5" />{q.erros}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Simulados Recentes */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Simulados VUNESP
                  </h2>
                  <button 
                    onClick={() => router.push('/simulados')}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold"
                  >
                    Ver todos →
                  </button>
                </div>

                {simulados.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum simulado registado.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {simulados.map((s) => (
                      <div key={s.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-white">{s.titulo}</h4>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(s.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-red-950/40 border border-red-600/30 text-red-400 px-2 py-1 rounded-lg font-bold">
                            Nota: {s.nota}
                          </span>
                          <p className="text-[10px] text-zinc-400 mt-1">{s.acertos}/{s.total_questoes} acertos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Redações com Nota e Tempo Gasto */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Redações VUNESP
                  </h2>
                  {/* Legenda de Desempenho da Nota */}
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>0-5</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>5-7</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>7-10</span>
                  </div>
                </div>

                {redacoes.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma redação registada.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {redacoes.map((r) => (
                      <div key={r.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-white leading-snug truncate max-w-[170px]">{r.tema}</h4>
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {new Date(r.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800/60 p-2.5 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-red-500" />
                            <span className="font-mono text-[11px]">{formatarTempoRedacao(r.tempo_gasto_segundos)}</span>
                          </div>
                          <div>
                            {renderizarBadgeNota(r.nota)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
}