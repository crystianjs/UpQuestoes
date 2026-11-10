'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, Briefcase, Utensils, Moon, Laptop, Smile, 
  CheckCircle2, Circle, XCircle, Calendar, Trash2, Sparkles, Pencil, Plus, ArrowUp, ArrowDown, HelpCircle, ExternalLink, Play, Square, Clock, RotateCcw, X
} from 'lucide-react';

// ESTRUTURA FIXA DO CIRCUITO LOOP COM OS HORÁRIOS ALINHADOS
const cronogramaLoopFixo = [
  {
    dia: "Segunda-feira",
    id: "segunda",
    tarefas: [
      { id: 'seg_1', horario: "05h15 - 07h15", materia: "Matéria", titulo: "Matéria — Bloco Matinal (Circuito Loop - Pos Edital)", icone: "BookOpen", estado: 'padrao', tipo: 'teorico' },
      { id: 'seg_2', horario: "20h00 - 21h30", materia: "Matéria", titulo: "Matéria — Revisão e Questões", icone: "HelpCircle", estado: 'padrao', tipo: 'revisao' }
    ]
  },
  {
    dia: "Terça-feira",
    id: "terca",
    tarefas: [
      { id: 'ter_1', horario: "05h15 - 07h15", materia: "Matéria", titulo: "Matéria — Bloco Matinal (Circuito Loop - Pos Edital)", icone: "BookOpen", estado: 'padrao', tipo: 'teorico' },
      { id: 'ter_2', horario: "20h00 - 21h30", materia: "Matéria", titulo: "Matéria — Revisão e Questões", icone: "HelpCircle", estado: 'padrao', tipo: 'revisao' }
    ]
  },
  {
    dia: "Quarta-feira",
    id: "quarta",
    tarefas: [
      { id: 'qua_1', horario: "05h15 - 07h15", materia: "Matéria", titulo: "Matéria — Bloco Matinal (Circuito Loop - Pos Edital)", icone: "BookOpen", estado: 'padrao', tipo: 'teorico' },
      { id: 'qua_2', horario: "20h00 - 21h30", materia: "Matéria", titulo: "Matéria — Revisão e Questões", icone: "HelpCircle", estado: 'padrao', tipo: 'revisao' }
    ]
  },
  {
    dia: "Quinta-feira",
    id: "quinta",
    tarefas: [
      { id: 'qui_1', horario: "05h15 - 07h15", materia: "Matéria", titulo: "Matéria — Bloco Matinal (Circuito Loop - Pos Edital)", icone: "BookOpen", estado: 'padrao', tipo: 'teorico' },
      { id: 'qui_2', horario: "20h00 - 21h30", materia: "Matéria", titulo: "Matéria — Revisão e Questões", icone: "HelpCircle", estado: 'padrao', tipo: 'revisao' }
    ]
  },
  {
    dia: "Sexta-feira",
    id: "sexta",
    tarefas: [
      { id: 'sex_1', horario: "05h15 - 07h15", materia: "Matéria", titulo: "Matéria — Bloco Matinal (Circuito Loop - Pos Edital)", icone: "BookOpen", estado: 'padrao', tipo: 'teorico' },
      { id: 'sex_2', horario: "20h00 - 21h30", materia: "Matéria", titulo: "Matéria — Revisão e Questões", icone: "HelpCircle", estado: 'padrao', tipo: 'revisao' }
    ]
  },
  {
    dia: "Sábado",
    id: "sabado",
    tarefas: [
      { id: 'sab_1', horario: "09h00 - 11h00", materia: "Matéria", titulo: "Matéria — Treino de Redação (Padrão VUNESP)", icone: "BookOpen", estado: 'padrao', tipo: 'teorico' }
    ]
  },
  {
    dia: "Domingo",
    id: "domingo",
    tarefas: []
  }
];

export default function CronogramaPage() {
  const router = useRouter();
  const [diasSemana, setDiasSemana] = useState<any[]>(cronogramaLoopFixo);
  const [diaAtualIndex, setDiaAtualIndex] = useState<number>(0);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editDiaId, setEditDiaId] = useState<string>('');
  const [editTarefaId, setEditTarefaId] = useState<string>('');
  const [editHorario, setEditHorario] = useState<string>('');
  const [editTitulo, setEditTitulo] = useState<string>('');
  const [editIcone, setEditIcone] = useState<string>('BookOpen');

  // Cronômetro e Modais
  const [tarefaAtivaModal, setTarefaAtivaModal] = useState<any | null>(null);
  const [etapaModal, setEtapaModal] = useState<number>(0); 
  const [segundosDecorridos, setSegundosDecorridos] = useState<number>(0);
  const [duracaoTotalSegundos, setDuracaoTotalSegundos] = useState<number>(0);
  const [cronometroRodando, setCronometroRodando] = useState<boolean>(false);
  const [showModalFim, setShowModalFim] = useState<boolean>(false);
  const [tempoFinalFormatado, setTempoFinalFormatado] = useState<string>('');

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      const uid = session.user.id;
      setUserId(uid);

      const hojeJs = new Date().getDay();
      let indexMapeado = hojeJs === 0 ? 6 : hojeJs - 1;
      setDiaAtualIndex(indexMapeado);

      await carregarProgressoSupabase(uid);
    }
    init();
  }, [router]);

  useEffect(() => {
    let intervalo: any = null;
    if (cronometroRodando) {
      intervalo = setInterval(() => {
        setSegundosDecorridos(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalo);
    }
    return () => clearInterval(intervalo);
  }, [cronometroRodando]);

  const extrairSegundosDoHorario = (horarioStr: string, tipo: string): number => {
    try {
      if (horarioStr && horarioStr.includes('-')) {
        const partes = horarioStr.split('-').map(p => p.trim());
        if (partes.length === 2) {
          const parseHoraMinuto = (str: string) => {
            const limpo = str.toLowerCase().replace('h', ':').replace('min', '');
            const subPartes = limpo.split(':');
            const h = parseInt(subPartes[0]) || 0;
            const m = parseInt(subPartes[1]) || 0;
            return h * 3600 + m * 60;
          };
          const inicioSeg = parseHoraMinuto(partes[0]);
          const fimSeg = parseHoraMinuto(partes[1]);
          if (fimSeg > inicioSeg) return fimSeg - inicioSeg;
        }
      }
    } catch (e) {
      console.log("Erro ao calcular tempo");
    }
    return 2 * 3600;
  };

  const carregarProgressoSupabase = async (uid: string) => {
    try {
      setCarregando(true);
      const { data } = await supabase
        .from('user_cronograma_progresso')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      
      if (data && data.dias) {
        const diasMesclados = cronogramaLoopFixo.map(diaFixo => {
          const diaSalvo = data.dias.find((d: any) => d.id === diaFixo.id);
          if (diaSalvo && diaSalvo.tarefas) {
            return diaSalvo;
          }
          return diaFixo;
        });
        setDiasSemana(diasMesclados);
      }
    } catch (e) {
      console.error("Erro ao carregar progresso:", e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabase = async (novoCronograma: any[]) => {
    if (!userId) return;
    try {
      setDiasSemana(novoCronograma);
      await supabase.from('user_cronograma_progresso').upsert({
        user_id: userId,
        dias: novoCronograma,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (e: any) {
      console.error("Erro ao salvar:", e);
    }
  };

  const handleRestaurarPadrao = async () => {
    if (!confirm("Deseja restaurar o cronograma para o padrão fixo do Circuito Loop?")) return;
    setDiasSemana(cronogramaLoopFixo);
    await salvarNoSupabase(cronogramaLoopFixo);
  };

  const alternarEstadoTarefa = async (diaId: string, tarefaId: string) => {
    const atualizado = diasSemana.map((dia) => {
      if (dia.id === diaId) {
        const tarefasAtualizadas = dia.tarefas.map((t: any) => {
          if (t.id === tarefaId) {
            let proximoEstado = 'feito';
            if (t.estado === 'feito') proximoEstado = 'nao_feito';
            else if (t.estado === 'nao_feito') proximoEstado = 'padrao';
            else proximoEstado = 'feito';
            return { ...t, estado: proximoEstado };
          }
          return t;
        });
        return { ...dia, tarefas: tarefasAtualizadas };
      }
      return dia;
    });
    salvarNoSupabase(atualizado);
  };

  const definirEstadoEspecifico = async (diaId: string, tarefaId: string, novoEstado: string) => {
    const atualizado = diasSemana.map((dia) => {
      if (dia.id === diaId) {
        const tarefasAtualizadas = dia.tarefas.map((t: any) => {
          if (t.id === tarefaId) {
            return { ...t, estado: novoEstado };
          }
          return t;
        });
        return { ...dia, tarefas: tarefasAtualizadas };
      }
      return dia;
    });
    salvarNoSupabase(atualizado);
  };

  const moverTarefaCima = (diaId: string, tarefaIndex: number) => {
    if (tarefaIndex === 0) return;
    const atualizado = diasSemana.map((dia) => {
      if (dia.id === diaId) {
        const novasTarefas = [...dia.tarefas];
        const temp = novasTarefas[tarefaIndex];
        novasTarefas[tarefaIndex] = novasTarefas[tarefaIndex - 1];
        novasTarefas[tarefaIndex - 1] = temp;
        return { ...dia, tarefas: novasTarefas };
      }
      return dia;
    });
    salvarNoSupabase(atualizado);
  };

  const moverTarefaBaixo = (diaId: string, tarefaIndex: number) => {
    const atualizado = diasSemana.map((dia) => {
      if (dia.id === diaId) {
        if (tarefaIndex === dia.tarefas.length - 1) return dia;
        const novasTarefas = [...dia.tarefas];
        const temp = novasTarefas[tarefaIndex];
        novasTarefas[tarefaIndex] = novasTarefas[tarefaIndex + 1];
        novasTarefas[tarefaIndex + 1] = temp;
        return { ...dia, tarefas: novasTarefas };
      }
      return dia;
    });
    salvarNoSupabase(atualizado);
  };

  const abrirEdicaoTarefa = (diaId: string, tarefa: any) => {
    setEditDiaId(diaId);
    setEditTarefaId(tarefa.id);
    setEditHorario(tarefa.horario);
    setEditTitulo(tarefa.titulo);
    setEditIcone(tarefa.icone || 'BookOpen');
    setShowEditModal(true);
  };

  const salvarEdicaoTarefa = () => {
    const atualizado = diasSemana.map((dia) => {
      if (dia.id === editDiaId) {
        const tarefasAtualizadas = dia.tarefas.map((t: any) => {
          if (t.id === editTarefaId) {
            return { ...t, horario: editHorario, titulo: editTitulo, icone: editIcone };
          }
          return t;
        });
        return { ...dia, tarefas: tarefasAtualizadas };
      }
      return dia;
    });
    salvarNoSupabase(atualizado);
    setShowEditModal(false);
  };

  const adicionarNovaTarefa = (diaId: string) => {
    const novaId = 't_' + Math.random().toString(36).substring(2, 7);
    const atualizado = diasSemana.map((dia) => {
      if (dia.id === diaId) {
        return {
          ...dia,
          tarefas: [
            ...dia.tarefas,
            { id: novaId, horario: "05h15 - 07h15", materia: "Matéria", titulo: "Matéria — Novo Bloco", icone: "BookOpen", estado: 'padrao', tipo: 'teorico' }
          ]
        };
      }
      return dia;
    });
    salvarNoSupabase(atualizado);
  };

  const removerTarefa = (diaId: string, tarefaId: string) => {
    if (confirm("Deseja realmente excluir este bloco?")) {
      const atualizado = diasSemana.map((dia) => {
        if (dia.id === diaId) {
          return {
            ...dia,
            tarefas: dia.tarefas.filter((t: any) => t.id !== tarefaId)
          };
        }
        return dia;
      });
      salvarNoSupabase(atualizado);
    }
  };

  const renderIcone = (nomeIcone: string, className: string) => {
    switch (nomeIcone) {
      case 'BookOpen': return <BookOpen className={className} />;
      case 'HelpCircle': return <HelpCircle className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  const percentualProgresso = duracaoTotalSegundos > 0 
    ? Math.min((segundosDecorridos / duracaoTotalSegundos) * 100, 100)
    : 0;
  const raioCirculo = 70;
  const circunferencia = 2 * Math.PI * raioCirculo;
  const strokeDashoffset = circunferencia - (percentualProgresso / 100) * circunferencia;

  const formatarTempo = (segundos: number) => {
    const hrs = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    const secs = segundos % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* CABEÇALHO */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Metodologia Oficial
              </span>
              <span className="bg-zinc-900 text-amber-400 text-xs font-bold px-3 py-1 rounded-xl border border-zinc-800">
                Circuito Loop - Pos Edital • TJSP 🚀
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Cronograma Fixo de Alta Performance
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
             Estude de forma ativa com revisões e questões para fixar o conhecimento na memória de longo prazo.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleRestaurarPadrao}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl transition-all shadow-lg cursor-pointer uppercase"
            >
              Restaurar Padrão Oficial
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center p-12 text-zinc-400 text-xs font-semibold">
            Carregando cronograma...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {diasSemana.map((diaObj, index) => {
              const isHoje = index === diaAtualIndex;
              const totalTarefas = diaObj.tarefas.length;
              const tarefasConcluidas = diaObj.tarefas.filter((t: any) => t.estado === 'feito').length;
              const progresso = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

              return (
                <div 
                  key={diaObj.id}
                  className={`bg-zinc-950 rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 ${
                    isHoje 
                      ? 'border-amber-400 shadow-amber-400/10 ring-1 ring-amber-400/50' 
                      : 'border-zinc-800'
                  }`}
                >
                  {isHoje && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-zinc-950 text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Hoje
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 pr-12">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${isHoje ? 'text-amber-400' : 'text-zinc-400'}`} />
                        {diaObj.dia}
                      </h3>
                    </div>

                    <div className="mb-4 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                        <span>Progresso do dia</span>
                        <span className={progresso === 100 ? 'text-emerald-400' : 'text-zinc-300'}>{progresso}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div 
                          className={`h-full transition-all duration-500 ${progresso === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${progresso}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {diaObj.tarefas.map((tarefa: any, tarefaIdx: number) => {
                        const isFeito = tarefa.estado === 'feito';
                        const isNaoFeito = tarefa.estado === 'nao_feito';

                        return (
                          <div 
                            key={tarefa.id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-3 group/item ${
                              isFeito 
                                ? 'bg-zinc-900/40 border-emerald-500/40 opacity-70' 
                                : isNaoFeito
                                ? 'bg-rose-950/20 border-rose-500/50'
                                : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div 
                              onClick={() => alternarEstadoTarefa(diaObj.id, tarefa.id)}
                              className="flex items-start gap-2.5 cursor-pointer min-w-0"
                            >
                              <div className="mt-0.5 shrink-0">
                                {isFeito ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : isNaoFeito ? (
                                  <XCircle className="w-4 h-4 text-rose-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-zinc-600 group-hover/item:text-zinc-400 transition-colors" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                                    {renderIcone(tarefa.icone, "w-3.5 h-3.5")}
                                    <span>{tarefa.horario}</span>
                                  </div>

                                  <div className="flex items-center gap-0.5 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); moverTarefaCima(diaObj.id, tarefaIdx); }}
                                      disabled={tarefaIdx === 0}
                                      className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-25 cursor-pointer"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); moverTarefaBaixo(diaObj.id, tarefaIdx); }}
                                      disabled={tarefaIdx === diaObj.tarefas.length - 1}
                                      className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-25 cursor-pointer"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <p className={`text-xs leading-relaxed transition-colors break-words whitespace-pre-wrap ${isFeito ? 'text-zinc-500 line-through' : isNaoFeito ? 'text-rose-200' : 'text-zinc-200'}`}>
                                  {tarefa.titulo}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setTarefaAtivaModal(tarefa);
                                  setDuracaoTotalSegundos(extrairSegundosDoHorario(tarefa.horario, tarefa.tipo));
                                  setEtapaModal(1);
                                }}
                                className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md uppercase cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Iniciar Estudo
                              </button>

                              <div className="flex items-center justify-between">
                                <button
                                  onClick={(e) => { e.stopPropagation(); abrirEdicaoTarefa(diaObj.id, tarefa); }}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3 text-amber-400" /> Editar
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); const novoSt = isNaoFeito ? 'padrao' : 'nao_feito'; definirEstadoEspecifico(diaObj.id, tarefa.id, novoSt); }}
                                    className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] font-medium cursor-pointer ${
                                      isNaoFeito ? 'bg-rose-600 text-white border-rose-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-rose-300'
                                    }`}
                                  >
                                    Não feito
                                  </button>

                                  <button
                                    onClick={(e) => { e.stopPropagation(); removerTarefa(diaObj.id, tarefa.id); }}
                                    className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => adicionarNovaTarefa(diaObj.id)}
                      className="w-full mt-3 py-2 bg-zinc-900/60 hover:bg-zinc-900 border border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" /> Adicionar Bloco
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-900 text-right">
                    <span className="text-[10px] text-zinc-500 font-bold">
                      {tarefasConcluidas} de {totalTarefas} concluídas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* MODAL ETAPA 1: Links */}
      {etapaModal === 1 && tarefaAtivaModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-400/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-center">
            <button onClick={() => setEtapaModal(0)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800 cursor-pointer text-xs">
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Plataformas de Estudo 🚀</h2>
              <p className="text-xs text-zinc-400 mt-1">Acesse os links para iniciar:</p>
            </div>
            <div className="space-y-2 pt-2">
              <a href="https://braboconcursos.entregadigital.app.br/produtos/1549" target="_blank" rel="noopener noreferrer" className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 text-xs font-bold flex items-center justify-between transition-all">
                <span>Brabo Concursos (Aulas)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a href="https://app.circuitoloop.com.br/dashboard" target="_blank" rel="noopener noreferrer" className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 text-xs font-bold flex items-center justify-between transition-all">
                <span>Circuito Loop - Pos Edital (Plataforma)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <button onClick={() => setEtapaModal(0)} className="px-4 py-2 bg-zinc-900 text-rose-400 rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
              <button onClick={() => setEtapaModal(2)} className="px-5 py-2.5 bg-amber-400 text-zinc-950 font-black rounded-xl text-xs cursor-pointer uppercase">Avançar ➔</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ETAPA 2: Circuito Loop */}
      {etapaModal === 2 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-400/50 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-center">
            <button onClick={() => setEtapaModal(0)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800 cursor-pointer"><X className="w-4 h-4" /></button>
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto"><Clock className="w-6 h-6 animate-pulse" /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Circuito Loop - Pos Edital</h2>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">Você iniciou o cronômetro no <strong className="text-amber-400">Circuito Loop - Pos Edital</strong> também?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => { setEtapaModal(3); setSegundosDecorridos(0); setCronometroRodando(false); }} className="py-3 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase cursor-pointer">Sim, Já Iniciei 👍</button>
              <button onClick={() => { setEtapaModal(3); setSegundosDecorridos(0); setCronometroRodando(false); }} className="py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase cursor-pointer border border-zinc-700">Não / Agora Não</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ETAPA 3: Cronômetro */}
      {etapaModal === 3 && tarefaAtivaModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-400/50 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 text-center">
            <button onClick={() => setEtapaModal(0)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800 cursor-pointer"><X className="w-4 h-4" /></button>
            <div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">{tarefaAtivaModal.horario}</span>
              <h2 className="text-base font-bold text-white mt-2 line-clamp-2">{tarefaAtivaModal.titulo}</h2>
            </div>
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={raioCirculo} className="text-zinc-900" strokeWidth="10" stroke="currentColor" fill="transparent" />
                <circle cx="80" cy="80" r={raioCirculo} className="text-amber-400 transition-all duration-1000 ease-linear" strokeWidth="10" strokeDasharray={circunferencia} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-amber-400 font-mono tracking-wider">{formatarTempo(segundosDecorridos)}</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Tempo Decorrido</span>
              </div>
            </div>
            <div className="space-y-2">
              {!cronometroRodando ? (
                <button onClick={() => setCronometroRodando(true)} className="w-full py-3 bg-amber-400 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer uppercase"><Play className="w-4 h-4 fill-current" /> Iniciar Cronômetro</button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSegundosDecorridos(0)} className="py-2.5 bg-zinc-900 text-zinc-300 font-bold rounded-xl text-xs uppercase cursor-pointer border border-zinc-800">Zerar</button>
                  <button onClick={() => { setCronometroRodando(false); setTempoFinalFormatado(formatarTempo(segundosDecorridos)); setEtapaModal(0); setShowModalFim(true); }} className="py-2.5 bg-rose-600 text-white font-black rounded-xl text-xs uppercase cursor-pointer shadow-lg">Encerrar</button>
                </div>
              )}
              <button onClick={() => setEtapaModal(0)} className="w-full py-2 text-zinc-500 hover:text-rose-400 text-xs font-semibold cursor-pointer">Cancelar e Voltar</button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP FINAL */}
      {showModalFim && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-emerald-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Bloco Concluído com Sucesso! 🎯</h2>
              <p className="text-xs text-amber-400 font-bold mt-1">Tempo registrado: {tempoFinalFormatado}</p>
            </div>
            <div className="pt-2">
              <button onClick={() => setShowModalFim(false)} className="w-full py-3 bg-amber-400 text-zinc-950 font-black rounded-xl text-xs cursor-pointer uppercase shadow-lg">Ok, Continuar 🚀</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800 cursor-pointer">✕</button>
            <h2 className="text-sm font-bold text-white">Editar Bloco de Estudo</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Horário:</label>
                <input type="text" value={editHorario} onChange={(e) => setEditHorario(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-3 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Título:</label>
                <textarea value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-3 outline-none resize-none" />
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-zinc-900 text-zinc-300 rounded-xl text-xs cursor-pointer">Cancelar</button>
              <button onClick={salvarEdicaoTarefa} className="px-4 py-2 bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer">Salvar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}