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

const mapaInicialExemplo = {
  disciplina: "Língua Portuguesa",
  titulo: "Mapa Mental: Morfossintaxe e Substantivação",
  banca: "VUNESP",
  ramos: [
    {
      id: "substantivo-derivacao",
      titulo: "📌 1. Substantivo e Derivação Imprópria",
      artigos: "MORFOSSINTAXE",
      tag: "Classe Variável",
      tagClasses: "bg-zinc-950 text-amber-400 border-amber-400/40",
      subnos: [
        {
          titulo: "Classe variável que nomeia seres, objetos, ações e sentimentos; atua como núcleo de funções sintáticas.",
          descricao: "",
          corTitulo: "text-zinc-950 font-bold",
          itens: [
            "☑ Flexiona em gênero, número e grau, exercendo função de núcleo do sujeito ou objeto.",
            "☑ Derivação imprópria: qualquer palavra (advérbio, verbo) antecedida por determinante vira substantivo."
          ]
        }
      ],
      modalInfo: {
        title: "💡 Exemplo Prático: Derivação Imprópria",
        tag: "Morfossintaxe",
        tagBg: "bg-amber-400 text-zinc-950 border-amber-500",
        casosPraticos: [
          {
            titulo: "🏛 CASO PRÁTICO 1 — SUBSTANTIVAÇÃO:",
            texto: "A banca coloca uma frase em que um advérbio ou verbo vem precedido de artigo (ex: 'O o anfíbio...')."
          }
        ],
        conclusoes: [
          "✅ Caso 1: A palavra perde sua classe gramatical original por derivação imprópria e passa a atuar como substantivo."
        ],
        pegadinha: "⚠️ Cuidado: A VUNESP costuma tentar induzir o candidato ao erro dizendo que a palavra mantém sua classe primitiva. Sempre olhe para o determinante (artigo/pronome)."
      }
    }
  ]
};

const PROMPT_MESTRE_TEXTO = `Atue como um Especialista em Concursos Públicos e Mentor para o concurso de Escrevente Técnico Judiciário do TJSP (Banca VUNESP). 

Sua tarefa é transformar o assunto de estudo fornecido no final desta instrução em um JSON VÁLIDO e ESTRUTURADO para Mapa Mental Interativo. 

RESPOSTA RESTRITA AO JSON: Retorne EXCLUSIVAMENTE o código JSON válido (sem nenhum texto explicativo, introdução ou markdown fora das chaves).

=====================================================
REGRAS OBRIGATÓRIAS DE CONTEÚDO E ESTRUTURA
=====================================================

1. IDs ÚNICOS E INÉDITOS:
   - Cada item dentro do array 'ramos' DEVE conter um campo 'id' único, descritivo e inédito.

2. REMOÇÃO DE RÓTULOS REDUNDANTES:
   - NUNCA inclua termos como "Regra Principal e Conceito" nos títulos dos sub-itens. Vá direto ao conceito ou regra jurídica na primeira linha do sub-bloco amarelo.

3. ESTRUTURA EXATA DO JSON:
{
  "disciplina": "[Nome Exato da Disciplina do Edital]",
  "titulo": "Mapa Mental: [Nome do Assunto Completo]",
  "banca": "VUNESP",
  "ramos": [
    {
      "id": "identificador-unico",
      "titulo": "📌 1. [Título do Tópico]",
      "artigos": "TEMA",
      "tag": "[Classe]",
      "tagClasses": "bg-zinc-950 text-amber-400 border-amber-400/40",
      "subnos": [
        {
          "titulo": "[Conceito ou Regra Direta sem rótulos extras]",
          "descricao": "",
          "corTitulo": "text-zinc-950 font-bold",
          "itens": ["☑ Ponto 1", "☑ Ponto 2"]
        }
      ],
      "modalInfo": {
        "title": "💡 Aplicação Prática",
        "tag": "Referência",
        "tagBg": "bg-amber-400 text-zinc-950 border-amber-500",
        "casosPraticos": [{"titulo": "CASO 1", "texto": "..."}],
        "conclusoes": ["✅ Desfecho..."],
        "pegadinha": "⚠️ Cuidado com..."
      }
    }
  ]
}`;

export default function MapaMentalPage() {
  const [mapasPorDisciplina, setMapasPorDisciplina] = useState<Record<string, any>>({});
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Todas as Matérias");
  const [selectedAssunto, setSelectedAssunto] = useState<string>("all");

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [modalDisciplinaAlvo, setModalDisciplinaAlvo] = useState<string>("Língua Portuguesa");
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    carregarDadosSupabase();

    const channel = supabase
      .channel('public:mapas_mentais')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mapas_mentais' }, () => {
        carregarDadosSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const carregarDadosSupabase = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from('mapas_mentais').select('*');
      
      if (error) throw error;

      if (data && data.length > 0) {
        const mapaFormatado: Record<string, any> = {};
        data.forEach((item: any) => {
          mapaFormatado[item.disciplina] = {
            disciplina: item.disciplina,
            titulo: item.titulo,
            banca: item.banca,
            ramos: item.ramos
          };
        });
        setMapasPorDisciplina(mapaFormatado);
      } else {
        await supabase.from('mapas_mentais').upsert({
          disciplina: mapaInicialExemplo.disciplina,
          titulo: mapaInicialExemplo.titulo,
          banca: mapaInicialExemplo.banca,
          ramos: mapaInicialExemplo.ramos
        }, { onConflict: 'disciplina' });

        setMapasPorDisciplina({ [mapaInicialExemplo.disciplina]: mapaInicialExemplo });
      }
    } catch (e) {
      console.error("Erro ao carregar mapas do Supabase:", e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabase = async (disciplinaAlvo: string, payloadMapa: any) => {
    try {
      const { error } = await supabase.from('mapas_mentais').upsert({
        disciplina: disciplinaAlvo,
        titulo: payloadMapa.titulo,
        banca: payloadMapa.banca || 'VUNESP',
        ramos: payloadMapa.ramos,
        updated_at: new Date().toISOString()
      }, { onConflict: 'disciplina' });

      if (error) throw error;

      setMapasPorDisciplina(prev => ({
        ...prev,
        [disciplinaAlvo]: payloadMapa
      }));
    } catch (e) {
      console.error("Erro ao salvar no Supabase:", e);
      alert("Erro ao salvar no banco de dados em nuvem. Verifique a conexão.");
    }
  };

  const handleCarregarJson = async () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      if (parsed && parsed.ramos && Array.isArray(parsed.ramos)) {
        const mapaExistente = mapasPorDisciplina[modalDisciplinaAlvo];
        let ramosFinais = [...parsed.ramos];

        if (mapaExistente && mapaExistente.ramos) {
          const idsNovos = new Set(parsed.ramos.map((r: any) => r.id));
          const ramosAntigosPreservados = mapaExistente.ramos.filter((r: any) => !idsNovos.has(r.id));
          ramosFinais = [...ramosAntigosPreservados, ...parsed.ramos];
        }

        const payloadFinal = {
          disciplina: modalDisciplinaAlvo,
          titulo: parsed.titulo || mapaExistente?.titulo || `Mapa Mental: ${modalDisciplinaAlvo}`,
          banca: parsed.banca || 'VUNESP',
          ramos: ramosFinais
        };

        await salvarNoSupabase(modalDisciplinaAlvo, payloadFinal);
        setShowJsonModal(false);
        setJsonInputText('');
        setSelectedDisciplina(modalDisciplinaAlvo);
        setSelectedAssunto('all');
        alert(`Mapa mental atualizado com sucesso na nuvem para ${modalDisciplinaAlvo} (${ramosFinais.length} blocos no total)!`);
      } else {
        alert('O JSON precisa conter obrigatoriamente a chave "ramos".');
      }
    } catch (e) {
      alert('Erro de sintaxe no JSON. Verifique se aspas e chaves estão corretas.');
    }
  };

  const excluirRamo = async (ramoId: string) => {
    if (!mapaAtual) return;
    if (confirm("Deseja apagar este assunto?")) {
      const novosRamos = mapaAtual.ramos.filter((r: any) => r.id !== ramoId);
      
      if (novosRamos.length === 0) {
        await supabase.from('mapas_mentais').delete().eq('disciplina', selectedDisciplina);
        const novoEstado = { ...mapasPorDisciplina };
        delete novoEstado[selectedDisciplina];
        setMapasPorDisciplina(novoEstado);
      } else {
        const novoMapa = { ...mapaAtual, ramos: novosRamos };
        await salvarNoSupabase(selectedDisciplina, novoMapa);
      }
      setSelectedAssunto('all');
    }
  };

  const copiarPromptMestre = () => {
    navigator.clipboard.writeText(PROMPT_MESTRE_TEXTO);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 3000);
  };

  const mapaAtual = selectedDisciplina !== "Todas as Matérias" ? mapasPorDisciplina[selectedDisciplina] : null;
  const ramosExibir = mapaAtual?.ramos ? mapaAtual.ramos.filter((r: any) => selectedAssunto === 'all' || r.id === selectedAssunto) : [];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Header da Página */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">TJSP - VUNESP</span>
              <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-2.5 py-0.5 rounded-full shadow-sm">Sincronizado Supabase 🟢</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {mapaAtual ? mapaAtual.titulo : "Mapa Mental • Edital TJSP"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setModalDisciplinaAlvo(selectedDisciplina !== "Todas as Matérias" ? selectedDisciplina : DISCIPLINAS_TJSP[0]);
                setJsonInputText(JSON.stringify(mapaInicialExemplo, null, 2));
                setShowJsonModal(true);
              }}
              className="text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-400/50 bg-amber-400 hover:bg-amber-500 text-zinc-950 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <svg className="w-4 h-4 text-zinc-950" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> Gerenciar / Adicionar Novos Blocos (JSON)
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
              }}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400"
            >
              <option value="Todas as Matérias">Todas as Matérias</option>
              {DISCIPLINAS_TJSP.map((disc) => (
                <option key={disc} value={disc}>
                  {disc} {mapasPorDisciplina[disc] ? "🟢" : "⚪"}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-2/3 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Assunto:</span>
            {selectedDisciplina === "Todas as Matérias" ? (
              <span className="text-xs text-zinc-500 italic">Selecione uma disciplina acima.</span>
            ) : !mapaAtual ? (
              <span className="text-xs text-amber-400 italic">Nenhum mapa cadastrado.</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setSelectedAssunto('all')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${selectedAssunto === 'all' ? 'border-amber-400 bg-amber-400 text-zinc-950 shadow-lg' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'}`}
                >
                  Todos os Temas
                </button>
                {mapaAtual.ramos.map((ramo: any) => (
                  <button 
                    key={ramo.id}
                    onClick={() => setSelectedAssunto(ramo.id)} 
                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${selectedAssunto === ramo.id ? 'border-amber-400 bg-amber-400 text-zinc-950 shadow-lg' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'}`}
                  >
                    {ramo.titulo.replace(/^[📌⚖️⏱️0-9]+\.\s*/, '')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Container */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col p-6 min-h-[650px]">
          <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>

          <div className="z-10 text-center mb-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 py-3 px-4 rounded-2xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide text-zinc-200">
                {selectedDisciplina !== "Todas as Matérias" ? selectedDisciplina : "Edital TJSP"} - Visão Sistêmica
              </span>
            </div>
            <span className="text-xs text-zinc-400 hidden sm:inline">Clique no botão amarelo para ver o <b>Exemplo Prático e Pegadinha</b></span>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 z-10 overflow-y-auto pr-1">
            {carregando ? (
              <div className="col-span-3 flex items-center justify-center p-12 text-zinc-400 text-xs">
                Sincronizando com o Supabase...
              </div>
            ) : selectedDisciplina === "Todas as Matérias" ? (
              <div className="col-span-3 flex flex-col items-center justify-center text-center p-12 space-y-3">
                <p className="text-sm text-zinc-400 font-medium">Selecione uma disciplina no filtro acima.</p>
              </div>
            ) : !mapaAtual ? (
              <div className="col-span-3 flex flex-col items-center justify-center text-center p-12 space-y-3">
                <p className="text-sm text-zinc-300 font-medium">Nenhum dado cadastrado para <b>{selectedDisciplina}</b>.</p>
                <button 
                  onClick={() => { setModalDisciplinaAlvo(selectedDisciplina); setShowJsonModal(true); }}
                  className="px-4 py-2.5 bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md hover:bg-amber-500 transition-all cursor-pointer"
                >
                  Adicionar Blocos via JSON
                </button>
              </div>
            ) : ramosExibir.length === 0 ? (
              <div className="col-span-3 flex items-center justify-center p-12 text-zinc-500 text-xs">
                Nenhum assunto encontrado.
              </div>
            ) : (
              ramosExibir.map((ramo: any) => (
                <div 
                  key={ramo.id}
                  className="bg-zinc-900/95 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xl group"
                >
                  <div>
                    {/* Cabeçalho do Card (Fundo Escuro, Texto Branco) */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {ramo.artigos}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${ramo.tagClasses || 'bg-zinc-950 text-amber-400 border-amber-400/40'}`}>
                          {ramo.tag}
                        </span>
                        <button
                          onClick={() => excluirRamo(ramo.id)}
                          className="text-zinc-500 hover:text-rose-400 bg-zinc-950 hover:bg-rose-950/40 p-1.5 rounded-lg border border-zinc-800 hover:border-rose-500/40 transition-all text-xs cursor-pointer"
                          title="Apagar este assunto"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Título do Card na parte externa escura */}
                    <h3 className="text-sm font-extrabold text-white mb-4 tracking-tight">{ramo.titulo}</h3>

                    {/* Blocos Internos com Fundo Amarelo e Conteúdo Direto */}
                    <div className="space-y-3 text-xs">
                      {ramo.subnos.map((sub: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-amber-400 text-zinc-950 border border-amber-500 shadow-md space-y-1.5">
                          {sub.titulo && (
                            <span className="font-extrabold block text-xs sm:text-[13px] text-zinc-950 leading-snug">
                              {sub.titulo}
                            </span>
                          )}
                          {sub.descricao && (
                            <p className="text-zinc-900 text-xs leading-relaxed font-semibold">{sub.descricao}</p>
                          )}
                          {sub.itens && sub.itens.length > 0 && (
                            <ul className="text-[11px] text-zinc-900 mt-2 space-y-1 list-disc list-inside font-medium">
                              {sub.itens.map((item: string, iIdx: number) => (
                                <li key={iIdx}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botão Inferior com Fundo Amarelo e Texto Preto */}
                  <button 
                    onClick={() => setActiveModal(ramo.id)} 
                    className="mt-5 w-full py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold rounded-xl border border-amber-500 transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    💡 Exemplo Prático e Pegadinha VUNESP
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 z-10">
            <span>TJSP Escrevente VUNESP</span>
            <span>Sincronizado em Nuvem (Merge por ID)</span>
          </div>
        </div>

        {/* Prompt Mestre Card */}
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-2.5 py-0.5 rounded-full">Mentor TJSP / VUNESP</span>
              <h2 className="text-sm font-bold text-white">Prompt Mestre Definitivo Atualizado</h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Gera mapas mentais limpos, sem rótulos redundantes, indo direto ao conceito jurídico.
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

      {/* MODAL DE EXEMPLOS PRÁTICOS */}
      {activeModal && mapaAtual && (
        (() => {
          const ramoModal = mapaAtual.ramos.find((r: any) => r.id === activeModal);
          if (!ramoModal || !ramoModal.modalInfo) return null;
          const info = ramoModal.modalInfo;
          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
                
                <button 
                  onClick={() => setActiveModal(null)} 
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2 rounded-full border border-zinc-800 transition-all cursor-pointer"
                >
                  ✕
                </button>

                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-400 text-zinc-950 border-amber-500">
                      {info.tag}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1">{info.title}</h2>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 max-h-[60vh] overflow-y-auto pr-1">
                  {info.casosPraticos && info.casosPraticos.map((caso: any, idx: number) => (
                    <div key={idx} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 shadow-inner">
                      <p className="font-bold text-amber-400 uppercase tracking-wide">
                        {caso.titulo}
                      </p>
                      <p className="text-zinc-200 text-xs sm:text-[13px] leading-relaxed">{caso.texto}</p>
                      
                      {info.conclusoes && info.conclusoes[idx] && (
                        <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed font-medium pt-2 border-t border-zinc-800/80">
                          {info.conclusoes[idx]}
                        </p>
                      )}
                    </div>
                  ))}

                  {info.pegadinha && (
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-amber-400/40 text-amber-200 space-y-1.5 shadow-lg">
                      <p className="font-bold uppercase tracking-wider text-amber-400">
                        ⚠️ PEGADINHA VUNESP:
                      </p>
                      <p className="leading-relaxed text-zinc-300 text-xs sm:text-[13px]">{info.pegadinha}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <button 
                    onClick={() => setActiveModal(null)} 
                    className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold rounded-xl text-xs transition-all shadow-lg cursor-pointer"
                  >
                    Entendi! Voltar ao Mapa
                  </button>
                </div>

              </div>
            </div>
          );
        })()
      )}

      {/* MODAL DE INJEÇÃO DE JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setShowJsonModal(false)} 
              className="absolute top-4 right-4 text-red-400 hover:text-white bg-zinc-900 w-9 h-9 flex items-center justify-center rounded-full border border-red-500/40 transition-all shadow-md cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-400 text-zinc-950 font-bold shadow-inner flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-400 text-zinc-950 border-amber-500">
                  Gerenciador em Nuvem (Merge por ID)
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Adicionar / Atualizar Blocos do Mapa Mental</h2>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                Disciplina Alvo:
              </label>
              <select 
                value={modalDisciplinaAlvo}
                onChange={(e) => setModalDisciplinaAlvo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400"
              >
                {DISCIPLINAS_TJSP.map((disc) => (
                  <option key={disc} value={disc}>{disc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                Cole o JSON do Prompt Mestre:
              </label>
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                className="w-full h-40 bg-zinc-900 text-amber-300 p-3 rounded-2xl border border-zinc-800 font-mono text-xs outline-none focus:border-amber-400 resize-none shadow-inner"
                placeholder="Cole o JSON aqui..."
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Une os novos blocos com os anteriores na nuvem.</span>
              <button 
                onClick={handleCarregarJson} 
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
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