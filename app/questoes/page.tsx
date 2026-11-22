'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { BookOpen, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const MATERIAS_TJSP = [
  'Língua Portuguesa',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Processual Civil',
  'Direito Constitucional',
  'Direito Administrativo',
  'Normas da Corregedoria',
  'Matemática',
  'Raciocínio Lógico',
  'Informática',
  'Atualidades',
  'Estatuto da Pessoa com Deficiência'
];

export default function QuestoesPage() {
  const router = useRouter();
  const [materia, setMateria] = useState(MATERIAS_TJSP[0]);
  const [assunto, setAssunto] = useState('');
  const [totalFeitas, setTotalFeitas] = useState<number | ''>(1);
  const [acertos, setAcertos] = useState<number | ''>(1);
  const [erros, setErros] = useState<number | ''>(0);
  const [motivoErro, setMotivoErro] = useState('');
  
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

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

  const handleTotalChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setTotalFeitas(num);
    if (typeof num === 'number' && typeof acertos === 'number' && num >= acertos) {
      setErros(num - acertos);
    }
  };

  const handleAcertosChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setAcertos(num);
    if (typeof num === 'number' && typeof totalFeitas === 'number' && totalFeitas >= num) {
      setErros(totalFeitas - num);
    }
  };

  async function handleSalvarQuestoes(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (totalFeitas === '' || acertos === '' || erros === '') {
      setErro('Preencha todos os campos numéricos corretamente.');
      return;
    }

    if (acertos + erros !== totalFeitas) {
      setErro('A soma de acertos e erros deve ser igual ao total de questões feitas.');
      return;
    }

    setSalvando(true);
    setErro('');
    setSucesso(false);

    try {
      const { error } = await supabase.from('user_questions').insert([
        {
          materia: materia,
          assunto: assunto.trim() || null,
          total_feitas: totalFeitas,
          acertos: acertos,
          erros: erros,
          motivo_erro: motivoErro.trim() || null,
          user_id: userId
        }
      ]);

      if (error) throw error;

      setSucesso(true);
      setAssunto('');
      setTotalFeitas(1);
      setAcertos(1);
      setErros(0);
      setMotivoErro('');
    } catch (err: any) {
      console.error(err);
      setErro(`Erro ao guardar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="w-full px-4 sm:px-8 py-8 space-y-8 max-w-5xl mx-auto">
        
        {/* Card Full-Width Amarelo */}
        <div className="bg-amber-400 border border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-950 text-center space-y-2 relative overflow-hidden">
          <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
            FOCO E CONSTÂNCIA • UPQUESTÕES
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug pt-1">
            Depende de você, aprenda de fato o que precisa aprender e curta o processo
          </h2>
        </div>

        {/* Bloco Único: Registo de Questões */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              Registo de Questões — UPQUESTÕES
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Registe o seu progresso e mapeie os motivos dos seus erros.
            </p>
          </div>

          {sucesso && (
            <div className="bg-emerald-950/40 border border-emerald-600/40 p-4 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" />
              Registo de questões guardado com sucesso!
            </div>
          )}

          {erro && (
            <div className="bg-red-950/40 border border-red-600/40 p-4 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {erro}
            </div>
          )}

          <form onSubmit={handleSalvarQuestoes} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Disciplina / Matéria</label>
                <select 
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
                >
                  {MATERIAS_TJSP.map((mat) => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Assunto / Tópico (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ex: Negação de Proposições, Art. 5º CF..."
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Feitas</label>
                <input 
                  type="number" 
                  min={1}
                  required
                  value={totalFeitas}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Acertos
                </label>
                <input 
                  type="number" 
                  min={0}
                  required
                  value={acertos}
                  onChange={(e) => handleAcertosChange(e.target.value)}
                  className="w-full bg-emerald-950/20 border border-emerald-600/50 rounded-xl px-4 py-3 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Erros
                </label>
                <input 
                  type="number" 
                  min={0}
                  readOnly
                  value={erros}
                  className="w-full bg-red-950/20 border border-red-600/50 rounded-xl px-4 py-3 text-sm text-red-400 font-bold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Campo Motivo do Erro (Sempre Visível) */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Motivo do Erro (Opcional / Caderno de Erros)
              </label>
              <textarea 
                rows={3}
                placeholder="Ex: Confundi o prazo do recurso, falta de atenção na leitura do comando, desconhecimento da letra da lei..."
                value={motivoErro}
                onChange={(e) => setMotivoErro(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <button 
              type="submit"
              disabled={salvando}
              className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-amber-400/20 disabled:opacity-50 cursor-pointer"
            >
              {salvando ? 'A guardar...' : 'Guardar Registo de Questões'}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}