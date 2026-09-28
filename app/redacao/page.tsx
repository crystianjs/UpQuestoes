'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { Play, Square, CheckCircle, AlertCircle, Clock, FileText, PlusCircle, Timer } from 'lucide-react';

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

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function verificarSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setUserId(session.user.id);
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

  // Função para formatar o tempo do cronómetro ao vivo (ex: 1h 34m 12s ou 00:05)
  const formatarTempoAoVivo = (segundosTotais: number) => {
    const horas = Math.floor(segundosTotais / 3600);
    const mins = Math.floor((segundosTotais % 3600) / 60);
    const secs = segundosTotais % 60;

    if (horas > 0) {
      return `${horas}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
          texto: 'Treino prático cronometrado em papel/digital externo.',
          tempo_gasto_segundos: tempoSegundos,
          user_id: userId
        }
      ]);

      if (error) throw error;

      setSucesso(true);
      setTema('');
      setTempoSegundos(0);
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
      const { error } = await supabase.from('redaccoes').insert([
        {
          tema: temaManual,
          texto: 'Registo manual de treino de redação.',
          tempo_gasto_segundos: segundosTotais,
          user_id: userId
        }
      ]);

      if (error) throw error;

      setSucesso(true);
      setTemaManual('');
      setTempoMinutosManual('');
    } catch (err: any) {
      console.error('Erro ao guardar registo manual:', err);
      setErro('Erro ao guardar redação manual. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              <FileText className="w-6 h-6 text-red-500" />
              Treino de Redação Padrão VUNESP
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Escolha entre cronometrar em tempo real ou registar manualmente o seu treino já realizado.
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
            Registo Manual (Esqueci/Feito)
          </button>
        </div>

        {sucesso && (
          <div className="bg-emerald-950/40 border border-emerald-600/40 p-4 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            Treino de redação guardado com sucesso! Consulte o histórico no Painel de Desempenho.
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

        {/* MODO 2: REGISTO MANUAL */}
        {modoRegistro === 'manual' && (
          <form onSubmit={guardarManual} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-10 shadow-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Registo Manual de Treino</h3>
              <p className="text-xs text-zinc-400">
                Esqueceu de ligar o cronómetro ou treinou no papel? Insira os dados abaixo para computar no seu progresso.
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

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tempo Gasto (em minutos)</label>
              <input 
                type="number" 
                min="1"
                max="300"
                disabled={salvando}
                value={tempoMinutosManual}
                onChange={(e) => setTempoMinutosManual(e.target.value)}
                placeholder="Ex: 45 (minutos)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-100 focus:outline-none focus:border-red-600 transition-colors"
                required
              />
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

      </main>
    </div>
  );
}