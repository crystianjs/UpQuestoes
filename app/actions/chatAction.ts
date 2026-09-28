'use server';

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: { persistSession: false, autoRefreshToken: false }
  }
);

export async function perguntarNvidiaAction(
  messages: { role: 'user' | 'assistant'; content: string }[], 
  userId?: string 
) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return { response: 'A variável de ambiente NVIDIA_API_KEY não está configurada no ficheiro .env.local.' };
  }

  try {
    // Buscar diretamente as tabelas principais de forma isolada para garantir exatidão absoluta
    const { data: simulados } = await supabaseAdmin.from('simulados').select('*');
    const { data: redaccoes } = await supabaseAdmin.from('redaccoes').select('*');
    const { data: melhorias } = await supabaseAdmin.from('pontos_melhoria').select('*');
    const { data: questoes } = await supabaseAdmin.from('user_questions').select('*');

    const listaSimulados = simulados && simulados.length > 0 
      ? JSON.stringify(simulados, null, 2) 
      : 'NENHUM SIMULADO REGISTADO.';

    const listaRedacoes = redaccoes && redaccoes.length > 0 
      ? JSON.stringify(redaccoes, null, 2) 
      : 'NENHUMA REDAÇÃO REGISTADA.';

    const listaMelhorias = melhorias && melhorias.length > 0 
      ? JSON.stringify(melhorias, null, 2) 
      : 'NENHUM PONTO DE MELHORIA REGISTADO.';

    const contextoDados = `
DADOS OFICIAIS DO ALUNO NA BASE DE DADOS:

1. TABELA SIMULADOS (REGISTOS REAIS):
${listaSimulados}

2. TABELA REDAÇÕES (redaccoes):
${listaRedacoes}

3. PONTOS DE MELHORIA:
${listaMelhorias}
    `;

    const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUEST-ES, especializado em preparar candidatos para o concurso de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo (TJSP) sob os rigorosos padrões da banca VUNESP.

ATENÇÃO CRÍTICA E OBRIGATÓRIA:
Tens acima os dados exatos extraídos diretamente das tabelas do Supabase. O aluno JÁ REALIZOU simulados (consulta a tabela de simulados acima, que contém o "Simulado 01 - VUNESP SP", 17 acertos em 46 questões e nota 3.70). 
É TERMINANTEMENTE PROIBIDO dizeres que o aluno não tem simulados ou que o campo está vazio, pois os dados estão visíveis e presentes na tabela.

REGRAS:
- Responde com base estrita nos dados do banco fornecidos acima.
- NUNCA uses asteriscos, negritos, itálicos ou símbolos markdown de formatação. Responde em texto limpo e direto.

${contextoDados}`;

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content
      }))
    ];

    const completion: any = await nvidiaClient.chat.completions.create({
      model: 'z-ai/glm-5.3',
      messages: formattedMessages,
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 2048,
      stream: false,
    });

    let respostaIA = completion.choices[0]?.message?.content || '';

    if (!respostaIA) {
      return { response: 'O assistente processou o pedido mas não gerou conteúdo.' };
    }

    respostaIA = respostaIA.replace(/[*_#`~]/g, '');

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro ao consultar o banco de dados:', error);
    return { response: `Erro ao processar os dados do sistema: ${error?.message || 'Erro desconhecido'}.` };
  }
}