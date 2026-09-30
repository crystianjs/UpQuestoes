'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

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

  useEffect(() => {
    const savedDecks = localStorage.getItem('upquest_flashcards');
    if (savedDecks) {
      try {
        setDecksPorDisciplina(JSON.parse(savedDecks));
      } catch (e) {
        console.error("Erro ao carregar flashcards", e);
      }
    } else {
      const inicial = { "Língua Portuguesa": flashcardsInicialExemplo };
      setDecksPorDisciplina(inicial);
      localStorage.setItem('upquest_flashcards', JSON.stringify(inicial));
    }

    const savedProgresso = localStorage.getItem('upquest_flashcards_progresso');
    if (savedProgresso) {
      try {
        setProgressoCards(JSON.parse(savedProgresso));
      } catch (e) {
        console.error("Erro ao carregar progresso", e);
      }
    }
  }, []);

  const salvarStorage = (novoEstado: Record<string, any>) => {
    setDecksPorDisciplina(novoEstado);
    localStorage.setItem('upquest_flashcards', JSON.stringify(novoEstado));
  };

  const handleCarregarJson = () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      if (parsed && parsed.cards && Array.isArray(parsed.cards)) {
        const atualizado = {
          ...decksPorDisciplina,
          [modalDisciplinaAlvo]: {
            ...parsed,
            disciplina: modalDisciplinaAlvo
          }
        };
        salvarStorage(atualizado);
        setShowJsonModal(false);
        setJsonInputText('');
        setSelectedDisciplina(modalDisciplinaAlvo);
        setSelectedAssunto('all');
        setCardIndex(0);
        setIsFlipped(false);
        alert(`Flashcards salvos com sucesso para ${modalDisciplinaAlvo}!`);
      } else {
        alert('O JSON precisa conter obrigatoriamente a chave "cards".');
      }
    } catch (e) {
      alert('Erro de sintaxe no JSON. Verifique as chaves e aspas.');
    }
  };

  const excluirCard = (cardId: string) => {
    if (!deckAtual) return;
    if (confirm("Deseja apagar este flashcard específico?")) {
      const novosCards = deckAtual.cards.filter((c: any) => c.id !== cardId);
      let novoEstado = { ...decksPorDisciplina };
      if (novosCards.length === 0) {
        delete novoEstado[selectedDisciplina];
      } else {
        novoEstado[selectedDisciplina] = { ...deckAtual, cards: novosCards };
      }
      salvarStorage(novoEstado);
      setCardIndex(0);
      setIsFlipped(false);
    }
  };

  const copiarPromptMestre = () => {
    navigator.clipboard.writeText(PROMPT_MESTRE_FLASHCARDS);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 3000);
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

  const avaliarDesempenho = (avaliacao: 'ruim' | 'medio' | 'bom') => {
    if (!cardAtual) return;
    const novoProgresso = {
      ...progressoCards,
      [cardAtual.id]: avaliacao
    };
    setProgressoCards(novoProgresso);
    localStorage.setItem('upquest_flashcards_progresso', JSON.stringify(novoProgresso));
    
    setTimeout(() => {
      proximoCard();
    }, 350);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Header da Página */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">TJSP - VUNESP</span>
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">Caderno de Revisão e Flashcards</span>
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
                setShowJsonModal(true);
              }}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 transition-all flex items-center gap-1.5 shadow-md"
            >
              <i className="fa-solid fa-code text-amber-400"></i> Gerenciar / Colar Novo JSON
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/3 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap"><i className="fa-solid fa-book text-amber-400 mr-1"></i> Disciplina:</span>
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
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap"><i className="fa-solid fa-filter text-amber-400 mr-1"></i> Tópico:</span>
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
                <i className="fa-solid fa-layer-group text-amber-400"></i> Card {cardsExibir.length > 0 ? cardIndex + 1 : 0} de {cardsExibir.length}
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
                <i className="fa-solid fa-trash-can text-rose-400"></i> Apagar Card
              </button>
            )}
          </div>

          <div className="z-10 my-6 flex-1 flex flex-col items-center justify-center">
            {selectedDisciplina === "Todas as Matérias" ? (
              <div className="text-center p-12 space-y-3">
                <i className="fa-solid fa-brain text-5xl text-zinc-700"></i>
                <p className="text-sm text-zinc-400 font-medium">Selecione uma disciplina no filtro acima para iniciar os estudos.</p>
              </div>
            ) : !deckAtual || cardsExibir.length === 0 ? (
              <div className="text-center p-12 space-y-3">
                <i className="fa-solid fa-code text-5xl text-amber-500/60"></i>
                <p className="text-sm text-zinc-300 font-medium">Nenhum flashcard encontrado para esta seleção.</p>
                <button 
                  onClick={() => { setModalDisciplinaAlvo(selectedDisciplina); setShowJsonModal(true); }}
                  className="px-4 py-2.5 bg-amber-500 text-black font-bold rounded-xl text-xs shadow-md hover:bg-amber-400 transition-all"
                >
                  Gerar Flashcards por JSON
                </button>
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-zinc-900/95 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[320px] relative transition-all">
                
                <div className="absolute top-4 right-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${isFlipped ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                    {isFlipped ? '✨ Verso (Resposta)' : '❓ Frente (Pergunta)'}
                  </span>
                </div>

                <div className="mt-4 mb-6">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i className={`fa-solid ${cardAtual.icone || 'fa-circle-question'}`}></i> {cardAtual.assunto}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                        {cardAtual.pergunta}
                      </h2>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-check"></i> Resposta Correta:
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-zinc-100 leading-relaxed bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                        {cardAtual.respostaResumida}
                      </p>
                      {cardAtual.detalhes && (
                        <p className="text-xs text-amber-300 bg-amber-950/20 p-3 rounded-xl border border-amber-500/30">
                          <b>Macete VUNESP:</b> {cardAtual.detalhes}
                        </p>
                      )}

                      {/* Botões com Fixação de Cor Baseada no Estado Armazenado */}
                      <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                        <p className="text-xs font-semibold text-zinc-400">Sua revisão sobre o assunto é:</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => avaliarDesempenho('ruim')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow ${
                              progressoCards[cardAtual.id] === 'ruim'
                                ? 'bg-rose-600 text-white border-2 border-rose-400 shadow-rose-900/50 scale-[1.02]'
                                : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-600/30'
                            }`}
                          >
                            🔴 Ruim
                          </button>
                          <button
                            onClick={() => avaliarDesempenho('medio')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow ${
                              progressoCards[cardAtual.id] === 'medio'
                                ? 'bg-amber-600 text-white border-2 border-amber-400 shadow-amber-900/50 scale-[1.02]'
                                : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-400 border border-amber-600/30'
                            }`}
                          >
                            🟡 Médio
                          </button>
                          <button
                            onClick={() => avaliarDesempenho('bom')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow ${
                              progressoCards[cardAtual.id] === 'bom'
                                ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-emerald-900/50 scale-[1.02]'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-600/30'
                            }`}
                          >
                            🟢 Bom
                          </button>
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
                      <i className="fa-solid fa-eye"></i> Virar Cartão e Ver Resposta
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>

          {cardsExibir.length > 0 && (
            <div className="z-10 flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                onClick={cardAnterior}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs border border-zinc-800 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-arrow-left"></i> Anterior
              </button>

              <span className="text-xs text-zinc-500 font-medium">
                TJSP Escrevente VUNESP
              </span>

              <button
                onClick={proximoCard}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs border border-blue-500/40 transition-all flex items-center gap-2 shadow-md"
              >
                Próximo Card <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          )}
        </div>

        {/* Prompt Mestre Card no Final da Página */}
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/25 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40">Automação de Repetição</span>
              <h2 className="text-sm font-bold text-white">Prompt Mestre para Flashcards</h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Gera perguntas diretas de memorização ativa e macetes VUNESP para adicionar direto no seu Caderno de Revisão.
            </p>
          </div>

          <button
            onClick={copiarPromptMestre}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 whitespace-nowrap shadow-md ${
              copiadoPrompt 
                ? 'bg-emerald-600 text-white border border-emerald-500' 
                : 'bg-amber-500 hover:bg-amber-400 text-black font-bold border border-amber-400'
            }`}
          >
            <i className={`fa-solid ${copiadoPrompt ? 'fa-check' : 'fa-copy'}`}></i>
            {copiadoPrompt ? 'Prompt Copiado!' : 'Copiar Prompt Mestre'}
          </button>
        </div>

      </main>

      {/* Modal de Injeção de JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowJsonModal(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2 rounded-full border border-zinc-800 transition-all"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <i className="fa-solid fa-code"></i>
              </div>
              <div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">Gerenciador de Decks</span>
                <h2 className="text-lg font-bold text-white mt-1">Colar JSON de Flashcards</h2>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                <i className="fa-solid fa-book text-amber-400"></i> Disciplina Alvo:
              </label>
              <select 
                value={modalDisciplinaAlvo}
                onChange={(e) => setModalDisciplinaAlvo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
              >
                {DISCIPLINAS_TJSP.map((disc) => (
                  <option key={disc} value={disc}>{disc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                <i className="fa-solid fa-code text-amber-400"></i> Cole o JSON gerado pelo Prompt Mestre:
              </label>
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                className="w-full h-40 bg-zinc-900 text-amber-300 p-3 rounded-2xl border border-zinc-800 font-mono text-xs outline-none focus:border-amber-500 resize-none"
                placeholder="Cole o JSON dos flashcards aqui..."
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Salva automaticamente no armazenamento local.</span>
              <button 
                onClick={handleCarregarJson} 
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
              >
                <i className="fa-solid fa-check"></i> Salvar Deck de Flashcards
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}