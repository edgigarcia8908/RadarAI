/**
 * Llamada directa a un LLM público — sin pasar por ningún servicio
 * intermediario propio. Completamente opcional: si no hay ninguna API key
 * configurada en el `.env`, `completar()` devuelve `null` y quien llama cae
 * a una respuesta con plantilla (ver `civic-intel.service.ts` y
 * `veedurias.service.ts`) — el resto de RadarAI funciona igual sin esto,
 * solo con redacción más plana.
 *
 * Agnóstico de proveedor a propósito: Anthropic tiene su propio formato de
 * API, pero OpenAI/Groq/DeepSeek (y la mayoría de proveedores nuevos)
 * exponen el mismo formato "chat/completions" — un solo cliente genérico
 * sirve para todos, solo cambia baseUrl/modelo. Cualquiera que clone este
 * repo puede activarlo con su PROPIA cuenta (son APIs públicas estándar).
 * Prioridad si hay varias keys: Anthropic > OpenAI > Groq > DeepSeek.
 */

export interface CompletarInput {
  system?: string;
  prompt: string;
  maxTokens?: number;
}

async function completarAnthropic(input: CompletarInput, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: input.maxTokens ?? 400,
      system: input.system,
      messages: [{ role: 'user', content: input.prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/** Formato "chat/completions" compartido por OpenAI, Groq, DeepSeek y la mayoría de proveedores compatibles. */
async function completarChatCompletions(input: CompletarInput, apiKey: string, baseUrl: string, model: string, proveedor: string): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: input.maxTokens ?? 400,
      messages: [...(input.system ? [{ role: 'system', content: input.system }] : []), { role: 'user', content: input.prompt }],
    }),
  });
  if (!res.ok) throw new Error(`${proveedor} respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/** Devuelve `null` si no hay ninguna API key configurada — nunca lanza por eso, es una mejora opcional. */
export async function completar(input: CompletarInput): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (anthropicKey) return completarAnthropic(input, anthropicKey);
  if (openaiKey) return completarChatCompletions(input, openaiKey, 'https://api.openai.com/v1', 'gpt-4o-mini', 'OpenAI');
  if (groqKey) return completarChatCompletions(input, groqKey, 'https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile', 'Groq');
  if (deepseekKey) return completarChatCompletions(input, deepseekKey, 'https://api.deepseek.com/v1', 'deepseek-chat', 'DeepSeek');
  return null;
}
