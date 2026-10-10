'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { Play, Square, CheckCircle, AlertCircle, Clock, FileText, PlusCircle, Timer, Edit3, Trash2, X, ExternalLink } from 'lucide-react';

interface RedacaoRegistro {
  id: string;
  tema: string;
  tempo_gasto_segundos: number;
  nota?: number | null;
  created_at: string;
}

interface RepertorioItem {
  id: string;
  nome: string;
  link: string;
  descricao: string;
  exemplo_pratico: string;
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

  // Estados de Listagem e Edição de Redações
  const [redacoesList, setRedacoesList] = useState<RedacaoRegistro[]>([]);
  const [redacaoEmEdicao, setRedacaoEmEdicao] = useState<RedacaoRegistro | null>(null);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);

  // Estados para as Estratégias de Redação e Repertórios
  const [abaEstrategia, setAbaEstrategia] = useState<'semRepertorio' | 'comRepertorio'>('semRepertorio');
  const [repertoriosList, setRepertoriosList] = useState<RepertorioItem[]>([]);
  const [isAdicionandoRepertorio, setIsAdicionandoRepertorio] = useState(false);
  const [repertorioEmEdicao, setRepertorioEmEdicao] = useState<RepertorioItem | null>(null);
  const [modalRepertorioEdicaoAberto, setModalRepertorioEdicaoAberto] = useState(false);

  const [novoNomeRep, setNovoNomeRep] = useState('');
  const [novoLinkRep, setNovoLinkRep] = useState('');
  const [novaDescRep, setNovaDescRep] = useState('');
  const [novoExemploRep, setNovoExemploRep] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar dados e sessão
  const carregarDados = async (uid: string) => {
    // Carregar Redações
    const { data: dataRed, error: errRed } = await supabase
      .from('redaccoes')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (!errRed && dataRed) {
      setRedacoesList(dataRed);
    }

    // Carregar Repertórios
    const { data: dataRep, error: errRep } = await supabase
      .from('repertorios')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (!errRep && dataRep) {
      setRepertoriosList(dataRep);
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
        carregarDados(uid);
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
      carregarDados(userId);
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
      carregarDados(userId);
    } catch (err: any) {
      console.error('Erro ao guardar registo manual:', err);
      setErro('Erro ao guardar redação manual. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

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
        alert(`Erro ao atualizar redação: ${error.message || 'Verifique as permissões'}`);
        return;
      }

      setModalEdicaoAberto(false);
      setRedacaoEmEdicao(null);
      carregarDados(userId);
    } catch (err: any) {
      alert('Erro inesperado ao atualizar redação.');
    }
  };

  const excluirRedacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta redação?')) return;
    if (!userId) return;

    const { error } = await supabase.from('redaccoes').delete().eq('id', id);
    if (!error) {
      carregarDados(userId);
    } else {
      alert('Erro ao excluir redação.');
    }
  };

  // Funções Supabase para Repertórios
  const salvarNovoRepertorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !novoNomeRep.trim()) return;

    try {
      const { error } = await supabase.from('repertorios').insert([
        {
          user_id: userId,
          nome: novoNomeRep,
          link: novoLinkRep,
          descricao: novaDescRep,
          exemplo_pratico: novoExemploRep
        }
      ]);

      if (error) throw error;

      setNovoNomeRep('');
      setNovoLinkRep('');
      setNovaDescRep('');
      setNovoExemploRep('');
      setIsAdicionandoRepertorio(false);
      carregarDados(userId);
    } catch (err: any) {
      alert('Erro ao salvar repertório no banco.');
    }
  };

  const abrirEdicaoRepertorio = (item: RepertorioItem) => {
    setRepertorioEmEdicao(item);
    setModalRepertorioEdicaoAberto(true);
  };

  const salvarEdicaoRepertorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !repertorioEmEdicao) return;

    try {
      const { error } = await supabase
        .from('repertorios')
        .update({
          nome: repertorioEmEdicao.nome,
          link: repertorioEmEdicao.link,
          descricao: repertorioEmEdicao.descricao,
          exemplo_pratico: repertorioEmEdicao.exemplo_pratico
        })
        .eq('id', repertorioEmEdicao.id);

      if (error) throw error;

      setModalRepertorioEdicaoAberto(false);
      setRepertorioEmEdicao(null);
      carregarDados(userId);
    } catch (err: any) {
      alert('Erro ao atualizar repertório.');
    }
  };

  const excluirRepertorio = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este repertório?')) return;
    if (!userId) return;

    const { error } = await supabase.from('repertorios').delete().eq('id', id);
    if (!error) {
      carregarDados(userId);
    } else {
      alert('Erro ao excluir repertório.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Cabeçalho */}
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

        {/* 1. CRONÔMETRO (SELEÇÃO E MODO DE REGISTRO) */}
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

        {/* PAINEL DO CRONÔMETRO */}
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

        {/* REGISTRO MANUAL DE NOTA */}
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

        {/* 2. NOTAS E HISTÓRICO */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              Histórico e Desempenho
            </h2>
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

        {/* 3. ESTRATÉGIAS DE REDAÇÃO */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-center gap-3 bg-zinc-950 p-2 rounded-2xl border border-zinc-800 shadow-lg">
            <button
              onClick={() => setAbaEstrategia('semRepertorio')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                abaEstrategia === 'semRepertorio'
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Estratégia 1 — Sem Repertório
            </button>

            <button
              onClick={() => setAbaEstrategia('comRepertorio')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                abaEstrategia === 'comRepertorio'
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Estratégia 2 — Com Repertório
            </button>
          </div>

          {/* ESTRATÉGIA 1: SEM REPERTÓRIO */}
          {abaEstrategia === 'semRepertorio' && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
              <div className="border-b border-zinc-800 pb-4">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  Guia Passo a Passo VUNESP
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Estratégia 1: Como começar sem saber nada sobre o tema
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  "Li o tema. Não sei nada sobre ele. Como eu começo?"
                </p>
              </div>

              {/* Passo 1 */}
              <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">
                  1. PONTO DE PARTIDA
                </h3>
                <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed break-words">
                  Você não precisa ter uma opinião pronta. Leia o tema e os textos de apoio. Que problema aparece ali?
                </p>
              </div>

              {/* Passo 2 */}
              <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">
                  2. EXEMPLO PRÁTICO DE SEPARAÇÃO DE TEMA E RECORTE
                </h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-zinc-300 bg-zinc-950 p-4 rounded-xl border border-zinc-800 break-words">
                  <p><strong className="text-white">Tema de treino:</strong> Desafios para ampliar o acesso à leitura no Brasil.</p>
                  <p><strong className="text-white">Assunto:</strong> Leitura.</p>
                  <p><strong className="text-white">Recorte:</strong> O que dificulta ampliar esse acesso?</p>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">
                  3. PERGUNTE AO TEMA (SITUAÇÕES CONCRETAS)
                </h3>
                <ul className="text-xs sm:text-sm text-zinc-200 space-y-2 font-medium">
                  <li className="flex items-center gap-2 break-words">
                    <span className="text-amber-400 font-bold">•</span>
                    Quem encontra barreiras?
                  </li>
                  <li className="flex items-center gap-2 break-words">
                    <span className="text-amber-400 font-bold">•</span>
                    O que dificulta o acesso?
                  </li>
                  <li className="flex items-center gap-2 break-words">
                    <span className="text-amber-400 font-bold">•</span>
                    O que isso provoca?
                  </li>
                </ul>
                <p className="text-xs text-amber-300/90 font-semibold pt-1">
                  👉 Pense sempre em situações concretas.
                </p>
              </div>

              {/* Passo 4 */}
              <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">
                  4. LEVANTAMENTO DE HIPÓTESES
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-zinc-200">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 break-words">
                    • <strong>Livro caro</strong> → Custo
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 break-words">
                    • <strong>Biblioteca distante</strong> → Dificuldade de acesso
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Consigo explicar essas barreiras?
                </p>
              </div>

              {/* Passo 5 */}
              <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">
                  5. ESTRUTURANDO A TESE E A INTRODUÇÃO
                </h3>
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                  <p className="text-xs font-bold text-amber-400 uppercase">Sua tese pode nascer daí:</p>
                  <blockquote className="text-xs sm:text-sm text-zinc-200 italic border-l-2 border-amber-400 pl-3 break-words">
                    "O custo dos livros e a dificuldade de acesso a bibliotecas limitam o acesso à leitura no Brasil."
                  </blockquote>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                  <p className="text-xs font-bold text-amber-400 uppercase">Um começo possível para a Introdução:</p>
                  <blockquote className="text-xs sm:text-sm text-zinc-200 italic border-l-2 border-amber-400 pl-3 break-words">
                    "A ampliação do acesso à leitura no Brasil enfrenta obstáculos. Entre eles, estão o custo dos livros e a dificuldade de acesso a bibliotecas."
                  </blockquote>
                </div>
              </div>

              {/* Passo 6 */}
              <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">
                  6. LÓGICA DO DESENVOLVIMENTO (EXPLIQUE O CAMINHO)
                </h3>
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-center space-y-2 text-xs sm:text-sm font-semibold text-zinc-200 break-words">
                  <div>Biblioteca distante</div>
                  <div className="text-amber-400">↓</div>
                  <div>Trajeto exige tempo e transporte.</div>
                  <div className="text-amber-400">↓</div>
                  <div>Sem esses recursos, o acesso aos livros fica mais difícil.</div>
                </div>
              </div>

              {/* Checklist */}
              <div className="p-6 bg-amber-400/10 border border-amber-400/30 rounded-2xl space-y-4">
                <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                  Checklist: Antes de Escrever
                </h3>
                <ul className="text-xs sm:text-sm text-zinc-200 space-y-2.5 font-medium">
                  <li className="flex items-center gap-2 break-words">
                    <span className="text-amber-400 font-bold">☑</span>
                    Respondi ao recorte do tema?
                  </li>
                  <li className="flex items-center gap-2 break-words">
                    <span className="text-amber-400 font-bold">☑</span>
                    Consigo explicar minha tese?
                  </li>
                  <li className="flex items-center gap-2 break-words">
                    <span className="text-amber-400 font-bold">☑</span>
                    Meu repertório ajuda a análise?
                  </li>
                </ul>
                <div className="pt-2 border-t border-amber-400/20 text-xs font-black text-rose-400 uppercase tracking-wider">
                  ⚠️ Não invente dados ou citações.
                </div>
              </div>
            </div>
          )}

          {/* ESTRATÉGIA 2: COM REPERTÓRIO */}
          {abaEstrategia === 'comRepertorio' && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    Banco de Repertórios
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">
                    Estratégia 2: Com Repertório
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Adicione seus filmes, livros, escritores, leis ou documentários para fundamentar suas redações.
                  </p>
                </div>

                {!isAdicionandoRepertorio && (
                  <button
                    onClick={() => setIsAdicionandoRepertorio(true)}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Adicionar Repertório
                  </button>
                )}
              </div>

              {/* Formulário de Adicionar Repertório */}
              {isAdicionandoRepertorio && (
                <form onSubmit={salvarNovoRepertorio} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-inner">
                  <h3 className="text-sm font-bold text-amber-400">Novo Repertório</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-400">Nome (Filme / Escritor / Documentário / Lei)</label>
                    <input
                      type="text"
                      value={novoNomeRep}
                      onChange={(e) => setNovoNomeRep(e.target.value)}
                      placeholder="Ex: Livro Vidas Secas - Graciliano Ramos"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-400">Link Exemplo (Internet)</label>
                    <input
                      type="url"
                      value={novoLinkRep}
                      onChange={(e) => setNovoLinkRep(e.target.value)}
                      placeholder="Ex: https://pt.wikipedia.org/wiki/Vidas_Secas"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-400">Descrição / Contexto de Uso</label>
                    <textarea
                      value={novaDescRep}
                      onChange={(e) => setNovaDescRep(e.target.value)}
                      placeholder="Explique como aplicar este repertório em temas de desigualdade, seca ou educação..."
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none whitespace-pre-wrap"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-400">Exemplo Prático (Aplicação na Redação)</label>
                    <textarea
                      value={novoExemploRep}
                      onChange={(e) => setNovoExemploRep(e.target.value)}
                      placeholder="Ex: 'Nesse contexto, a obra Vidas Secas retrata...'"
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none whitespace-pre-wrap"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdicionandoRepertorio(false)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 text-xs font-bold transition shadow cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              )}

              {/* Listagem dos Repertórios */}
              <div className="space-y-3 pt-2">
                {repertoriosList.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum repertório cadastrado ainda.</p>
                ) : (
                  repertoriosList.map((item) => (
                    <div key={item.id} className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2.5 relative group overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2 break-words max-w-[70%] sm:max-w-[80%]">
                          {item.nome}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-[11px] shrink-0"
                              title="Abrir link de exemplo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => abrirEdicaoRepertorio(item)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                            title="Editar repertório"
                          >
                            <Edit3 className="w-3 h-3 text-amber-400" />
                            Editar
                          </button>
                          <button
                            onClick={() => excluirRepertorio(item.id)}
                            className="p-1.5 bg-zinc-900 hover:bg-rose-950 text-rose-400 border border-zinc-800 hover:border-rose-800 rounded-lg transition"
                            title="Excluir repertório"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {item.descricao && (
                        <p className="text-xs text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                          <strong className="text-zinc-400">Descrição:</strong> {item.descricao}
                        </p>
                      )}

                      {item.exemplo_pratico && (
                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-amber-300/90 space-y-1 overflow-hidden">
                          <p className="font-bold uppercase text-[10px] text-amber-400 tracking-wider">Exemplo Prático:</p>
                          <p className="italic leading-relaxed break-words whitespace-pre-wrap">{item.exemplo_pratico}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* MODAL DE EDIÇÃO DE REDAÇÃO */}
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

      {/* MODAL DE EDIÇÃO DE REPERTÓRIO */}
      {modalRepertorioEdicaoAberto && repertorioEmEdicao && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Editar Repertório
              </h3>
              <button 
                onClick={() => setModalRepertorioEdicaoAberto(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicaoRepertorio} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400">Nome</label>
                <input
                  type="text"
                  value={repertorioEmEdicao.nome}
                  onChange={(e) => setRepertorioEmEdicao({ ...repertorioEmEdicao, nome: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400">Link Exemplo</label>
                <input
                  type="url"
                  value={repertorioEmEdicao.link}
                  onChange={(e) => setRepertorioEmEdicao({ ...repertorioEmEdicao, link: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400">Descrição</label>
                <textarea
                  value={repertorioEmEdicao.descricao}
                  onChange={(e) => setRepertorioEmEdicao({ ...repertorioEmEdicao, descricao: e.target.value })}
                  className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none resize-none whitespace-pre-wrap"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400">Exemplo Prático</label>
                <textarea
                  value={repertorioEmEdicao.exemplo_pratico}
                  onChange={(e) => setRepertorioEmEdicao({ ...repertorioEmEdicao, exemplo_pratico: e.target.value })}
                  className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none resize-none whitespace-pre-wrap"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalRepertorioEdicaoAberto(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 text-xs font-bold transition shadow"
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