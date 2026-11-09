'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { BarChart3, Award, CheckCircle2, XCircle, Clock, Calendar, Filter, FileText, Tag, Star, BookOpen, AlertCircle } from 'lucide-react';

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

interface FlashcardDetalhado {
  id: string;
  disciplina: string;
  assunto: string;
  pergunta: string;
  tag: string;
  statusAvaliacao?: string | null;
}

export default function DesempenhoPage() {
  const router = useRouter();
  const [questoes, setQuestoes] = useState<QuestaoRegistro[]>([]);
  const [redacoes, setRedacoes] = useState<RedacaoRegistro[]>([]);
  const [simulados, setSimulados] = useState<SimuladoRegistro[]>([]);
  const [cardsRevisao, setCardsRevisao] = useState<FlashcardDetalhado[]>([]);
  
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

      const [qRes, rRes, sRes, revRes] = await Promise.all([
        supabase.from('user_questions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('redaccoes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('simulados').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('caderno_revisao').select('*')
      ]);

      if (qRes.data) setQuestoes(qRes.data);
      if (rRes.data) setRedacoes(rRes.data);
      if (sRes.data) setSimulados(sRes.data);
      
      if (revRes.data) {
        let todosCards: FlashcardDetalhado[] = [];
        revRes.data.forEach((item: any) => {
          let rawCards = item.cards;
          if (typeof rawCards === 'string') {
            try { rawCards = JSON.parse(rawCards); } catch (e) { rawCards = []; }
          }
          if (Array.isArray(rawCards)) {
            rawCards.forEach((c: any) => {
              todosCards.push({
                id: c.id,
                disciplina: item.disciplina,
                assunto: c.assunto || c.titulo || "Geral",
                pergunta: c.pergunta || c.titulo || "Questão de Revisão",
                tag: c.tag || "VUNESP",
                statusAvaliacao: c.statusAvaliacao
              });
            });
          }
        });
        setCardsRevisao(todosCards);
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

  const cardsImportanteRevisar = cardsRevisao.filter(c => c.statusAvaliacao === 'importante_revisar');
  const cardsRevisaoGeral = cardsRevisao.filter(c => c.statusAvaliacao === 'revisao_geral');

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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filtroPeriodo === 'todas' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Geral
            </button>
            <button 
              onClick={() => setFiltroPeriodo('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filtroPeriodo === 'semana' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Esta Semana
            </button>
            <button 
              onClick={() => setFiltroPeriodo('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filtroPeriodo === 'mes' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Importante Revisar</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{cardsImportanteRevisar.length}</h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">Flashcards marcados</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Revisão Geral</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{cardsRevisaoGeral.length}</h3>
                <span className="text-[11px] text-zinc-500 mt-1 block">Flashcards marcados</span>
              </div>
            </div>

            {/* SEÇÕES DETALHADAS DE REVISÃO (UM ABAIXO DO OUTRO POR MATÉRIA E ASSUNTO) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              
              {/* Importante Revisar para Prova */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    Importante Revisar para Prova ({cardsImportanteRevisar.length})
                  </h2>
                  <span className="text-xs font-mono bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2.5 py-1 rounded-lg">
                    Prioridade Alta
                  </span>
                </div>

                {cardsImportanteRevisar.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum flashcard marcado como importante para revisar.</p>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {cardsImportanteRevisar.map((c) => (
                      <div key={c.id} className="bg-zinc-900/60 border border-amber-400/30 rounded-xl p-4 space-y-2 hover:border-amber-400/60 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            {c.disciplina}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            {c.tag}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-300">Assunto: <span className="text-white">{c.assunto}</span></p>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{c.pergunta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Revisão Geral */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Revisão Geral ({cardsRevisaoGeral.length})
                  </h2>
                  <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                    Acompanhamento
                  </span>
                </div>

                {cardsRevisaoGeral.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum flashcard marcado para revisão geral.</p>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {cardsRevisaoGeral.map((c) => (
                      <div key={c.id} className="bg-zinc-900/60 border border-blue-500/30 rounded-xl p-4 space-y-2 hover:border-blue-500/60 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {c.disciplina}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            {c.tag}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-300">Assunto: <span className="text-white">{c.assunto}</span></p>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{c.pergunta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Listagens Detalhadas (Questões, Simulados e Redações) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
              
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
                  <button onClick={() => router.push('/simulados')} className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer">
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

              {/* Redações */}
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