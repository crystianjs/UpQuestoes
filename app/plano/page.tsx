'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Circle, Plus, Trash2, Calendar } from 'lucide-react';

const MATERIAS_TJSP = [
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
  "Estatuto da Pessoa com Deficiência",
  "Redação"
];

const DIAS_OPCOES = [
  { id: 'segunda', nome: 'Segunda-feira' },
  { id: 'terca', nome: 'Terça-feira' },
  { id: 'quarta', nome: 'Quarta-feira' },
  { id: 'quinta', nome: 'Quinta-feira' },
  { id: 'sexta', nome: 'Sexta-feira' },
  { id: 'sabado', nome: 'Sábado' },
  { id: 'domingo', nome: 'Domingo' }
];

interface TarefaCronograma {
  id: string;
  materia: string;
  tipo: 'revisao' | 'teorico';
  dia_semana: string;
  horario: string;
  assunto_titulo: string;
  concluido: boolean;
}

export default function PlanoEstudosPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tarefasCronograma, setTarefasCronograma] = useState<TarefaCronograma[]>([]);
  
  const [novaMateria, setNovaMateria] = useState(MATERIAS_TJSP[0]);
  const [novoTipo, setNovoTipo] = useState<'revisao' | 'teorico'>('teorico');
  const [novoDia, setNovoDia] = useState('segunda');
  const [novoHorario, setNovoHorario] = useState('08h00 - 09h00');
  const [novoAssunto, setNovoAssunto] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        carregarCronograma(session.user.id);
      }
    }
    init();
  }, []);

  const carregarCronograma = async (uid: string) => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('cronograma_tarefas')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!error && data) setTarefasCronograma(data);
    } catch (e) {
      console.error("Erro ao carregar:", e);
    } finally {
      setCarregando(false);
    }
  };

  const adicionarAoCronograma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      const tituloFinal = novoAssunto.trim() !== '' 
        ? novoAssunto 
        : `${novaMateria} (${novoTipo === 'revisao' ? 'Revisão' : 'Teórico'})`;

      const { data, error } = await supabase
        .from('cronograma_tarefas')
        .insert([
          {
            user_id: userId,
            materia: novaMateria,
            tipo: novoTipo,
            dia_semana: novoDia,
            horario: novoHorario || '08h00 - 09h00',
            assunto_titulo: tituloFinal,
            concluido: false
          }
        ])
        .select();

      if (error) throw error;
      if (data) {
        setTarefasCronograma([data[0], ...tarefasCronograma]);
        setNovoAssunto('');
        setNovoHorario('08h00 - 09h00');
        alert('Tarefa atribuída com sucesso ao cronograma!');
      }
    } catch (e) {
      alert('Erro ao adicionar tarefa ao cronograma.');
    }
  };

  const alternarConcluido = async (id: string, statusAtual: boolean) => {
    try {
      const { error } = await supabase
        .from('cronograma_tarefas')
        .update({ concluido: !statusAtual })
        .eq('id', id);

      if (error) throw error;
      setTarefasCronograma(
        tarefasCronograma.map(t => t.id === id ? { ...t, concluido: !statusAtual } : t)
      );
    } catch (e) {
      alert('Erro ao atualizar status.');
    }
  };

  const excluirTarefa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cronograma_tarefas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTarefasCronograma(tarefasCronograma.filter(t => t.id !== id));
    } catch (e) {
      alert('Erro ao remover tarefa.');
    }
  };

  const formatarDiaExibicao = (diaId: string) => {
    if (diaId === 'sabado') return 'Sábado';
    if (diaId === 'domingo') return 'Domingo';
    return `${diaId.charAt(0).toUpperCase() + diaId.slice(1)}-feira`;
  };

  const listaRevisoes = tarefasCronograma.filter(t => t.tipo === 'revisao');
  const listaTeoricos = tarefasCronograma.filter(t => t.tipo === 'teorico');

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            TJSP - VUNESP
          </span>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
            Plano de Estudos & Cronograma Atribuído
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Atribua matérias, redação, horários e assuntos específicos diretamente para o dia desejado.
          </p>
        </div>

        <form onSubmit={adicionarAoCronograma} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Atribuir Nova Tarefa ao Cronograma
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-400">Matéria / Redação</label>
              <select
                value={novaMateria}
                onChange={(e) => setNovaMateria(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
              >
                {MATERIAS_TJSP.map((mat) => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-400">Tipo de Bloco</label>
              <select
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value as 'revisao' | 'teorico')}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
              >
                <option value="teorico">Aula / Teórico</option>
                <option value="revisao">Revisão</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-400">Dia da Semana</label>
              <select
                value={novoDia}
                onChange={(e) => setNovoDia(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
              >
                {DIAS_OPCOES.map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-400">Horário</label>
              <input
                type="text"
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
                placeholder="Ex: 08h00 - 10h00"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-400">Assunto / Título</label>
              <input
                type="text"
                value={novoAssunto}
                onChange={(e) => setNovoAssunto(e.target.value)}
                placeholder="Ex: Artigo 5º da CF/88"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Adicionar ao Cronograma
          </button>
        </form>

        {carregando ? (
          <div className="text-center py-12 text-zinc-500 text-xs">Carregando tarefas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <span className="text-[10px] font-extrabold uppercase text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                  Ciclo Atribuído
                </span>
                <h3 className="text-lg font-black text-white mt-2">Revisões no Cronograma</h3>
              </div>

              {listaRevisoes.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma revisão atribuída ainda.</p>
              ) : (
                <div className="space-y-3">
                  {listaRevisoes.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        item.concluido 
                          ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75' 
                          : 'bg-zinc-900/60 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={() => alternarConcluido(item.id, item.concluido)}
                          className="text-amber-400 hover:text-amber-300 cursor-pointer"
                        >
                          {item.concluido ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-zinc-500" />
                          )}
                        </button>
                        <div>
                          <p className={`text-xs font-bold ${item.concluido ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                            {item.materia}
                          </p>
                          <p className="text-xs text-amber-400">{item.assunto_titulo}</p>
                          <span className="text-[10px] text-zinc-400">{item.horario} • <strong>{formatarDiaExibicao(item.dia_semana)}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => excluirTarefa(item.id)}
                        className="text-zinc-600 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <span className="text-[10px] font-extrabold uppercase text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  Ciclo Atribuído
                </span>
                <h3 className="text-lg font-black text-white mt-2">Aulas / Teórico no Cronograma</h3>
              </div>

              {listaTeoricos.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma aula atribuída ainda.</p>
              ) : (
                <div className="space-y-3">
                  {listaTeoricos.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        item.concluido 
                          ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75' 
                          : 'bg-zinc-900/60 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={() => alternarConcluido(item.id, item.concluido)}
                          className="text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          {item.concluido ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-zinc-500" />
                          )}
                        </button>
                        <div>
                          <p className={`text-xs font-bold ${item.concluido ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                            {item.materia}
                          </p>
                          <p className="text-xs text-blue-400">{item.assunto_titulo}</p>
                          <span className="text-[10px] text-zinc-400">{item.horario} • <strong>{formatarDiaExibicao(item.dia_semana)}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => excluirTarefa(item.id)}
                        className="text-zinc-600 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}