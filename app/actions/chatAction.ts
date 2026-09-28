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
    return { response: 'A variável de ambiente NVIDIA_API_KEY não está configurada.' };
  }

  try {
    // Buscar diretamente as tabelas do Supabase
    const [simRes, redRes, melRes] = await Promise.all([
      supabaseAdmin.from('simulados').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('redaccoes').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('pontos_melhoria').select('*').order('created_at', { ascending: false })
    ]);

    const simulados = simRes.data || [];
    const redaccoes = redRes.data || [];
    const melhorias = melRes.data || [];

    // Montar o resumo direto dos dados reais
    let resumoSimulados = 'Nenhum simulado registado.';
    if (simulados.length > 0) {
      resumoSimulados = simulados.map(s => 
        `- Titulo: ${s.titulo} | Acertos: ${s.acertos}/${s.total_questoes} | Nota: ${s.nota} \vert{} Data:${new Date(s.created_at).toLocaleDateString('pt-BR')}`
      ).join('\n');
    }

    let resumoRedacoes = redaccoes.length > 0 ? `${redaccoes.length} redações registadas.` : 'Nenhuma redação registada.';

    const contextoDados = `
ESTATÍSTICAS OFICIAIS DO ALUNO NA BASE DE DADOS:
- Total de Simulados Realizados: ${simulados.length}
Lista de Simulados:
${resumoSimulados}

- Total de Redações: ${redaccoes.length}
- Pontos de Melhoria Registados: ${melhorias.length}
    `;

    const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUEST-ES, especializado em preparar candidatos para o concurso de Escrevente do TJSP (VUNESP).
Tens acima os dados exatos e contados diretamente do banco de dados. O aluno realizou exatamente ${simulados.length} simulado(s) (o Simulado 01 - VUNESP SP com 17 acertos, 46 questões e nota 3.70). 
Nunca digas que o aluno tem 0 simulados se o número acima for maior que 0.

REGRAS:
- Responde com base estrita nos dados fornecidos acima.
- NUNCA uses asteriscos, negritos, itálicos ou símbolos markdown de formatação. Responde em texto limpo.

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
      max_tokens: 1500,
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