'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '../components/Navbar'; // Ajuste o caminho se necessário para o seu Navbar
import { Award, Plus, CheckCircle2, XCircle, Calendar, BarChart2 } from 'lucide-react';

interface Simulado {
  id: string;
  created_at: string;
  titulo: string;
  acertos: number;
  total_questoes: number;
  nota: number;
}

export default function SimuladosPage() {
  const router = useRouter();
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Estados do formulário de novo simulado
  const [titulo, setTitulo] = useState('');
  const [acertos, setAcertos] = useState('');
  const [total, setTotal] = useState('100'); // Padrão TJSP Costuma ser 100 questões

  useEffect(() => {
    carregarSimulados();
  }, []);

  async function carregarSimulados() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('simulados')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSimulados(data);
    } catch (error) {
      console.error('Erro ao carregar simulados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarSimulado(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const numAcertos = parseInt(acertos);
      const numTotal = parseInt(total);
      const notaCalculada = Number(((numAcertos / numTotal) * 10).toFixed(2));

      const { error } = await supabase.from('simulados').insert([
        {
          user_id: user.id,
          titulo,
          acertos: numAcertos,
          total_questoes: numTotal,
          nota: notaCalculada,
        },
      ]);

      if (error) throw error;

      setTitulo('');
      setAcertos('');
      setModalOpen(false);
      carregarSimulados();
    } catch (error) {
      console.error('Erro ao salvar simulado:', error);
      alert('Erro ao guardar o simulado. Verifique a tabela no Supabase.');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Cabeçalho da Página */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Award className="w-8 h-8 text-red-600" />
              Simulados TJSP / VUNESP
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Registe e acompanhe o seu desempenho nos simulados focados no concurso.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Simulado
          </button>
        </div>

        {/* Listagem de Simulados */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">A carregar simulados...</div>
        ) : simulados.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <BarChart2 className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-semibold text-zinc-300">Ainda nenhum simulado registado</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Clique no botão acima para adicionar o resultado do seu primeiro simulado e medir a sua evolução rumo à aprovação.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulados.map((sim) => {
              const percentual = Math.round((sim.acertos / sim.total_questoes) * 100);
              return (
                <div key={sim.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-white">{sim.titulo}</h3>
                    <span className="text-xs bg-red-950/40 border border-red-600/30 text-red-400 px-2.5 py-1 rounded-lg font-semibold">
                      Nota: {sim.nota}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{sim.acertos} acertos / {sim.total_questoes}</span>
                    </div>
                    <span className={`font-bold ${percentual >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {percentual}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Registo */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Registar Novo Simulado</h3>
                <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSalvarSimulado} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Título do Simulado</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Simulado 01 - VUNESP TJSP"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Acertos</label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 75"
                      value={acertos}
                      onChange={(e) => setAcertos(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Total de Questões</label>
                    <input
                      type="number"
                      required
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                  >
                    Guardar Simulado
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}