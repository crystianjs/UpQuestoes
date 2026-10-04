'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { BarChart3, Award, CheckCircle2, XCircle, Clock, Calendar, Filter, Brain, HelpCircle, FileText, Tag } from 'lucide-react';

interface QuestaoRegistro {
  id: string;
  materia: string;
  assunto?: string;
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

export default function DesempenhoPage() {
  const router = useRouter();
  const [questoes, setQuestoes] = useState<QuestaoRegistro[]>([]);
  const [redacoes, setRedacoes] = useState<RedacaoRegistro[]>([]);
  const [simulados, setSimulados] = useState<SimuladoRegistro[]>([]);
  
  // Estado para armazenar os flashcards sincronizados da tabela dedicada 'flashcards_progresso'
  const [flashcardsListados, setFlashcardsListados] = useState<Array<{ id: string; assunto: string; disciplina: string; status: string; pergunta: string }>>([]);
  const [flashcardsStats, setFlashcardsStats] = useState({ bom: 0, medio: 0, ruim: 0, total: 0 });

  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todas' | 'semana' | 'mes'>('todas');

  useEffect(() => {
    async function carregarDados() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const userId = session.user.id;

      // Execução em paralelo consultando a tabela dedicada 'flashcards_progresso'
      const [qRes, rRes, sRes, fRes] = await Promise.all([
        supabase.from('user_questions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('redaccoes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('simulados').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('flashcards_progresso').select('*').eq('user_id', userId)
      ]);

      if (qRes.data) setQuestoes(qRes.data);
      if (rRes.data) setRedacoes(rRes.data);
      if (sRes.data) setSimulados(sRes.data);

      // Processamento de Flashcards direto da tabela dedicada 'flashcards_progresso'
      try {
        let listaCards: Array<{ id: string; assunto: string; disciplina: string; status: string; pergunta: string }> = [];

        if (fRes.data && fRes.data.length > 0) {
          fRes.data.forEach((item: any) => {
            const statusCard = item.status || 'pendente';
            listaCards.push({
              id: item.card_id,
              assunto: item.assunto || 'Assunto Geral',
              disciplina: item.disciplina || 'Geral',
              status: statusCard,
              pergunta: item.pergunta || 'Pergunta do card'
            });
          });
        }

        // Ordenação inteligente priorizando os cards que precisam de revisão (ruim -> medio -> bom -> pendente)
        listaCards.sort((a, b) => {
          const peso: Record<string, number> = { ruim: 1, medio: 2, bom: 3, pendente: 4 };
          return (peso[a.status] || 5) - (peso[b.status] || 5);
        });

        let b = 0, m = 0, r = 0;
        listaCards.forEach((fc) => {
          if (fc.status === 'bom') b++;
          if (fc.status === 'medio') m++;
          if (fc.status === 'ruim') r++;
        });

        setFlashcardsListados(listaCards);
        setFlashcardsStats({ bom: b, medio: m, ruim: r, total: b + m + r });
      } catch (e) {
        console.error("Erro ao carregar flashcards", e);
      }

      setLoading(false);
    }

    carregarDados();
  }, [router]);

  const filtrarPorPeriodo = <T extends { created_at: string }>(itens: T[]) => {
    const agora = new Date();
    return itens.filter((item) => {
      const dataItem = new Date(item.created_at);
      if (filtroPeriodo === 'semana') {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(agora.getDate() - 7);
        return dataItem >= umaSemanaAtras;
      } else if (filtroPeriodo === 'mes') {
        return (
          dataItem.getMonth() === agora.getMonth() &&
          dataItem.getFullYear() === agora.getFullYear()
        );
      }
      return true;
    });
  };

  const questoesFiltradas = useMemo(() => filtrarPorPeriodo(questoes), [questoes, filtroPeriodo]);
  const redacoesFiltradas = useMemo(() => filtrarPorPeriodo(redacoes), [redacoes, filtroPeriodo]);
  const simuladosFiltrados = useMemo(() => filtrarPorPeriodo(simulados), [simulados, filtroPeriodo]);

  const totalFeitas = questoesFiltradas.reduce((acc, q) => acc + q.total_feitas, 0);
  const totalAcertos = questoesFiltradas.reduce((acc, q) => acc + q.acertos, 0);
  const totalErros = questoesFiltradas.reduce((acc, q) => acc + q.erros, 0);
  const aproveitamento = totalFeitas > 0 ? ((totalAcertos / totalFeitas) * 100).toFixed(1) : '0';

  const mediaSimulados = simuladosFiltrados.length > 0
    ? (simuladosFiltrados.reduce((acc, s) => acc + Number(s.nota), 0) / simuladosFiltrados.length).toFixed(1)
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

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-500" />
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroPeriodo === 'todas' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Geral
            </button>
            <button 
              onClick={() => setFiltroPeriodo('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroPeriodo === 'semana' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Esta Semana
            </button>
            <button 
              onClick={() => setFiltroPeriodo('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroPeriodo === 'mes' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Este Mês
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 text-sm">A carregar métricas...</div>
        ) : (
          <>
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Questões no Período</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{totalFeitas}</h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">Filtro: <strong className="text-zinc-300 uppercase">{filtroPeriodo}</strong></span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Taxa de Acerto</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{aproveitamento}%</h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">{totalAcertos} acertos / {totalErros} erros</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total de Redações</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{redacoesFiltradas.length}</h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">Treinos cronometrados</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Média em Simulados</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{mediaSimulados} <span className="text-xs font-normal text-zinc-500">/ 10</span></h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">{simuladosFiltrados.length} simulados registados</span>
              </div>

              {/* Card de Flashcards com destaque exclusivo em fundo amarelo/âmbar suave */}
              <div className="bg-gradient-to-br from-amber-950/60 via-zinc-950 to-zinc-950 border border-amber-500/60 rounded-2xl p-5 shadow-xl relative overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Flashcards Revistos</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{flashcardsStats.total}</h3>
                <span className="text-[10px] text-amber-300 mt-1 block">🟢 {flashcardsStats.bom} | 🟡 {flashcardsStats.medio} | 🔴 {flashcardsStats.ruim}</span>
              </div>
            </div>

            {/* SEÇÃO DE FLASHCARDS COM DESTAQUE EM AMARELO */}
            <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Brain className="w-6 h-6 text-amber-400" />
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
                  <HelpCircle className="w-10 h-10 text-amber-500/50 mx-auto" />
                  <p className="text-xs text-zinc-400">Nenhum flashcard avaliado na tabela dedicada ainda.</p>
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
                    <div key={fc.id} className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-inner">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 truncate max-w-[140px]">
                            {fc.disciplina}
                          </span>
                          <span className="text-xs font-bold text-amber-200 truncate max-w-[150px]">{fc.assunto}</span>
                        </div>
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{fc.pergunta}</p>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">Sua avaliação:</span>
                        <div>
                          {fc.status === 'bom' && (
                            <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-bold rounded-xl shadow">🟢 Bom</span>
                          )}
                          {fc.status === 'medio' && (
                            <span className="px-3 py-1 bg-amber-950/80 border border-amber-600/40 text-amber-300 text-xs font-bold rounded-xl shadow">🟡 Médio</span>
                          )}
                          {fc.status === 'ruim' && (
                            <span className="px-3 py-1 bg-rose-950/80 border border-rose-600/40 text-rose-300 text-xs font-bold rounded-xl shadow">🔴 Precisa Revisar</span>
                          )}
                          {fc.status === 'pendente' && (
                            <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-500 text-[11px] font-medium rounded-xl">⚪ Não Avaliado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Listagens Detalhadas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Histórico de Questões */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Questões ({filtroPeriodo.toUpperCase()})
                </h2>

                {questoesFiltradas.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum registo de questões.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {questoesFiltradas.map((q) => (
                      <div key={q.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex justify-between items-center">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white">{q.materia}</h4>
                          {q.assunto && (
                            <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {q.assunto}
                            </p>
                          )}
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
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
                    Simulados VUNESP ({filtroPeriodo.toUpperCase()})
                  </h2>
                  <button onClick={() => router.push('/simulados')} className="text-xs text-amber-400 hover:text-amber-300 font-semibold">
                    Ver todos →
                  </button>
                </div>

                {simuladosFiltrados.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum simulado registado.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {simuladosFiltrados.map((s) => (
                      <div key={s.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-white">{s.titulo}</h4>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(s.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-amber-950/40 border border-amber-600/30 text-amber-400 px-2 py-1 rounded-lg font-bold">
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
                    <FileText className="w-5 h-5 text-amber-500" />
                    Redações VUNESP ({filtroPeriodo.toUpperCase()})
                  </h2>
                </div>

                {redacoesFiltradas.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma redação registada.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {redacoesFiltradas.map((r) => (
                      <div key={r.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-white leading-snug truncate max-w-[170px]">{r.tema}</h4>
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {new Date(r.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800/60 p-2.5 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
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