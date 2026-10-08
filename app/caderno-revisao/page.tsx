'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

const revisaoInicialExemplo = {
  disciplina: "Língua Portuguesa",
  titulo: "Caderno de Revisão: Flashcards VUNESP",
  banca: "VUNESP",
  cards: [
    {
      id: "fc-port-01",
      tag: "Classes Gramaticais",
      assunto: "Morfologia",
      detalhes: "PEGADINHA VUNESP: A banca costuma tentar incluir interjeições e artigos como variáveis em graus compostos.",
      pergunta: "Quais são as 10 classes gramaticais da Língua Portuguesa?",
      respostaResumida: "Substantivo, Artigo, Adjetivo, Pronome, Numeral, Verbo, Advérbio, Preposição, Conjunção e Interjeição.",
      statusAvaliacao: null
    }
  ]
};

const PROMPT_MESTRE_FLASHCARD = `Atue como Especialista e Mentor para o concurso do TJSP (Banca VUNESP). 
Gere um JSON estruturado para o Caderno de Revisão (Flashcards) contendo perguntas diretas, resposta resumida e detalhes/pegadinha da banca.
Retorne EXCLUSIVAMENTE o JSON válido, seguindo esta estrutura exata:
{
  "disciplina": "Nome da Disciplina",
  "titulo": "Flashcards VUNESP: [Assunto]",
  "banca": "VUNESP",
  "cards": [
    {
      "id": "fc-disc-001",
      "tag": "Palavra-Chave / Assunto Curto",
      "assunto": "Tema Principal",
      "pergunta": "Pergunta objetiva com foco na VUNESP?",
      "respostaResumida": "Explicação ou gabarito direto da resposta.",
      "detalhes": "PEGADINHA VUNESP: Explicação do ponto que a banca mais erra.",
      "statusAvaliacao": null
    }
  ]
}`;

export default function CadernoRevisaoPage() {
  const [revisoesPorDisciplina, setRevisoesPorDisciplina] = useState<Record<string, any>>({});
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Língua Portuguesa");
  const [selectedAssunto, setSelectedAssunto] = useState<string>("all");

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [modalDisciplinaAlvo, setModalDisciplinaAlvo] = useState<string>("Língua Portuguesa");
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Controle de flashcards revelados
  const [respostasReveladas, setRespostasReveladas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    carregarDadosSupabase();
  }, []);

  const carregarDadosSupabase = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from('caderno_revisao').select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        const formatado: Record<string, any> = {};
        data.forEach((item: any) => {
          let rawCards = item.cards;
          if (typeof rawCards === 'string') {
            try { rawCards = JSON.parse(rawCards); } catch (e) { rawCards = []; }
          }
          formatado[item.disciplina] = {
            disciplina: item.disciplina,
            titulo: item.titulo,
            banca: item.banca,
            cards: Array.isArray(rawCards) ? rawCards : []
          };
        });
        setRevisoesPorDisciplina(formatado);
      } else {
        await supabase.from('caderno_revisao').upsert({
          disciplina: revisaoInicialExemplo.disciplina,
          titulo: revisaoInicialExemplo.titulo,
          banca: revisaoInicialExemplo.banca,
          cards: revisaoInicialExemplo.cards
        }, { onConflict: 'disciplina' });
        setRevisoesPorDisciplina({ [revisaoInicialExemplo.disciplina]: revisaoInicialExemplo });
      }
    } catch (e) {
      console.error("Erro ao carregar do Supabase:", e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabase = async (disciplinaAlvo: string, payload: any) => {
    try {
      const { error } = await supabase.from('caderno_revisao').upsert({
        disciplina: disciplinaAlvo,
        titulo: payload.titulo,
        banca: payload.banca || 'VUNESP',
        cards: payload.cards,
        updated_at: new Date().toISOString()
      }, { onConflict: 'disciplina' });

      if (error) throw error;
      setRevisoesPorDisciplina(prev => ({ ...prev, [disciplinaAlvo]: payload }));
    } catch (e) {
      alert("Erro ao salvar no banco.");
    }
  };

  const handleCarregarJson = async () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      const listaCards = parsed.cards || parsed.ramos;
      if (parsed && listaCards && Array.isArray(listaCards)) {
        const existente = revisoesPorDisciplina[modalDisciplinaAlvo];
        let cardsFinais = [...listaCards];

        if (existente && existente.cards) {
          const idsNovos = new Set(listaCards.map((r: any) => r.id));
          const preservados = existente.cards.filter((r: any) => !idsNovos.has(r.id));
          cardsFinais = [...preservados, ...listaCards];
        }

        const payloadFinal = {
          disciplina: modalDisciplinaAlvo,
          titulo: parsed.titulo || existente?.titulo || `Revisão: ${modalDisciplinaAlvo}`,
          banca: parsed.banca || 'VUNESP',
          cards: cardsFinais
        };

        await salvarNoSupabase(modalDisciplinaAlvo, payloadFinal);
        setShowJsonModal(false);
        setJsonInputText('');
        setSelectedDisciplina(modalDisciplinaAlvo);
        setSelectedAssunto('all');
        alert(`Atualizado com sucesso para ${modalDisciplinaAlvo}!`);
      } else {
        alert('O JSON precisa conter a chave "cards".');
      }
    } catch (e) {
      alert('Erro de sintaxe no JSON.');
    }
  };

  const toggleRevelar = (cardId: string) => {
    setRespostasReveladas(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Salva o status de desempenho diretamente dentro do card e sincroniza com o Supabase
  const definirStatus = async (cardId: string, status: string) => {
    if (!revisaoAtual) return;

    const cardsAtualizados = revisaoAtual.cards.map((c: any) => {
      if (c.id === cardId) {
        return { ...c, statusAvaliacao: status };
      }
      return c;
    });

    const payloadAtualizado = {
      ...revisaoAtual,
      cards: cardsAtualizados
    };

    await salvarNoSupabase(selectedDisciplina, payloadAtualizado);
  };

  const excluirCard = async (cardId: string) => {
    if (!revisaoAtual) return;
    if (confirm("Deseja apagar este flashcard?")) {
      const novosCards = revisaoAtual.cards.filter((r: any) => r.id !== cardId);
      if (novosCards.length === 0) {
        await supabase.from('caderno_revisao').delete().eq('disciplina', selectedDisciplina);
        const novoEstado = { ...revisoesPorDisciplina };
        delete novoEstado[selectedDisciplina];
        setRevisoesPorDisciplina(novoEstado);
      } else {
        const novoMapa = { ...revisaoAtual, cards: novosCards };
        await salvarNoSupabase(selectedDisciplina, novoMapa);
      }
      setSelectedAssunto('all');
    }
  };

  const copiarPromptMestre = () => {
    navigator.clipboard.writeText(PROMPT_MESTRE_FLASHCARD);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 3000);
  };

  const revisaoAtual = selectedDisciplina !== "Todas as Matérias" ? revisoesPorDisciplina[selectedDisciplina] : null;
  const cardsExibir = revisaoAtual?.cards ? revisaoAtual.cards.filter((r: any) => selectedAssunto === 'all' || r.id === selectedAssunto) : [];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="w-full px-4 sm:px-8 py-6 space-y-6">
        
        {/* Header Superior */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">TJSP - VUNESP</span>
              <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-2.5 py-0.5 rounded-full">Caderno de Revisão 🟢</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              {revisaoAtual ? revisaoAtual.titulo : "Painel de Flashcards"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setModalDisciplinaAlvo(selectedDisciplina !== "Todas as Matérias" ? selectedDisciplina : DISCIPLINAS_TJSP[0]);
                setJsonInputText(JSON.stringify(revisaoInicialExemplo, null, 2));
                setShowJsonModal(true);
              }}
              className="text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-400/50 bg-amber-400 hover:bg-amber-500 text-zinc-950 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              Novo Flashcard
            </button>
          </div>
        </div>

        {/* Filtros Limpos: Matéria e Assunto */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/2 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Matéria:</span>
            <select 
              value={selectedDisciplina}
              onChange={(e) => {
                setSelectedDisciplina(e.target.value);
                setSelectedAssunto('all');
              }}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer"
            >
              <option value="Todas as Matérias">Todas as Matérias</option>
              {DISCIPLINAS_TJSP.map((disc) => (
                <option key={disc} value={disc}>
                  {disc} {revisoesPorDisciplina[disc] ? "🟢" : "⚪"}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/2 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Assunto:</span>
            <select
              value={selectedAssunto}
              onChange={(e) => setSelectedAssunto(e.target.value)}
              disabled={selectedDisciplina === "Todas as Matérias" || !revisaoAtual}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold disabled:opacity-40 cursor-pointer"
            >
              <option value="all">Todos os Assuntos</option>
              {revisaoAtual?.cards?.map((card: any) => (
                <option key={card.id} value={card.id}>
                  {card.titulo || card.tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTAINER EM TELA CHEIA */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden p-6 sm:p-10 min-h-[70vh]">
          
          {carregando ? (
            <div className="flex items-center justify-center p-20 text-zinc-400 text-sm">
              Carregando dados da nuvem...
            </div>
          ) : selectedDisciplina === "Todas as Matérias" ? (
            <div className="flex flex-col items-center justify-center text-center p-20 space-y-3">
              <p className="text-base text-zinc-400 font-medium">Selecione uma disciplina para visualizar os flashcards em tela cheia.</p>
            </div>
          ) : !revisaoAtual ? (
            <div className="flex flex-col items-center justify-center text-center p-20 space-y-3">
              <p className="text-base text-zinc-300 font-medium">Nenhum flashcard encontrado para <b>{selectedDisciplina}</b>.</p>
              <button 
                onClick={() => { setModalDisciplinaAlvo(selectedDisciplina); setShowJsonModal(true); }}
                className="px-5 py-3 bg-amber-400 text-zinc-950 font-extrabold rounded-xl text-xs shadow-md hover:bg-amber-500 transition-all cursor-pointer"
              >
                Cadastrar via JSON
              </button>
            </div>
          ) : cardsExibir.length === 0 ? (
            <div className="flex items-center justify-center p-20 text-zinc-500 text-sm">
              Nenhum assunto correspondente.
            </div>
          ) : (
            <div className="space-y-10">
              {cardsExibir.map((card: any) => {
                const revelado = respostasReveladas[card.id];
                const statusAtual = card.statusAvaliacao; // Lido direto do card persistido

                return (
                  <div 
                    key={card.id}
                    className="bg-zinc-900/60 rounded-2xl p-6 sm:p-8 border border-zinc-800/80 shadow-xl space-y-6 relative"
                  >
                    {/* Cabeçalho */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-amber-400/40 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                          {card.assunto || card.tema || card.artigos || "FLASHCARD"}
                        </span>
                        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-1">
                          {card.pergunta || card.titulo || "Questão de Revisão"}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-zinc-950 text-amber-400 border border-amber-400/30">
                          {card.tag}
                        </span>
                        <button
                          onClick={() => excluirCard(card.id)}
                          className="text-zinc-500 hover:text-rose-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-rose-500/40 transition-all text-xs cursor-pointer"
                          title="Apagar este card"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Área da Resposta */}
                    <div className="space-y-4">
                      {!revelado ? (
                        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                          <p className="text-xs text-zinc-400 italic">A resposta está oculta para treino ativo.</p>
                          <button
                            onClick={() => toggleRevelar(card.id)}
                            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            Ver Resposta
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-5 sm:p-6 rounded-xl bg-zinc-950 border-l-4 border-amber-400 border-t border-r border-b border-zinc-800/80 shadow-md space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Resposta:</span>
                            <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed font-semibold">
                              {card.respostaResumida || card.conteudo || card.resposta || "Resposta não especificada."}
                            </p>
                          </div>

                          <div className="flex justify-start">
                            <button
                              onClick={() => toggleRevelar(card.id)}
                              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              Retornar ao Flashcard (Tentar Novamente)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controles de Desempenho e Botão de Pegadinha VUNESP */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-bold text-zinc-400">Seu Desempenho:</span>
                        <button
                          onClick={() => definirStatus(card.id, 'ruim')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            statusAtual === 'ruim' 
                              ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/50' 
                              : 'bg-zinc-950 text-rose-400 border-rose-500/30 hover:bg-rose-950/20'
                          }`}
                        >
                          🔴 Ruim
                        </button>
                        <button
                          onClick={() => definirStatus(card.id, 'medio')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            statusAtual === 'medio' 
                              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md ring-2 ring-amber-400/50' 
                              : 'bg-zinc-950 text-amber-400 border-amber-500/30 hover:bg-amber-950/20'
                          }`}
                        >
                          🟡 Médio
                        </button>
                        <button
                          onClick={() => definirStatus(card.id, 'bom')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            statusAtual === 'bom' 
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/50' 
                              : 'bg-zinc-950 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20'
                          }`}
                        >
                          🟢 Bom
                        </button>
                      </div>

                      {card.detalhes && (
                        <button 
                          onClick={() => setActiveModal(card.id)} 
                          className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-amber-400 text-xs sm:text-sm font-bold rounded-xl border border-amber-400/40 transition-all shadow-md cursor-pointer"
                        >
                          💡 Ver Pegadinha e Detalhes VUNESP
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé com Prompt Mestre para Flashcards */}
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-2.5 py-0.5 rounded-full">Mentor VUNESP</span>
              <h2 className="text-sm font-bold text-white">Prompt Mestre para Flashcards</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Gera os cards rigorosamente no formato correto para o painel.
            </p>
          </div>

          <button
            onClick={copiarPromptMestre}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap shadow-md cursor-pointer ${
              copiadoPrompt 
                ? 'bg-emerald-600 text-white border border-emerald-500' 
                : 'bg-amber-400 hover:bg-amber-500 text-zinc-950 border border-amber-500'
            }`}
          >
            {copiadoPrompt ? 'Prompt Copiado!' : 'Copiar Prompt Mestre'}
          </button>
        </div>

      </main>

      {/* MODAL DE DETALHES / PEGADINHAS */}
      {activeModal && revisaoAtual && (
        (() => {
          const cardModal = revisaoAtual.cards.find((r: any) => r.id === activeModal);
          if (!cardModal) return null;
          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
                
                <button 
                  onClick={() => setActiveModal(null)} 
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2.5 rounded-full border border-zinc-800 transition-all cursor-pointer"
                >
                  ✕
                </button>

                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-400 text-zinc-950 border-amber-500">
                      {cardModal.tag}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1">Detalhes e Comentários VUNESP</h2>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-zinc-300 max-h-[65vh] overflow-y-auto pr-1">
                  <div className="p-4 bg-zinc-900 rounded-2xl border border-amber-400/40 text-amber-200 space-y-2 shadow-lg">
                    <p className="font-bold uppercase tracking-wider text-amber-400">
                      ⚠️ ANÁLISE / PEGADINHA:
                    </p>
                    <p className="leading-relaxed text-zinc-200 text-xs sm:text-sm">{cardModal.detalhes}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <button 
                    onClick={() => setActiveModal(null)} 
                    className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg cursor-pointer"
                  >
                    Entendi! Voltar ao Caderno
                  </button>
                </div>

              </div>
            </div>
          );
        })()
      )}

      {/* MODAL DE INJEÇÃO DE JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setShowJsonModal(false)} 
              className="absolute top-4 right-4 text-red-400 hover:text-white bg-zinc-900 w-9 h-9 flex items-center justify-center rounded-full border border-red-500/40 transition-all shadow-md cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-400 text-zinc-950 font-bold shadow-inner flex-shrink-0">
              🥷🏻
              </div>
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-400 text-zinc-950 border-amber-500">
                  Gerenciador em Nuvem
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Criar novo flashcard</h2>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-zinc-300">Disciplina Alvo:</label>
              <select 
                value={modalDisciplinaAlvo}
                onChange={(e) => setModalDisciplinaAlvo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer"
              >
                {DISCIPLINAS_TJSP.map((disc) => (
                  <option key={disc} value={disc}>{disc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Cole o JSON do Flashcard:</label>
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                className="w-full h-44 bg-zinc-900 text-amber-300 p-3.5 rounded-2xl border border-zinc-800 font-mono text-xs outline-none focus:border-amber-400 resize-none shadow-inner"
                placeholder="Cole o JSON aqui..."
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Mescla os novos cards com os anteriores na nuvem.</span>
              <button 
                onClick={handleCarregarJson} 
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                Salvar na Nuvem
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}