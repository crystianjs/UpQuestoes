'use server';

import OpenAI from 'openai';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function perguntarNvidiaAction(
  messages: { role: 'user' | 'assistant'; content: string }[], 
  contextoDados?: string
) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return { response: 'Erro: A chave NVIDIA_API_KEY não está configurada no ficheiro .env.local.' };
  }

  try {
    let systemPrompt = `Tu és o mentor de inteligência artificial oficial do portal UPQUEST-ES, especializado no concurso de Escrevente Técnico Judiciário do TJSP sob o padrão da banca VUNESP.
O teu objetivo é ajudar o aluno respondendo às suas dúvidas de direito, português, fornecendo temas inéditos de redação nos padrões VUNESP (com texto motivador e propostas claras), e analisando o seu desempenho de forma inteligente, cirúrgica e motivadora.`;

    if (contextoDados) {
      systemPrompt += `\n\nDADOS REAIS DO ALUNO NO SISTEMA:\n${contextoDados}`;
    }

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content
      }))
    ];

    const completion: any = await nvidiaClient.chat.completions.create({
      model: 'z-ai/glm-5.3-flash', // Modelo exato selecionado no teu painel da NVIDIA NIM
      messages: formattedMessages,
      temperature: 0.6,
      max_tokens: 1500,
    });

    const respostaIA = completion.choices[0]?.message?.content || 'O assistente não gerou resposta.';

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro ao chamar a API da NVIDIA:', error);
    return { response: `Erro ao processar com a IA da NVIDIA: ${error?.message || 'Erro desconhecido'}` };
  }
}