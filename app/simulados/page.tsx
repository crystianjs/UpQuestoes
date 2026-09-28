'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '../components/Navbar';
import { Award, Plus, CheckCircle2, XCircle, Calendar, BarChart2, Target, Code, Copy, Check } from 'lucide-react';

interface Simulado {
  id: string;
  created_at: string;
  titulo: string;
  acertos: number;
  total_questoes: number;
  nota: number;
}

interface PontoMelhoria {
  id: string;
  materia: string;
  quantidade_erros: number;
  quantidade_acertos: number;
  assunto_estudar: string;
  created_at: string;
}

export default function SimuladosPage() {
  const router = useRouter();
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [melhorias, setMelhorias] = useState<PontoMelhoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  
  // Modal único
  const [modalOpen, setModalOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Estados do formulário de simulado
  const [titulo, setTitulo] = useState('');
  const [acertos, setAcertos] = useState('');
  const [total, setTotal] = useState('100');

  // Estados dos Pontos de Melhoria (dentro do modal)
  const [incluirMelhorias, setIncluirMelhorias] = useState(false);
  const [modoJson, setModoJson] = useState(false);
  const [novaMateria, setNovaMateria] = useState('');
  const [errosInput, setErrosInput] = useState('');
  const [acertosInput, setAcertosInput] = useState('');
  const [assuntoInput, setAssuntoInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const [simRes, melRes] = await Promise.all([
        supabase.from('simulados').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('pontos_melhoria').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (simRes.data) setSimulados(simRes.data);
      if (melRes.data) setMelhorias(melRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarTudo(e: React.FormEvent) {
    e.preventDefault();
    if (aGuardar) return; // Bloqueia novos cliques se já estiver a processar
    setAGuardar(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAGuardar(false);
        return;
      }

      const numAcertos = parseInt(acertos);
      const numTotal = parseInt(total);
      const notaCalculada = Number(((numAcertos / numTotal) * 10).toFixed(2));

      // 1. Inserir Simulado
      const { error: erroSimulado } = await supabase.from('simulados').insert([
        {
          user_id: user.id,
          titulo,
          acertos: numAcertos,
          total_questoes: numTotal,
          nota: notaCalculada,
        },
      ]);

      if (erroSimulado) {
        console.error('Erro detalhado Simulado:', erroSimulado);
        alert(`Erro ao guardar Simulado: ${erroSimulado.message}`);
        setAGuardar(false);
        return;
      }

      // 2. Inserir Pontos de Melhoria (se preenchido)
      if (incluirMelhorias) {
        let itensParaInserir: any[] = [];

        if (modoJson && jsonInput.trim()) {
          try {
            const parsed = JSON.parse(jsonInput);
            const arrayParsed = Array.isArray(parsed) ? parsed : [parsed];
            itensParaInserir = arrayParsed.map((item) => ({
              user_id: user.id,
              materia: item.materia,
              quantidade_erros: Number(item.quantidade_erros) || 0,
              quantidade_acertos: Number(item.quantidade_acertos) || 0,
              assunto_estudar: item.assunto_estudar || item.assunto || ''
            }));
          } catch (err) {
            alert('JSON inválido. O simulado foi guardado, mas verifique a sintaxe do JSON de melhorias.');
            setAGuardar(false);
            return;
          }
        } else if (!modoJson && novaMateria && assuntoInput) {
          itensParaInserir = [{
            user_id: user.id,
            materia: novaMateria,
            quantidade_erros: Number(errosInput) || 0,
            quantidade_acertos: Number(acertosInput) || 0,
            assunto_estudar: assuntoInput
          }];
        }

        if (itensParaInserir.length > 0) {
          const { error: erroMelhoria } = await supabase.from('pontos_melhoria').insert(itensParaInserir);
          if (erroMelhoria) {
            console.error('Erro detalhado Ponto de Melhoria:', erroMelhoria);
            alert(`Erro ao guardar Ponto de Melhoria: ${erroMelhoria.message}`);
            setAGuardar(false);
            return;
          }
        }
      }

      // Resetar estados e fechar modal
      setTitulo('');
      setAcertos('');
      setIncluirMelhorias(false);
      setModoJson(false);
      setNovaMateria('');
      setErrosInput('');
      setAcertosInput('');
      setAssuntoInput('');
      setJsonInput('');
      setModalOpen(false);
      
      carregarDados();
    } catch (error) {
      console.error('Erro geral ao guardar dados:', error);
      alert('Erro inesperado ao guardar dados.');
    } finally {
      setAGuardar(false);
    }
  }

  const promptModelo = `Analisa os meus erros recentes e gera um payload JSON estrito (sem texto adicional fora do JSON) contendo um array de objetos com o seguinte formato exato para cada ponto de melhoria:
[
  {
    "materia": "Nome da Matéria",
    "quantidade_erros": 0,
    "quantidade_acertos": 0,
    "assunto_estudar": "Assunto específico a ser estudado"
  }
]`;

  const copiarPrompt = () => {
    navigator.clipboard.writeText(promptModelo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const jsonExemplo = JSON.stringify([
    {
      "materia": "Direito Administrativo",
      "quantidade_erros": 4,
      "quantidade_acertos": 8,
      "assunto_estudar": "Poderes Administrativos - Poder Hierárquico e Disciplinar"
    }
  ], null, 2);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-10">
        
        {/* Cabeçalho da Página */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Award className="w-8 h-8 text-red-600" />
              Simulados e Pontos de Melhoria — VUNESP
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Registe os seus simulados e faça a gestão inteligente das suas lacunas de estudo.
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

        {/* Secção de Pontos de Melhoria */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                Pontos de Melhoria e Assuntos Focados
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Matérias e conteúdos críticos identificados para revisão direcionada.</p>
            </div>
            <button
              onClick={copiarPrompt}
              className="text-xs bg-zinc-950 border border-zinc-700 hover:border-red-500 text-zinc-300 px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-red-500" />}
              {copiado ? 'Prompt Copiado!' : 'Copiar Prompt para IA'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-zinc-500 text-xs">A carregar melhorias...</div>
          ) : melhorias.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-8 text-center space-y-2">
              <p className="text-xs text-zinc-400">Nenhum ponto de melhoria registado.</p>
              <p className="text-[10px] text-zinc-500">Pode adicioná-los diretamente ao registar um novo simulado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {melhorias.map((m) => (
                <div key={m.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-zinc-200 bg-zinc-800 px-2.5 py-1 rounded-lg">{m.materia}</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-400 font-semibold">✓ {m.quantidade_acertos}</span>
                      <span className="text-red-400 font-semibold">✕ {m.quantidade_erros}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Assunto a ser estudado:</span>
                    <p className="text-xs text-white font-medium mt-1 leading-snug">{m.assunto_estudar}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listagem de Simulados */}
        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-red-600" />
            Histórico de Simulados
          </h2>

          {loading ? (
            <div className="text-center py-20 text-zinc-500">A carregar simulados...</div>
          ) : simulados.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
              <BarChart2 className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-lg font-semibold text-zinc-300">Ainda nenhum simulado registado</h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                Clique no botão de adicionar simulado para guardar o seu histórico de notas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {simulados.map((sim) => {
                const percentual = Math.round((sim.acertos / sim.total_questoes) * 100);
                return (
                  <div key={sim.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base text-white">{sim.titulo}</h3>
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
        </div>

        {/* Modal Unificado (Simulado + Pontos de Melhoria Opcionais) */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-red-600" />
                  Registar Simulado e Melhorias
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarTudo} className="space-y-4">
                {/* Dados do Simulado */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-500">1. Dados do Simulado</h4>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Título do Simulado</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Simulado 01 - VUNESP TJSP"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Acertos</label>
                      <input
                        type="number"
                        required
                        placeholder="Ex: 75"
                        value={acertos}
                        onChange={(e) => setAcertos(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Total de Questões</label>
                      <input
                        type="number"
                        required
                        value={total}
                        onChange={(e) => setTotal(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Secção Opcional de Pontos de Melhoria */}
                <div className="pt-3 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirMelhorias}
                        onChange={(e) => setIncluirMelhorias(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-red-500" /> Adicionar Pontos de Melhoria (Opcional)
                      </span>
                    </label>
                  </div>

                  {incluirMelhorias && (
                    <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
                      {/* Seletor Manual / JSON */}
                      <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setModoJson(false)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${!modoJson ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Manual
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoJson(true)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modoJson ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                        >
                          <Code className="w-3.5 h-3.5" /> Payload JSON
                        </button>
                      </div>

                      {modoJson ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-zinc-400">JSON (materia, quantidade_erros, quantidade_acertos, assunto_estudar):</span>
                            <button 
                              type="button" 
                              onClick={() => setJsonInput(jsonExemplo)}
                              className="text-[10px] text-red-400 hover:underline cursor-pointer"
                            >
                              Inserir Exemplo
                            </button>
                          </div>
                          <textarea
                            rows={4}
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='[{"materia": "...", "quantidade_erros": 0, "quantidade_acertos": 0, "assunto_estudar": "..."}]'
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-red-600"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Matéria</label>
                            <input
                              type="text"
                              value={novaMateria}
                              onChange={(e) => setNovaMateria(e.target.value)}
                              placeholder="Ex: Direito Constitucional"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Erros</label>
                              <input
                                type="number"
                                value={errosInput}
                                onChange={(e) => setErrosInput(e.target.value)}
                                placeholder="0"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Acertos</label>
                              <input
                                type="number"
                                value={acertosInput}
                                onChange={(e) => setAcertosInput(e.target.value)}
                                placeholder="0"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Assunto a ser estudado</label>
                            <input
                              type="text"
                              value={assuntoInput}
                              onChange={(e) => setAssuntoInput(e.target.value)}
                              placeholder="Ex: Direitos e Garantias Fundamentais"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={aGuardar}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={aGuardar}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {aGuardar ? 'A guardar...' : 'Guardar Registo'}
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