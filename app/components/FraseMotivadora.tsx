'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const frasesReflexivas = [
  "A disciplina é a escolha entre o que você quer agora e o que você quer mais tarde.",
  "O modo como você faz qualquer coisa é o modo como você faz tudo.",
  "Construir o próprio futuro exige sacrifícios que ninguém vê, mas cujos frutos todos admiram.",
  "A constância supera o talento quando o talento não tem constância.",
  "O seu maior concorrente é a versão de ontem de si mesmo.",
  "Plante a sua aprovação todos os dias no silêncio da rotina.",
  "Grandes conquistas são feitas de pequenos nadas repetidos com excelência."
];

export default function FraseMotivadora() {
  const [fraseDoDia, setFraseDoDia] = useState('');

  useEffect(() => {
    const index = Math.floor(Math.random() * frasesReflexivas.length);
    setFraseDoDia(frasesReflexivas[index]);
  }, []);

  if (!fraseDoDia) return null;

  return (
    <div className="bg-zinc-950 border border-red-600/30 rounded-xl p-4 shadow-lg flex items-center gap-3 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
      <div className="p-2 bg-red-950/40 rounded-lg text-red-500 border border-red-600/20">
        <Sparkles className="w-5 h-5 animate-pulse" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Reflexão Diária</p>
        <p className="text-sm text-zinc-300 italic mt-0.5">"{fraseDoDia}"</p>
      </div>
    </div>
  );
}