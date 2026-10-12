'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

const frasesReflexivas = [
  "Se o cara explicou e um ser humano entendeu, você também pode entender.",
  "O estudo exige brio. Exige você olhar para o livro e dizer: 'Você não vai me vencer'.",
  "Porque o Senhor dá a sabedoria; da sua boca vem o conhecimento e o entendimento.",
  "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.",
  "A repetição com correção, até a exaustão, leva à perfeição.",
  "A disciplina é a escolha entre o que você quer agora e o que você quer mais tarde.",
  "O modo como você faz qualquer coisa é o modo como você faz tudo.",
  "O seu maior concorrente é a versão de ontem de si mesmo."
];

export default function FraseMotivadora() {
  const [fraseDoDia, setFraseDoDia] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const index = Math.floor(Math.random() * frasesReflexivas.length);
    setFraseDoDia(frasesReflexivas[index]);
    setIsOpen(true);
  }, []);

  if (!isOpen || !fraseDoDia) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-amber-400/50 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in duration-200">
        
        {/* Botão Fechar */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800 transition-all text-xs cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400/10 rounded-xl text-amber-400 border border-amber-400/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Mentalidade de Alta Performance</p>
            <h2 className="text-base font-bold text-white">Reflexão Diária</h2>
          </div>
        </div>

        {/* Caixa da Frase em Amarelo */}
        <div className="bg-amber-400 border border-amber-300 rounded-2xl p-5 shadow-lg text-zinc-950">
          <p className="text-sm font-bold italic leading-relaxed text-center">
            &ldquo;{fraseDoDia}&rdquo;
          </p>
        </div>

        {/* Botão de Ação Principal */}
        <div className="pt-2">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-950/40 cursor-pointer uppercase tracking-wider"
          >
            Vai pra cima! É voce contra você mesmo! 🚀
          </button>
        </div>

      </div>
    </div>
  );
}