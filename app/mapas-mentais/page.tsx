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

// --- COMPONENTE VISUAL AVANÇADO DE DIAGRAMAS LÓGICOS ---
function LogicalDiagram({ grafico }: { grafico: any }) {
  if (!grafico || !grafico.tipo) return null;

  // 1. CONJUNTOS ANINHADOS (Todo A é B)
  if (grafico.tipo === 'conjuntos_aninhados' && Array.isArray(grafico.conjuntos)) {
    return (
      <div className="bg-zinc-950 border border-amber-400/30 rounded-2xl p-5 space-y-4 shadow-inner my-3">
        {grafico.titulo && (
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              📊 Diagrama Lógico: {grafico.titulo}
            </span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-2">
          <svg className="w-full max-w-[320px] h-[220px] overflow-visible" viewBox="0 0 300 200">
            {grafico.conjuntos.map((c: any, index: number) => {
              const rx = 130 - index * 38;
              const ry = 85 - index * 24;
              const cx = 150;
              const cy = 100;

              const coresFundo = ['rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.18)', 'rgba(245, 158, 11, 0.32)'];
              const coresBorda = ['rgba(245, 158, 11, 0.4)', 'rgba(245, 158, 11, 0.7)', '#F59E0B'];

              return (
                <g key={index}>
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    fill={coresFundo[index % coresFundo.length]}
                    stroke={coresBorda[index % coresBorda.length]}
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cy - ry + 16}
                    fill="#F3F4F6"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {c.nome}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {(grafico.conclusao || grafico.descricao) && (
          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl space-y-1.5 text-xs">
            {grafico.conclusao && (
              <p className="text-amber-300 font-bold flex items-center gap-1.5">
                <span>💡 Conclusão:</span> {grafico.conclusao}
              </p>
            )}
            {grafico.descricao && (
              <p className="text-zinc-400 leading-relaxed">{grafico.descricao}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. CONJUNTOS MISTOS OU SEPARADOS (Com suporte a múltiplos grupos, isolados e pontos de existência opcionais)
  if ((grafico.tipo === 'conjuntos_misto' || grafico.tipo === 'conjuntos_separados') && Array.isArray(grafico.grupos)) {
    return (
      <div className="bg-zinc-950 border border-amber-400/30 rounded-2xl p-5 space-y-4 shadow-inner my-3">
        {grafico.titulo && (
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              📊 Diagrama Lógico: {grafico.titulo}
            </span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-2">
          <svg className="w-full max-w-[440px] h-[220px] overflow-visible" viewBox="0 0 420 200">
            {grafico.grupos.map((grupo: any, gIdx: number) => {
              const cx = grupo.posicaoX || (gIdx === 0 ? 130 : 320);
              const cy = grupo.posicaoY || 100;
              const corBorda = grupo.corBorda || (gIdx === 0 ? '#F59E0B' : '#EF4444');
              const corFundo = grupo.corFundo || (gIdx === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)');

              return (
                <g key={gIdx}>
                  {grupo.conjuntos && grupo.conjuntos.map((c: any, cIdx: number) => {
                    const rx = (grupo.raioMaxX || 100) - cIdx * 32;
                    const ry = (grupo.raioMaxY || 75) - cIdx * 20;

                    return (
                      <g key={cIdx}>
                        <ellipse
                          cx={cx}
                          cy={cy}
                          rx={rx}
                          ry={ry}
                          fill={cIdx === 0 ? corFundo : 'rgba(245, 158, 11, 0.25)'}
                          stroke={corBorda}
                          strokeWidth="2"
                        />
                        <text
                          x={cx}
                          y={cy - ry + 16}
                          fill="#F3F4F6"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {c.nome}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Suporte opcional a pontos de existência */}
            {Array.isArray(grafico.existencia) && grafico.existencia.map((pt: any, pIdx: number) => (
              <g key={pIdx}>
                <circle cx={pt.x} cy={pt.y} r="5" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
                {pt.rotulo && (
                  <text x={pt.x + 10} y={pt.y + 4} fill="#38BDF8" fontSize="12" fontWeight="bold">
                    {pt.rotulo}
                  </text>
                )}
              </g>
            ))}

            {/* Linha/Símbolo visual de exclusão (Disjunção total) se houver separação explícita */}
            {grafico.grupos.length > 1 && grafico.mostrarDisjuncao !== false && (
              <g>
                <line x1="240" y1="80" x2="240" y2="120" stroke="#EF4444" strokeWidth="2" strokeDasharray="4" />
                <text x="240" y="70" fill="#EF4444" fontSize="16" fontWeight="bold" textAnchor="middle">≠</text>
              </g>
            )}
          </svg>
        </div>

        {(grafico.conclusao || grafico.descricao) && (
          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl space-y-1.5 text-xs">
            {grafico.conclusao && (
              <p className="text-amber-300 font-bold flex items-center gap-1.5">
                <span>💡 Conclusão:</span> {grafico.conclusao}
              </p>
            )}
            {grafico.descricao && (
              <p className="text-zinc-400 leading-relaxed">{grafico.descricao}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

const mapaInicialExemplo = {
  disciplina: "Raciocínio Lógico",
  titulo: "Silogismo Categórico e Diagramas de Conjuntos",
  banca: "VUNESP",
  ramos: [
    {
      id: "card-1-todo-nenhum-1728000000",
      titulo: "Card 1 - Todo e Nenhum",
      artigos: "LÓGICA DE ARGUMENTAÇÃO",
      tag: "Silogismo",
      assunto: "Proposições Categóricas - Conjuntos (Todo-Nenhum)",
      tipo: "exatas",
      grafico: {
        tipo: "conjuntos_misto",
        titulo: "TODO ESCREVENTE É SERVIDOR PÚBLICO E NENHUM SERVIDOR PÚBLICO É ESTRANGEIRO",
        grupos: [
          {
            posicaoX: 130,
            raioMaxX: 105,
            raioMaxY: 75,
            conjuntos: [
              { nome: "Servidor Público" },
              { nome: "Escrevente" }
            ]
          },
          {
            posicaoX: 320,
            raioMaxX: 60,
            raioMaxY: 60,
            corBorda: "#EF4444",
            corFundo: "rgba(239, 68, 68, 0.15)",
            conjuntos: [
              { nome: "Estrangeiro" }
            ]
          }
        ],
        conclusao: "Nenhum escrevente é estrangeiro.",
        descricao: "O conjunto Escrevente está inteiramente dentro de Servidor Público. Como nenhum servidor público é estrangeiro, os conjuntos Estrangeiro e Servidor Público são totalmente disjuntos (não se cruzam)."
      },
      subnos: [
        {
          titulo: "Validação Lógica VUNESP:",
          itens: [
            "Premissa 1: Todo Escrevente é Servidor Público (E ⊂ S)",
            "Premissa 2: Nenhum Servidor Público é Estrangeiro (S ∩ Est = ∅)",
            "Conclusão Necessária: Nenhum Escrevente é Estrangeiro (E ∩ Est = ∅)"
          ]
        }
      ],
      modalInfo: {
        title: "Dica de Ouro VUNESP",
        tag: "Estratégia",
        casosPraticos: [
          {
            titulo: "PADRÃO DA BANCA:",
            texto: "Se o conjunto maior (Servidor Público) não tem interseção com Estrangeiro, qualquer subconjunto contido nele (Escrevente) também JAMAIS poderá ter interseção com Estrangeiro."
          }
        ],
        conclusoes: ["Desenhe sempre os conjuntos inclusos juntos e coloque o conjunto excluído isolado do lado de fora."],
        pegadinha: "Nunca coloque um elemento totalmente excluído dentro do diagrama principal!"
      },
      importante: true
    }
  ]
};

const PROMPT_MESTRE_TEXTO = `Atue como Especialista e Mentor para o concurso do TJSP (Banca VUNESP). 
Gere um JSON estruturado para a tela de revisão em tela cheia (Raciocínio Lógico - Diagramas).

⚠️ **REGRA CRÍTICA PARA DIAGRAMAS DE CONJUNTOS (TODO / NENHUM)**:
1. Para premissas de inclusão com exclusão ("Todo A é B e Nenhum B é C"):
   Utilize o tipo "conjuntos_misto" no objeto "grafico" para garantir que o conjunto excluído fique SEPARADO e ISOLADO.
   
Estrutura exata do grafico para "conjuntos_misto":
"grafico": {
  "tipo": "conjuntos_misto",
  "titulo": "PREMISSAS EM CAIXA ALTA",
  "grupos": [
    {
      "posicaoX": 130,
      "raioMaxX": 105,
      "raioMaxY": 75,
      "conjuntos": [
        { "nome": "Conjunto Maior (ex: Servidor Público)" },
        { "nome": "Conjunto Menor (ex: Escrevente)" }
      ]
    },
    {
      "posicaoX": 320,
      "raioMaxX": 60,
      "raioMaxY": 60,
      "corBorda": "#EF4444",
      "corFundo": "rgba(239, 68, 68, 0.15)",
      "conjuntos": [
        { "nome": "Conjunto Excluído (ex: Estrangeiro)" }
      ]
    }
  ],
  "conclusao": "Conclusão válida do silogismo.",
  "descricao": "Explicação visual demonstrando por que os conjuntos não se cruzam."
}

Retorne EXCLUSIVAMENTE o JSON válido contendo a chave "ramos".`;

export default function MapaMentalPage() {
  const [mapasPorDisciplina, setMapasPorDisciplina] = useState<Record<string, any>>({});
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("Todas as Matérias");
  const [selectedAssunto, setSelectedAssunto] = useState<string>("all");

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [modalDisciplinaAlvo, setModalDisciplinaAlvo] = useState<string>("Raciocínio Lógico");
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(true);

  const [editandoRamoId, setEditandoRamoId] = useState<string | null>(null);
  const [novoAssuntoInput, setNovoAssuntoInput] = useState<string>('');

  useEffect(() => {
    carregarDadosSupabase();
  }, []);

  const carregarDadosSupabase = async () => {
    try {
      setCarregando(true);
      
      let { data: dadosEspelho } = await supabase.from('temp_mapas_mentais').select('*');
      const { data: dadosPrincipal, error: erroPrincipal } = await supabase.from('mapas_mentais').select('*');
      if (erroPrincipal) throw erroPrincipal;

      if ((!dadosEspelho || dadosEspelho.length === 0) && dadosPrincipal && dadosPrincipal.length > 0) {
        for (const item of dadosPrincipal) {
          await supabase.from('temp_mapas_mentais').upsert({
            disciplina: item.disciplina,
            titulo: item.titulo,
            banca: item.banca,
            ramos: item.ramos,
            backed_up_at: new Date().toISOString()
          }, { onConflict: 'disciplina' });
        }
        const resEspelho = await supabase.from('temp_mapas_mentais').select('*');
        dadosEspelho = resEspelho.data;
      }

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
            return {
              ...r,
              assunto: assuntoDefinitivo
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
      console.error("Erro ao carregar:", e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabaseComBackup = async (disciplinaAlvo: string, payloadMapa: any) => {
    try {
      const { data: dadosAtuais } = await supabase
        .from('mapas_mentais')
        .select('*')
        .eq('disciplina', disciplinaAlvo)
        .maybeSingle();

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
      alert("Erro crítico ao salvar no banco. O backup temp_mapas_mentais foi preservado.");
    }
  };

  const handleCarregarJson = async () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      if (parsed && parsed.ramos && Array.isArray(parsed.ramos)) {
        const mapaExistente = mapasPorDisciplina[modalDisciplinaAlvo];
        let novosRamosValidos = parsed.ramos.filter(Boolean);

        if (mapaExistente && mapaExistente.ramos) {
          const idsExistentes = new Set(mapaExistente.ramos.map((r: any) => r.id));
          const idsConflitantes = novosRamosValidos.filter((r: any) => idsExistentes.has(r.id));

          if (idsConflitantes.length > 0) {
            const confirmar = confirm(`⚠️ ALERTA DE SEGURANÇA: Encontramos ${idsConflitantes.length} ID(s) repetidos. Deseja mesclar atualizando estes itens?`);
            if (!confirmar) return;
          }

          const ramosAtualizadosMap = new Map();
          mapaExistente.ramos.forEach((r: any) => ramosAtualizadosMap.set(r.id, r));
          
          novosRamosValidos.forEach((r: any) => {
            ramosAtualizadosMap.set(r.id, r);
          });

          novosRamosValidos = Array.from(ramosAtualizadosMap.values());
        }

        const payloadFinal = {
          disciplina: modalDisciplinaAlvo,
          titulo: parsed.titulo || mapaExistente?.titulo || `Revisão: ${modalDisciplinaAlvo}`,
          banca: parsed.banca || 'VUNESP',
          ramos: novosRamosValidos
        };

        await salvarNoSupabaseComBackup(modalDisciplinaAlvo, payloadFinal);
        setShowJsonModal(false);
        setJsonInputText('');
        setSelectedDisciplina(modalDisciplinaAlvo);
        setSelectedAssunto('all');
        alert(`Conteúdo incorporado com segurança para ${modalDisciplinaAlvo}!`);
      } else {
        alert('O JSON precisa conter obrigatoriamente a chave "ramos".');
      }
    } catch (e) {
      alert('Erro de sintaxe no JSON.');
    }
  };

  const toggleImportante = async (ramoId: string) => {
    if (!mapaAtual) return;

    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      if (r && r.id === ramoId) {
        return { ...r, importante: !r.importante };
      }
      return r;
    });

    const payloadAtualizado = {
      ...mapaAtual,
      ramos: ramosAtualizados
    };

    await salvarNoSupabaseComBackup(selectedDisciplina, payloadAtualizado);
  };

  const salvarAssuntoEditado = async (ramoId: string) => {
    if (!mapaAtual) return;

    const ramosAtualizados = mapaAtual.ramos.map((r: any) => {
      if (r && r.id === ramoId) {
        return { ...r, assunto: novoAssuntoInput };
      }
      return r;
    });

    const payloadAtualizado = {
      ...mapaAtual,
      ramos: ramosAtualizados
    };

    await salvarNoSupabaseComBackup(selectedDisciplina, payloadAtualizado);
    setEditandoRamoId(null);
  };

  const excluirRamo = async (ramoId: string) => {
    if (!mapaAtual) return;
    if (confirm("Deseja apagar este tópico de revisão?")) {
      const novosRamos = mapaAtual.ramos.filter((r: any) => r && r.id !== ramoId);
      if (novosRamos.length === 0) {
        await supabase.from('mapas_mentais').delete().eq('disciplina', selectedDisciplina);
        const novoEstado = { ...mapasPorDisciplina };
        delete novoEstado[selectedDisciplina];
        setMapasPorDisciplina(novoEstado);
      } else {
        const novoMapa = { ...mapaAtual, ramos: novosRamos };
        await salvarNoSupabaseComBackup(selectedDisciplina, novoMapa);
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

  const assuntosUnicos = mapaAtual?.ramos && Array.isArray(mapaAtual.ramos)
    ? Array.from(new Set(mapaAtual.ramos.filter(Boolean).map((r: any) => {
        if (!r) return null;
        return r.assunto && r.assunto.trim() !== "" 
          ? r.assunto 
          : (r.titulo ? r.titulo.replace(/^[📌📍🚩⚡0-9.\-\)]+\s*/, '').trim() : "Geral");
      }).filter(Boolean)))
    : [];

  const ramosExibir = mapaAtual?.ramos && Array.isArray(mapaAtual.ramos) 
    ? mapaAtual.ramos.filter((r: any) => {
        if (!r) return false;
        if (selectedAssunto === 'all') return true;
        const assuntoRamo = r.assunto && r.assunto.trim() !== "" 
          ? r.assunto 
          : (r.titulo ? r.titulo.replace(/^[📌📍🚩⚡0-9.\-\)]+\s*/, '').trim() : "Geral");
        return assuntoRamo === selectedAssunto;
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
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              {mapaAtual ? mapaAtual.titulo : "Painel de Revisão Estratégica"}
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
              Novo Mapa
            </button>
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
                  {disc} {mapasPorDisciplina && mapasPorDisciplina[disc] ? "🟢" : "⚪"}
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
              <p className="text-base text-zinc-400 font-medium">Selecione uma disciplina para visualizar o conteúdo detalhado em tela cheia.</p>
            </div>
          ) : !mapaAtual ? (
            <div className="flex flex-col items-center justify-center text-center p-20 space-y-3">
              <p className="text-base text-zinc-300 font-medium">Nenhum registro encontrado para <b>{selectedDisciplina}</b>.</p>
              <button 
                onClick={() => { setModalDisciplinaAlvo(selectedDisciplina); setShowJsonModal(true); }}
                className="px-5 py-3 bg-amber-400 text-zinc-950 font-extrabold rounded-xl text-xs shadow-md hover:bg-amber-500 transition-all cursor-pointer"
              >
                Cadastrar via JSON
              </button>
            </div>
          ) : ramosExibir.length === 0 ? (
            <div className="flex items-center justify-center p-20 text-zinc-500 text-sm">
              Nenhum tópico correspondente.
            </div>
          ) : (
            <div className="space-y-12">
              {ramosExibir.map((ramo: any) => {
                if (!ramo) return null;
                const estaEditando = editandoRamoId === ramo.id;
                const assuntoExibicao = ramo.assunto || "Sem Assunto";
                const ehImportante = ramo.importante === true;

                return (
                  <div 
                    key={ramo.id}
                    className={`rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative transition-all border ${
                      ehImportante 
                        ? 'bg-amber-950/20 border-amber-400/60 shadow-amber-500/10' 
                        : 'bg-zinc-900/60 border-zinc-800/80'
                    }`}
                  >
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${ehImportante ? 'border-amber-400/40' : 'border-zinc-800'}`}>
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                            ehImportante 
                              ? 'text-amber-300 bg-amber-400/20 border-amber-400/40' 
                              : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                          }`}>
                            {selectedDisciplina}
                          </span>

                          {!estaEditando ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-300">
                                • {assuntoExibicao}
                              </span>
                              <button
                                onClick={() => {
                                  setEditandoRamoId(ramo.id);
                                  setNovoAssuntoInput(ramo.assunto || '');
                                }}
                                className="text-[10px] text-amber-400 hover:underline bg-zinc-900 px-2 py-0.5 rounded border border-amber-400/20 cursor-pointer"
                              >
                                ✏️ Editar Assunto
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
                                onClick={() => salvarAssuntoEditado(ramo.id)}
                                className="px-3 py-1 bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg cursor-pointer"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditandoRamoId(null)}
                                className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-lg cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>

                        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-2">
                          {ramo.titulo ? ramo.titulo.replace(/^[📌📍🚩⚡]\s*/, '') : "Tópico de Revisão"}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        {/* Botão Importante */}
                        <button
                          onClick={() => toggleImportante(ramo.id)}
                          className={`text-xs font-extrabold px-3 py-1 rounded-lg border transition-all cursor-pointer shadow-md ${
                            ehImportante
                              ? 'bg-amber-400 text-zinc-950 border-amber-300 ring-2 ring-amber-400/50'
                              : 'bg-zinc-950 text-amber-400/70 border-amber-500/30 hover:text-amber-400 hover:border-amber-400/50'
                          }`}
                        >
                          ⭐ Importante
                        </button>

                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-zinc-950 text-amber-400 border border-amber-400/30 whitespace-nowrap">
                          {ramo.tag}
                        </span>

                        <button
                          onClick={() => excluirRamo(ramo.id)}
                          className="text-zinc-500 hover:text-rose-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-rose-500/40 transition-all text-xs cursor-pointer"
                          title="Apagar este tópico"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* RENDERIZAÇÃO DO GRÁFICO LÓGICO SE EXISTIR */}
                    {ramo.grafico && <LogicalDiagram grafico={ramo.grafico} />}

                    <div className="space-y-6">
                      {ramo.subnos && ramo.subnos.map((sub: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`p-5 sm:p-6 rounded-xl border-l-4 border-amber-400 shadow-md space-y-3 transition-all ${
                            ehImportante 
                              ? 'bg-zinc-900/90 border-t border-r border-b border-amber-400/40' 
                              : 'bg-zinc-950 border-t border-r border-b border-zinc-800/80'
                          } ${ramo.tipo === 'exatas' ? 'font-mono' : ''}`}
                        >
                          {sub.titulo && (
                            <h3 className="text-sm sm:text-base font-bold text-amber-300 leading-snug">
                              {sub.titulo}
                            </h3>
                          )}
                          {sub.descricao && (
                            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-medium">
                              {sub.descricao}
                            </p>
                          )}
                          {sub.itens && sub.itens.length > 0 && (
                            <ul className="text-xs sm:text-sm text-zinc-200 space-y-2.5 pt-2 border-t border-zinc-900 font-medium">
                              {sub.itens.map((item: string, iIdx: number) => (
                                <li key={iIdx} className="leading-relaxed flex items-start gap-2.5">
                                  <span className="text-amber-400 font-bold select-none mt-0.5">•</span>
                                  <span className="flex-1">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={() => setActiveModal(ramo.id)} 
                        className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs sm:text-sm font-black rounded-xl border border-amber-500 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        💡 Ver Exemplo Prático e Pegadinha VUNESP
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-2.5 py-0.5 rounded-full">Mentor VUNESP</span>
              <h2 className="text-sm font-bold text-white">Prompt Mestre com Backup Automático em temp_mapas_mentais</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Gera conteúdos estruturados com IDs seguros e suporte a gráficos lógicos.
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

      {activeModal && mapaAtual && (
        (() => {
          const ramoModal = mapaAtual.ramos.find((r: any) => r && r.id === activeModal);
          if (!ramoModal || !ramoModal.modalInfo) return null;
          const info = ramoModal.modalInfo;
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
                      {info.tag}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1">{info.title}</h2>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-zinc-300 max-h-[65vh] overflow-y-auto pr-1">
                  {info.casosPraticos && info.casosPraticos.map((caso: any, idx: number) => (
                    <div key={idx} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 shadow-inner">
                      <p className="font-bold text-amber-400 uppercase tracking-wide">
                        {caso.titulo}
                      </p>
                      <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">{caso.texto}</p>
                      
                      {info.conclusoes && info.conclusoes[idx] && (
                        <p className="text-amber-300 text-xs sm:text-sm leading-relaxed font-semibold pt-2 border-t border-zinc-800">
                          {info.conclusoes[idx]}
                        </p>
                      )}
                    </div>
                  ))}

                  {info.pegadinha && (
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-amber-400/40 text-amber-200 space-y-1.5 shadow-lg">
                      <p className="font-bold uppercase tracking-wider text-amber-400">
                        PEGADINHA VUNESP:
                      </p>
                      <p className="leading-relaxed text-zinc-300 text-xs sm:text-sm">{info.pegadinha}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <button 
                    onClick={() => setActiveModal(null)} 
                    className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg cursor-pointer"
                  >
                    Entendi! Voltar ao Painel
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
              ✕
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-400 text-zinc-950 font-bold shadow-inner flex-shrink-0">
               🥷
              </div>
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-400 text-zinc-950 border-amber-500">
                  Gerenciador com Backup em Nuvem
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Adicionar novo mapa / tópico com Segurança</h2>
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
              <label className="text-xs font-bold text-zinc-300">Cole o JSON gerado pelo Prompt Mestre:</label>
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                className="w-full h-44 bg-zinc-900 text-amber-300 p-3.5 rounded-2xl border border-zinc-800 font-mono text-xs outline-none focus:border-amber-400 resize-none shadow-inner"
                placeholder="Cole o JSON aqui..."
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Cria cópia em temp_mapas_mentais antes de salvar.</span>
              <button 
                onClick={handleCarregarJson} 
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                Salvar com Backup Automático
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}