'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '../components/Navbar';
import { BarChart2, CheckCircle2, XCircle, Award, FileText, TrendingUp, Calendar } from 'lucide-react';

interface QuestaoReg {
  id: string;
  created_at: string;
  materia?: string;
  materia_nome?: string;
  acertos?: number;
  certas?: number;
  erros?: number;
  incorretas?: number;
  total?: number;
}

interface RedacaoReg {
  id: string;
  created_at: string;
  tema?: string;
  tempo_dedicado?: string;
}

interface SimuladoReg {
  id: string;
  created_at: string;
  titulo: string;
  acertos: number;
  total_questoes: number;
  nota: number;
}

export default function DesempenhoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Estados de dados
  const [questoes, setQuestoes] = useState<QuestaoReg[]>([]);
  const [redacoes, setRedacoes] = useState<RedacaoReg[]>([]);
  const [simulados, setSimulados] = useState<SimuladoReg[]>([]);

  // Métricas calculadas
  const [totalQuestoesRespondidas, setTotalQuestoesRespondidas] = useState(0);
  const [totalAcertos, setTotalAcertos] = useState(0);
  const [totalErros, setTotalErros] = useState(0);
  const [taxaAcertoGeral, setTaxaAcertoGeral] = useState(0);
  const [mediaSimulados, setMediaSimulados] = useState(0);

  useEffect(() => {
    carregarDadosDesempenho();
  }, []);

  async function carregarDadosDesempenho() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // 1. Buscar Questões (suporta tabelas user_questions ou questoes)
      let qData: any[] = [];
      const { data: q1 } = await supabase.from('user_questions').select('*').eq('user_id', user.id);
      if (q1 && q1.length > 0) {
        qData = q1;
      } else {
        const { data: q2 } = await supabase.from('questoes').select('*').eq('user_id', user.id);
        if (q2) qData = q2;
      }
      setQuestoes(qData);

      // Calcular totais de questões
      let acertosSum = 0;
      let errosSum = 0;
      qData.forEach((item) => {
        acertosSum += item.acertos || item.certas || 0;
        errosSum += item.erros || item.incorretas || 0;
      });
      const totalQ = acertosSum + errosSum;
      setTotalAcertos(acertosSum);
      setTotalErros(errosSum);
      setTotalQuestoesRespondidas(totalQ);
      setTaxaAcertoGeral(totalQ > 0 ? Number(((acertosSum / totalQ) * 100).toFixed(1)) : 0);

      // 2. Buscar Redações (suporta redaccoes ou redacao)
      let rData: any[] = [];
      const { data: r1 } = await supabase.from('redaccoes').select('*').eq('user_id', user.id);
      if (r1 && r1.length > 0) {
        rData = r1;
      } else {
        const { data: r2 } = await supabase.from('redacao').select('*').eq('user_id', user.id);
        if (r2) rData = r2;
      }
      setRedacoes(rData);

      // 3. Buscar Simulados
      const { data: sData } = await supabase
        .from('simulados')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sData) {
        setSimulados(sData);
        if (sData.length > 0) {
          const somaNotas = sData.reduce((acc, curr) => acc + Number(curr.nota), 0);
          setMediaSimulados(Number((somaNotas / sData.length).toFixed(1)));
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados de desempenho:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600 mb-4"></div>
        <p className="text-zinc-400 text-sm">A carregar métricas de desempenho...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-600" />
              Desempenho & Estatísticas — UPQUESTOES
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Acompanhe a sua evolução para o concurso do TJSP (VUNESP).
            </p>
          </div>
        </div>

        {/* Cards de Resumo Geral */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-2 shadow-xl">
            <span className="text-xs font-semibold text-zinc-400">Questões no Período</span>
            <div className="text-3xl font-black text-white">{totalQuestoesRespondidas}</div>
            <p className="text-xs text-zinc-500">Total registado no sistema</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-2 shadow-xl">
            <span className="text-xs font-semibold text-zinc-400">Taxa de Acerto Geral</span>
            <div className="text-3xl font-black text-emerald-400">{taxaAcertoGeral}%</div>
            <p className="text-xs text-zinc-500">{totalAcertos} acertos / {totalErros} erros</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-2 shadow-xl">
            <span className="text-xs font-semibold text-zinc-400">Total de Redações</span>
            <div className="text-3xl font-black text-white">{redacoes.length}</div>
            <p className="text-xs text-zinc-500">Treinos VUNESP efetuados</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-2 shadow-xl">
            <span className="text-xs font-semibold text-zinc-400">Média em Simulados</span>
            <div className="text-3xl font-black text-red-500">{mediaSimulados} <span className="text-sm font-normal text-zinc-500">/ 10</span></div>
            <p className="text-xs text-zinc-500">{simulados.length} simulados realizados</p>
          </div>

        </div>

        {/* Secções Detalhadas (Questões e Simulados) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Histórico Recente de Simulados */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-red-600" />
                Simulados Recentes
              </h3>
              <button 
                onClick={() => router.push('/simulados')}
                className="text-xs text-red-400 hover:text-red-300 font-semibold"
              >
                Ver todos →
              </button>
            </div>

            {simulados.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Nenhum simulado registado ainda.</p>
            ) : (
              <div className="space-y-3">
                {simulados.slice(0, 4).map((sim) => (
                  <div key={sim.id} className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-sm text-white">{sim.titulo}</h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-red-950/40 border border-red-600/30 text-red-400 px-2 py-1 rounded-lg font-bold">
                        Nota: {sim.nota}
                      </span>
                      <p className="text-xs text-zinc-400 mt-1">{sim.acertos}/{sim.total_questoes} acertos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registo de Questões por Matéria / Resumo */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-red-600" />
              Registo de Questões
            </h3>

            {questoes.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Nenhum histórico de questões encontrado.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {questoes.slice(0, 5).map((q, idx) => (
                  <div key={q.id || idx} className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-sm text-white">{q.materia || q.materia_nome || 'Matéria Geral TJSP'}</h4>
                      <p className="text-xs text-zinc-500">{new Date(q.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {q.acertos || q.certas || 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-3.5 h-3.5" /> {q.erros || q.incorretas || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}