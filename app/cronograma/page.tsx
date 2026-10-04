'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, 
  Briefcase, 
  Utensils, 
  Moon, 
  Laptop, 
  Smile, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Code, 
  Trash2, 
  Upload, 
  Sparkles,
  Quote,
  Pencil,
  Plus
} from 'lucide-react';

const cronogramaPadrao = [
  {
    dia: "Segunda-feira",
    id: "segunda",
    tarefas: [
      { id: "s1", horario: "05h00 - 07h00", titulo: "Bloco de Ouro 1 ( 1 Video aula + 5 exercícios )", icone: "BookOpen", concluida: false },
      { id: "s2", horario: "07h45 - 19h00", titulo: "Período de Trabalho (incluindo transporte)", icone: "Briefcase", concluida: false },
      { id: "s3", horario: "19h00 - 20h00", titulo: "Chegada em casa, banho e jantar", icone: "Utensils", concluida: false },
      { id: "s4", horario: "20h00 - 21h40", titulo: "Bloco de Ouro 2 (Questões e Revisões)", icone: "BookOpen", concluida: false },
      { id: "s5", horario: "22h00", titulo: "Dormir", icone: "Moon", concluida: false }
    ]
  },
  {
    dia: "Terça-feira",
    id: "terca",
    tarefas: [
      { id: "t1", horario: "05h00 - 07h00", titulo: "Bloco de Ouro 1 ( 1 Video aula + 5 exercícios )", icone: "BookOpen", concluida: false },
      { id: "t2", horario: "07h45 - 19h00", titulo: "Período de Trabalho (incluindo transporte)", icone: "Briefcase", concluida: false },
      { id: "t3", horario: "19h00 - 20h00", titulo: "Chegada em casa, banho e jantar", icone: "Utensils", concluida: false },
      { id: "t4", horario: "20h00 - 21h40", titulo: "Bloco de Ouro 2 (Questões e Revisões)", icone: "BookOpen", concluida: false },
      { id: "t5", horario: "22h00", titulo: "Dormir", icone: "Moon", concluida: false }
    ]
  },
  {
    dia: "Quarta-feira",
    id: "quarta",
    tarefas: [
      { id: "q1", horario: "05h00 - 07h00", titulo: "Bloco de Ouro 1 ( 1 Video aula + 5 exercícios )", icone: "BookOpen", concluida: false },
      { id: "q2", horario: "07h45 - 19h00", titulo: "Período de Trabalho (incluindo transporte)", icone: "Briefcase", concluida: false },
      { id: "q3", horario: "19h00 - 20h00", titulo: "Chegada em casa, banho e jantar", icone: "Utensils", concluida: false },
      { id: "q4", horario: "20h00 - 21h40", titulo: "Bloco de Ouro 2 (Questões e Revisões)", icone: "BookOpen", concluida: false },
      { id: "q5", horario: "22h00", titulo: "Dormir", icone: "Moon", concluida: false }
    ]
  },
  {
    dia: "Quinta-feira",
    id: "quinta",
    tarefas: [
      { id: "qu1", horario: "05h00 - 07h00", titulo: "Bloco de Ouro 1 ( 1 Video aula + 5 exercícios )", icone: "BookOpen", concluida: false },
      { id: "qu2", horario: "07h45 - 19h00", titulo: "Período de Trabalho (incluindo transporte)", icone: "Briefcase", concluida: false },
      { id: "qu3", horario: "19h00 - 20h00", titulo: "Chegada em casa, banho e jantar", icone: "Utensils", concluida: false },
      { id: "qu4", horario: "20h00 - 21h40", titulo: "Bloco de Ouro 2 (Questões e Revisões)", icone: "BookOpen", concluida: false },
      { id: "qu5", horario: "22h00", titulo: "Dormir", icone: "Moon", concluida: false }
    ]
  },
  {
    dia: "Sexta-feira",
    id: "sexta",
    tarefas: [
      { id: "sex1", horario: "05h00 - 07h00", titulo: "Bloco de Ouro 1 ( 1 Video aula + 5 exercícios )", icone: "BookOpen", concluida: false },
      { id: "sex2", horario: "07h45 - 19h00", titulo: "Período de Trabalho (incluindo transporte)", icone: "Briefcase", concluida: false },
      { id: "sex3", horario: "19h00 - 20h00", titulo: "Chegada em casa, banho e jantar", icone: "Utensils", concluida: false },
      { id: "sex4", horario: "20h00 - 21h40", titulo: "Bloco de Ouro 2 (Questões e Revisões)", icone: "BookOpen", concluida: false },
      { id: "sex5", horario: "22h00", titulo: "Dormir", icone: "Moon", concluida: false }
    ]
  },
  {
    dia: "Sábado",
    id: "sabado",
    tarefas: [
      { id: "sab1", horario: "09h00 - 12h00", titulo: "Treino Especial de Redação", icone: "BookOpen", concluida: false },
      { id: "sab2", horario: "12h00 em diante", titulo: "Descanso Total e Lazer", icone: "Smile", concluida: false }
    ]
  },
  {
    dia: "Domingo",
    id: "domingo",
    tarefas: [
      { id: "dom1", horario: "10h00", titulo: "Simulado e Ajustes", icone: "BookOpen", concluida: false },
      { id: "dom2", horario: "Tarde/Noite", titulo: "Lazer e Organização Semanal", icone: "Smile", concluida: false }
    ]
  }
];

const PROMPT_CRONOGRAMA_JSON = `Gere estritamente um array JSON válido contendo os dias da semana e suas respectivas tarefas para um cronograma semanal de alta performance. Siga exatamente esta estrutura:

[
  {
    "dia": "Segunda-feira",
    "id": "segunda",
    "tarefas": [
      { "id": "s1", "horario": "05h00 - 07h00", "titulo": "Descrição da Tarefa", "icone": "BookOpen", "concluida": false }
    ]
  }
]
Ícones permitidos no campo "icone": "BookOpen", "Briefcase", "Utensils", "Moon", "Laptop", "Smile".`;

export default function CronogramaPage() {
  const router = useRouter();
  const [diasSemana, setDiasSemana] = useState<any[]>(cronogramaPadrao);
  const [diaAtualIndex, setDiaAtualIndex] = useState<number>(0);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Modais
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);

  // Estados do Modal de Edição de Tarefa Individual
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editDiaId, setEditDiaId] = useState<string>('');
  const [editTarefaId, setEditTarefaId] = useState<string>('');
  const [editHorario, setEditHorario] = useState<string>('');
  const [editTitulo, setEditTitulo] = useState<string>('');
  const [editIcone, setEditIcone] = useState<string>('BookOpen');

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

      await carregarCronogramaSupabase(uid);
    }
    init();
  }, [router]);

  const carregarCronogramaSupabase = async (uid: string) => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('user_cronograma_progresso')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      
      if (error) throw error;

      if (data && data.dias) {
        setDiasSemana(data.dias);
      } else {
        // Se não existir, cria o padrão para este usuário
        await supabase.from('user_cronograma_progresso').upsert({
          user_id: uid,
          dias: cronogramaPadrao,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        setDiasSemana(cronogramaPadrao);
      }
    } catch (e) {
      console.error("Erro ao carregar cronograma do Supabase:", e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabase = async (novoCronograma: any[]) => {
    if (!userId) return;
    try {
      setDiasSemana(novoCronograma);
      const { error } = await supabase.from('user_cronograma_progresso').upsert({
        user_id: userId,
        dias: novoCronograma,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (e: any) {
      console.error("Erro ao salvar no Supabase:", e);
      alert("Erro ao salvar na nuvem: " + e.message);
    }
  };

  const toggleTarefa = (diaId: string, tarefaId: string) => {
    const atualizado = diasSemana.map((dia) => {
      if (dia.id === diaId) {
        const tarefasAtualizadas = dia.tarefas.map((t: any) => {
          if (t.id === tarefaId) {
            return { ...t, concluida: !t.concluida };
          }
          return t;
        });
        return { ...dia, tarefas: tarefasAtualizadas };
      }
      return dia;
    });
    salvarNoSupabase(atualizado);
  };

  const handleRemoverCronograma = async () => {
    if (confirm("Tem certeza que deseja restaurar o cronograma para o padrão na nuvem?")) {
      await salvarNoSupabase(cronogramaPadrao);
      alert("Cronograma restaurado para o padrão!");
    }
  };

  const handleSalvarNovoJson = async () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].dia && parsed[0].tarefas) {
        await salvarNoSupabase(parsed);
        setShowJsonModal(false);
        setJsonInputText('');
        alert("Novo cronograma salvo com sucesso na nuvem!");
      } else {
        alert("O JSON precisa ser um array válido contendo os dias e tarefas.");
      }
    } catch (e) {
      alert("Erro de sintaxe no JSON. Verifique as chaves e colchetes.");
    }
  };

  const copiarPromptJson = () => {
    navigator.clipboard.writeText(PROMPT_CRONOGRAMA_JSON);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 3000);
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
            { id: novaId, horario: "Novo Horário", titulo: "Nova Tarefa de Estudo", icone: "BookOpen", concluida: false }
          ]
        };
      }
      return dia;
    });
    salvarNoSupabase(atualizado);
  };

  const removerTarefa = (diaId: string, tarefaId: string) => {
    if (confirm("Deseja realmente excluir esta tarefa?")) {
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
      case 'Briefcase': return <Briefcase className={className} />;
      case 'Utensils': return <Utensils className={className} />;
      case 'Moon': return <Moon className={className} />;
      case 'Laptop': return <Laptop className={className} />;
      case 'Smile': return <Smile className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header com Ações de Gerenciamento JSON */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-600/20 text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Alta Performance
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Tabela Dedicada Supabase 🟢
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5">
              Cronograma Semanal de Estudos e Trabalho
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acompanhe suas tarefas diárias, marque as etapas concluídas e gerencie sua rotina com total privacidade.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setJsonInputText(JSON.stringify(diasSemana, null, 2));
                setShowJsonModal(true);
              }}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-400" /> Subir Novo Cronograma (JSON)
            </button>

            <button
              onClick={handleRemoverCronograma}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> Restaurar Padrão
            </button>
          </div>
        </div>

        {/* Bloco de Destaque Sofisticado: Citações do Clóvis de Barros Filho */}
        <div className="bg-amber-400 border border-amber-300 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-zinc-950">
          <div className="absolute -right-10 -bottom-10 text-amber-500/30 pointer-events-none">
            <Quote className="w-40 h-40" />
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 bg-zinc-950 text-amber-400 rounded-xl shrink-0 mt-1 shadow-md">
              <Quote className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
                <span>Inspiração e Mentalidade — Clóvis de Barros Filho</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <blockquote className="bg-zinc-950/90 border border-amber-500/30 rounded-xl p-3.5 text-xs italic text-amber-300 shadow-md">
                  &ldquo;Não tem milagre se você não tiver se preparado.&rdquo;
                </blockquote>
                <blockquote className="bg-zinc-950/90 border border-amber-500/30 rounded-xl p-3.5 text-xs italic text-amber-300 shadow-md">
                  &ldquo;Algumas conquistas são sempre antecedidas de algumas dores.&rdquo;
                </blockquote>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Cards dos Dias da Semana */}
        {carregando ? (
          <div className="flex items-center justify-center p-12 text-zinc-400 text-xs">
            Sincronizando cronograma com o Supabase...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {diasSemana.map((diaObj, index) => {
              const isHoje = index === diaAtualIndex;
              const totalTarefas = diaObj.tarefas.length;
              const tarefasConcluidas = diaObj.tarefas.filter((t: any) => t.concluida).length;
              const progresso = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

              return (
                <div 
                  key={diaObj.id}
                  className={`bg-zinc-950 rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 ${
                    isHoje 
                      ? 'border-red-500/80 shadow-red-950/20 ring-1 ring-red-500/50' 
                      : 'border-zinc-800/90'
                  }`}
                >
                  {isHoje && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-red-600 to-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Hoje
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4 pr-12">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${isHoje ? 'text-red-500' : 'text-blue-400'}`} />
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
                          className={`h-full transition-all duration-500 ${progresso === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-600 to-rose-600'}`}
                          style={{ width: `${progresso}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {diaObj.tarefas.map((tarefa: any) => (
                        <div 
                          key={tarefa.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col gap-3 group/item ${
                            tarefa.concluida 
                              ? 'bg-zinc-900/40 border-zinc-900/80 opacity-60' 
                              : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 shadow-sm'
                          }`}
                        >
                          <div 
                            onClick={() => toggleTarefa(diaObj.id, tarefa.id)}
                            className="flex items-start gap-2.5 cursor-pointer min-w-0"
                          >
                            <div className="mt-0.5 shrink-0">
                              {tarefa.concluida ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-zinc-600 group-hover/item:text-zinc-400 transition-colors" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 mb-1">
                                {renderIcone(tarefa.icone, "w-3.5 h-3.5")}
                                <span>{tarefa.horario}</span>
                              </div>
                              <p className={`text-xs leading-relaxed transition-colors ${tarefa.concluida ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                {tarefa.titulo}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-800/60">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirEdicaoTarefa(diaObj.id, tarefa);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-blue-600/30 border border-zinc-700/85 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                              title="Editar Tarefa"
                            >
                              <Pencil className="w-3 h-3 text-blue-400" /> Editar
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTarefa(diaObj.id, tarefa.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] font-medium cursor-pointer ${
                                tarefa.concluida
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-red-600/20 hover:text-red-300 hover:border-red-500/40'
                              }`}
                            >
                              {tarefa.concluida ? 'Feito' : 'Não feito'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removerTarefa(diaObj.id, tarefa.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800/90 text-zinc-400 hover:text-rose-400 hover:bg-rose-600/20 border border-zinc-700/85 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                              title="Excluir Tarefa"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" /> Apagar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => adicionarNovaTarefa(diaObj.id)}
                      className="w-full mt-3 py-2 bg-zinc-900/60 hover:bg-zinc-900 border border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-red-500" /> Adicionar Tarefa
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-900 text-right">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {tarefasConcluidas} de {totalTarefas} concluídas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* MODAL DE EDIÇÃO INDIVIDUAL DE TAREFA */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setShowEditModal(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800 transition-all text-xs cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 pr-8">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Editar Tarefa</h2>
                <p className="text-[11px] text-zinc-400">Modifique os dados da atividade selecionada.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Horário:</label>
                <input 
                  type="text"
                  value={editHorario}
                  onChange={(e) => setEditHorario(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-3 outline-none focus:border-blue-500"
                  placeholder="Ex: 05h00 - 07h00"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Título da Tarefa:</label>
                <textarea 
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-3 outline-none focus:border-blue-500 resize-none"
                  placeholder="Descrição da tarefa..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Ícone:</label>
                <select
                  value={editIcone}
                  onChange={(e) => setEditIcone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-3 outline-none focus:border-blue-500"
                >
                  <option value="BookOpen">BookOpen (Estudos)</option>
                  <option value="Briefcase">Briefcase (Trabalho)</option>
                  <option value="Utensils">Utensils (Alimentação)</option>
                  <option value="Moon">Moon (Sono)</option>
                  <option value="Laptop">Laptop (Tecnologia)</option>
                  <option value="Smile">Smile (Lazer)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs transition-all border border-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarEdicaoTarefa}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-900/30 cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE SUBIR / GERENCIAR JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setShowJsonModal(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 w-9 h-9 flex items-center justify-center rounded-full border border-zinc-800 transition-all text-sm cursor-pointer"
              title="Fechar"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 pr-10">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Subir Novo Cronograma em JSON</h2>
                <p className="text-xs text-zinc-400">Cole a estrutura JSON formatada para atualizar instantaneamente o seu cronograma na nuvem.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Estrutura JSON do Cronograma:</label>
                  <button
                    onClick={copiarPromptJson}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiadoPrompt 
                        ? 'bg-emerald-600 text-white border-emerald-500' 
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {copiadoPrompt ? 'Prompt Modelo Copiado!' : 'Copiar Modelo Prompt'}
                  </button>
                </div>
                <textarea 
                  value={jsonInputText}
                  onChange={(e) => setJsonInputText(e.target.value)}
                  rows={14}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono rounded-xl p-3.5 outline-none focus:border-blue-500 resize-none leading-relaxed"
                  placeholder="Cole aqui o JSON estruturado..."
                ></textarea>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs transition-all border border-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSalvarNovoJson}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Salvar na Nuvem
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}