'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { BarChart3, Award, CheckCircle2, XCircle, Clock, Calendar, Filter, FileText, Tag, Star, BookOpen, Layers, Edit3, Trash2 } from 'lucide-react';

const DISCIPLINAS_TJSP = [
  "Língua Portuguesa",
  "Direito Penal",
  "Direito Processual Penal",
  "Direito Processual Civil",
  "Direito Constitucional",
  "Direito Administrativo",
  "Normas da Corregedoria",
  "Matemática",
  "Raciocínio Lógico",
  "Informática",
  "Atualidades",
  "Estatuto da Pessoa com Deficiência"
];

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
  const [filtroRevisao, setFiltroRevisao] = useState<'todos' | 'importante_revisar' | 'revisao_geral'>('todos');
  const [filtroMateriaRevisao, setFiltroMateriaRevisao] = useState<string>('todas');

  // Estados para edição inline de assunto nas questões
  const [editandoQuestaoId, setEditandoQuestaoId] = useState<string | null>(null);
  const [novoAssuntoQuestao, setNovoAssuntoQuestao] = useState<string>('');

  useEffect(() => {
    carregarDados();
  }, [router]);

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

  const salvarAssuntoQuestao = async (questaoId: string) => {
    const { error } = await supabase
      .from('user_questions')
      .update({ assunto: novoAssuntoQuestao })
      .eq('id', questaoId);

    if (error) {
      alert("Erro ao atualizar o assunto da questão.");
      return;
    }

    setQuestoes(prev => prev.map(q => q.id === questaoId ? { ...q, assunto: novoAssuntoQuestao } : q));
    setEditandoQuestaoId(null);
    setNovoAssuntoQuestao('');
  };

  const excluirQuestao = async (questaoId: string) => {
    if (!confirm("Deseja apagar este registo de questão?")) return;

    const { error } = await supabase
      .from('user_questions')
      .delete()
      .eq('id', questaoId);

    if (error) {
      alert("Erro ao excluir questão.");
      return;
    }

    setQuestoes(prev => prev.filter(q => q.id !== questaoId));
  };

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

  const cardsRevisaoFiltrados = useMemo(() => {
    let base = cardsRevisao;
    if (filtroRevisao === 'importante_revisar') {
      base = cardsImportanteRevisar;
    } else if (filtroRevisao === 'revisao_geral') {
      base = cardsRevisaoGeral;
    } else {
      base = cardsRevisao.filter(c => c.statusAvaliacao === 'importante_revisar' || c.statusAvaliacao === 'revisao_geral');
    }

    if (filtroMateriaRevisao !== 'todas') {
      base = base.filter(c => c.disciplina === filtroMateriaRevisao);
    }

    return base;
  }, [cardsRevisao, cardsImportanteRevisar, cardsRevisaoGeral, filtroRevisao, filtroMateriaRevisao]);

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

            {/* SEÇÃO DETALHADA DE REVISÕES COM FILTRO POR TIPO E MATÉRIA */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-500" />
                    Painel de Revisões por Matéria e Assunto
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Acompanhamento centralizado dos flashcards marcados para estudo focado.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* Filtro por Matéria */}
                  <select
                    value={filtroMateriaRevisao}
                    onChange={(e) => setFiltroMateriaRevisao(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500 font-semibold cursor-pointer"
                  >
                    <option value="todas">Todas as Matérias</option>
                    {DISCIPLINAS_TJSP.map((disc) => (
                      <option key={disc} value={disc}>{disc}</option>
                    ))}
                  </select>

                  {/* Filtro por Tipo de Revisão */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                    <button 
                      onClick={() => setFiltroRevisao('todos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filtroRevisao === 'todos' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setFiltroRevisao('importante_revisar')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filtroRevisao === 'importante_revisar' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Importante Revisar
                    </button>
                    <button 
                      onClick={() => setFiltroRevisao('revisao_geral')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filtroRevisao === 'revisao_geral' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Revisão Geral
                    </button>
                  </div>
                </div>
              </div>

              {cardsRevisaoFiltrados.length === 0 ? (
                <p className="text-xs text-zinc-500 py-10 text-center">Nenhum flashcard encontrado para os filtros selecionados.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cardsRevisaoFiltrados.map((c) => {
                    const isImportante = c.statusAvaliacao === 'importante_revisar';
                    return (
                      <div 
                        key={c.id} 
                        className={`rounded-xl p-4 space-y-3 transition-all border ${
                          isImportante 
                            ? 'bg-amber-950/10 border-amber-400/40 hover:border-amber-400/70' 
                            : 'bg-blue-950/10 border-blue-500/40 hover:border-blue-500/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isImportante 
                              ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' 
                              : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                          }`}>
                            {c.disciplina}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                            {isImportante ? <Star className="w-3 h-3 text-amber-400 fill-current" /> : <BookOpen className="w-3 h-3 text-blue-400" />}
                            {isImportante ? 'Prioridade' : 'Geral'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-zinc-200">Assunto: <span className="text-white font-extrabold">{c.assunto}</span></p>
                          <p className="text-xs text-zinc-400 line-clamp-2">{c.pergunta}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Listagens Detalhadas (Questões com Edição/Lixeira, Simulados e Redações) */}
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
                    {questoesFiltradas.map((q) => {
                      const estaEditando = editandoQuestaoId === q.id;
                      return (
                        <div key={q.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1 w-full">
                              <h4 className="text-sm font-bold text-white">{q.materia}</h4>
                              
                              {!estaEditando ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {q.assunto ? (
                                    <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                                      <Tag className="w-3 h-3" /> {q.assunto}
                                    </p>
                                  ) : (
                                    <span className="text-[11px] text-zinc-500 italic">Sem assunto definido</span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditandoQuestaoId(q.id);
                                      setNovoAssuntoQuestao(q.assunto || '');
                                    }}
                                    className="text-[10px] text-amber-400 hover:underline bg-zinc-950 px-2 py-0.5 rounded border border-amber-400/20 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" /> Editar Assunto
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={novoAssuntoQuestao}
                                    onChange={(e) => setNovoAssuntoQuestao(e.target.value)}
                                    placeholder="Nome do assunto..."
                                    className="bg-zinc-950 border border-amber-400 text-zinc-100 text-xs px-2.5 py-1 rounded-lg outline-none w-full"
                                  />
                                  <button
                                    onClick={() => salvarAssuntoQuestao(q.id)}
                                    className="px-3 py-1 bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg cursor-pointer shrink-0"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => setEditandoQuestaoId(null)}
                                    className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-lg cursor-pointer shrink-0"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}

                              <span className="text-[10px] text-zinc-500 flex items-center gap-1 pt-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(q.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <button
                              onClick={() => excluirQuestao(q.id)}
                              className="text-zinc-600 hover:text-rose-400 p-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                              title="Apagar registo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                            <span className="text-zinc-400">Total Feitas: <strong className="text-white">{q.total_feitas}</strong></span>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 flex items-center gap-0.5 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />{q.acertos}</span>
                              <span className="text-red-400 flex items-center gap-0.5 font-semibold"><XCircle className="w-3.5 h-3.5" />{q.erros}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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