import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json({ error: 'A chave NVIDIA_API_KEY não está configurada no ambiente.' }, { status: 500 });
    }

    // Inicialização segura dentro da rota para evitar falhas no build da Vercel
    const nvidiaClient = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Tenta buscar dados das tabelas de forma segura
    let questoesData: any[] = [];
    let redacoesData: any[] = [];

    try {
      const { data } = await supabaseAdmin.from('user_questions').select('*').eq('user_id', userId);
      if (data) questoesData = data;
    } catch (e) {
      try {
        const { data } = await supabaseAdmin.from('questoes').select('*').eq('user_id', userId);
        if (data) questoesData = data;
      } catch (err) {}
    }

    try {
      const { data } = await supabaseAdmin.from('redaccoes').select('*').eq('user_id', userId);
      if (data) redacoesData = data;
    } catch (e) {
      try {
        const { data } = await supabaseAdmin.from('redacao').select('*').eq('user_id', userId);
        if (data) redacoesData = data;
      } catch (err) {}
    }

    const contextoDados = `
    DADOS REAIS DO ALUNO NO SISTEMA UPQUESTOES (TJSP / VUNESP):
    - Total de registos de questões respondidos: ${questoesData.length}
    - Histórico de Questões: ${JSON.stringify(questoesData)}
    - Total de Redações treinadas: ${redacoesData.length}
    - Histórico de Redações: ${JSON.stringify(redacoesData)}
    `;

    const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUESTOES, especializado em preparar candidatos para o concurso de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo (TJSP) sob os rigorosos padrões da banca VUNESP.
    Tens acesso direto aos dados de desempenho do aluno através do banco de dados. Utiliza estes dados para dar feedback cirúrgico, analítico e motivador. Responde sempre em Português de Portugal natural, técnico e objetivo.

    ${contextoDados}`;

    const completion = await nvidiaClient.chat.completions.create({
      model: 'z-ai/glm-5-3-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 1500,
      stream: false,
    });

    const respostaIA = completion.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';

    return NextResponse.json({ response: respostaIA });
  } catch (error: any) {
    console.error('Erro detalhado na API do Chat NVIDIA:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao comunicar com a IA da NVIDIA.' },
      { status: 500 }
    );
  }
}