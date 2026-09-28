'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { BarChart3, Award, CheckCircle2, XCircle, Clock, Calendar, Filter } from 'lucide-react';

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
  created_at: string;
}

export default function DesempenhoPage() {
  const router = useRouter();
  const [questoes, setQuestoes] = useState<QuestaoRegistro[]>([]);
  const [redacoes, setRedacoes] = useState<RedacaoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtro de tempo para questões ('todas', 'semana', 'mes')
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todas' | 'semana' | 'mes'>('todas');

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

      if (qData) setQuestoes(qData);
      if (rData) setRedacoes(rData);
      setLoading(false);
    }

    carregarDados();
  }, [router]);

  // Filtragem de questões por período (Semana / Mês / Todas)
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
      return true; // 'todas'
    });
  }, [questoes, filtroPeriodo]);

  const totalFeitas = questoesFiltradas.reduce((acc, q) => acc + q.total_feitas, 0);
  const totalAcertos = questoesFiltradas.reduce((acc, q) => acc + q.acertos, 0);
  const totalErros = questoesFiltradas.reduce((acc, q) => acc + q.erros, 0);
  const aproveitamento = totalFeitas > 0 ? ((totalAcertos / totalFeitas) * 100).toFixed(1) : '0';

  // Formatar segundos de redação no formato amigável (ex: 1h 34m ou 55s)
  const formatarTempoRedacao = (segundosTotais: number) => {
    if (!segundosTotais || segundosTotais === 0) return '0s';

    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    if (minutos > 0) {
      return `${minutos}m ${segundos > 0 ? `${segundos}s` : ''}`.trim();
    }
    return `${segundos}s`;
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header com Filtros */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-red-500" />
              Desempenho & Estatísticas — UPQUESTOES
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Acompanhe a sua evolução para o concurso do TJSP (VUNESP).
            </p>
          </div>

          {/* Filtros de Período */}
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
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Questões no Período</p>
                <h3 className="text-3xl font-black text-white mt-2">{totalFeitas}</h3>
                <span className="text-xs text-zinc-500 mt-1 block">Filtrado por: <strong className="text-zinc-300 uppercase">{filtroPeriodo}</strong></span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Taxa de Acerto</p>
                <h3 className="text-3xl font-black text-white mt-2">{aproveitamento}%</h3>
                <span className="text-xs text-zinc-500 mt-1 block">{totalAcertos} acertos / {totalErros} erros</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total de Redações</p>
                <h3 className="text-3xl font-black text-white mt-2">{redacoes.length}</h3>
                <span className="text-xs text-zinc-500 mt-1 block">Treinos cronometrados</span>
              </div>

            </div>

            {/* Secção de Estatísticas e Gráfico de Barras por Matéria */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Histórico de Questões */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-red-500" />
                  Registo de Questões ({filtroPeriodo.toUpperCase()})
                </h2>

                {questoesFiltradas.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum registo encontrado para este período.</p>
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
                        <div className="flex items-center gap-3 text-xs">
                          <span className="bg-zinc-800 px-2.5 py-1 rounded-lg text-zinc-300">Total: {q.total_feitas}</span>
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />{q.acertos}</span>
                          <span className="text-red-400 flex items-center gap-1 font-semibold"><XCircle className="w-3.5 h-3.5" />{q.erros}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Redações com Cards Individuais e Tempo Gasto */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  Tempo de Treino de Redações VUNESP
                </h2>

                {redacoes.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma redação cronometrada ainda.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {redacoes.map((r) => (
                      <div key={r.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-white leading-snug">{r.tema}</h4>
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {new Date(r.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {/* Card Estatístico de Tempo de Redação Formatado */}
                        <div className="bg-zinc-950 border border-zinc-800/60 p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Clock className="w-4 h-4 text-red-500" />
                            <span>Tempo dedicado ao treino:</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-600/30 px-3 py-1 rounded-md font-mono">
                            {formatarTempoRedacao(r.tempo_gasto_segundos)}
                          </span>
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