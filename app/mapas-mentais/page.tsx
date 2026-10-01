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

const mapaInicialExemplo = {
  disciplina: "Direito Processual Civil",
  titulo: "Mapa Mental: D. Processual Civil e Normas",
  banca: "VUNESP",
  ramos: [
    {
      id: "citacao-conceito",
      titulo: "1. Citação: Conceito e Formas de Realização",
      artigos: "ARTS. 238 - 259",
      tag: "Triangulação",
      corBorda: "border-rose-500/40 hover:border-rose-400",
      tagClasses: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      headerIcon: "fa-envelope text-rose-400",
      subnos: [
        {
          titulo: "Regra Geral e Meio Eletrônico (Art. 246)",
          descricao: "Convocação do réu, executado ou interessado para integrar a relação processual.",
          corTitulo: "text-amber-300",
          icone: "fa-bolt",
          itens: [
            "Regra PREFERENCIAL: Meio eletrônico (prazo de até 3 dias úteis para confirmação de recebimento após envio).",
            "Ausência de confirmação em 3 dias úteis exige citação por correio, oficial, escrivão/chefe ou edital."
          ]
        },
        {
          titulo: "Demais Formas Reais (Correio, Oficial, Cartório)",
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
        title: "Exemplo Prático: Formas de Citação",
        tag: "Art. 238 a 259 CPC",
        tagBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        iconBg: "bg-rose-500/20 text-rose-400 border border-rose-500/40",
        icon: "fa-envelope",
        casosPraticos: [
          {
            titulo: "CASO PRÁTICO — CITAÇÃO ELETRÔNICA:",
            texto: "A empresa ré é intimada por meio eletrônico cadastrado, mas deixa passar o prazo de 3 dias úteis sem acusar o recebimento."
          }
        ],
        conclusoes: [
          "Conclusão: Frustrada a via eletrônica sem confirmação, o processo prossegue com a expedição de mandado por correio ou oficial de justiça."
        ],
        pegadinha: "A VUNESP costuma inventar que a ausência de confirmação da citação eletrônica gera revelia automática. Cuidado: ela apenas obriga o uso dos meios tradicionais (correio/oficial), salvo se houver justificativa indevida passível de multa por ato atentatório à dignidade da justiça."
      }
    },
    {
      id: "citacao-ficta",
      titulo: "2. Citação Ficta: Hora Certa e Edital",
      artigos: "ARTS. 252 - 259",
      tag: "Presunção Legal",
      corBorda: "border-amber-500/40 hover:border-amber-400",
      tagClasses: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      headerIcon: "fa-triangle-exclamation text-amber-400",
      subnos: [
        {
          titulo: "Citação por Hora Certa (Art. 252)",
          descricao: "Modalidade executada exclusivamente por Oficial de Justiça em caso de ocultação.",
          corTitulo: "text-amber-300",
          icone: "fa-clock",
          itens: [
            "Requisito: Suspeita de OCULTAÇÃO do citando após o oficial procurar por 2 (duas) vezes sem sucesso.",
            "Procedimento: Intimação de familiar ou vizinho informando o dia e horário em que retornará no dia útil imediato."
          ]
        },
        {
          titulo: "Citação por Edital (Art. 256)",
          descricao: "Medida excepcionalíssima quando desconhecido ou incerto o citando, ou inacessível o lugar.",
          corTitulo: "text-amber-300",
          icone: "fa-newspaper",
          itens: [
            "Aplica-se quando ignorado, incerto ou inacessível o lugar em que se encontrar o citando.",
            "Fixação do prazo de publicação do edital pelo juiz entre 20 e 60 dias."
          ]
        }
      ],
      modalInfo: {
        title: "Exemplo Prático: Citação por Hora Certa e Edital",
        tag: "Art. 252 a 259 CPC",
        tagBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        iconBg: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
        icon: "fa-triangle-exclamation",
        casosPraticos: [
          {
            titulo: "CASO PRÁTICO — HORA CERTA:",
            texto: "O oficial vai à casa do réu duas vezes e percebe que ele se esconde para não receber o mandado."
          }
        ],
        conclusoes: [
          "Conclusão: O oficial avisa a pessoa da família que retornará no dia útil seguinte em horário certo, realizando a citação na hora marcada mesmo com a ausência intencional."
        ],
        pegadinha: "A VUNESP adora trocar o número de tentativas para a Hora Certa: são necessárias exatamente 2 (duas) tentativas frustradas por suspeita de ocultação."
      }
    },
    {
      id: "intimacoes",
      titulo: "3. Intimações e Cartas Processuais",
      artigos: "ARTS. 260 - 275",
      tag: "Atos de Cientificação",
      corBorda: "border-emerald-500/40 hover:border-emerald-400",
      tagClasses: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      headerIcon: "fa-file-lines text-emerald-400",
      subnos: [
        {
          titulo: "Intimação (Arts. 269 - 275)",
          descricao: "Ato pelo qual se dá ciência a alguém dos atos e dos termos do processo.",
          corTitulo: "text-amber-300",
          icone: "fa-bell",
          itens: [
            "Regra: Realizada via Diário da Justiça Eletrônico (DJE) em nome do advogado constituído.",
            "Nulidade da intimação: Ocorre quando realizada sem observar o pedido expresso de publicação em nome de advogado indicado."
          ]
        },
        {
          titulo: "Espécies de Cartas (Arts. 260 - 268)",
          descricao: "Instrumentos de cooperação interjurisdicional.",
          corTitulo: "text-amber-300",
          icone: "fa-signs-post",
          itens: [
            "Carta Precatória: Solicitada por juízo estadual/federal a outro juízo de jurisdição diversa no território nacional.",
            "Carta Rogatória: Solicitada a autoridade judiciária estrangeira."
          ]
        }
      ],
      modalInfo: {
        title: "Exemplo Prático: Cartas e Intimações",
        tag: "Art. 260 a 275 CPC",
        tagBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
        icon: "fa-file-lines",
        casosPraticos: [
          {
            titulo: "CASO PRÁTICO — CARTA PRECATÓRIA:",
            texto: "Um juiz de São Paulo precisa ouvir uma testemunha que mora em Campinas."
          }
        ],
        conclusoes: [
          "Conclusão: Emite-se uma Carta Precatória direcionada ao juízo de Campinas para a prática do ato processual fora da comarca de origem."
        ],
        pegadinha: "Lembre-se: atos fora da comarca dentro do Brasil utilizam Precatória. Para atos fora do país, usa-se a Rogatória."
      }
    }
  ]
};

const PROMPT_MESTRE_TEXTO = `Com base no resumo de estudo fornecido, transforme-o estritamente no seguinte formato JSON válido (sem markdown extra fora das chaves). 
IMPORTANTE: Cada objeto dentro de 'ramos' deve conter obrigatoriamente o seu próprio objeto 'modalInfo' detalhado com arrays 'casosPraticos' (com titulo e texto) e 'conclusoes', além da string 'pegadinha' focada na banca VUNESP. Cada subnó deve conter o campo 'icone' (ex: fa-bolt, fa-bell, fa-user, etc).

{
  "disciplina": "Nome da Disciplina do Edital TJSP",
  "titulo": "Título curto do Mapa Mental",
  "banca": "VUNESP",
  "ramos": [
    {
      "id": "identificador-unico",
      "titulo": "Título do Bloco",
      "artigos": "ARTS. X - Y",
      "tag": "Palavra Chave",
      "corBorda": "border-rose-500/40 hover:border-rose-400",
      "tagClasses": "bg-rose-500/20 text-rose-300 border-rose-500/30",
      "headerIcon": "fa-gavel text-rose-400",
      "subnos": [
        {
          "titulo": "Título da Subseção",
          "descricao": "Explicação objetiva.",
          "corTitulo": "text-amber-300",
          "icone": "fa-bolt",
          "itens": ["Ponto 1"]
        }
      ],
      "modalInfo": {
        "title": "Exemplo Prático Específico deste Assunto",
        "tag": "Referência Legal",
        "tagBg": "bg-rose-500/20 text-rose-300 border-rose-500/30",
        "iconBg": "bg-rose-500/20 text-rose-400 border border-rose-500/40",
        "icon": "fa-gavel",
        "casosPraticos": [
          {
            "titulo": "CASO PRÁTICO — TEMA:",
            "texto": "Descrição detalhada do caso prático..."
          }
        ],
        "conclusoes": [
          "Conclusão direta relacionada ao caso..."
        ],
        "pegadinha": "Descreva a pegadinha clássica da banca VUNESP..."
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

  useEffect(() => {
    const saved = localStorage.getItem('upquest_mapas_mentais');
    if (saved) {
      try {
        setMapasPorDisciplina(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar mapas", e);
      }
    } else {
      const inicial = { "Direito Processual Civil": mapaInicialExemplo };
      setMapasPorDisciplina(inicial);
      localStorage.setItem('upquest_mapas_mentais', JSON.stringify(inicial));
    }
  }, []);

  const salvarMapasStorage = (novoEstado: Record<string, any>) => {
    setMapasPorDisciplina(novoEstado);
    localStorage.setItem('upquest_mapas_mentais', JSON.stringify(novoEstado));
  };

  const handleCarregarJson = () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      if (parsed && parsed.ramos && Array.isArray(parsed.ramos)) {
        const atualizado = {
          ...mapasPorDisciplina,
          [modalDisciplinaAlvo]: {
            ...parsed,
            disciplina: modalDisciplinaAlvo
          }
        };
        salvarMapasStorage(atualizado);
        setShowJsonModal(false);
        setJsonInputText('');
        setSelectedDisciplina(modalDisciplinaAlvo);
        setSelectedAssunto('all');
        alert(`Mapa mental salvo com sucesso para ${modalDisciplinaAlvo}!`);
      } else {
        alert('O JSON precisa conter obrigatoriamente a chave "ramos".');
      }
    } catch (e) {
      alert('Erro de sintaxe no JSON.');
    }
  };

  const excluirRamo = (ramoId: string) => {
    if (!mapaAtual) return;
    if (confirm("Deseja apagar este assunto?")) {
      const novosRamos = mapaAtual.ramos.filter((r: any) => r.id !== ramoId);
      let novoEstado = { ...mapasPorDisciplina };
      if (novosRamos.length === 0) {
        delete novoEstado[selectedDisciplina];
      } else {
        novoEstado[selectedDisciplina] = { ...mapaAtual, ramos: novosRamos };
      }
      salvarMapasStorage(novoEstado);
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
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">Visão Sistêmica Ampla</span>
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
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> Gerenciar / Colar Novo JSON
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
                    {ramo.titulo.replace(/^[0-9]+\.\s*/, '')}
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
                {selectedDisciplina !== "Todas as Matérias" ? selectedDisciplina : "CPC / VUNESP"} - Visão Sistêmica
              </span>
            </div>
            <span className="text-xs text-zinc-400 hidden sm:inline">Clique em um bloco para ver o <b>Exemplo Prático</b></span>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 z-10 overflow-y-auto pr-1">
            {selectedDisciplina === "Todas as Matérias" ? (
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
                  Colar JSON Agora
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
                    Exemplo Prático e Pegadinha
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 z-10">
            <span>TJSP Escrevente VUNESP</span>
            <span>Fixação rápida garantida</span>
          </div>
        </div>

        {/* Prompt Mestre Card */}
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">Automação de Conteúdo</span>
              <h2 className="text-sm font-bold text-white">Prompt Mestre com Ícones e Cores</h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Gera resumos estruturados com destaque em amarelo para pontos críticos e ícones visuais para melhor assimilação.
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
                        PEGADINHA VUNESP:
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

      {/* MODAL DE INJEÇÃO DE JSON COM O CABEÇALHO PADRONIZADO E SVG NATIVO */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            
            {/* Botão de Fechar Estilizado */}
            <button 
              onClick={() => setShowJsonModal(false)} 
              className="absolute top-4 right-4 text-[#ff7575] hover:text-white bg-[#2a1215] hover:bg-[#3d1a1e] w-9 h-9 flex items-center justify-center rounded-full border border-red-500/40 transition-all shadow-md"
            >
              ✕
            </button>

            {/* Cabeçalho com Ícone SVG Nativo Dourado */}
            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/40 shadow-inner flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Gerenciador de Decks
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Colar Novo JSON de Flashcards</h2>
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
                Cole o JSON do Prompt Mestre:
              </label>
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                className="w-full h-40 bg-zinc-900 text-amber-300 p-3 rounded-2xl border border-zinc-800 font-mono text-xs outline-none focus:border-amber-500 resize-none shadow-inner"
                placeholder="Cole o JSON aqui..."
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Salva direto no armazenamento local.</span>
              <button 
                onClick={handleCarregarJson} 
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
              >
                Salvar na Disciplina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}