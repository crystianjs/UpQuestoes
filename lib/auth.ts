// lib/auth.ts
import { supabase } from './supabase';

export async function getUtilizadorAtual() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

export async function fazerLogout() {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}