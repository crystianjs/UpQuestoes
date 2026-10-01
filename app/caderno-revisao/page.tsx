'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';

// Inicialização do Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// MATÉRIAS OFICIAIS DO EDITAL TJSP - VUNESP
// ============================================================================
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

const flashcardsInicialExemplo = {
  disciplina: "Língua Portuguesa",
  titulo: "Flashcards: Morfologia e Classes de Palavras",
  banca: "VUNESP",
  cards: [
    {
      id: "fc-1",
      assunto: "Morfologia",
      tag: "Classes Gramaticais",
      tagClasses: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      pergunta: "Quais são as 10 classes gramaticais da Língua Portuguesa?",
      respostaResumida: "Substantivo, Artigo, Adjetivo, Pronome, Numeral, Verbo, Advérbio, Preposição, Conjunção e Interjeição.",
      detalhes: "Dica VUNESP: As 6 primeiras são variáveis em gênero, número e/ou grau; as 4 últimas são invariáveis. Cuidado com o Numeral, que pode ser variável.",
      icone: "fa-book-open"
    },
    {
      id: "fc-2",
      assunto: "Morfologia",
      tag: "Verbos",
      tagClasses: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      pergunta: "Qual é a diferença fundamental entre Verbos Transitivos Diretos e Indiretos?",
      respostaResumida: "O VTD exige objeto direto sem preposição obrigatória. O VTI exige objeto indireto regido por preposição obrigatória.",
      detalhes: "A VUNESP adora cobrar verbos que mudam de regência ou que aceitam os dois tipos (bitransitivos). Atente-se à regência do verbo 'aspirar' e 'visar'.",
      icone: "fa-bolt"
    }
  ]
};

const PROMPT_MESTRE_FLASHCARDS = `Com base no assunto de estudo fornecido, transforme-o estritamente no seguinte formato JSON válido (sem markdown extra fora das chaves). 
IMPORTANTE: Gere cartões focados em memorização ativa para concurso público (padrão VUNESP), contendo ID único, assunto, tag curta, classes de estilo para a tag, pergunta, respostaResumida, macete de detalhes e icone (ex: fa-brain, fa-book, fa-bolt).

{
  "disciplina": "Nome exato da Disciplina do Edital TJSP",
  "titulo": "Título descritivo do Deck de Flashcards",
  "banca": "VUNESP",
  "cards": [
    {
      "id": "fc-identificador-unico",
      "assunto": "Subtema ou Tópico",
      "tag": "Palavra Chave",
      "tagClasses": "bg-amber-500/20 text-amber-300 border-amber-500/30",
      "pergunta": "Pergunta direta e desafiadora estimulando a lembrança ativa?",
      "respostaResumida": "Resposta clara, objetiva e direta que aparece ao virar o cartão.",
      "detalhes": "Detalhe complementar, macete ou pegadinha clássica da banca VUNESP sobre o tema.",
      "icone": "fa-brain"
    }
  ]
}`;

export default function CadernoRevisaoPage() {
  const [decksPorDisciplina, setDecksPorDisciplina] = useState<Record<string, any>>({});
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Todas as Matérias");
  const [selectedAssunto, setSelectedAssunto] = useState<string>("all");

  // Estados dos Flashcards
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [progressoCards, setProgressoCards] = useState<Record<string, string>>({});

  // Estados dos Modais
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [modalDisciplinaAlvo, setModalDisciplinaAlvo] = useState<string>("Língua Portuguesa");
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);
  const [copiadoModalPrompt, setCopiadoModalPrompt] = useState<boolean>(false);
  const [modalFeedback, setModalFeedback] = useState<{ tipo: 'erro' | 'sucesso'; mensagem: string } | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Carrega do Supabase ao iniciar e ativa sincronização em tempo real (Realtime)
  useEffect(() => {
    carregarDecksDoSupabase();

    const channel = supabase
      .channel('public:caderno_revisao')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caderno_revisao' }, () => {
        carregarDecksDoSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const carregarDecksDoSupabase = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from('caderno_revisao').select('*');
      
      if (error) throw error;

      if (data && data.length > 0) {
        const formatoObj: Record<string, any> = {};
        const progressoGeral: Record<string, string> = {};

        data.forEach((item: any) => {
          formatoObj[item.disciplina] = {
            disciplina: item.disciplina,
            titulo: item.titulo,
            banca: item.banca,
            cards: item.cards
          };

          // Extrai o status/avaliação salvo em cada card
          if (item.cards && Array.isArray(item.cards)) {
            item.cards.forEach((c: any) => {
              if (c.statusAvaliacao) {
                progressoGeral[c.id] = c.statusAvaliacao;
              }
            });
          }
        });

        setDecksPorDisciplina(formatoObj);
        if (Object.keys(progressoGeral).length > 0) {
          setProgressoCards(progressoGeral);
        }
      } else {
        // Insere o exemplo inicial se a tabela estiver vazia
        await supabase.from('caderno_revisao').upsert({
          disciplina: flashcardsInicialExemplo.disciplina,
          titulo: flashcardsInicialExemplo.titulo,
          banca: flashcardsInicialExemplo.banca,
          cards: flashcardsInicialExemplo.cards
        }, { onConflict: 'disciplina' });

        setDecksPorDisciplina({ [flashcardsInicialExemplo.disciplina]: flashcardsInicialExemplo });
      }
    } catch (e) {
      console.error("Erro ao carregar do Supabase:", e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabase = async (disciplinaAlvo: string, deckData: any) => {
    try {
      const { error } = await supabase.from('caderno_revisao').upsert({
        disciplina: disciplinaAlvo,
        titulo: deckData.titulo,
        banca: deckData.banca || 'VUNESP',
        cards: deckData.cards,
        updated_at: new Date().toISOString()
      }, { onConflict: 'disciplina' });

      if (error) throw error;

      setDecksPorDisciplina(prev => ({
        ...prev,
        [disciplinaAlvo]: deckData
      }));
    } catch (e: any) {
      console.error("Erro ao salvar no Supabase:", e);
      setModalFeedback({ tipo: 'erro', mensagem: `Erro ao salvar na nuvem: ${e.message}` });
    }
  };

  const handleCarregarJson = async () => {
    setModalFeedback(null);
    try {
      const parsed = JSON.parse(jsonInputText);
      if (parsed && parsed.cards && Array.isArray(parsed.cards)) {
        const deckFinal = {
          ...parsed,
          disciplina: modalDisciplinaAlvo
        };
        await salvarNoSupabase(modalDisciplinaAlvo, deckFinal);
        setModalFeedback({ tipo: 'sucesso', mensagem: `Deck salvo na nuvem para ${modalDisciplinaAlvo}!` });
        setTimeout(() => {
          setShowJsonModal(false);
          setModalFeedback(null);
          setSelectedDisciplina(modalDisciplinaAlvo);
          setSelectedAssunto('all');
          setCardIndex(0);
          setIsFlipped(false);
        }, 1200);
      } else {
        setModalFeedback({ tipo: 'erro', mensagem: 'O JSON precisa conter obrigatoriamente a chave "cards" em formato de array ([...]).' });
      }
    } catch (e: any) {
      setModalFeedback({ tipo: 'erro', mensagem: `Erro de sintaxe no JSON: ${e.message}` });
    }
  };

  const excluirCard = async (cardId: string) => {
    if (!deckAtual) return;
    if (confirm("Deseja apagar este flashcard da nuvem?")) {
      const novosCards = deckAtual.cards.filter((c: any) => c.id !== cardId);
      
      if (novosCards.length === 0) {
        await supabase.from('caderno_revisao').delete().eq('disciplina', selectedDisciplina);
        const novoEstado = { ...decksPorDisciplina };
        delete novoEstado[selectedDisciplina];
        setDecksPorDisciplina(novoEstado);
      } else {
        const deckAtualizado = { ...deckAtual, cards: novosCards };
        await salvarNoSupabase(selectedDisciplina, deckAtualizado);
      }
      setCardIndex(0);
      setIsFlipped(false);
    }
  };

  const copiarPromptMestre = () => {
    navigator.clipboard.writeText(PROMPT_MESTRE_FLASHCARDS);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 3000);
  };

  const copiarPromptModal = () => {
    navigator.clipboard.writeText(PROMPT_MESTRE_FLASHCARDS);
    setCopiadoModalPrompt(true);
    setTimeout(() => setCopiadoModalPrompt(false), 3000);
  };

  const deckAtual = selectedDisciplina !== "Todas as Matérias" ? decksPorDisciplina[selectedDisciplina] : null;
  const assuntosDisponiveis = deckAtual?.cards ? Array.from(new Set(deckAtual.cards.map((c: any) => c.assunto))) : [];

  const cardsExibir = deckAtual?.cards ? deckAtual.cards.filter((c: any) => selectedAssunto === 'all' || c.assunto === selectedAssunto) : [];
  const cardAtual = cardsExibir[cardIndex] || cardsExibir[0];

  const proximoCard = () => {
    setIsFlipped(false);
    if (cardIndex < cardsExibir.length - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      setCardIndex(0);
    }
  };

  const cardAnterior = () => {
    setIsFlipped(false);
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
    } else {
      setCardIndex(cardsExibir.length - 1);
    }
  };

  const avaliarDesempenho = async (avaliacao: 'ruim' | 'medio' | 'bom') => {
    if (!cardAtual || !deckAtual) return;
    
    const novoProgresso = {
      ...progressoCards,
      [cardAtual.id]: avaliacao
    };
    setProgressoCards(novoProgresso);
    
    // Atualiza o statusAvaliacao dentro do card e salva na nuvem
    const cardsAtualizados = deckAtual.cards.map((c: any) => {
      if (c.id === cardAtual.id) {
        return { ...c, statusAvaliacao: avaliacao };
      }
      return c;
    });

    const deckAtualizado = { ...deckAtual, cards: cardsAtualizados };
    await salvarNoSupabase(selectedDisciplina, deckAtualizado);

    setTimeout(() => {
      proximoCard();
    }, 350);
  };

  // Contadores para o resumo superior
  const totalBons = Object.values(progressoCards).filter(v => v === 'bom').length;
  const totalMedios = Object.values(progressoCards).filter(v => v === 'medio').length;
  const totalRuins = Object.values(progressoCards).filter(v => v === 'ruim').length;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Painel de Status Detalhado por Assunto (Sincronizado) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              🧠 Caderno de Revisão: Status Detalhado por Assunto
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Bom: {totalBons}
            </span>
            <span className="bg-amber-950/60 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Médio: {totalMedios}
            </span>
            <span className="bg-rose-950/60 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Ruim: {totalRuins}
            </span>
          </div>
        </div>

        {/* Header da Página */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">TJSP - VUNESP</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">Sincronizado Supabase 🟢</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {deckAtual ? deckAtual.titulo : "Flashcards de Memorização Ativa"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setModalDisciplinaAlvo(selectedDisciplina !== "Todas as Matérias" ? selectedDisciplina : DISCIPLINAS_TJSP[0]);
                setJsonInputText(JSON.stringify(flashcardsInicialExemplo, null, 2));
                setModalFeedback(null);
                setShowJsonModal(true);
              }}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 transition-all flex items-center gap-1.5 shadow-md"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
              Gerenciar / Colar Novo JSON
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/3 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Disciplina:</span>
            <select 
              value={selectedDisciplina}
              onChange={(e) => {
                setSelectedDisciplina(e.target.value);
                setSelectedAssunto('all');
                setCardIndex(0);
                setIsFlipped(false);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
            >
              <option value="Todas as Matérias">Todas as Matérias</option>
              {DISCIPLINAS_TJSP.map((disc) => (
                <option key={disc} value={disc}>
                  {disc} {decksPorDisciplina[disc] ? "🟢" : "⚪"}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-2/3 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Tópico:</span>
            {selectedDisciplina === "Todas as Matérias" ? (
              <span className="text-xs text-zinc-500 italic">Selecione uma disciplina ao lado.</span>
            ) : !deckAtual ? (
              <span className="text-xs text-amber-400/90 italic">Nenhum flashcard cadastrado.</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { setSelectedAssunto('all'); setCardIndex(0); setIsFlipped(false); }} 
                  className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${selectedAssunto === 'all' ? 'border-amber-500 bg-amber-500 text-black font-bold shadow-lg' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'}`}
                >
                  Todos os Tópicos
                </button>
                {assuntosDisponiveis.map((assunto: any) => (
                  <button 
                    key={assunto}
                    onClick={() => { setSelectedAssunto(assunto); setCardIndex(0); setIsFlipped(false); }} 
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${selectedAssunto === assunto ? 'border-amber-500 bg-amber-500 text-black font-bold shadow-lg' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'}`}
                  >
                    {assunto}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Container do Flashcard */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col p-6 min-h-[550px] justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>

          <div className="z-10 flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                Card {cardsExibir.length > 0 ? cardIndex + 1 : 0} de {cardsExibir.length}
              </span>
              {cardAtual && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cardAtual.tagClasses}`}>
                  {cardAtual.tag}
                </span>
              )}
            </div>

            {cardAtual && (
              <button
                onClick={() => excluirCard(cardAtual.id)}
                className="text-zinc-400 hover:text-rose-400 bg-zinc-900/80 hover:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-rose-500/40 transition-all text-xs font-semibold flex items-center gap-1.5"
                title="Apagar este flashcard específico"
              >
                <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Apagar Card
              </button>
            )}
          </div>

          <div className="z-10 my-6 flex-1 flex flex-col items-center justify-center">
            {carregando ? (
              <div className="text-center p-12 text-zinc-400 text-xs">Sincronizando com o Supabase...</div>
            ) : selectedDisciplina === "Todas as Matérias" ? (
              <div className="text-center p-12 space-y-3">
                <p className="text-sm text-zinc-400 font-medium">Selecione uma disciplina no filtro acima para iniciar os estudos.</p>
              </div>
            ) : !deckAtual || cardsExibir.length === 0 ? (
              <div className="text-center p-12 space-y-3">
                <p className="text-sm text-zinc-300 font-medium">Nenhum flashcard encontrado para esta seleção.</p>
                <button 
                  onClick={() => { 
                    setModalDisciplinaAlvo(selectedDisciplina); 
                    setJsonInputText(JSON.stringify(flashcardsInicialExemplo, null, 2));
                    setModalFeedback(null);
                    setShowJsonModal(true); 
                  }}
                  className="px-4 py-2.5 bg-amber-500 text-black font-bold rounded-xl text-xs shadow-md hover:bg-amber-400 transition-all"
                >
                  Gerar Flashcards por JSON
                </button>
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-zinc-900/95 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[320px] relative transition-all">
                
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {progressoCards[cardAtual.id] && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      progressoCards[cardAtual.id] === 'bom' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      progressoCards[cardAtual.id] === 'medio' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {progressoCards[cardAtual.id].toUpperCase()}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${isFlipped ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                    {isFlipped ? 'Verso (Resposta)' : 'Frente (Pergunta)'}
                  </span>
                </div>

                <div className="mt-4 mb-6">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        {cardAtual.assunto}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                        {cardAtual.pergunta}
                      </h2>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        Resposta Correta:
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-zinc-100 leading-relaxed bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                        {cardAtual.respostaResumida}
                      </p>
                      {cardAtual.detalhes && (
                        <p className="text-xs text-amber-300 bg-amber-950/20 p-3 rounded-xl border border-amber-500/30">
                          <b>Macete VUNESP:</b> {cardAtual.detalhes}
                        </p>
                      )}

                      <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                        <p className="text-xs font-semibold text-zinc-400">Sua revisão sobre o assunto é (salvo na nuvem):</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => avaliarDesempenho('ruim')} className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${progressoCards[cardAtual.id] === 'ruim' ? 'bg-rose-600 text-white border-2 border-rose-400' : 'bg-rose-950/40 text-rose-400 border border-rose-600/30'}`}>Ruim</button>
                          <button onClick={() => avaliarDesempenho('medio')} className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${progressoCards[cardAtual.id] === 'medio' ? 'bg-amber-600 text-white border-2 border-amber-400' : 'bg-amber-950/40 text-amber-400 border border-amber-600/30'}`}>Médio</button>
                          <button onClick={() => avaliarDesempenho('bom')} className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${progressoCards[cardAtual.id] === 'bom' ? 'bg-emerald-600 text-white border-2 border-emerald-400' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-600/30'}`}>Bom</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!isFlipped && (
                  <div className="pt-4 border-t border-zinc-800 flex items-center justify-center">
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black border border-amber-400 shadow-amber-500/20"
                    >
                      Virar Cartão e Ver Resposta
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>

          {cardsExibir.length > 0 && (
            <div className="z-10 flex items-center justify-between pt-4 border-t border-zinc-800">
              <button onClick={cardAnterior} className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs border border-zinc-800">Anterior</button>
              <span className="text-xs text-zinc-500 font-medium">Sincronizado na Nuvem</span>
              <button onClick={proximoCard} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs border border-blue-500/40 shadow-md">Próximo Card</button>
            </div>
          )}
        </div>

        {/* Prompt Mestre Card */}
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Prompt Mestre para Flashcards</h2>
            <p className="text-xs text-zinc-400 max-w-xl">Gera perguntas diretas de memorização ativa e macetes VUNESP.</p>
          </div>
          <button onClick={copiarPromptMestre} className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md">
            {copiadoPrompt ? 'Prompt Copiado!' : 'Copiar Prompt Mestre'}
          </button>
        </div>

      </main>

      {/* Modal JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            <button onClick={() => { setShowJsonModal(false); setModalFeedback(null); }} className="absolute top-4 right-4 z-20 text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-600 p-2 rounded-xl border border-rose-500/40 w-9 h-9 flex items-center justify-center">✕</button>

            <div className="flex items-center justify-between pr-12">
              <h2 className="text-lg font-bold text-white">Enviar Deck para a Nuvem</h2>
              <button onClick={copiarPromptModal} className="text-xs font-semibold px-3 py-2 rounded-xl border bg-zinc-900 text-amber-300 border-amber-500/40">
                {copiadoModalPrompt ? 'Copiado!' : 'Copiar Prompt Mestre'}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Disciplina Alvo:</label>
              <select value={modalDisciplinaAlvo} onChange={(e) => setModalDisciplinaAlvo(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500">
                {DISCIPLINAS_TJSP.map((disc) => (<option key={disc} value={disc}>{disc}</option>))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Cole o JSON gerado:</label>
              <textarea
                value={jsonInputText}
                onChange={(e) => { setJsonInputText(e.target.value); if (modalFeedback) setModalFeedback(null); }}
                className="w-full h-36 bg-zinc-900 text-amber-300 p-3 rounded-2xl border border-zinc-800 font-mono text-xs outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {modalFeedback && (
              <div className={`p-3 rounded-xl border text-xs font-semibold ${modalFeedback.tipo === 'sucesso' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/50 text-rose-300 border-rose-500/40'}`}>
                {modalFeedback.mensagem}
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Sincroniza automaticamente entre PC e Celular.</span>
              <button onClick={handleCarregarJson} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs shadow-md">Salvar na Nuvem</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}