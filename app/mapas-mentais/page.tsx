'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';

// Inicialização do Cliente Supabase (Certifique-se de ter as variáveis no seu .env.local)
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
  disciplina: "Direito Processual Civil",
  titulo: "Mapa Mental: D. Processual Civil e Normas",
  banca: "VUNESP",
  ramos: [
    {
      id: "citacao-conceito",
      titulo: "📌 1. Citação: Conceito e Formas de Realização",
      artigos: "ARTS. 238 - 259",
      tag: "Triangulação",
      corBorda: "border-rose-500/40 hover:border-rose-400",
      tagClasses: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      headerIcon: "fa-envelope text-rose-400",
      subnos: [
        {
          titulo: "⚖️ Regra Geral e Meio Eletrônico (Art. 246)",
          descricao: "Convocação do réu, executado ou interessado para integrar a relação processual.",
          corTitulo: "text-amber-300",
          icone: "fa-bolt",
          itens: [
            "Regra PREFERENCIAL: Meio eletrônico (prazo de até 3 dias úteis para confirmação de recebimento após envio).",
            "Ausência de confirmação em 3 dias úteis exige citação por correio, oficial, escrivão/chefe ou edital."
          ]
        },
        {
          titulo: "🏛️ Demais Formas Reais (Correio, Oficial, Cartório)",
          descricao: "Modalidades diretas de comunicação ao citando.",
          corTitulo: "text-amber-300",
          icone: "fa-user-tie",
          itens: [
            "Correio (AR): Regra subsidiária padrão. Entregue ao citando ou ao encarregado da recepção em condomínios/loteamentos.",
            "Oficial de Justiça: Utilizada quando frustrado o meio eletrônico/correio, em ações de estado, réu incapaz ou pessoa de direito público."
          ]
        }
      ],
      modalInfo: {
        title: "💡 Exemplo Prático: Formas de Citação",
        tag: "Art. 238 a 259 CPC",
        tagBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        iconBg: "bg-rose-500/20 text-rose-400 border border-rose-500/40",
        icon: "fa-envelope",
        casosPraticos: [
          {
            titulo: "📌 CASO PRÁTICO — CITAÇÃO ELETRÔNICA:",
            texto: "A empresa ré é intimada por meio eletrônico cadastrado, mas deixa passar o prazo de 3 dias úteis sem acusar o recebimento."
          }
        ],
        conclusoes: [
          "✅ Conclusão: Frustrada a via eletrônica sem confirmação, o processo prossegue com a expedição de mandado por correio ou oficial de justiça."
        ],
        pegadinha: "⚠️ A VUNESP costuma inventar que a ausência de confirmação da citação eletrônica gera revelia automática. Cuidado: ela apenas obriga o uso dos meios tradicionais (correio/oficial), salvo se houver justificativa indevida passível de multa por ato atentatório à dignidade da justiça."
      }
    }
  ]
};

const PROMPT_MESTRE_TEXTO = `Com base estritamente no assunto de estudo fornecido (de qualquer disciplina do edital do TJSP), transforme-o em um JSON válido estruturado para mapa mental (sem nenhum texto ou markdown fora das chaves).

REGRAS OBRIGATÓRIAS PARA QUALQUER ASSUNTO:
1. IDs ÚNICOS E INÉDITOS: Cada item dentro de 'ramos' DEVE ter um campo 'id' único, descritivo e inédito (ex: 'penal-crimes-01', 'adm-licitacoes-02'). NUNCA repita IDs anteriores para garantir o funcionamento correto do merge na nuvem.
2. RIGOR VUNESP & TJSP: Foque na lei seca, jurisprudência pacificada e pegadinhas clássicas da VUNESP para o concurso de Escrevente do TJSP.
3. 4 TÓPICOS OBRIGATÓRIOS POR RAMO: Cada ramo principal DEVE conter estritamente:
   - Um título esquematizado com emojis visuais (📌, ⚖️, ⏱️).
   - O campo 'subnos' detalhando a base legal/conceito com ícones.
   - O objeto 'modalInfo' contendo obrigatoriamente: 'casosPraticos' (situação concreta simulando prova), 'conclusoes' (desfecho jurídico) e 'pegadinha' (armadilha clássica da banca).
4. PADRÃO VISUAL E EMOJIS: Use emojis estratégicos em todos os títulos para facilitar a memorização visual.

Siga exatamente esta estrutura JSON de exemplo:

{
  "disciplina": "Nome exato da Disciplina do Edital TJSP",
  "titulo": "Mapa Mental: [Nome do Assunto]",
  "banca": "VUNESP",
  "ramos": [
    {
      "id": "identificador-unico-e-inedito",
      "titulo": "📌 1. [Título Principal do Tópico]",
      "artigos": "ARTS. X - Y / SÚMULA Z",
      "tag": "Palavra-Chave",
      "corBorda": "border-rose-500/40 hover:border-rose-400",
      "tagClasses": "bg-rose-500/20 text-rose-300 border-rose-500/30",
      "headerIcon": "fa-gavel text-rose-400",
      "subnos": [
        {
          "titulo": "⚖️ Regra Principal e Conceito",
          "descricao": "Explicação objetiva e direta focada no que a VUNESP cobra.",
          "corTitulo": "text-amber-300",
          "icone": "fa-bolt",
          "itens": [
            "Primeiro ponto fundamental com base legal.",
            "Segundo ponto cobrado em provas anteriores."
          ]
        }
      ],
      "modalInfo": {
        "title": "💡 Aplicação Prática: [Assunto]",
        "tag": "Referência Legal",
        "tagBg": "bg-rose-500/20 text-rose-300 border-rose-500/30",
        "iconBg": "bg-rose-500/20 text-rose-400 border border-rose-500/40",
        "icon": "fa-gavel",
        "casosPraticos": [
          {
            "titulo": "🏛️️ CASO PRÁTICO — SITUAÇÃO EM PROVA:",
            "texto": "Descrição de uma situação hipotética simulando uma questão de múltipla escolha da VUNESP..."
          }
        ],
        "conclusoes": [
          "✅ Conclusão jurídica direta fundamentada na legislação ou jurisprudência..."
        ],
        "pegadinha": "⚠️ Cuidado! A VUNESP costuma tentar induzir o candidato ao erro afirmando que [insira a pegadinha clássica da banca sobre o tema]..."
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
  const [modalDisciplinaAlvo, setModalDisciplinaAlvo] = useState<string>("Direito Processual Civil");
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Carrega do Supabase ao iniciar e configura o Realtime
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
        // Insere o exemplo inicial se a tabela estiver vazia
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
        // Pega o mapa/deck existente na disciplina alvo para fazer o merge inteligente por ID
        const mapaExistente = mapasPorDisciplina[modalDisciplinaAlvo];
        let ramosFinais = [...parsed.ramos];

        if (mapaExistente && mapaExistente.ramos) {
          // Cria um Set com os IDs dos ramos novos que estão sendo enviados
          const idsNovos = new Set(parsed.ramos.map((r: any) => r.id));
          
          // Preserva os ramos antigos cujos IDs NÃO estão presentes no novo lote
          const ramosAntigosPreservados = mapaExistente.ramos.filter((r: any) => !idsNovos.has(r.id));
          
          // Une os antigos preservados com os novos ramos (ou atualizados por ID)
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
        alert(`Mapa mental atualizado com sucesso na nuvem para ${modalDisciplinaAlvo} (${ramosFinais.length} blocos no total, sem perder os anteriores)!`);
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
        // Se ficar vazio, remove do banco
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
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Header da Página */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">TJSP - VUNESP</span>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">Sincronizado Supabase 🟢</span>
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
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 transition-all flex items-center gap-1.5 shadow-md"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> Gerenciar / Adicionar Novos Blocos (JSON)
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
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
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
              <span className="text-xs text-amber-400/90 italic">Nenhum mapa cadastrado.</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setSelectedAssunto('all')} 
                  className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${selectedAssunto === 'all' ? 'border-amber-500 bg-amber-600 text-white shadow-lg' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'}`}
                >
                  Todos os Temas
                </button>
                {mapaAtual.ramos.map((ramo: any) => (
                  <button 
                    key={ramo.id}
                    onClick={() => setSelectedAssunto(ramo.id)} 
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${selectedAssunto === ramo.id ? 'border-amber-500 bg-amber-600 text-white shadow-lg' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'}`}
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
            <span className="text-xs text-zinc-400 hidden sm:inline">Clique em um bloco para ver o <b>Exemplo Prático e Pegadinha</b></span>
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
                  className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md hover:bg-amber-500 transition-all"
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
                  className={`bg-zinc-900/90 rounded-2xl p-5 border ${ramo.corBorda} transition-all flex flex-col justify-between shadow-xl group`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-300">
                        {ramo.artigos}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${ramo.tagClasses}`}>
                          {ramo.tag}
                        </span>
                        <button
                          onClick={() => excluirRamo(ramo.id)}
                          className="text-zinc-500 hover:text-rose-400 bg-zinc-950/80 hover:bg-rose-950/40 p-1.5 rounded-lg border border-zinc-800 hover:border-rose-500/40 transition-all text-xs"
                          title="Apagar este assunto"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-4">{ramo.titulo}</h3>

                    <div className="space-y-3 text-xs">
                      {ramo.subnos.map((sub: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 shadow-sm">
                          <span className={`font-bold block mb-1.5 text-xs sm:text-[13px] ${sub.corTitulo || 'text-amber-300'} flex items-center gap-1.5`}>
                            {sub.titulo}
                          </span>
                          {sub.descricao && (
                            <p className="text-zinc-300 text-xs leading-relaxed">{sub.descricao}</p>
                          )}
                          {sub.itens && sub.itens.length > 0 && (
                            <ul className="text-[11px] text-zinc-400 mt-2 space-y-1.5 list-disc list-inside">
                              {sub.itens.map((item: string, iIdx: number) => (
                                <li key={iIdx}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveModal(ramo.id)} 
                    className="mt-5 w-full py-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-1.5 shadow-md"
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
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">Automação Definitiva</span>
              <h2 className="text-sm font-bold text-white">Prompt Mestre com Casos Práticos e Emojis</h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Gera mapas mentais com 4 tópicos obrigatórios (Resumo, Subnós, Casos Práticos e Pegadinhas) e IDs únicos.
            </p>
          </div>

          <button
            onClick={copiarPromptMestre}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 whitespace-nowrap shadow-md ${
              copiadoPrompt 
                ? 'bg-emerald-600 text-white border border-emerald-500' 
                : 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/40'
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
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2 rounded-full border border-zinc-800 transition-all"
                >
                  ✕
                </button>

                <div className="flex items-center gap-3">
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${info.tagBg || 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                      {info.tag}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1">{info.title}</h2>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 max-h-[60vh] overflow-y-auto pr-1">
                  {info.casosPraticos && info.casosPraticos.map((caso: any, idx: number) => (
                    <div key={idx} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 shadow-inner">
                      <p className="font-bold text-amber-300 uppercase tracking-wide">
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
                    <div className="p-4 bg-[#1b151b] rounded-2xl border border-amber-500/40 text-amber-200 space-y-1.5 shadow-lg">
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
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
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
              className="absolute top-4 right-4 text-[#ff7575] hover:text-white bg-[#2a1215] hover:bg-[#3d1a1e] w-9 h-9 flex items-center justify-center rounded-full border border-red-500/40 transition-all shadow-md"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/40 shadow-inner flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">
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
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
              >
                {DISCIPLINAS_TJSP.map((disc) => (
                  <option key={disc} value={disc}>{disc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                Cole o JSON do Prompt Mestre (os novos IDs somam-se aos antigos):
              </label>
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                className="w-full h-40 bg-zinc-900 text-amber-300 p-3 rounded-2xl border border-zinc-800 font-mono text-xs outline-none focus:border-amber-500 resize-none shadow-inner"
                placeholder="Cole o JSON aqui..."
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Une os novos blocos com os anteriores na nuvem.</span>
              <button 
                onClick={handleCarregarJson} 
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
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