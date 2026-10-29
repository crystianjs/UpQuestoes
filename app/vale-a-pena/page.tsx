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

// --- COMPONENTE DE SELEÇÃO E MARCA-TEXTO ---
function TextoGrifavel({ children, idUnico }: { children: React.ReactNode; idUnico: string }) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const salvo = localStorage.getItem(`grifos_dom_${idUnico}`);
    if (salvo && containerRef.current) {
      try { containerRef.current.innerHTML = salvo; } catch (e) { console.error(e); }
    }
  }, [idUnico]);

  const processarSelecao = (clientX: number, clientY: number) => {
    const selecao = window.getSelection();
    if (!selecao || selecao.isCollapsed) { setMenuPos(null); return; }
    const texto = selecao.toString().trim();
    if (texto.length > 0) {
      const range = selecao.getRangeAt(0);
      if (containerRef.current && containerRef.current.contains(range.commonAncestorContainer)) {
        rangeRef.current = range.cloneRange();
        setMenuPos({ x: clientX, y: clientY });
      }
    }
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
    } catch (e) { console.error(e); }
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
        if (range.compareBoundaryPoints(Range.END_TO_START, markRange) < 0 && range.compareBoundaryPoints(Range.START_TO_END, markRange) > 0) {
          const pai = mark.parentNode;
          while (mark.firstChild) { pai?.insertBefore(mark.firstChild, mark); }
          pai?.removeChild(mark);
        }
      });
      localStorage.setItem(`grifos_dom_${idUnico}`, containerRef.current.innerHTML);
    } catch (e) { console.error(e); }
    setMenuPos(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="relative">
      <div ref={containerRef} onContextMenu={(e) => { const s = window.getSelection(); if (s && !s.isCollapsed) { e.preventDefault(); processarSelecao(e.clientX, e.clientY); } }} onMouseUp={(e) => { if (e.button === 2) return; setTimeout(() => { const s = window.getSelection(); if (s && !s.isCollapsed) { const r = s.getRangeAt(0).getBoundingClientRect(); processarSelecao(r.left + r.width / 2, r.top - 10); } else { setMenuPos(null); } }, 50); }} className="select-text">
        {children}
      </div>
      {menuPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPos(null)} />
          <div className="fixed z-50 bg-zinc-900 border border-amber-400 shadow-2xl rounded-2xl p-2 flex items-center gap-2 transform -translate-x-1/2 -translate-y-full" style={{ top: `${menuPos.y}px`, left: `${menuPos.x}px` }}>
            <button onClick={() => aplicarGrifo('bg-yellow-400/40', 'text-yellow-100')} className="w-6 h-6 rounded-full bg-yellow-400 cursor-pointer font-bold text-[10px] text-zinc-950 flex items-center justify-center">A</button>
            <button onClick={() => aplicarGrifo('bg-sky-400/40', 'text-sky-100')} className="w-6 h-6 rounded-full bg-sky-400 cursor-pointer font-bold text-[10px] text-zinc-950 flex items-center justify-center">A</button>
            <button onClick={() => aplicarGrifo('bg-emerald-400/40', 'text-emerald-100')} className="w-6 h-6 rounded-full bg-emerald-400 cursor-pointer font-bold text-[10px] text-zinc-950 flex items-center justify-center">A</button>
            <button onClick={() => aplicarGrifo('bg-rose-500/40', 'text-rose-100')} className="w-6 h-6 rounded-full bg-rose-500 cursor-pointer font-bold text-[10px] text-zinc-950 flex items-center justify-center">A</button>
            <div className="w-[1px] h-4 bg-zinc-700 mx-0.5" />
            <button onClick={removerGrifoTrecho} className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-[10px] flex items-center justify-center">✕</button>
          </div>
        </>
      )}
    </div>
  );
}

// --- DIAGRAMA LÓGICO ---
function LogicalDiagram({ grafico }: { grafico: any }) {
  if (!grafico) return null;
  const listaItens = Array.isArray(grafico.elementos) ? grafico.elementos
                   : Array.isArray(grafico.conjuntos) ? grafico.conjuntos
                   : Array.isArray(grafico.grupos) ? grafico.grupos
                   : Array.isArray(grafico.cards) ? grafico.cards
                   : Array.isArray(grafico.etapas) ? grafico.etapas
                   : [];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-inner my-3">
      {grafico.titulo && <p className="text-xs font-bold text-amber-400 uppercase">📌 {grafico.titulo}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {listaItens.map((card: any, idx: number) => (
          <div key={idx} className="rounded-xl p-4 border space-y-2 bg-zinc-900 border-zinc-800 text-zinc-200">
            <p className="text-xs font-black uppercase text-amber-400">{card.titulo || card.nome || `Item ${idx + 1}`}</p>
            {card.descricao && <p className="text-xs text-zinc-300">{card.descricao}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ValeAPenaPage() {
  const [mapasPorDisciplina, setMapasPorDisciplina] = useState<Record<string, any>>({});
  const [abaSelecionada, setAbaSelecionada] = useState<'revisar' | 'revisarParaProva'>('revisarParaProva');
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Todas as Matérias");
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from('mapas_mentais').select('*');
      if (error) throw error;
      if (data) {
        const mapaFormatado: Record<string, any> = {};
        data.forEach((item: any) => {
          let rawRamos = item.ramos;
          if (typeof rawRamos === 'string') { try { rawRamos = JSON.parse(rawRamos); } catch (e) { rawRamos = []; } }
          mapaFormatado[item.disciplina] = {
            disciplina: item.disciplina,
            titulo: item.titulo,
            banca: item.banca,
            ramos: Array.isArray(rawRamos) ? rawRamos.filter(Boolean) : []
          };
        });
        setMapasPorDisciplina(mapaFormatado);
      }
    } catch (e) { console.error(e); } finally { setCarregando(false); }
  };

  const atualizarRamoNoSupabase = async (disciplinaAlvo: string, ramoId: string, campo: 'revisar' | 'revisarParaProva', novoValor: boolean) => {
    const mapaAtual = mapasPorDisciplina[disciplinaAlvo];
    if (!mapaAtual) return;

    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      if (r && r.id === ramoId) {
        return { ...r, [campo]: novoValor };
      }
      return r;
    });

    const payloadAtualizado = {
      ...mapaAtual,
      ramos: ramosAtualizados
    };

    setMapasPorDisciplina(prev => ({
      ...prev,
      [disciplinaAlvo]: payloadAtualizado
    }));

    try {
      const { error } = await supabase.from('mapas_mentais').upsert({
        disciplina: disciplinaAlvo,
        titulo: mapaAtual.titulo,
        banca: mapaAtual.banca || 'VUNESP',
        ramos: ramosAtualizados,
        updated_at: new Date().toISOString()
      }, { onConflict: 'disciplina' });

      if (error) throw error;
    } catch (e) {
      console.error("Erro ao sincronizar com mapas mentais:", e);
      alert("Erro ao sincronizar alteração na nuvem.");
    }
  };

  // Coleta todos os itens marcados de todas as disciplinas carregadas, sem restrição arbitrária
  const itensFiltrados: { disciplina: string; ramo: any; indexOriginal: number }[] = [];
  Object.keys(mapasPorDisciplina).forEach(disc => {
    if (selectedDisciplina === "Todas as Matérias" || selectedDisciplina === disc) {
      const mapa = mapasPorDisciplina[disc];
      if (mapa && Array.isArray(mapa.ramos)) {
        mapa.ramos.forEach((r: any, idx: number) => {
          if (!r) return;
          if (abaSelecionada === 'revisar' && r.revisar === true) {
            itensFiltrados.push({ disciplina: disc, ramo: r, indexOriginal: idx });
          } else if (abaSelecionada === 'revisarParaProva' && r.revisarParaProva === true) {
            itensFiltrados.push({ disciplina: disc, ramo: r, indexOriginal: idx });
          }
        });
      }
    }
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />
      <main className="w-full px-4 sm:px-8 py-6 space-y-6">
        
        {/* Cabeçalho */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">TJSP - VUNESP</span>
              <span className="bg-yellow-500/20 text-yellow-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-yellow-500/30">⚡ Central de Revisão Estratégica</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Vale a Pena Ver de Novo</h1>
          </div>

          {/* Abas de Alternância */}
          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
            <button
              onClick={() => setAbaSelecionada('revisarParaProva')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                abaSelecionada === 'revisarParaProva'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🔥 Revisar para Prova
            </button>
            <button
              onClick={() => setAbaSelecionada('revisar')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                abaSelecionada === 'revisar'
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📌 Revisar Geral
            </button>
          </div>
        </div>

        {/* Filtro de Matéria */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg flex items-center gap-4">
          <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Filtrar Matéria:</span>
          <select 
            value={selectedDisciplina}
            onChange={(e) => setSelectedDisciplina(e.target.value)}
            className="w-full sm:w-72 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer"
          >
            <option value="Todas as Matérias">Todas as Matérias ({itensFiltrados.length} itens)</option>
            {DISCIPLINAS_TJSP.map((disc) => (
              <option key={disc} value={disc}>{disc}</option>
            ))}
          </select>
        </div>

        {/* Listagem dos Cards */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-10 min-h-[60vh]">
          {carregando ? (
            <div className="flex items-center justify-center p-20 text-zinc-400 text-sm">Carregando tópicos...</div>
          ) : itensFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-20 space-y-3">
              <p className="text-base text-zinc-400 font-medium">Nenhum tópico encontrado nesta categoria.</p>
              <p className="text-xs text-zinc-500">Vá até os Mapas Mentais e altere as bandeiras de revisão nos tópicos desejados.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {itensFiltrados.map(({ disciplina, ramo, indexOriginal }, globalIdx) => {
                const estiloTagBadge = abaSelecionada === 'revisarParaProva'
                  ? 'text-rose-300 bg-rose-500/20 border-rose-500/40'
                  : 'text-amber-300 bg-amber-500/20 border-amber-500/40';

                // Chave única blindada combinando disciplina, ID e índice para evitar qualquer colisão
                const chaveUnicaCard = `${disciplina}-${ramo.id || 'sem-id'}-${indexOriginal}-${globalIdx}`;

                return (
                  <TextoGrifavel key={chaveUnicaCard} idUnico={chaveUnicaCard}>
                    <div className="rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative border bg-zinc-900/60 border-zinc-800">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${estiloTagBadge}`}>
                              {disciplina}
                            </span>
                            <span className="text-xs font-semibold text-zinc-300">• {ramo.assunto || "Revisão"}</span>
                          </div>
                          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-2">
                            {ramo.titulo ? ramo.titulo.replace(/^[📌📍🚩⚡]\s*/, '') : "Tópico"}
                          </h2>
                        </div>

                        {/* Botões interativos */}
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                          <button
                            onClick={() => atualizarRamoNoSupabase(disciplina, ramo.id, 'revisarParaProva', !ramo.revisarParaProva)}
                            className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-md ${
                              ramo.revisarParaProva
                                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50'
                                : 'bg-zinc-950 text-rose-400/70 border-rose-500/30 hover:text-rose-400'
                            }`}
                          >
                            🔥 Revisar p/ Prova
                          </button>

                          <button
                            onClick={() => atualizarRamoNoSupabase(disciplina, ramo.id, 'revisar', !ramo.revisar)}
                            className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-md ${
                              ramo.revisar
                                ? 'bg-amber-400 text-zinc-950 border-amber-300 ring-2 ring-amber-400/50'
                                : 'bg-zinc-950 text-amber-400/70 border-amber-500/30 hover:text-amber-400'
                            }`}
                          >
                            📌 Revisar Geral
                          </button>
                        </div>
                      </div>

                      {ramo.grafico && <LogicalDiagram grafico={ramo.grafico} />}

                      <div className="space-y-6">
                        {ramo.subnos && ramo.subnos.map((sub: any, idx: number) => (
                          <div key={idx} className="p-5 sm:p-6 rounded-2xl border-l-4 border-amber-400 shadow-md space-y-3 bg-zinc-950 border-t border-r border-b border-zinc-800/80">
                            {sub.titulo && <h3 className="text-sm sm:text-base font-black text-amber-300">{sub.titulo}</h3>}
                            {sub.descricao && <p className="text-zinc-300 text-xs sm:text-sm font-medium leading-relaxed">{sub.descricao}</p>}
                            {sub.itens && sub.itens.length > 0 && (
                              <ul className="text-xs sm:text-sm text-zinc-200 space-y-2.5 pt-2 border-t border-zinc-900 font-medium">
                                {sub.itens.map((item: string, iIdx: number) => (
                                  <li key={iIdx} className="leading-relaxed flex items-start gap-2.5">
                                    <span className="font-bold text-amber-400">•</span>
                                    <span className="flex-1">{item}</span>
                                  </li>
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

      </main>
    </div>
  );
}