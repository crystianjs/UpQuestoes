'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Zap, Flame, Bookmark, Filter, CheckCircle2 } from 'lucide-react';

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

// --- RENDERIZADOR DE DIAGRAMA / CARDS INTERNOS RESTAURADO ---
function LogicalDiagram({ grafico }: { grafico: any }) {
  if (!grafico) return null;
  const listaItens = Array.isArray(grafico.cards) ? grafico.cards
                   : Array.isArray(grafico.elementos) ? grafico.elementos
                   : Array.isArray(grafico.conjuntos) ? grafico.conjuntos
                   : Array.isArray(grafico.grupos) ? grafico.grupos
                   : Array.isArray(grafico.etapas) ? grafico.etapas
                   : Array.isArray(grafico.itens) ? grafico.itens
                   : [];

  const itensExibir = listaItens.length > 0 ? listaItens : (grafico.conteudo || grafico.descricao || grafico.subtitulo ? [{
    titulo: grafico.titulo || "Detalhes",
    conteudo: grafico.conteudo || grafico.descricao || grafico.subtitulo,
    exemplo: grafico.exemplo,
    alerta: grafico.alerta,
    corFundo: 'rgba(24, 24, 27, 0.9)',
    corBorda: '#3F3F46',
    corTitulo: '#F59E0B'
  }] : []);

  if (itensExibir.length === 0) return null;

  return (
    <div className="bg-zinc-950 border border-amber-400/30 rounded-2xl p-5 space-y-4 shadow-inner my-3">
      {grafico.titulo && listaItens.length > 0 && (
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          {grafico.iconeUrl ? <img src={grafico.iconeUrl} alt="" className="w-4 h-4 object-contain" style={{ filter: 'invert(80%) sepia(80%) saturate(1000%) hue-rotate(350deg) brightness(100%) contrast(100%)' }} /> : <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{grafico.titulo}</span>
        </div>
      )}

      <div className={`grid gap-4 ${itensExibir.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {itensExibir.map((card: any, idx: number) => {
          if (!card) return null;
          const tituloCard = card.titulo || card.nome || `Item ${idx + 1}`;
          const subtituloCard = card.subtitulo || card.destaque || '';
          const conteudoCard = card.conteudo || card.descricao || '';
          const topicosCard = Array.isArray(card.topicos) ? card.topicos : Array.isArray(card.itens) ? card.itens : [];
          const exemploCard = card.exemplo || '';
          const alertaCard = card.alerta || '';

          return (
            <div key={idx} className="rounded-2xl p-4 border space-y-3 transition-all shadow-lg" style={{ backgroundColor: card.corFundo || 'rgba(24, 24, 27, 0.9)', borderColor: card.corBorda || '#3F3F46' }}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: card.corTitulo || '#F59E0B' }}>
                  {card.iconeUrl && <img src={card.iconeUrl} alt="" className="w-4 h-4 object-contain inline-block" style={{ filter: 'invert(80%) sepia(80%) saturate(1000%) hue-rotate(350deg) brightness(100%) contrast(100%)' }} />}
                  {tituloCard}
                </span>
              </div>
              {subtituloCard && <p className="text-xs font-bold text-zinc-200">{subtituloCard}</p>}
              {conteudoCard && <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">{conteudoCard}</p>}
              {topicosCard.length > 0 && (
                <ul className="text-xs sm:text-sm text-zinc-200 space-y-1.5 pt-1 font-medium">
                  {topicosCard.map((tp: string, tIdx: number) => (
                    <li key={tIdx} className="flex items-start gap-2 leading-relaxed"><span className="text-amber-400 font-bold">•</span><span>{tp}</span></li>
                  ))}
                </ul>
              )}
              {exemploCard && (
                <div className="bg-zinc-900/90 border border-sky-500/30 rounded-xl p-3 text-xs space-y-1 mt-2">
                  <span className="font-bold text-sky-400 uppercase tracking-wide text-[10px] block">Exemplo Prático:</span>
                  <p className="text-zinc-300 leading-relaxed italic">{exemploCard}</p>
                </div>
              )}
              {alertaCard && (
                <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-3 text-xs space-y-1 mt-2">
                  <span className="font-bold text-rose-400 uppercase tracking-wide text-[10px] block">Atenção / Pegadinha VUNESP:</span>
                  <p className="text-zinc-200 leading-relaxed">{alertaCard}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ValeAPenaPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [mapasPorDisciplina, setMapasPorDisciplina] = useState<Record<string, any>>({});
  const [abaSelecionada, setAbaSelecionada] = useState<'revisar' | 'revisarParaProva'>('revisarParaProva');
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Todas as Matérias");
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      const uid = session.user.id;
      setUserId(uid);
      carregarDados(uid);
    }
    init();
  }, [router]);

  const carregarDados = async (uid: string) => {
    try {
      setCarregando(true);
      const { data: dadosEspelho } = await supabase.from('temp_mapas_mentais').select('*').eq('user_id', uid);
      const { data, error } = await supabase.from('mapas_mentais').select('*').eq('user_id', uid);
      if (error) throw error;

      const fonteDados = (dadosEspelho && dadosEspelho.length > 0) ? dadosEspelho : data;

      if (fonteDados) {
        const mapaFormatado: Record<string, any> = {};
        fonteDados.forEach((item: any) => {
          let rawRamos = item.ramos;
          if (typeof rawRamos === 'string') { try { rawRamos = JSON.parse(rawRamos); } catch (e) { rawRamos = []; } }
          
          mapaFormatado[item.disciplina] = {
            disciplina: item.disciplina,
            titulo: item.titulo || `Revisão: ${item.disciplina}`,
            banca: item.banca || 'VUNESP',
            ramos: Array.isArray(rawRamos) ? rawRamos.filter(Boolean).map((r: any) => ({
              ...r,
              assunto: r.assunto && r.assunto.trim() !== "" ? r.assunto : (r.titulo ? r.titulo.replace(/^[📌📍🚩⚡0-9.\-\)]+\s*/, '').trim() : "Geral"),
              revisar: r.revisar === true,
              revisarParaProva: r.revisarParaProva === true
            })) : []
          };
        });
        setMapasPorDisciplina(mapaFormatado);
      }
    } catch (e) { console.error(e); } finally { setCarregando(false); }
  };

  const atualizarRamoPorIndice = async (disciplinaAlvo: string, indexOriginal: number, campo: 'revisar' | 'revisarParaProva', novoValor: boolean) => {
    if (!userId) return;
    const mapaAtual = mapasPorDisciplina[disciplinaAlvo];
    if (!mapaAtual || !Array.isArray(mapaAtual.ramos)) return;

    const ramosAtualizados = [...mapaAtual.ramos];
    if (ramosAtualizados[indexOriginal]) {
      ramosAtualizados[indexOriginal] = {
        ...ramosAtualizados[indexOriginal],
        [campo]: novoValor
      };
    }

    const payloadAtualizado = { ...mapaAtual, ramos: ramosAtualizados };
    setMapasPorDisciplina(prev => ({ ...prev, [disciplinaAlvo]: payloadAtualizado }));

    try {
      await supabase.from('mapas_mentais').upsert({
        user_id: userId,
        disciplina: disciplinaAlvo,
        titulo: mapaAtual.titulo || `Revisão: ${disciplinaAlvo}`,
        banca: mapaAtual.banca || 'VUNESP',
        ramos: ramosAtualizados,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,disciplina' });

      await supabase.from('temp_mapas_mentais').upsert({
        user_id: userId,
        disciplina: disciplinaAlvo,
        titulo: mapaAtual.titulo || `Revisão: ${disciplinaAlvo}`,
        banca: mapaAtual.banca || 'VUNESP',
        ramos: ramosAtualizados,
        backed_up_at: new Date().toISOString()
      }, { onConflict: 'user_id,disciplina' });
    } catch (e: any) { console.error(e); }
  };

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
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/35">TJSP - VUNESP</span>
              <span className="bg-yellow-500/20 text-yellow-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-yellow-500/30 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Central de Revisão Estratégica</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Vale a Pena Ver de Novo</h1>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
            <button onClick={() => setAbaSelecionada('revisarParaProva')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${abaSelecionada === 'revisarParaProva' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}><Flame className="w-3.5 h-3.5" /> Revisar para Prova</button>
            <button onClick={() => setAbaSelecionada('revisar')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${abaSelecionada === 'revisar' ? 'bg-amber-400 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}><Bookmark className="w-3.5 h-3.5" /> Revisar Geral</button>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-amber-400 shrink-0" /><span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Filtrar Matéria:</span></div>
          <select value={selectedDisciplina} onChange={(e) => setSelectedDisciplina(e.target.value)} className="w-full sm:w-72 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer">
            <option value="Todas as Matérias">Todas as Matérias ({itensFiltrados.length} itens)</option>
            {DISCIPLINAS_TJSP.map((disc) => (<option key={disc} value={disc}>{disc}</option>))}
          </select>
        </div>

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
                const estiloTagBadge = abaSelecionada === 'revisarParaProva' ? 'text-rose-300 bg-rose-500/20 border-rose-500/40' : 'text-amber-300 bg-amber-500/20 border-amber-500/40';
                const chaveUnicaCard = `${disciplina}-${indexOriginal}-${globalIdx}`;

                return (
                  <TextoGrifavel key={chaveUnicaCard} idUnico={chaveUnicaCard}>
                    <div className="rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative border bg-zinc-900/60 border-zinc-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${estiloTagBadge}`}>{disciplina}</span>
                            <span className="text-xs font-semibold text-zinc-300">• {ramo.assunto || "Revisão"}</span>
                          </div>
                          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-2">{ramo.titulo ? ramo.titulo.replace(/^[📌📍🚩⚡]\s*/, '') : "Tópico"}</h2>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                          <button onClick={() => atualizarRamoPorIndice(disciplina, indexOriginal, 'revisarParaProva', !ramo.revisarParaProva)} className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${ramo.revisarParaProva ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50' : 'bg-zinc-950 text-rose-400/70 border-rose-500/30 hover:text-rose-400'}`}><Flame className="w-3.5 h-3.5" /> Revisar p/ Prova</button>
                          <button onClick={() => atualizarRamoPorIndice(disciplina, indexOriginal, 'revisar', !ramo.revisar)} className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${ramo.revisar ? 'bg-amber-400 text-zinc-950 border-amber-300 ring-2 ring-amber-400/50' : 'bg-zinc-950 text-amber-400/70 border-amber-500/30 hover:text-amber-400'}`}><Bookmark className="w-3.5 h-3.5" /> Revisar Geral</button>
                        </div>
                      </div>

                      {/* AQUI ESTAVA O PROBLEMA: AGORA O DIAGRAMA É RENDERIZADO CORRETAMENTE NO VALE A PENA */}
                      {ramo.grafico && <LogicalDiagram grafico={ramo.grafico} />}
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