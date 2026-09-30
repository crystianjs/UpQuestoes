'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { Play, Square, CheckCircle, AlertCircle, Clock, FileText, PlusCircle, Timer, Edit3, Trash2, X } from 'lucide-react';

interface RedacaoRegistro {
  id: string;
  tema: string;
  tempo_gasto_segundos: number;
  nota?: number | null;
  created_at: string;
}

export default function RedacaoPage() {
  const router = useRouter();
  const [modoRegistro, setModoRegistro] = useState<'cronometro' | 'manual'>('cronometro');

  // Estados do Cronómetro
  const [tema, setTema] = useState('');
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [tempoSegundos, setTempoSegundos] = useState(0);

  // Estados do Registo Manual
  const [temaManual, setTemaManual] = useState('');
  const [tempoMinutosManual, setTempoMinutosManual] = useState('');
  const [notaManual, setNotaManual] = useState('');

  // Estados de Listagem e Edição
  const [redacoesList, setRedacoesList] = useState<RedacaoRegistro[]>([]);
  const [redacaoEmEdicao, setRedacaoEmEdicao] = useState<RedacaoRegistro | null>(null);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar dados e sessão
  const carregarRedacoes = async (uid: string) => {
    const { data, error } = await supabase
      .from('redaccoes')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRedacoesList(data);
    }
  };

  useEffect(() => {
    async function verificarSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        const uid = session.user.id;
        setUserId(uid);
        carregarRedacoes(uid);
      }
    }
    verificarSessao();
  }, [router]);

  // Gestão do Cronômetro
  useEffect(() => {
    if (cronometroAtivo) {
      timerRef.current = setInterval(() => {
        setTempoSegundos((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cronometroAtivo]);

  const formatarTempo = (segundosTotais: number) => {
    if (!segundosTotais) return '0s';
    const horas = Math.floor(segundosTotais / 3600);
    const mins = Math.floor((segundosTotais % 3600) / 60);
    const secs = segundosTotais % 60;
    if (horas > 0) return `${horas}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
    return `${secs}s`;
  };

  const formatarTempoAoVivo = (segundosTotais: number) => {
    const horas = Math.floor(segundosTotais / 3600);
    const mins = Math.floor((segundosTotais % 3600) / 60);
    const secs = segundosTotais % 60;

    if (horas > 0) {
      return `${horas}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Função para renderizar a nota com cores dinâmicas baseadas na escala (0-5 Vermelho, 5-7 Azul, 7-10 Verde)
  const renderizarBadgeNota = (nota?: number | null) => {
    if (nota === null || nota === undefined) {
      return <span className="text-zinc-600 italic">Sem nota</span>;
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
      <span className={`px-2.5 py-1 rounded-lg font-bold border text-xs ${estilos}`}>
        {nota.toFixed(1)}
      </span>
    );
  };

  const iniciarTreino = () => {
    if (!tema.trim()) {
      setErro('Por favor, insira o tema da redação antes de iniciar o cronómetro.');
      return;
    }
    setErro('');
    setCronometroAtivo(true);
  };

  const pararEGuardarTreino = async () => {
    if (!userId) return;
    setCronometroAtivo(false);

    if (tempoSegundos === 0) {
      setErro('O cronómetro não registou tempo suficiente.');
      return;
    }

    setSalvando(true);
    setErro('');
    setSucesso(false);

    try {
      const { error } = await supabase.from('redaccoes').insert([
        {
          tema: tema,
          texto: 'Treino prático cronometrado.',
          tempo_gasto_segundos: tempoSegundos,
          user_id: userId
        }
      ]);

      if (error) throw error;

      setSucesso(true);
      setTema('');
      setTempoSegundos(0);
      carregarRedacoes(userId);
    } catch (err: any) {
      console.error('Erro ao guardar treino de redação:', err);
      setErro('Erro ao guardar redação. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const guardarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!temaManual.trim()) {
      setErro('Por favor, insira o tema da redação.');
      return;
    }

    const minutos = parseInt(tempoMinutosManual);
    if (isNaN(minutos) || minutos <= 0) {
      setErro('Por favor, insira um tempo válido em minutos.');
      return;
    }

    setSalvando(true);
    setErro('');
    setSucesso(false);

    try {
      const segundosTotais = minutos * 60;
      let notaFinal = notaManual ? parseFloat(notaManual) : null;

      // Suporte caso o usuário digite notas de 0 a 100 convertendo proporcionalmente para 0 a 10 se necessário, ou mantendo a escala informada
      if (notaFinal !== null && notaFinal > 10) {
        notaFinal = notaFinal / 10;
      }

      const { error } = await supabase.from('redaccoes').insert([
        {
          tema: temaManual,
          texto: 'Registo manual de treino de redação.',
          tempo_gasto_segundos: segundosTotais,
          nota: notaFinal,
          user_id: userId
        }
      ]);

      if (error) throw error;

      setSucesso(true);
      setTemaManual('');
      setTempoMinutosManual('');
      setNotaManual('');
      carregarRedacoes(userId);
    } catch (err: any) {
      console.error('Erro ao guardar registo manual:', err);
      setErro('Erro ao guardar redação manual. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // Funções de Edição e Exclusão
  const abrirEdicao = (redacao: RedacaoRegistro) => {
    setRedacaoEmEdicao(redacao);
    setModalEdicaoAberto(true);
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !redacaoEmEdicao) return;

    try {
      let novaNota = redacaoEmEdicao.nota !== undefined && redacaoEmEdicao.nota !== null ? Number(redacaoEmEdicao.nota) : null;
      if (novaNota !== null && novaNota > 10) {
        novaNota = novaNota / 10;
      }

      const { error } = await supabase
        .from('redaccoes')
        .update({
          tema: redacaoEmEdicao.tema,
          nota: novaNota
        })
        .eq('id', redacaoEmEdicao.id)
        .select();

      if (error) {
        console.error('Erro do Supabase ao atualizar:', error.message || error);
        alert(`Erro ao atualizar redação: ${error.message || 'Verifique as permissões da tabela'}`);
        return;
      }

      setModalEdicaoAberto(false);
      setRedacaoEmEdicao(null);
      carregarRedacoes(userId);
    } catch (err: any) {
      console.error('Erro inesperado:', err?.message || err);
      alert('Erro inesperado ao atualizar redação.');
    }
  };

  const excluirRedacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta redação?')) return;
    if (!userId) return;

    const { error } = await supabase.from('redaccoes').delete().eq('id', id);
    if (!error) {
      carregarRedacoes(userId);
    } else {
      alert('Erro ao excluir redação.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-500" />
              Treino de Redação Padrão VUNESP
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Cronometre ao vivo, registre manualmente e gerencie suas notas e histórico.
            </p>
          </div>
        </div>

        {/* Seletor de Modo (Abas) */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-1.5 border border-zinc-800 rounded-2xl">
          <button
            onClick={() => { setModoRegistro('cronometro'); setErro(''); setSucesso(false); }}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              modoRegistro === 'cronometro'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Timer className="w-4 h-4" />
            Cronómetro ao Vivo
          </button>
          <button
            onClick={() => { setModoRegistro('manual'); setErro(''); setSucesso(false); }}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              modoRegistro === 'manual'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Registo Manual & Nota
          </button>
        </div>

        {sucesso && (
          <div className="bg-emerald-950/40 border border-emerald-600/40 p-4 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            Treino de redação guardado com sucesso!
          </div>
        )}

        {erro && (
          <div className="bg-red-950/40 border border-red-600/40 p-4 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {erro}
          </div>
        )}

        {/* MODO 1: CRONÓMETRO */}
        {modoRegistro === 'cronometro' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-10 shadow-xl space-y-8 text-center">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tema da Redação</label>
              <input 
                type="text" 
                disabled={cronometroAtivo || salvando}
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: Os impactos da tecnologia nas relações sociais contemporâneas"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-100 focus:outline-none focus:border-red-600 transition-colors disabled:opacity-60"
              />
            </div>

            <div className="py-8 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <Clock className={`w-10 h-10 ${cronometroAtivo ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
              <span className="text-4xl md:text-5xl font-black tracking-widest text-white font-mono">
                {formatarTempoAoVivo(tempoSegundos)}
              </span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">
                {cronometroAtivo ? 'Cronómetro a correr...' : 'Pronto para iniciar'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!cronometroAtivo ? (
                <button 
                  onClick={iniciarTreino}
                  disabled={salvando}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Iniciar Treino & Cronómetro
                </button>
              ) : (
                <button 
                  onClick={pararEGuardarTreino}
                  disabled={salvando}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base animate-pulse"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Parar & Guardar Redação
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODO 2: REGISTO MANUAL COM NOTA */}
        {modoRegistro === 'manual' && (
          <form onSubmit={guardarManual} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-10 shadow-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Registo Manual de Treino & Nota</h3>
              <p className="text-xs text-zinc-400">
                Insira os dados do treino realizado externamente e a nota atribuída (0 a 10).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tema da Redação</label>
              <input 
                type="text" 
                disabled={salvando}
                value={temaManual}
                onChange={(e) => setTemaManual(e.target.value)}
                placeholder="Ex: A importância da empatia nas relações de trabalho"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-100 focus:outline-none focus:border-red-600 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tempo Gasto (minutos)</label>
                <input 
                  type="number" 
                  min="1"
                  max="300"
                  disabled={salvando}
                  value={tempoMinutosManual}
                  onChange={(e) => setTempoMinutosManual(e.target.value)}
                  placeholder="Ex: 45"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-100 focus:outline-none focus:border-red-600 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nota Atribuída (0 a 10)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="10"
                  disabled={salvando}
                  value={notaManual}
                  onChange={(e) => setNotaManual(e.target.value)}
                  placeholder="Ex: 7.5"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-100 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={salvando}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base"
            >
              <PlusCircle className="w-5 h-5" />
              Guardar Registo Manual
            </button>
          </form>
        )}

        {/* TABELA DE VISUALIZAÇÃO E DESEMPENHO */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              Histórico e Desempenho
            </h2>
            {/* Legenda de Desempenho */}
            <div className="flex items-center gap-3 text-[11px] text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> 0 - 5</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 5 - 7</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 7 - 10</span>
            </div>
          </div>

          {redacoesList.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma redação registada até o momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4">Tema</th>
                    <th className="py-3 px-4">Tempo Gasto</th>
                    <th className="py-3 px-4">Nota (Desempenho)</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs">
                  {redacoesList.map((red) => (
                    <tr key={red.id} className="hover:bg-zinc-900/40 transition">
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">{red.tema}</td>
                      <td className="py-3.5 px-4 text-zinc-300 font-mono">{formatarTempo(red.tempo_gasto_segundos)}</td>
                      <td className="py-3.5 px-4">
                        {renderizarBadgeNota(red.nota)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {new Date(red.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => abrirEdicao(red)}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition inline-flex items-center gap-1 font-semibold"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          Editar
                        </button>
                        <button
                          onClick={() => excluirRedacao(red.id)}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-rose-950 text-rose-400 border border-zinc-800 hover:border-rose-800 rounded-lg transition inline-flex items-center"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* MODAL DE EDIÇÃO */}
      {modalEdicaoAberto && redacaoEmEdicao && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-red-500" />
                Editar Redação & Nota
              </h3>
              <button 
                onClick={() => setModalEdicaoAberto(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400">Tema</label>
                <input
                  type="text"
                  value={redacaoEmEdicao.tema}
                  onChange={(e) => setRedacaoEmEdicao({ ...redacaoEmEdicao, tema: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-red-600 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400">Nota Atribuída (0 a 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={redacaoEmEdicao.nota ?? ''}
                  onChange={(e) => setRedacaoEmEdicao({ ...redacaoEmEdicao, nota: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ex: 7.5"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalEdicaoAberto(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}