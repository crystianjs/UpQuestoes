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
    return { response: 'Erro: Chave da API NVIDIA não configurada.' };
  }

  try {
    // 1. CONSULTA DIRETA AO SUPABASE
    const [simRes, redRes] = await Promise.all([
      supabaseAdmin.from('simulados').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('redaccoes').select('*').order('created_at', { ascending: false })
    ]);

    const simulados = simRes.data || [];
    const redaccoes = redRes.data || [];

    // 2. CONSTRUIR TEXTO EXPLICITO DE FACTOS REAIS
    let dadosFactuais = `ESTATÍSTICAS REAIS DO ALUNO NO SISTEMA:\n`;
    
    if (simulados.length > 0) {
      dadosFactuais += `- Simulados realizados: ${simulados.length}. Detalhe do último simulado: "${simulados[0].titulo}", com ${simulados[0].acertos} acertos em${simulados[0].total_questoes} questões, obtendo a nota ${simulados[0].nota}.\n`;
    } else {
      dadosFactuais += `- Simulados realizados: 0.\n`;
    }

    dadosFactuais += `- Redações registadas: ${redaccoes.length}.\n`;

    // 3. SYSTEM PROMPT RIGOROSO E CURTO
    const systemPrompt = `És o assistente de inteligência artificial do UPQUEST-ES, mentor para o concurso de Escrevente do TJSP (VUNESP).
Deves responder sempre com base estrita nos dados factuais fornecidos abaixo pelo sistema. 

REGRAS OBRIGATÓRIAS:
1. Nunca digas que o aluno tem 0 simulados se os dados abaixo indicarem o contrário.
2. NUNCA uses asteriscos, negritos, itálicos ou quaisquer símbolos markdown de formatação. Apenas texto limpo.

${dadosFactuais}`;

    // Formatar mensagens garantindo que o system prompt é respeitado
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
      max_tokens: 1000,
      stream: false,
    });

    let respostaIA = completion.choices[0]?.message?.content || '';

    if (!respostaIA) {
      return { response: 'O assistente processou o pedido mas não gerou conteúdo.' };
    }

    // Limpeza total de markdown de forma agressiva
    respostaIA = respostaIA.replace(/[*_#`~[\]()>-]/g, '').trim();

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro no chatAction:', error);
    return { response: `Erro ao processar a solicitação: ${error?.message || 'Erro desconhecido'}.` };
  }
}