'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Filter, Flame, Bookmark, CheckCircle2, X, Edit3, Image as ImageIcon } from 'lucide-react';

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
      <div 
        ref={containerRef} 
        onContextMenu={(e) => { const s = window.getSelection(); if (s && !s.isCollapsed) { e.preventDefault(); processarSelecao(e.clientX, e.clientY); } }} 
        onMouseUp={(e) => { if (e.button === 2) return; setTimeout(() => { const s = window.getSelection(); if (s && !s.isCollapsed) { const r = s.getRangeAt(0).getBoundingClientRect(); processarSelecao(r.left + r.width / 2, r.top - 10); } else { setMenuPos(null); } }, 50); }} 
        className="select-text"
      >
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
            <button onClick={removerGrifoTrecho} className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-[10px] flex items-center justify-center"><X className="w-3 h-3" /></button>
          </div>
        </>
      )}
    </div>
  );
}

// --- RENDERIZADOR DE DIAGRAMA BLINDADO ---
function LogicalDiagram({ grafico, onDeletarCard }: { grafico: any; onDeletarCard?: (index: number) => void }) {
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
                {onDeletarCard && listaItens.length > 0 && (
                  <button onClick={() => onDeletarCard(idx)} className="text-zinc-400 hover:text-rose-400 bg-zinc-900/80 w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-all border border-zinc-700/50 cursor-pointer"><X className="w-3 h-3" /></button>
                )}
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

export default function MapaMentalPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [mapasPorDisciplina, setMapasPorDisciplina] = useState<Record<string, any>>({});
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Todas as Matérias");
  const [selectedAssunto, setSelectedAssunto] = useState<string>("all");
  const [filtroRevisao, setFiltroRevisao] = useState<string>("todos");
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [modalDisciplinaAlvo, setModalDisciplinaAlvo] = useState<string>("Raciocínio Lógico");
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);
  const [editandoRamoId, setEditandoRamoId] = useState<string | null>(null);
  const [novoAssuntoInput, setNovoAssuntoInput] = useState<string>('');
  const [modalImagensState, setModalImagensState] = useState<{ imagens: string[]; indexAtual: number } | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      const uid = session.user.id;
      setUserId(uid);
      carregarDadosSupabase(uid);
    }
    init();
  }, [router]);

  const carregarDadosSupabase = async (uid: string) => {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from('mapas_mentais').select('*').eq('user_id', uid);
      if (error) throw error;

      if (data) {
        const mapaFormatado: Record<string, any> = {};
        data.forEach((item: any) => {
          let rawRamos = item.ramos;
          if (typeof rawRamos === 'string') { try { rawRamos = JSON.parse(rawRamos); } catch (e) { rawRamos = []; } }
          
          mapaFormatado[item.disciplina] = {
            disciplina: item.disciplina,
            titulo: item.titulo || `Revisão: ${item.disciplina}`,
            banca: item.banca || 'VUNESP',
            ramos: Array.isArray(rawRamos) ? rawRamos.filter(Boolean).map((r: any, idx: number) => ({
              ...r,
              id: r.id || `ramo-${item.disciplina}-${idx}-${r.titulo ? r.titulo.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '') : idx}`,
              assunto: r.assunto && r.assunto.trim() !== "" ? r.assunto : (r.titulo ? r.titulo.replace(/^[📌📍🚩⚡0-9.\-\)]+\s*/, '').trim() : "Geral"),
              revisar: r.revisar === true || r.revisar === 'true',
              revisarParaProva: r.revisarParaProva === true || r.revisarParaProva === 'true',
              imagens: Array.isArray(r.imagens) ? r.imagens : [],
              grafico: r.grafico || null,
              subnos: r.subnos || []
            })) : []
          };
        });
        setMapasPorDisciplina(mapaFormatado);
      }
    } catch (e) { console.error("Erro ao carregar do Supabase:", e); } finally { setCarregando(false); }
  };

  const salvarNoSupabaseComBackup = async (disciplinaAlvo: string, payloadMapa: any) => {
    if (!userId) return;
    try {
      const { error: erroPrincipal } = await supabase.from('mapas_mentais').upsert({
        user_id: userId,
        disciplina: disciplinaAlvo,
        titulo: payloadMapa.titulo,
        banca: payloadMapa.banca || 'VUNESP',
        ramos: payloadMapa.ramos,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,disciplina' });

      if (erroPrincipal) {
        console.error("Erro no upsert principal:", erroPrincipal.message);
      }

      await supabase.from('temp_mapas_mentais').upsert({
        user_id: userId,
        disciplina: disciplinaAlvo,
        titulo: payloadMapa.titulo,
        banca: payloadMapa.banca || 'VUNESP',
        ramos: payloadMapa.ramos,
        backed_up_at: new Date().toISOString()
      }, { onConflict: 'user_id,disciplina' });

    } catch (e) { 
      console.error("Erro crítico ao salvar:", e); 
    }
  };

  const handleCarregarJson = async () => {
    if (!userId) return;
    try {
      let textoLimpo = jsonInputText.trim();
      if (textoLimpo.startsWith('```')) { textoLimpo = textoLimpo.replace(/^```(json)?/i, '').replace(/```$/, '').trim(); }
      let parsed = JSON.parse(textoLimpo);

      if (parsed && parsed.ramos && Array.isArray(parsed.ramos)) {
        const registroAtual = mapasPorDisciplina[modalDisciplinaAlvo];
        const ramosExistentes = registroAtual?.ramos || [];
        const mapaRamosUnificados = new Map();
        ramosExistentes.forEach((r: any) => { if (r && r.id) mapaRamosUnificados.set(r.id, r); });

        parsed.ramos.forEach((r: any, idx: number) => {
          if (r) {
            const idRamo = r.id || `ramo-json-${idx}-${r.titulo ? r.titulo.substring(0, 10) : idx}`;
            const existente = mapaRamosUnificados.get(idRamo);
            const assuntoDefinitivo = r.assunto && r.assunto.trim() !== "" ? r.assunto : (r.titulo ? r.titulo.replace(/^[📌📍🚩⚡0-9.\-\)]+\s*/, '').trim() : "Geral");

            if (existente) {
              mapaRamosUnificados.set(idRamo, {
                ...r,
                id: idRamo,
                assunto: assuntoDefinitivo,
                revisar: existente.revisar || r.revisar || false,
                revisarParaProva: existente.revisarParaProva || r.revisarParaProva || false,
                imagens: Array.from(new Set([...(existente.imagens || []), ...(r.imagens || [])]))
              });
            } else {
              mapaRamosUnificados.set(idRamo, { 
                ...r, 
                id: idRamo, 
                assunto: assuntoDefinitivo, 
                revisar: r.revisar === true, 
                revisarParaProva: r.revisarParaProva === true, 
                imagens: r.imagens || [] 
              });
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

        setMapasPorDisciplina(prev => ({ ...prev, [modalDisciplinaAlvo]: payloadFinal }));
        setShowJsonModal(false);
        setJsonInputText('');
        setSelectedDisciplina(modalDisciplinaAlvo);
        await salvarNoSupabaseComBackup(modalDisciplinaAlvo, payloadFinal);
      } else {
        alert('O JSON precisa conter a chave "ramos".');
      }
    } catch (e: any) { alert(`Erro no JSON: ${e.message}`); }
  };

  const handleUploadMultiplasImagens = async (ramoId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = e.target.files;
    if (!arquivos || arquivos.length === 0 || !mapaAtual) return;
    const promessasLeitura = Array.from(arquivos).map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }));
    const novasBase64 = await Promise.all(promessasLeitura);
    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      if (r && (r.id === ramoId || r.titulo === ramoId)) {
        const listaAtual = Array.isArray(r.imagens) ? r.imagens : [];
        return { ...r, imagens: [...listaAtual, ...novasBase64] };
      }
      return r;
    });
    const mapaAtualizadoFinal = { ...mapaAtual, ramos: ramosAtualizados };
    setMapasPorDisciplina(prev => ({ ...prev, [selectedDisciplina]: mapaAtualizadoFinal }));
    await salvarNoSupabaseComBackup(selectedDisciplina, mapaAtualizadoFinal);
  };

  const removerImagemUnica = async (ramoId: string, indexParaRemover: number) => {
    if (!mapaAtual) return;
    if (confirm("Deseja apagar esta imagem?")) {
      const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
        if (r && (r.id === ramoId || r.titulo === ramoId)) {
          const listaAtual = Array.isArray(r.imagens) ? [...r.imagens] : [];
          listaAtual.splice(indexParaRemover, 1);
          return { ...r, imagens: listaAtual };
        }
        return r;
      });
      const mapaAtualizadoFinal = { ...mapaAtual, ramos: ramosAtualizados };
      setMapasPorDisciplina(prev => ({ ...prev, [selectedDisciplina]: mapaAtualizadoFinal }));
      await salvarNoSupabaseComBackup(selectedDisciplina, mapaAtualizadoFinal);
    }
  };

  const toggleRevisar = async (targetId: string, targetTitulo: string) => {
    if (!mapaAtual) return;
    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      const match = (r.id && r.id === targetId) || (r.titulo && r.titulo === targetTitulo);
      if (match) {
        return { ...r, revisar: !r.revisar };
      }
      return r;
    });

    const mapaAtualizadoFinal = { ...mapaAtual, ramos: ramosAtualizados };
    setMapasPorDisciplina(prev => ({ ...prev, [selectedDisciplina]: mapaAtualizadoFinal }));
    await salvarNoSupabaseComBackup(selectedDisciplina, mapaAtualizadoFinal);
  };

  const toggleRevisarParaProva = async (targetId: string, targetTitulo: string) => {
    if (!mapaAtual) return;
    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      const match = (r.id && r.id === targetId) || (r.titulo && r.titulo === targetTitulo);
      if (match) {
        return { ...r, revisarParaProva: !r.revisarParaProva };
      }
      return r;
    });

    const mapaAtualizadoFinal = { ...mapaAtual, ramos: ramosAtualizados };
    setMapasPorDisciplina(prev => ({ ...prev, [selectedDisciplina]: mapaAtualizadoFinal }));
    await salvarNoSupabaseComBackup(selectedDisciplina, mapaAtualizadoFinal);
  };

  const salvarAssuntoEditado = async (ramoId: string) => {
    if (!mapaAtual) return;
    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      if (r && r.id === ramoId) return { ...r, assunto: novoAssuntoInput };
      return r;
    });
    const mapaAtualizadoFinal = { ...mapaAtual, ramos: ramosAtualizados };
    setMapasPorDisciplina(prev => ({ ...prev, [selectedDisciplina]: mapaAtualizadoFinal }));
    await salvarNoSupabaseComBackup(selectedDisciplina, mapaAtualizadoFinal);
    setEditandoRamoId(null);
  };

  const excluirRamo = async (ramoId: string) => {
    if (!mapaAtual || !userId) return;
    if (confirm("Deseja apagar este tópico?")) {
      const novosRamos = mapaAtual.ramos.filter((r: any) => r && r.id !== ramoId);
      if (novosRamos.length === 0) {
        await supabase.from('mapas_mentais').delete().eq('disciplina', selectedDisciplina).eq('user_id', userId);
        await supabase.from('temp_mapas_mentais').delete().eq('disciplina', selectedDisciplina).eq('user_id', userId);
        const novoEstado = { ...mapasPorDisciplina };
        delete novoEstado[selectedDisciplina];
        setMapasPorDisciplina(novoEstado);
      } else {
        const mapaAtualizadoFinal = { ...mapaAtual, ramos: novosRamos };
        setMapasPorDisciplina(prev => ({ ...prev, [selectedDisciplina]: mapaAtualizadoFinal }));
        await salvarNoSupabaseComBackup(selectedDisciplina, mapaAtualizadoFinal);
      }
    }
  };

  const mapaAtual = selectedDisciplina !== "Todas as Matérias" ? mapasPorDisciplina[selectedDisciplina] : null;
  const assuntosUnicos = mapaAtual?.ramos ? Array.from(new Set(mapaAtual.ramos.filter(Boolean).map((r: any) => r.assunto || "Geral"))) : [];
  
  const ramosExibir = mapaAtual?.ramos ? mapaAtual.ramos.filter((r: any) => {
    if (!r) return false;
    const matchAssunto = selectedAssunto === 'all' || (r.assunto || "Geral") === selectedAssunto;
    const matchRevisao = filtroRevisao === 'todos' 
      ? true 
      : filtroRevisao === 'revisarParaProva' 
        ? r.revisarParaProva === true 
        : r.revisar === true;
    return matchAssunto && matchRevisao;
  }) : [];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />
      <main className="w-full px-4 sm:px-8 py-6 space-y-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">TJSP - VUNESP</span>
              <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">Backup Automático Ativo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">{mapaAtual ? mapaAtual.titulo : "Painel de Mapas Mentais"}</h1>
          </div>
          <button onClick={() => { setModalDisciplinaAlvo(selectedDisciplina !== "Todas as Matérias" ? selectedDisciplina : DISCIPLINAS_TJSP[0]); setShowJsonModal(true); }} className="text-xs font-bold px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 transition-all shadow-md cursor-pointer">Novo Mapa</button>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Matéria:</span>
            <select value={selectedDisciplina} onChange={(e) => { setSelectedDisciplina(e.target.value); setSelectedAssunto('all'); }} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold cursor-pointer">
              <option value="Todas as Matérias">Todas as Matérias</option>
              {DISCIPLINAS_TJSP.map((disc) => (<option key={disc} value={disc}>{disc} {mapasPorDisciplina[disc] ? "(com mapas)" : ""}</option>))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Assunto:</span>
            <select value={selectedAssunto} onChange={(e) => setSelectedAssunto(e.target.value)} disabled={selectedDisciplina === "Todas as Matérias" || !mapaAtual} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-semibold disabled:opacity-40 cursor-pointer">
              <option value="all">Todos os Assuntos</option>
              {assuntosUnicos.map((assunto: any, idx: number) => (<option key={idx} value={assunto}>{assunto}</option>))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Filtro:</span>
            <select value={filtroRevisao} onChange={(e) => setFiltroRevisao(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-amber-400 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 font-bold cursor-pointer">
              <option value="todos">Todos os Tópicos</option>
              <option value="revisarParaProva">Revisar para Prova</option>
              <option value="revisarGeral">Revisar Geral</option>
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
            <div className="flex items-center justify-center p-20 text-zinc-500 text-sm">Nenhum tópico correspondente a este filtro.</div>
          ) : (
            <div className="space-y-12">
              {ramosExibir.map((ramo: any) => {
                if (!ramo) return null;
                const estaEditando = editandoRamoId === ramo.id;
                const listaImagensRamo = Array.isArray(ramo.imagens) ? ramo.imagens : [];

                return (
                  <TextoGrifavel key={ramo.id} idUnico={ramo.id}>
                    <div className={`rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative border transition-all ${ramo.revisarParaProva ? 'bg-rose-950/20 border-rose-500/60' : ramo.revisar ? 'bg-amber-950/20 border-amber-500/60' : 'bg-zinc-900/60 border-zinc-800/80'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
                        <div className="space-y-1 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border text-amber-400 bg-amber-400/10 border-amber-400/20">{selectedDisciplina}</span>
                            {!estaEditando ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-zinc-300">• {ramo.assunto || "Geral"}</span>
                                <button onClick={() => { setEditandoRamoId(ramo.id); setNovoAssuntoInput(ramo.assunto || ''); }} className="text-[10px] text-amber-400 hover:underline bg-zinc-900 px-2 py-0.5 rounded border border-amber-400/20 cursor-pointer flex items-center gap-1"><Edit3 className="w-3 h-3" /> Editar</button>
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

                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                          <label className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 transition-all cursor-pointer shadow-md flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" /> Enviar Imagens
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUploadMultiplasImagens(ramo.id, e)} />
                          </label>
                          <button onClick={() => toggleRevisarParaProva(ramo.id, ramo.titulo)} className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${ramo.revisarParaProva ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50' : 'bg-zinc-950 text-rose-400/70 border-rose-500/30 hover:text-rose-400'}`}>
                            <Flame className="w-3.5 h-3.5" /> Revisar p/ Prova
                          </button>
                          <button onClick={() => toggleRevisar(ramo.id, ramo.titulo)} className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${ramo.revisar ? 'bg-amber-400 text-zinc-950 border-amber-300 ring-2 ring-amber-400/50' : 'bg-zinc-950 text-amber-400/70 border-zinc-500/30 hover:text-amber-400'}`}>
                            <Bookmark className="w-3.5 h-3.5" /> Revisar Geral
                          </button>
                          <button onClick={() => excluirRamo(ramo.id)} className="text-zinc-500 hover:text-rose-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800 transition-all text-xs cursor-pointer" title="Apagar Ramo"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* DIAGRAMA / CARDS INTERNOS */}
                      {ramo.grafico && <LogicalDiagram grafico={ramo.grafico} />}

                      {listaImagensRamo.length > 0 && (
                        <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Imagens Anexadas ({listaImagensRamo.length})</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {listaImagensRamo.map((imgUrl: string, imgIdx: number) => (
                              <div key={imgIdx} className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video flex items-center justify-center cursor-pointer" onClick={() => setModalImagensState({ imagens: listaImagensRamo, indexAtual: imgIdx })}>
                                <img src={imgUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <button onClick={(e) => { e.stopPropagation(); removerImagemUnica(ramo.id, imgIdx); }} className="absolute top-2 right-2 bg-rose-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-6">
                        {ramo.subnos && ramo.subnos.map((sub: any, idx: number) => (
                          <div key={idx} className="p-5 sm:p-6 rounded-xl border-l-4 border-amber-400 shadow-md space-y-3 bg-zinc-950 border border-zinc-800/80">
                            {sub.titulo && <h3 className="text-sm font-bold text-amber-300">{sub.titulo}</h3>}
                            {sub.descricao && <p className="text-zinc-300 text-xs sm:text-sm">{sub.descricao}</p>}
                            {sub.itens && (
                              <ul className="text-xs sm:text-sm text-zinc-200 space-y-2 pt-2 border-t border-zinc-900">
                                {sub.itens.map((item: string, i: number) => (<li key={i} className="flex items-start gap-2"><span className="text-amber-400">•</span><span>{item}</span></li>))}
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

      {modalImagensState && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setModalImagensState(null)}>
          <div className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalImagensState(null)} className="absolute -top-12 right-0 bg-zinc-800 text-white w-10 h-10 rounded-full font-bold flex items-center justify-center"><X className="w-5 h-5" /></button>
            <img src={modalImagensState.imagens[modalImagensState.indexAtual]} alt="" className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-zinc-800 shadow-2xl" />
          </div>
        </div>
      )}

      {showJsonModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button onClick={() => setShowJsonModal(false)} className="absolute top-4 right-4 text-red-400 bg-zinc-900 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
            <h2 className="text-lg font-bold text-white">Adicionar novo mapa / tópico via JSON</h2>
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