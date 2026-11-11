'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Filter, Image as ImageIcon, Tag, BookOpen, Layers, X, AlertCircle, Upload, Edit3, Save } from 'lucide-react';

const DISCIPLINAS_TJSP = [
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
  "Estatuto da Pessoa com Deficiência"
];

interface ErroCard {
  id: string;
  user_id?: string;
  disciplina: string;
  assunto: string;
  titulo: string;
  conteudo: string;
  observacao?: string;
  imagem_url?: string;
  created_at: string;
}

export default function AprendizadoPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [errosPorDisciplina, setErrosPorDisciplina] = useState<Record<string, ErroCard[]>>({});
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Todas as Matérias");
  const [selectedAssunto, setSelectedAssunto] = useState<string>("Todos os Assuntos");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [enviandoImagem, setEnviandoImagem] = useState<boolean>(false);

  // Estados de Edição Livre
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editDisciplina, setEditDisciplina] = useState<string>('');
  const [editAssunto, setEditAssunto] = useState<string>('');
  const [editTitulo, setEditTitulo] = useState<string>('');
  const [editConteudo, setEditConteudo] = useState<string>('');
  const [editObservacao, setEditObservacao] = useState<string>('');

  // Campos do novo card
  const [disciplinaModal, setDisciplinaModal] = useState<string>(DISCIPLINAS_TJSP[0]);
  const [assuntoModal, setAssuntoModal] = useState<string>('');
  const [tituloModal, setTituloModal] = useState<string>('');
  const [conteudoModal, setConteudoModal] = useState<string>('');
  const [observacaoModal, setObservacaoModal] = useState<string>('');
  const [arquivoImagem, setArchivoImagem] = useState<File | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      const uid = session.user.id;
      setUserId(uid);
      carregarDadosSupabase(uid);
    }
    init();
  }, [router]);

  const carregarDadosSupabase = async (uid: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('aprendendo_erros')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const agrupado: Record<string, ErroCard[]> = {};
        data.forEach((item: ErroCard) => {
          if (!agrupado[item.disciplina]) {
            agrupado[item.disciplina] = [];
          }
          agrupado[item.disciplina].push(item);
        });
        setErrosPorDisciplina(agrupado);
      } else {
        setErrosPorDisciplina({});
      }
    } catch (e) {
      console.error("Erro ao carregar dados do Supabase:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!tituloModal.trim() || !conteudoModal.trim() || !assuntoModal.trim()) {
      alert("Preencha os campos obrigatórios (Assunto, Título e Enunciado).");
      return;
    }

    try {
      setEnviandoImagem(true);
      let publicImageUrl: string | null = null;

      if (arquivoImagem) {
        const fileExt = arquivoImagem.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('aprendizado-imagens')
          .upload(filePath, arquivoImagem);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('aprendizado-imagens')
          .getPublicUrl(filePath);

        publicImageUrl = publicData.publicUrl;
      }

      const novoCard: any = {
        id: `err-${Date.now()}`,
        user_id: userId,
        disciplina: disciplinaModal,
        assunto: assuntoModal.trim(),
        titulo: tituloModal.trim(),
        conteudo: conteudoModal.trim(),
        observacao: observacaoModal.trim() || null,
        imagem_url: publicImageUrl,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('aprendendo_erros').insert([novoCard]);
      if (insertError) throw insertError;

      await carregarDadosSupabase(userId);
      setShowModal(false);
      setAssuntoModal('');
      setTituloModal('');
      setConteudoModal('');
      setObservacaoModal('');
      setArchivoImagem(null);
      alert("Registro de aprendizado adicionado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      alert(`Erro ao salvar (verifique as políticas RLS do Supabase): ${err.message || JSON.stringify(err)}`);
    } finally {
      setEnviandoImagem(false);
    }
  };

  const iniciarEdicao = (card: ErroCard) => {
    setEditandoId(card.id);
    setEditDisciplina(card.disciplina);
    setEditAssunto(card.assunto);
    setEditTitulo(card.titulo);
    setEditConteudo(card.conteudo);
    setEditObservacao(card.observacao || '');
  };

  const salvarEdicao = async (idCard: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('aprendendo_erros')
        .update({
          disciplina: editDisciplina,
          assunto: editAssunto.trim(),
          titulo: editTitulo.trim(),
          conteudo: editConteudo.trim(),
          observacao: editObservacao.trim() || null
        })
        .eq('id', idCard)
        .eq('user_id', userId);

      if (error) throw error;

      setEditandoId(null);
      await carregarDadosSupabase(userId);
    } catch (err: any) {
      console.error("Erro ao atualizar:", err);
      alert(`Erro ao atualizar: ${err.message || JSON.stringify(err)}`);
    }
  };

  const excluirCard = async (idCard: string) => {
    if (!userId) return;
    if (!confirm("Deseja apagar este registro?")) return;

    try {
      const { error } = await supabase
        .from('aprendendo_erros')
        .delete()
        .eq('id', idCard)
        .eq('user_id', userId);

      if (error) throw error;
      await carregarDadosSupabase(userId);
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir o registro.");
    }
  };

  const assuntosDisponiveis = useMemo(() => {
    let listaCards: ErroCard[] = [];
    if (selectedDisciplina === "Todas as Matérias") {
      Object.values(errosPorDisciplina).forEach(arr => {
        listaCards = listaCards.concat(arr);
      });
    } else {
      listaCards = errosPorDisciplina[selectedDisciplina] || [];
    }
    const unicos = Array.from(new Set(listaCards.map(c => c.assunto).filter(Boolean)));
    return unicos;
  }, [errosPorDisciplina, selectedDisciplina]);

  const cardsParaExibir = useMemo(() => {
    let lista = selectedDisciplina === "Todas as Matérias"
      ? Object.values(errosPorDisciplina).flat()
      : (errosPorDisciplina[selectedDisciplina] || []);

    if (selectedAssunto !== "Todos os Assuntos") {
      lista = lista.filter(c => c.assunto === selectedAssunto);
    }

    return lista;
  }, [errosPorDisciplina, selectedDisciplina, selectedAssunto]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">TJSP - VUNESP</span>
              <span className="bg-blue-500/20 text-blue-400 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-500/30">Banco de Aprendizado Ativo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              Aprendizado e Correção de Erros
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Registre pegadinhas e pontos de atenção para blindar sua preparação.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-400/50 bg-amber-400 hover:bg-amber-500 text-zinc-950 transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Registro de Aprendizado
          </button>
        </div>

        {/* Filtros por Matéria e Assunto */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/2 flex items-center gap-3">
            <Filter className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Matéria:</span>
            <select 
              value={selectedDisciplina}
              onChange={(e) => {
                setSelectedDisciplina(e.target.value);
                setSelectedAssunto("Todos os Assuntos");
              }}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer"
            >
              <option value="Todas as Matérias">Todas as Matérias</option>
              {DISCIPLINAS_TJSP.map((disc) => (
                <option key={disc} value={disc}>
                  {disc} {errosPorDisciplina[disc] ? `(${errosPorDisciplina[disc].length})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/2 flex items-center gap-3">
            <Tag className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Assunto:</span>
            <select 
              value={selectedAssunto}
              onChange={(e) => setSelectedAssunto(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer"
            >
              <option value="Todos os Assuntos">Todos os Assuntos</option>
              {assuntosDisponiveis.map((assunto) => (
                <option key={assunto} value={assunto}>{assunto}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Listagem dos Cards em Coluna (Um embaixo do outro) */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-10 min-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center p-20 text-zinc-400 text-sm">
              Carregando registros...
            </div>
          ) : cardsParaExibir.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-20 space-y-3">
              <AlertCircle className="w-10 h-10 text-zinc-600" />
              <p className="text-sm text-zinc-400 font-medium">Nenhum registro encontrado para os filtros selecionados.</p>
              <button 
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md hover:bg-amber-300 transition-all cursor-pointer"
              >
                Criar Primeiro Registro
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {cardsParaExibir.map((card) => {
                const isEditing = editandoId === card.id;

                return (
                  <div 
                    key={card.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 transition-all hover:border-amber-400/40"
                  >
                    {!isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                            {card.disciplina}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => iniciarEdicao(card)}
                              className="text-zinc-400 hover:text-amber-400 p-2 rounded-lg transition-all cursor-pointer bg-zinc-950 border border-zinc-800"
                              title="Editar card"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => excluirCard(card.id)}
                              className="text-zinc-500 hover:text-rose-400 p-2 rounded-lg transition-all cursor-pointer bg-zinc-950 border border-zinc-800"
                              title="Apagar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{card.assunto}</span>
                          </div>
                          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight break-words">
                            {card.titulo}
                          </h2>
                        </div>

                        {/* Campo de Enunciado em destaque na cor amarela */}
                        <div className="bg-amber-400/10 border border-amber-400/40 rounded-2xl p-4 sm:p-5 text-amber-100 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-inner">
                          <span className="font-extrabold text-amber-400 uppercase text-[11px] tracking-wider block mb-1">Enunciado / Descrição:</span>
                          {card.conteudo}
                        </div>

                        {card.imagem_url && (
                          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center p-2 shadow-inner">
                            <img 
                              src={card.imagem_url} 
                              alt={card.titulo} 
                              className="max-h-[500px] object-contain w-full rounded-xl"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                        )}

                        {card.observacao && (
                          <div className="bg-amber-950/20 border border-amber-400/30 rounded-2xl p-4 text-amber-200 text-xs sm:text-sm space-y-1">
                            <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block">Observação:</span>
                            <p className="whitespace-pre-wrap leading-relaxed">{card.observacao}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 bg-zinc-950 p-6 rounded-2xl border border-amber-400/50">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="text-xs font-bold text-amber-400">Modo de Edição</span>
                          <button 
                            onClick={() => setEditandoId(null)}
                            className="text-zinc-400 hover:text-white text-xs cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>

                        <select 
                          value={editDisciplina}
                          onChange={(e) => setEditDisciplina(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none font-semibold"
                        >
                          {DISCIPLINAS_TJSP.map((disc) => (
                            <option key={disc} value={disc}>{disc}</option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={editAssunto}
                          onChange={(e) => setEditAssunto(e.target.value)}
                          placeholder="Assunto"
                          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 outline-none"
                        />

                        <input
                          type="text"
                          value={editTitulo}
                          onChange={(e) => setEditTitulo(e.target.value)}
                          placeholder="Título"
                          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 outline-none font-bold"
                        />

                        <textarea
                          rows={5}
                          value={editConteudo}
                          onChange={(e) => setEditConteudo(e.target.value)}
                          placeholder="Enunciado / Descrição"
                          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl p-3 outline-none resize-none"
                        />

                        <textarea
                          rows={3}
                          value={editObservacao}
                          onChange={(e) => setEditObservacao(e.target.value)}
                          placeholder="Observação (Opcional)"
                          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl p-3 outline-none resize-none"
                        />

                        <button
                          onClick={() => salvarEdicao(card.id)}
                          className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Save className="w-4 h-4" /> Salvar Alterações
                        </button>
                      </div>
                    )}

                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="font-mono">ID: {card.id}</span>
                      <span>{new Date(card.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Modal de Cadastro Manual */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 my-8">
            
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2.5 rounded-full border border-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-400 text-zinc-950 font-bold shrink-0 shadow-inner">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-400/20 text-amber-400 border-amber-400/30">
                  ID Automático Gerado
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">Novo Registro de Aprendizado</h2>
              </div>
            </div>

            <form onSubmit={handleCriarCard} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Disciplina:</label>
                <select 
                  value={disciplinaModal}
                  onChange={(e) => setDisciplinaModal(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer"
                >
                  {DISCIPLINAS_TJSP.map((disc) => (
                    <option key={disc} value={disc}>{disc}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Assunto:</label>
                <input
                  type="text"
                  required
                  value={assuntoModal}
                  onChange={(e) => setAssuntoModal(e.target.value)}
                  placeholder="Ex: Art. 5 da CF..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Título do Erro / Pegadinha:</label>
                <input
                  type="text"
                  required
                  value={tituloModal}
                  onChange={(e) => setTituloModal(e.target.value)}
                  placeholder="Ex: Confusão entre imunidade e isenção"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Enunciado (Destaque Amarelo):</label>
                <textarea
                  required
                  rows={4}
                  value={conteudoModal}
                  onChange={(e) => setConteudoModal(e.target.value)}
                  placeholder="Cole ou digite o enunciado da questão..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl p-3 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Observação (Opcional):</label>
                <textarea
                  rows={2}
                  value={observacaoModal}
                  onChange={(e) => setObservacaoModal(e.target.value)}
                  placeholder="Adicione anotações ou lembretes extras..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl p-3 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-amber-400" /> Anexar Imagem do Computador (Opcional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivoImagem(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-zinc-950 file:cursor-pointer cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoImagem}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {enviandoImagem ? 'A enviar imagem...' : 'Salvar Registro'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}