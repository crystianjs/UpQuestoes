'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// --- COMPONENTE DE SELEÇÃO E MARCA-TEXTO (GRIFO REAL NO DOM SEGURO) ---
function TextoGrifavel({ children, idUnico }: { children: React.ReactNode; idUnico: string }) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const salvo = localStorage.getItem(`grifos_dom_${idUnico}`);
    if (salvo && containerRef.current) {
      try {
        containerRef.current.innerHTML = salvo;
      } catch (e) {
        console.error("Erro ao carregar grifos visualmente", e);
      }
    }
  }, [idUnico]);

  const processarSelecao = (clientX: number, clientY: number) => {
    const selecao = window.getSelection();
    if (!selecao || selecao.isCollapsed) {
      setMenuPos(null);
      return;
    }

    const texto = selecao.toString().trim();
    if (texto.length > 0) {
      const range = selecao.getRangeAt(0);
      if (containerRef.current && containerRef.current.contains(range.commonAncestorContainer)) {
        rangeRef.current = range.cloneRange();
        setMenuPos({ x: clientX, y: clientY });
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const selecao = window.getSelection();
    if (selecao && !selecao.isCollapsed) {
      e.preventDefault();
      processarSelecao(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2) return;
    setTimeout(() => {
      const selecao = window.getSelection();
      if (selecao && !selecao.isCollapsed) {
        const range = selecao.getRangeAt(0).getBoundingClientRect();
        processarSelecao(range.left + range.width / 2, range.top - 10);
      } else {
        setMenuPos(null);
      }
    }, 50);
  };

  const aplicarGrifo = (estiloBg: string, corTexto: string) => {
    const range = rangeRef.current;
    if (!range || !containerRef.current) return;

    try {
      const span = document.createElement('mark');
      span.className = `${estiloBg} ${corTexto} rounded px-1 font-semibold transition-all`;
      span.appendChild(range.extractContents());
      range.insertNode(span);

      localStorage.setItem(`grifos_dom_${idUnico}`, containerRef.current.innerHTML);
    } catch (e) {
      console.error("Erro ao aplicar grifo no DOM:", e);
    }

    setMenuPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const removerGrifoTrecho = () => {
    const range = rangeRef.current;
    if (!range || !containerRef.current) return;

    try {
      const marks = containerRef.current.querySelectorAll('mark');
      
      marks.forEach(mark => {
        const markRange = document.createRange();
        markRange.selectNode(mark);

        if (
          range.compareBoundaryPoints(Range.END_TO_START, markRange) < 0 &&
          range.compareBoundaryPoints(Range.START_TO_END, markRange) > 0
        ) {
          const pai = mark.parentNode;
          while (mark.firstChild) {
            pai?.insertBefore(mark.firstChild, mark);
          }
          pai?.removeChild(mark);
        }
      });

      localStorage.setItem(`grifos_dom_${idUnico}`, containerRef.current.innerHTML);
    } catch (e) {
      console.error("Erro ao remover grifo do trecho:", e);
    }

    setMenuPos(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        onContextMenu={handleContextMenu} 
        onMouseUp={handleMouseUp} 
        className="select-text"
      >
        {children}
      </div>

      {menuPos && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setMenuPos(null)} 
            onContextMenu={(e) => { e.preventDefault(); setMenuPos(null); }}
          />

          <div 
            className="fixed z-50 bg-zinc-900 border border-amber-400 shadow-2xl rounded-2xl p-2 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100 transform -translate-x-1/2 -translate-y-full"
            style={{ top: `${menuPos.y}px`, left: `${menuPos.x}px` }}
          >
            <span className="text-[10px] font-black text-amber-400 px-1 uppercase tracking-wider">
              Grifar:
            </span>
            
            <button
              onClick={() => aplicarGrifo('bg-yellow-400/40', 'text-yellow-100')}
              className="w-6 h-6 rounded-full bg-yellow-400 hover:scale-110 transition shadow cursor-pointer border border-yellow-200 flex items-center justify-center text-[10px] text-zinc-950 font-bold"
              title="Amarelo"
            >
              A
            </button>

            <button
              onClick={() => aplicarGrifo('bg-sky-400/40', 'text-sky-100')}
              className="w-6 h-6 rounded-full bg-sky-400 hover:scale-110 transition shadow cursor-pointer border border-sky-200 flex items-center justify-center text-[10px] text-zinc-950 font-bold"
              title="Azul"
            >
              A
            </button>

            <button
              onClick={() => aplicarGrifo('bg-emerald-400/40', 'text-emerald-100')}
              className="w-6 h-6 rounded-full bg-emerald-400 hover:scale-110 transition shadow cursor-pointer border border-emerald-200 flex items-center justify-center text-[10px] text-zinc-950 font-bold"
              title="Verde"
            >
              A
            </button>

            <button
              onClick={() => aplicarGrifo('bg-rose-500/40', 'text-rose-100')}
              className="w-6 h-6 rounded-full bg-rose-500 hover:scale-110 transition shadow cursor-pointer border border-rose-300 flex items-center justify-center text-[10px] text-zinc-950 font-bold"
              title="Vermelho"
            >
              A
            </button>

            <div className="w-[1px] h-4 bg-zinc-700 mx-0.5" />

            <button
              onClick={removerGrifoTrecho}
              className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-rose-600 hover:text-white text-zinc-400 border border-zinc-700 hover:border-rose-500 hover:scale-110 transition shadow cursor-pointer flex items-center justify-center text-[10px] font-bold"
              title="Remover grifo do trecho"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// --- COMPONENTE VISUAL UNIVERSAL DE DIAGRAMAS, CARDS E FLUXOGRAMAS ---
function LogicalDiagram({ grafico }: { grafico: any }) {
  if (!grafico) return null;

  const listaItens = Array.isArray(grafico.elementos) ? grafico.elementos
                   : Array.isArray(grafico.conjuntos) ? grafico.conjuntos
                   : Array.isArray(grafico.grupos) ? grafico.grupos
                   : Array.isArray(grafico.cards) ? grafico.cards
                   : Array.isArray(grafico.etapas) ? grafico.etapas
                   : Array.isArray(grafico.itens) ? grafico.itens
                   : Array.isArray(grafico.nos) ? grafico.nos
                   : Array.isArray(grafico.passos) ? grafico.passos
                   : [];

  return (
    <div className="bg-zinc-950 border border-amber-400/30 rounded-2xl p-5 space-y-4 shadow-inner my-3">
      {grafico.titulo && (
        <div className="border-b border-zinc-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            📌 {grafico.titulo}
          </span>
        </div>
      )}

      <div className={`grid gap-4 ${listaItens.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {listaItens.map((card: any, idx: number) => {
          const tituloCard = card.titulo || card.nome || card.rotulo || `Item ${idx + 1}`;
          const subtituloCard = card.subtitulo || card.destaque || '';
          const conteudoCard = card.conteudo || card.descricao || '';
          const topicosCard = Array.isArray(card.topicos) ? card.topicos : Array.isArray(card.itens) ? card.itens : [];

          return (
            <div 
              key={idx}
              className="rounded-2xl p-4 border space-y-2.5 transition-all shadow-lg"
              style={{
                backgroundColor: card.corFundo || 'rgba(24, 24, 27, 0.9)',
                borderColor: card.corBorda || '#3F3F46'
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: card.corTitulo || '#F59E0B' }}>
                  {card.icone && <span>{card.icone}</span>}
                  {tituloCard}
                </span>
              </div>

              {subtituloCard && <p className="text-xs font-bold text-zinc-200">{subtituloCard}</p>}
              {conteudoCard && <p className="text-xs text-zinc-300 leading-relaxed">{conteudoCard}</p>}

              {topicosCard.length > 0 && (
                <ul className="text-xs text-zinc-300 space-y-1.5 pt-1">
                  {topicosCard.map((tp: string, tIdx: number) => (
                    <li key={tIdx} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{tp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PROMPT_MESTRE_TEXTO = `Atue como Especialista e Mentor para o concurso do TJSP (Banca VUNESP).
Gere um JSON estruturado estrito contendo obrigatoriamente a chave "ramos".

REGRAS CRÍTICAS DE FORMATAÇÃO DO JSON (OBRIGATÓRIO):
1. NUNCA insira quebras de linha literais dentro dos valores de texto/string (ex: NUNCA faça "titulo": "Linha 1 
\\n Linha 2"). Mantenha todo o texto de cada campo em UMA ÚNICA LINHA sem dar Enter dentro de aspas.
2. NUNCA utilize entidades HTML (como &#x20;, &nbsp;, &quot;).
3. Mantenha todas as chaves de fechamento (}, ]) devidamente pareadas.
4. Garanta que cada objeto dentro do array "ramos" possua um campo "id" único e descritivo.

DIRETRIZES DE CRIAÇÃO LIBERADA DE GRÁFICOS E FLUXOGRAMAS:
Seja extremamente criativo, didático e visual na elaboração do campo "grafico". Escolha o formato visual perfeito de acordo com a disciplina:

1. PARA MATEMÁTICA / RACIOCÍNIO LÓGICO (Conjuntos, Silogismos, Venn):
   Use "tipo": "conjuntos_misto" ou "conjuntos_aninhados" com elipses e posições X/Y.

2. PARA DIREITO CONSTITUCIONAL / ADMINISTRATIVO / PENAL / PORTUGUÊS (Cards Comparativos, Quadrados, Retângulos, Tabelas Visuais):
   Use "tipo": "cards_flexiveis" com a estrutura:
   "grafico": {
     "tipo": "cards_flexiveis",
     "titulo": "Nacionalidade Brasileira (Art. 12, CF)",
     "cards": [
       {
         "titulo": "Brasileiro Nato",
         "icone": "👤",
         "badge": "Art. 12, I",
         "corFundo": "rgba(30, 58, 138, 0.4)",
         "corBorda": "#3B82F6",
         "corTitulo": "#60A5FA",
         "subtitulo": "Critério de Origem",
         "topicos": [
           "Nascimento no Brasil (jus soli), salvo pais a serviço do seu país.",
           "Nascimento no exterior de pai ou mãe brasileira a serviço do Brasil."
         ]
       },
       {
         "titulo": "Naturalizado",
         "icone": "📜",
         "badge": "Art. 12, II",
         "corFundo": "rgba(120, 53, 15, 0.4)",
         "corBorda": "#F59E0B",
         "corTitulo": "#FBBF24",
         "subtitulo": "Critério de Vontade / Requisitos",
         "topicos": [
           "Ordinária: 1 ano ininterrupto + idoneidade moral (países de língua portuguesa).",
           "Extraordinária: mais de 15 anos + ausência de condenação penal."
         ]
       }
     ],
     "conclusao": "Brasileiro nato jamais será extraditado; naturalizado pode apenas em crime comum antes da naturalização ou tráfico ilícito.",
     "descricao": "Resumo comparativo direto para questões de prova VUNESP."
   }

3. PARA FLUXOGRAMAS / PROCEDIMENTOS / PRAZOS PROCESSUAIS (Com Setas Conectoras):
   Use "tipo": "fluxograma" com a estrutura:
   "grafico": {
     "tipo": "fluxograma",
     "titulo": "Fluxograma de Naturalização Extraordinária",
     "etapas": [
       {
         "titulo": "Ponto de Partida",
         "destaque": "Qualquer Nacionalidade",
         "corFundo": "rgba(24, 24, 27, 0.95)",
         "corBorda": "#3F3F46",
         "rotuloSeta": "Requisitos Temporais"
       },
       {
         "titulo": "Exigência Principal",
         "destaque": "Mais de 15 Anos Ininterruptos",
         "descricao": "Residência contínua no Brasil sem infrações penais gravemente apenadas.",
         "corFundo": "rgba(6, 78, 59, 0.4)",
         "corBorda": "#10B981",
         "corTexto": "#34D399"
       }
     ],
     "conclusao": "A concessão extraordinária não exige idoneidade prévia em rol taxativo além da ausência de condenação."
   }

ESTRUTURA COMPLETA DO JSON EXIGIDA:
{
  "ramos": [
    {
      "id": "identificador-unico-12345",
      "titulo": "Título do Tópico em linha única",
      "artigos": "CF/88 Art. 12",
      "tag": "Constitucional",
      "assunto": "Nacionalidade",
      "tipo": "conceito",
      "grafico": { ... },
      "subnos": [
        {
          "titulo": "Destaque da Legislação",
          "itens": ["Ponto 1", "Ponto 2"]
        }
      ],
      "modalInfo": {
        "title": "Dica de Ouro VUNESP",
        "tag": "Estratégia",
        "casosPraticos": [
          {
            "titulo": "PADRÃO DA BANCA:",
            "texto": "Explicação da pegadinha."
          }
        ],
        "conclusoes": ["Conclusão para prova."],
        "pegadinha": "Pegadinha clássica da VUNESP."
      }
    }
  ]
}

Retorne EXCLUSIVAMENTE o JSON válido, sem markdown ou textos antes/depois. Explore ao máximo sua criatividade, didática e visualidade. Evite respostas vagas ou superficiais. Use exemplos práticos, diagramas, fluxogramas e cards comparativos para facilitar a compreensão do conteúdo.`;

export default function MapaMentalPage() {
  const [mapasPorDisciplina, setMapasPorDisciplina] = useState<Record<string, any>>({});
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Todas as Matérias");
  const [selectedAssunto, setSelectedAssunto] = useState<string>("all");

  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [modalDisciplinaAlvo, setModalDisciplinaAlvo] = useState<string>("Raciocínio Lógico");
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(true);

  const [editandoRamoId, setEditandoRamoId] = useState<string | null>(null);
  const [novoAssuntoInput, setNovoAssuntoInput] = useState<string>('');

  useEffect(() => { carregarDadosSupabase(); }, []);

  const carregarDadosSupabase = async () => {
    try {
      setCarregando(true);
      let { data: dadosEspelho } = await supabase.from('temp_mapas_mentais').select('*');
      const { data: dadosPrincipal, error: erroPrincipal } = await supabase.from('mapas_mentais').select('*');
      if (erroPrincipal) throw erroPrincipal;

      const dadosParaUsar = (dadosEspelho && dadosEspelho.length > 0) ? dadosEspelho : dadosPrincipal;

      if (dadosParaUsar && dadosParaUsar.length > 0) {
        const mapaFormatado: Record<string, any> = {};
        dadosParaUsar.forEach((item: any) => {
          let rawRamos = item.ramos;
          if (typeof rawRamos === 'string') {
            try { rawRamos = JSON.parse(rawRamos); } catch (e) { rawRamos = []; }
          }
          
          const ramosValidados = Array.isArray(rawRamos) ? rawRamos.filter(Boolean).map((r: any) => {
            if (!r) return null;
            const assuntoDefinitivo = r.assunto && r.assunto.trim() !== ""
              ? r.assunto
              : (r.titulo ? r.titulo.replace(/^[📌📍🚩⚡0-9.\-\)]+\s*/, '').trim() : "Geral");
            
            const eraImportante = r.importante === true || r.revisar === true || r.revisarParaProva === true;

            return { 
              ...r, 
              assunto: assuntoDefinitivo,
              revisar: r.revisar !== undefined ? r.revisar : eraImportante,
              revisarParaProva: r.revisarParaProva !== undefined ? r.revisarParaProva : eraImportante,
              importante: undefined 
            };
          }) : [];

          mapaFormatado[item.disciplina] = {
            disciplina: item.disciplina,
            titulo: item.titulo,
            banca: item.banca,
            ramos: ramosValidados
          };
        });
        setMapasPorDisciplina(mapaFormatado);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabaseComBackup = async (disciplinaAlvo: string, payloadMapa: any) => {
    try {
      const { data: dadosAtuais } = await supabase.from('mapas_mentais').select('*').eq('disciplina', disciplinaAlvo).maybeSingle();
      if (dadosAtuais) {
        await supabase.from('temp_mapas_mentais').upsert({
          disciplina: dadosAtuais.disciplina,
          titulo: dadosAtuais.titulo,
          banca: dadosAtuais.banca,
          ramos: dadosAtuais.ramos,
          backed_up_at: new Date().toISOString()
        }, { onConflict: 'disciplina' });
      }

      const { error } = await supabase.from('mapas_mentais').upsert({
        disciplina: disciplinaAlvo,
        titulo: payloadMapa.titulo,
        banca: payloadMapa.banca || 'VUNESP',
        ramos: payloadMapa.ramos,
        updated_at: new Date().toISOString()
      }, { onConflict: 'disciplina' });

      if (error) throw error;
      setMapasPorDisciplina(prev => ({ ...prev, [disciplinaAlvo]: payloadMapa }));
    } catch (e) {
      alert("Erro ao salvar no banco.");
    }
  };

  // FUNÇÃO ATUALIZADA: FAZ MERGE INTELIGENTE DOS RAMOS EXISTENTES COM OS NOVOS DO JSON
  const handleCarregarJson = async () => {
    try {
      let textoLimpo = jsonInputText.trim();
      if (textoLimpo.startsWith('```')) {
        textoLimpo = textoLimpo.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
      }
      textoLimpo = textoLimpo.replace(/\r?\n/g, ' ');
      let parsed = JSON.parse(textoLimpo);

      if (parsed && parsed.ramos && Array.isArray(parsed.ramos)) {
        // 1. Busca os registros já salvos no banco para esta disciplina
        const { data: registroAtual } = await supabase
          .from('mapas_mentais')
          .select('*')
          .eq('disciplina', modalDisciplinaAlvo)
          .maybeSingle();

        let ramosExistentes = [];
        if (registroAtual && registroAtual.ramos) {
          ramosExistentes = typeof registroAtual.ramos === 'string' 
            ? JSON.parse(registroAtual.ramos) 
            : registroAtual.ramos;
        }

        // 2. Unifica os ramos antigos com os novos por ID (preservando flags de revisão)
        const mapaRamosUnificados = new Map();
        
        if (Array.isArray(ramosExistentes)) {
          ramosExistentes.forEach((r: any) => {
            if (r && r.id) mapaRamosUnificados.set(r.id, r);
          });
        }

        parsed.ramos.forEach((r: any) => {
          if (r && r.id) {
            const existente = mapaRamosUnificados.get(r.id);
            if (existente) {
              mapaRamosUnificados.set(r.id, {
                ...r,
                revisar: existente.revisar || r.revisar,
                revisarParaProva: existente.revisarParaProva || r.revisarParaProva
              });
            } else {
              mapaRamosUnificados.set(r.id, r);
            }
          }
        });

        const ramosFinais = Array.from(mapaRamosUnificados.values());

        const payloadFinal = {
          disciplina: modalDisciplinaAlvo,
          titulo: parsed.titulo || registroAtual?.titulo || `Revisão: ${modalDisciplinaAlvo}`,
          banca: parsed.banca || 'VUNESP',
          ramos: ramosFinais
        };

        await salvarNoSupabaseComBackup(modalDisciplinaAlvo, payloadFinal);
        setShowJsonModal(false);
        setJsonInputText('');
        setSelectedDisciplina(modalDisciplinaAlvo);
        alert(`Conteúdo incorporado com sucesso para ${modalDisciplinaAlvo}! Agora todos os assuntos coexistem na matéria.`);
      } else {
        alert('O JSON precisa conter a chave "ramos".');
      }
    } catch (e: any) {
      alert(`Erro no JSON: ${e.message}`);
    }
  };

  const toggleRevisar = async (ramoId: string) => {
    if (!mapaAtual) return;
    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      if (r && r.id === ramoId) return { ...r, revisar: !r.revisar };
      return r;
    });
    await salvarNoSupabaseComBackup(selectedDisciplina, { ...mapaAtual, ramos: ramosAtualizados });
  };

  const toggleRevisarParaProva = async (ramoId: string) => {
    if (!mapaAtual) return;
    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      if (r && r.id === ramoId) return { ...r, revisarParaProva: !r.revisarParaProva };
      return r;
    });
    await salvarNoSupabaseComBackup(selectedDisciplina, { ...mapaAtual, ramos: ramosAtualizados });
  };

  const salvarAssuntoEditado = async (ramoId: string) => {
    if (!mapaAtual) return;
    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      if (r && r.id === ramoId) return { ...r, assunto: novoAssuntoInput };
      return r;
    });
    await salvarNoSupabaseComBackup(selectedDisciplina, { ...mapaAtual, ramos: ramosAtualizados });
    setEditandoRamoId(null);
  };

  const excluirRamo = async (ramoId: string) => {
    if (!mapaAtual) return;
    if (confirm("Deseja apagar este tópico?")) {
      const novosRamos = mapaAtual.ramos.filter((r: any) => r && r.id !== ramoId);
      if (novosRamos.length === 0) {
        await supabase.from('mapas_mentais').delete().eq('disciplina', selectedDisciplina);
        const novoEstado = { ...mapasPorDisciplina };
        delete novoEstado[selectedDisciplina];
        setMapasPorDisciplina(novoEstado);
      } else {
        await salvarNoSupabaseComBackup(selectedDisciplina, { ...mapaAtual, ramos: novosRamos });
      }
    }
  };

  const copiarPromptMestre = () => {
    navigator.clipboard.writeText(PROMPT_MESTRE_TEXTO);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 3000);
  };

  const mapaAtual = selectedDisciplina !== "Todas as Matérias" ? mapasPorDisciplina[selectedDisciplina] : null;

  const assuntosUnicos = mapaAtual?.ramos && Array.isArray(mapaAtual.ramos)
    ? Array.from(new Set(mapaAtual.ramos.filter(Boolean).map((r: any) => r.assunto || "Geral")))
    : [];

  const ramosExibir = mapaAtual?.ramos && Array.isArray(mapaAtual.ramos) 
    ? mapaAtual.ramos.filter((r: any) => {
        if (!r) return false;
        if (selectedAssunto === 'all') return true;
        return (r.assunto || "Geral") === selectedAssunto;
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
              <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">Backup Automático Ativo 🟢</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {mapaAtual ? mapaAtual.titulo : "Painel de Revisão Estratégica"}
            </h1>
          </div>

          <button
            onClick={() => {
              setModalDisciplinaAlvo(selectedDisciplina !== "Todas as Matérias" ? selectedDisciplina : DISCIPLINAS_TJSP[0]);
              setShowJsonModal(true);
            }}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 transition-all shadow-md cursor-pointer"
          >
            Novo Mapa
          </button>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/2 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Matéria:</span>
            <select 
              value={selectedDisciplina}
              onChange={(e) => { setSelectedDisciplina(e.target.value); setSelectedAssunto('all'); }}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer"
            >
              <option value="Todas as Matérias">Todas as Matérias</option>
              {DISCIPLINAS_TJSP.map((disc) => (
                <option key={disc} value={disc}>
                  {disc} {mapasPorDisciplina[disc] ? "🟢" : "⚪"}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/2 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Assunto:</span>
            <select
              value={selectedAssunto}
              onChange={(e) => setSelectedAssunto(e.target.value)}
              disabled={selectedDisciplina === "Todas as Matérias" || !mapaAtual}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold disabled:opacity-40 cursor-pointer"
            >
              <option value="all">Todos os Assuntos</option>
              {assuntosUnicos.map((assunto: any, idx: number) => (
                <option key={idx} value={assunto}>{assunto}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden p-6 sm:p-10 min-h-[70vh]">
          {carregando ? (
            <div className="flex items-center justify-center p-20 text-zinc-400 text-sm">Carregando dados...</div>
          ) : selectedDisciplina === "Todas as Matérias" ? (
            <div className="flex items-center justify-center text-center p-20 text-zinc-400">Selecione uma disciplina para visualizar os conteúdos.</div>
          ) : !mapaAtual ? (
            <div className="flex flex-col items-center justify-center text-center p-20 space-y-3">
              <p className="text-zinc-300">Nenhum registro para <b>{selectedDisciplina}</b>.</p>
              <button onClick={() => { setModalDisciplinaAlvo(selectedDisciplina); setShowJsonModal(true); }} className="px-5 py-3 bg-amber-400 text-zinc-950 font-extrabold rounded-xl text-xs cursor-pointer">Cadastrar via JSON</button>
            </div>
          ) : ramosExibir.length === 0 ? (
            <div className="flex items-center justify-center p-20 text-zinc-500 text-sm">Nenhum tópico correspondente.</div>
          ) : (
            <div className="space-y-12">
              {ramosExibir.map((ramo: any) => {
                if (!ramo) return null;
                const estaEditando = editandoRamoId === ramo.id;
                const ehRevisarParaProva = ramo.revisarParaProva === true;
                const ehRevisarGeral = ramo.revisar === true;

                return (
                  <TextoGrifavel key={ramo.id} idUnico={ramo.id}>
                    <div className={`rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative border transition-all ${
                      ehRevisarParaProva ? 'bg-rose-950/20 border-rose-500/60' : ehRevisarGeral ? 'bg-amber-950/20 border-amber-500/60' : 'bg-zinc-900/60 border-zinc-800/80'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
                        <div className="space-y-1 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border text-amber-400 bg-amber-400/10 border-amber-400/20">
                              {selectedDisciplina}
                            </span>
                            {!estaEditando ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-zinc-300">• {ramo.assunto || "Geral"}</span>
                                <button onClick={() => { setEditandoRamoId(ramo.id); setNovoAssuntoInput(ramo.assunto || ''); }} className="text-[10px] text-amber-400 hover:underline bg-zinc-900 px-2 py-0.5 rounded border border-amber-400/20 cursor-pointer">✏️ Editar</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <input type="text" value={novoAssuntoInput} onChange={(e) => setNovoAssuntoInput(e.target.value)} className="bg-zinc-900 border border-amber-400 text-zinc-100 text-xs px-2.5 py-1 rounded-lg outline-none" />
                                <button onClick={() => salvarAssuntoEditado(ramo.id)} className="px-3 py-1 bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg cursor-pointer">Salvar</button>
                              </div>
                            )}
                          </div>
                          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-2">{ramo.titulo}</h2>
                        </div>

                        {/* BOTÕES DE FLAG INTERATIVOS E SINCRONIZADOS */}
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                          <button
                            onClick={() => toggleRevisarParaProva(ramo.id)}
                            className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-md ${
                              ramo.revisarParaProva ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50' : 'bg-zinc-950 text-rose-400/70 border-rose-500/30 hover:text-rose-400'
                            }`}
                          >
                            🔥 Revisar p/ Prova
                          </button>

                          <button
                            onClick={() => toggleRevisar(ramo.id)}
                            className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-md ${
                              ramo.revisar ? 'bg-amber-400 text-zinc-950 border-amber-300 ring-2 ring-amber-400/50' : 'bg-zinc-950 text-amber-400/70 border-amber-500/30 hover:text-amber-400'
                            }`}
                          >
                            📌 Revisar Geral
                          </button>

                          <button onClick={() => excluirRamo(ramo.id)} className="text-zinc-500 hover:text-rose-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800 transition-all text-xs cursor-pointer" title="Apagar">✕</button>
                        </div>
                      </div>

                      {ramo.grafico && <LogicalDiagram grafico={ramo.grafico} />}

                      <div className="space-y-6">
                        {ramo.subnos && ramo.subnos.map((sub: any, idx: number) => (
                          <div key={idx} className="p-5 sm:p-6 rounded-xl border-l-4 border-amber-400 shadow-md space-y-3 bg-zinc-950 border-t border-r border-b border-zinc-800/80">
                            {sub.titulo && <h3 className="text-sm font-bold text-amber-300">{sub.titulo}</h3>}
                            {sub.descricao && <p className="text-zinc-300 text-xs sm:text-sm">{sub.descricao}</p>}
                            {sub.itens && (
                              <ul className="text-xs sm:text-sm text-zinc-200 space-y-2 pt-2 border-t border-zinc-900">
                                {sub.itens.map((item: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2"><span className="text-amber-400">•</span><span>{item}</span></li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TextoGrifavel>
                );
              })}
            </div>
          )}
        </div>

        {/* SEÇÃO DO PROMPT MESTRE */}
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-2.5 py-0.5 rounded-full">Mentor VUNESP</span>
              <h2 className="text-sm font-bold text-white">Prompt Mestre com Marca-Texto e Suporte Gráfico</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Gera conteúdos estruturados com IDs seguros, grifos de texto e diagramas visuais.
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

      {/* Modal de JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button onClick={() => setShowJsonModal(false)} className="absolute top-4 right-4 text-red-400 bg-zinc-900 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer">✕</button>
            <h2 className="text-lg font-bold text-white">Adicionar novo mapa / tópico</h2>
            <select value={modalDisciplinaAlvo} onChange={(e) => setModalDisciplinaAlvo(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5">
              {DISCIPLINAS_TJSP.map((disc) => <option key={disc} value={disc}>{disc}</option>)}
            </select>
            <textarea value={jsonInputText} onChange={(e) => setJsonInputText(e.target.value)} className="w-full h-44 bg-zinc-900 text-amber-300 p-3.5 rounded-2xl border border-zinc-800 font-mono text-xs outline-none" placeholder="Cole o JSON aqui..." />
            <button onClick={handleCarregarJson} className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold rounded-xl text-xs cursor-pointer">Salvar com Backup Automático</button>
          </div>
        </div>
      )}
    </div>
  );
}