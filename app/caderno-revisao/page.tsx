'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lightbulb, Tag, X, Edit3, Plus, Trash2, BookOpen, ExternalLink, AlertTriangle } from 'lucide-react';

const DISCIPLINAS_TJSP = [
  "Língua Portuguesa",
  "Matemática",
  "Raciocínio Lógico",
  "Informática",
  "Direito e Atualidades"
];

const revisaoInicialExemplo = {
  disciplina: "Língua Portuguesa",
  titulo: "Caderno de Revisão: Flashcards VUNESP",
  banca: "VUNESP",
  cards: [
    {
      id: "fc-port-01",
      tag: "Classes Gramaticais",
      assunto: "Pronome relativo",
      detalhes: "PEGADINHA VUNESP: A banca costuma tentar incluir interjeições e artigos como variáveis em graus compostos.",
      pergunta: "Quais são as 10 classes gramaticais da Língua Portuguesa?",
      respostaResumida: "Substantivo, Artigo, Adjetivo, Pronome, Numeral, Verbo, Advérbio, Preposição, Conjunção e Interjeição.",
      statusAvaliacao: null
    }
  ]
};

const PROMPT_MESTRE_FLASHCARD = `Atue como Especialista e Mentor para o concurso do TJSP (Banca VUNESP). 
Gere um JSON estruturado para o Caderno de Revisão (Flashcards). 

⚠️ **REGRA CRÍTICA DE PROTEÇÃO E IDs**: 
- Crie IDs estritamente únicos para cada novo card utilizando sufixos de timestamp ou slugs longos (ex: "fc-assunto-novo-1728000000"). NUNCA reutilice IDs curtos ou genéricos para evitar colisões e sobrescritas acidentais no banco de dados.
- Traga um ASSUNTO OBJETIVO e limpo (ex: "Pronome relativo", "Art. 6 §1 + Direitos sociais", "Razão"). NUNCA inclua emojis, ícones ou símbolos decorativos no campo "assunto", "tag" ou "titulo".

Retorne EXCLUSIVAMENTE o JSON válido, seguindo esta estrutura exata:
{
  "disciplina": "Nome da Disciplina",
  "titulo": "Flashcards VUNESP: [Assunto]",
  "banca": "VUNESP",
  "cards": [
    {
      "id": "fc-assunto-unico-1728000000",
      "tag": "Palavra-Chave",
      "assunto": "Assunto Objetivo",
      "pergunta": "Pergunta objetiva com foco na VUNESP?",
      "respostaResumida": "Explicação ou gabarito direto da resposta.",
      "detalhes": "PEGADINHA VUNESP: Explicação do ponto que a banca mais erra.",
      "statusAvaliacao": null
    }
  ]
}`;

export default function CadernoRevisaoPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [revisoesPorDisciplina, setRevisoesPorDisciplina] = useState<Record<string, any>>({});
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Língua Portuguesa");
  const [selectedAssunto, setSelectedAssunto] = useState<string>("all");

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [modalDisciplinaAlvo, setModalDisciplinaAlvo] = useState<string>("Língua Portuguesa");
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(true);

  const [editandoCardId, setEditandoCardId] = useState<string | null>(null);
  const [novoAssuntoInput, setNovoAssuntoInput] = useState<string>('');

  const [respostasReveladas, setRespostasReveladas] = useState<Record<string, boolean>>({});

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
      setCarregando(true);
      const { data, error } = await supabase.from('caderno_revisao').select('*').eq('user_id', uid);
      if (error) throw error;

      const formatado: Record<string, any> = {};

      if (data && data.length > 0) {
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
      } else if (uid === '96d5de06-229d-4a5c-97c0-dbb47224bb17') {
        await supabase.from('caderno_revisao').upsert({
          user_id: uid,
          disciplina: revisaoInicialExemplo.disciplina,
          titulo: revisaoInicialExemplo.titulo,
          banca: revisaoInicialExemplo.banca,
          cards: revisaoInicialExemplo.cards
        }, { onConflict: 'user_id,disciplina' });
        formatado[revisaoInicialExemplo.disciplina] = revisaoInicialExemplo;
      }

      setRevisoesPorDisciplina(formatado);
    } catch (e) {
      console.error("Erro ao carregar do Supabase:", e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabase = async (disciplinaAlvo: string, payload: any) => {
    if (!userId) return;
    try {
      const { error } = await supabase.from('caderno_revisao').upsert({
        user_id: userId,
        disciplina: disciplinaAlvo,
        titulo: payload.titulo,
        banca: payload.banca || 'VUNESP',
        cards: payload.cards,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,disciplina' });

      if (error) throw error;
      setRevisoesPorDisciplina(prev => ({ ...prev, [disciplinaAlvo]: payload }));
    } catch (e: any) {
      console.error("Erro detalhado Supabase:", e);
      alert(`Erro ao atualizar no banco: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleCarregarJson = async () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      const listaCards = parsed.cards || parsed.ramos;
      if (parsed && listaCards && Array.isArray(listaCards)) {
        const existente = revisoesPorDisciplina[modalDisciplinaAlvo];
        let novosCardsValidos = listaCards.filter(Boolean);

        if (existente && existente.cards) {
          const idsExistentes = new Set(existente.cards.map((c: any) => c.id));
          const idsConflitantes = novosCardsValidos.filter((c: any) => idsExistentes.has(c.id));

          if (idsConflitantes.length > 0) {
            const confirmar = confirm(`Alerta de Segurança: Encontramos ${idsConflitantes.length} ID(s) repetidos. Deseja atualizar os flashcards existentes?`);
            if (!confirmar) return;
          }

          const cardsAtualizadosMap = new Map();
          existente.cards.forEach((c: any) => cardsAtualizadosMap.set(c.id, c));
          
          novosCardsValidos.forEach((c: any) => {
            cardsAtualizadosMap.set(c.id, c);
          });

          novosCardsValidos = Array.from(cardsAtualizadosMap.values());
        }

        const payloadFinal = {
          disciplina: modalDisciplinaAlvo,
          titulo: parsed.titulo || existente?.titulo || `Revisão: ${modalDisciplinaAlvo}`,
          banca: parsed.banca || 'VUNESP',
          cards: novosCardsValidos
        };

        await salvarNoSupabase(modalDisciplinaAlvo, payloadFinal);
        setShowJsonModal(false);
        setJsonInputText('');
        setSelectedDisciplina(modalDisciplinaAlvo);
        setSelectedAssunto('all');
        alert(`Flashcards incorporados com segurança para ${modalDisciplinaAlvo}!`);
      } else {
        alert('O JSON precisa conter obrigatoriamente a chave "cards".');
      }
    } catch (e) {
      alert('Erro de sintaxe no JSON. Verifique se o formato está correto.');
    }
  };

  const toggleRevelar = (cardId: string) => {
    setRespostasReveladas(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

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

  const salvarAssuntoEditado = async (cardId: string) => {
    if (!revisaoAtual) return;

    const cardsAtualizados = revisaoAtual.cards.map((c: any) => {
      if (c.id === cardId) {
        return { ...c, assunto: novoAssuntoInput };
      }
      return c;
    });

    const payloadAtualizado = {
      ...revisaoAtual,
      cards: cardsAtualizados
    };

    await salvarNoSupabase(selectedDisciplina, payloadAtualizado);
    setEditandoCardId(null);
  };

  const excluirCard = async (cardId: string) => {
    if (!revisaoAtual || !userId) return;
    if (confirm("Deseja apagar este flashcard?")) {
      const novosCards = revisaoAtual.cards.filter((r: any) => r.id !== cardId);
      if (novosCards.length === 0) {
        await supabase.from('caderno_revisao').delete().eq('disciplina', selectedDisciplina).eq('user_id', userId);
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
  
  const assuntosUnicos = revisaoAtual?.cards && Array.isArray(revisaoAtual.cards)
    ? Array.from(new Set(revisaoAtual.cards.map((c: any) => c.assunto || c.titulo || "Geral")))
    : [];

  const cardsExibir = revisaoAtual?.cards && Array.isArray(revisaoAtual.cards) 
    ? revisaoAtual.cards.filter((r: any) => {
        if (selectedAssunto === 'all') return true;
        const nomeAssunto = r.assunto || r.titulo || "Geral";
        return nomeAssunto === selectedAssunto;
      }) 
    : [];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="w-full px-4 sm:px-8 py-6 space-y-6">
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">TJSP - VUNESP</span>
              <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">Segurança Ativa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              {selectedDisciplina === "Direito e Atualidades" ? "Aviso: Estudo pelo Circuito Loop" : (revisaoAtual ? revisaoAtual.titulo : "Painel de Flashcards")}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {selectedDisciplina !== "Direito e Atualidades" && (
              <button
                onClick={() => {
                  setModalDisciplinaAlvo(selectedDisciplina !== "Todas as Matérias" ? selectedDisciplina : DISCIPLINAS_TJSP[0]);
                  setJsonInputText(JSON.stringify(revisaoInicialExemplo, null, 2));
                  setShowJsonModal(true);
                }}
                className="text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-400/50 bg-amber-400 hover:bg-amber-500 text-zinc-950 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Flashcard
              </button>
            )}
          </div>
        </div>

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
                  {disc} {revisoesPorDisciplina && revisoesPorDisciplina[disc] ? "[Ativo]" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/2 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Assunto:</span>
            <select
              value={selectedAssunto}
              onChange={(e) => setSelectedAssunto(e.target.value)}
              disabled={selectedDisciplina === "Todas as Matérias" || selectedDisciplina === "Direito e Atualidades" || !revisaoAtual}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold disabled:opacity-40 cursor-pointer"
            >
              <option value="all">Todos os Assuntos</option>
              {assuntosUnicos.map((assunto: any, idx: number) => (
                <option key={idx} value={assunto}>
                  {assunto}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden p-6 sm:p-10 min-h-[70vh]">
          
          {carregando ? (
            <div className="flex items-center justify-center p-20 text-zinc-400 text-sm">
              Carregando dados da nuvem...
            </div>
          ) : selectedDisciplina === "Todas as Matérias" ? (
            <div className="flex flex-col items-center justify-center text-center p-20 space-y-3">
              <p className="text-base text-zinc-400 font-medium">Selecione uma disciplina para visualizar os flashcards em tela cheia.</p>
            </div>
          ) : selectedDisciplina === "Direito e Atualidades" ? (
            <div className="flex flex-col items-center justify-center text-center p-16 sm:p-24 space-y-6 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-lg">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  ‼️ Flashcard no Circuito Loop sobre Atualidade e Direito
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Os flashcards, questões e materiais de Direito, Atualidades e Estatuto da Pessoa com Deficiência (PCD) encontram-se centralizados e disponíveis na plataforma dedicada Circuito Loop.
                </p>
              </div>
              <a
                href="https://app.circuitoloop.com.br/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black text-xs sm:text-sm rounded-2xl transition-all shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Abrir Circuito Loop</span>
                <ExternalLink className="w-4 h-4" />
              </a>
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
                const statusAtual = card.statusAvaliacao;
                const estaEditando = editandoCardId === card.id;

                return (
                  <div 
                    key={card.id}
                    className="rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative transition-all border bg-zinc-900/60 border-zinc-800/80"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border text-amber-400 bg-amber-400/10 border-amber-400/20">
                            {selectedDisciplina}
                          </span>
                          
                          {!estaEditando ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-300">
                                • {card.assunto || "Assunto Geral"}
                              </span>
                              <button
                                onClick={() => {
                                  setEditandoCardId(card.id);
                                  setNovoAssuntoInput(card.assunto || '');
                                }}
                                className="text-[10px] text-amber-400 hover:underline bg-zinc-900 px-2 py-0.5 rounded border border-amber-400/25 cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Editar Assunto
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={novoAssuntoInput}
                                onChange={(e) => setNovoAssuntoInput(e.target.value)}
                                className="bg-zinc-900 border border-amber-400 text-zinc-100 text-xs px-2.5 py-1 rounded-lg outline-none"
                                placeholder="Novo assunto..."
                              />
                              <button
                                onClick={() => salvarAssuntoEditado(card.id)}
                                className="px-3 py-1 bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg cursor-pointer"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditandoCardId(null)}
                                className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-lg cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>

                        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-2">
                          {card.pergunta || card.titulo || "Questão de Revisão"}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-zinc-950 text-amber-400 border border-amber-400/30 whitespace-nowrap flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {card.tag}
                        </span>

                        <button
                          onClick={() => excluirCard(card.id)}
                          className="text-zinc-500 hover:text-rose-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-rose-500/40 transition-all text-xs cursor-pointer"
                          title="Apagar este card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

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
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                              Resposta:
                            </span>
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

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <span className="text-xs font-bold text-zinc-400">Status de Revisão:</span>
                        <button
                          onClick={() => definirStatus(card.id, 'importante_revisar')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            statusAtual === 'importante_revisar' 
                              ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md ring-2 ring-amber-400/50' 
                              : 'bg-zinc-950 text-amber-400 border-amber-500/30 hover:bg-amber-950/20'
                          }`}
                        >
                          1. Revisar para prova
                        </button>
                        <button
                          onClick={() => definirStatus(card.id, 'revisao_geral')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            statusAtual === 'revisao_geral' 
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-500/50' 
                              : 'bg-zinc-950 text-blue-400 border-blue-500/30 hover:bg-blue-950/20'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" /> 2. Revisao geral
                        </button>
                      </div>

                      {card.detalhes && (
                        <button 
                          onClick={() => setActiveModal(card.id)} 
                          className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-amber-400 text-xs sm:text-sm font-bold rounded-xl border border-amber-400/40 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          Ver Pegadinha e Detalhes VUNESP
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedDisciplina !== "Direito e Atualidades" && (
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-2.5 py-0.5 rounded-full">Mentor VUNESP</span>
                <h2 className="text-sm font-bold text-white">Prompt Mestre para Flashcards</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Gera os cards limpos e com IDs seguros em formato timestamp para proteger o seu histórico.
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
        )}

      </main>

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
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-400 text-zinc-950 border-amber-500 flex items-center gap-1 w-max">
                      <Tag className="w-3 h-3" /> {cardModal.tag}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1">Detalhes e Comentários VUNESP</h2>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-zinc-300 max-h-[65vh] overflow-y-auto pr-1">
                  <div className="p-4 bg-zinc-900 rounded-2xl border border-amber-400/40 text-amber-200 space-y-2 shadow-lg flex items-start gap-2.5">
                    <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-wider text-amber-400">
                        ANÁLISE / PEGADINHA:
                      </p>
                      <p className="leading-relaxed text-zinc-200 text-xs sm:text-sm">{cardModal.detalhes}</p>
                    </div>
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

      {showJsonModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setShowJsonModal(false)} 
              className="absolute top-4 right-4 text-red-400 hover:text-white bg-zinc-900 w-9 h-9 flex items-center justify-center rounded-full border border-red-500/40 transition-all shadow-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-400 text-zinc-950 font-bold shadow-inner flex-shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-400 text-zinc-950 border-amber-500">
                  Gerenciador em Nuvem
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Adicionar / Atualizar Flashcard com Segurança</h2>
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
              <span className="text-[11px] text-zinc-500">A operação será gravada de forma segura na nuvem.</span>
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