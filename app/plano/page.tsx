'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MATERIAS_TJSP = [
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

const CICLO_REVISAO_PADRAO = MATERIAS_TJSP.map(m => ({
  materia: m,
  carga: m === "Língua Portuguesa" ? "10 min" : "10 min"
}));

const CICLO_TEORICO_PADRAO = MATERIAS_TJSP.map(m => ({
  materia: m,
  carga: ["Direito Constitucional", "Direito Administrativo", "Direito Penal", "Direito Processual Penal", "Direito Processual Civil", "Normas da Corregedoria"].includes(m) ? "2 horas" : "4 horas"
}));

export default function PlanoEstudosPage() {
  const [cicloRevisao, setCicloRevisao] = useState(CICLO_REVISAO_PADRAO);
  const [cicloTeorico, setCicloTeorico] = useState(CICLO_TEORICO_PADRAO);
  
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDadosSupabase();
  }, []);

  const carregarDadosSupabase = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from('plano_estudos_tjsp').select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        const rev = data.find((d: any) => d.tipo === 'revisao');
        const teo = data.find((d: any) => d.tipo === 'teorico');

        if (rev && rev.dados) setCicloRevisao(rev.dados);
        if (teo && teo.dados) setCicloTeorico(teo.dados);
      }
    } catch (e) {
      console.error("Erro ao carregar do Supabase:", e);
    } finally {
      setCarregando(false);
    }
  };

  const salvarNoSupabase = async () => {
    try {
      await supabase.from('plano_estudos_tjsp').upsert([
        { tipo: 'revisao', dados: cicloRevisao, updated_at: new Date().toISOString() },
        { tipo: 'teorico', dados: cicloTeorico, updated_at: new Date().toISOString() }
      ], { onConflict: 'tipo' });

      setEditando(false);
      alert('Alterações salvas com sucesso!');
    } catch (e) {
      alert('Erro ao salvar no banco. Verifique se a tabela foi criada.');
    }
  };

  const atualizarCargaRevisao = (index: number, novaCarga: string) => {
    const novo = [...cicloRevisao];
    novo[index].carga = novaCarga;
    setCicloRevisao(novo);
  };

  const atualizarCargaTeorico = (index: number, novaCarga: string) => {
    const novo = [...cicloTeorico];
    novo[index].carga = novaCarga;
    setCicloTeorico(novo);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        
        {/* Cabeçalho e Botão de Editar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
          <div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              TJSP - VUNESP
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              Seus Ciclos de Estudo e Revisão
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {editando ? (
              <>
                <button
                  onClick={() => setEditando(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarNoSupabase}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Salvar na Nuvem
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditando(true)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                Editar
              </button>
            )}
          </div>
        </div>

        {carregando ? (
          <div className="text-center py-20 text-zinc-500 text-sm">Carregando seus ciclos...</div>
        ) : (
          <div className="space-y-10">
            
            {/* 1. CICLO DE REVISÃO */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 bg-gradient-to-r from-amber-600/20 to-transparent border-b border-zinc-800">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">O Ciclo de Estudos • TJSP</p>
                <h2 className="text-2xl font-black text-white mt-0.5">CICLO DE REVISÃO</h2>
                <p className="text-xs text-zinc-400 mt-1">A mesma grade. O que muda é a carga — revisar é mais rápido que assistir.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-xs uppercase tracking-wider text-amber-400 font-bold">
                      <th className="py-3.5 px-6">Matéria</th>
                      <th className="py-3.5 px-6 text-right">Carga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-xs sm:text-sm font-medium">
                    {cicloRevisao.map((item, index) => (
                      <tr key={index} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-4 px-6 text-zinc-200 font-semibold">{item.materia}</td>
                        <td className="py-4 px-6 text-right">
                          {editando ? (
                            <input
                              type="text"
                              value={item.carga}
                              onChange={(e) => atualizarCargaRevisao(index, e.target.value)}
                              className="bg-zinc-900 border border-amber-400 text-amber-300 px-3 py-1 rounded-lg text-xs font-bold text-right outline-none w-36"
                            />
                          ) : (
                            <span className="font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20">
                              {item.carga}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-300 font-medium">
                💡 <span className="font-bold text-white">10 minutos</span> Com o tempo vira 30, 40, uma hora — porque o caderno cresce.
              </div>
            </div>

            {/* 2. CICLO TEÓRICO */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 bg-gradient-to-r from-blue-600/20 to-transparent border-b border-zinc-800">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">O Ciclo de Estudos • TJSP</p>
                <h2 className="text-2xl font-black text-white mt-0.5">CICLO TEÓRICO</h2>
                <p className="text-xs text-zinc-400 mt-1">Aqui você assiste à videoaula e escreve o seu resumo. Só passa pra próxima quando bater a hora.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-xs uppercase tracking-wider text-blue-400 font-bold">
                      <th className="py-3.5 px-6">Matéria</th>
                      <th className="py-3.5 px-6 text-right">Carga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-xs sm:text-sm font-medium">
                    {cicloTeorico.map((item, index) => (
                      <tr key={index} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-4 px-6 text-zinc-200 font-semibold">{item.materia}</td>
                        <td className="py-4 px-6 text-right">
                          {editando ? (
                            <input
                              type="text"
                              value={item.carga}
                              onChange={(e) => atualizarCargaTeorico(index, e.target.value)}
                              className="bg-zinc-900 border border-blue-400 text-blue-300 px-3 py-1 rounded-lg text-xs font-bold text-right outline-none w-36"
                            />
                          ) : (
                            <span className="font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-lg border border-blue-400/20">
                              {item.carga}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-300 font-medium">
                ⏱️ <span className="font-bold text-white">Foco total no cronograma.</span> Respeite o tempo estipulado para manter o ritmo constante.
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}