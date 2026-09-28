'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;

      if (data.session) {
        router.push('/desempenho');
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      setErro(err.message || 'Erro ao autenticar. Verifique o seu e-mail e palavra-passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 font-sans selection:bg-red-600 selection:text-white">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-red-950/20 relative overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-600 shadow-lg shadow-red-600"></div>

        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-red-950/40 border border-red-600/50 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-7 h-7" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-wider text-white">
            UPQUEST<span className="text-red-600">OES</span>
          </h1>
          <p className="text-xs font-medium text-zinc-400 mt-1 uppercase tracking-widest">
            Acesso Restrito — Concurso TJSP (VUNESP)
          </p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-600/50 rounded-lg text-xs text-red-300 text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              E-mail
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@gmail.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Palavra-passe
            </label>
            <input 
              type="password" 
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-red-600/30 transition-all duration-200 text-sm tracking-wide mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'A autenticar...' : 'Entrar na Plataforma'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-900 text-center text-xs text-zinc-500">
          <p>Não possui cadastro? Peça a um administrador a criação da sua conta.</p>
          <Link href="#" className="text-red-500 hover:underline block mt-2">
            Cadastre-se
          </Link>
        </div>

      </div>
    </div>
  );
}