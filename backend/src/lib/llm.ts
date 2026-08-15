/**
 * Llamada directa a un LLM público (Anthropic o OpenAI) — sin pasar por
 * ningún servicio intermediario propio. Completamente opcional: si no hay
 * `ANTHROPIC_API_KEY` ni `OPENAI_API_KEY` en el `.env`, `completar()`
 * devuelve `null` y quien llama cae a una respuesta con plantilla (ver
 * `civic-intel.service.ts` y `veedurias.service.ts`) — el resto de RadarAI
 * funciona igual sin esto, solo con redacción más plana.
 *
 * Cualquiera que clone este repo puede activarlo con su PROPIA cuenta de
 * Anthropic/OpenAI (son APIs públicas estándar, no algo privado de un
 * tercero) — a diferencia del servicio anterior, esto sí es algo que
 * cualquiera puede desplegar con este mismo repo.
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

async function completarOpenAi(input: CompletarInput, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: input.maxTokens ?? 400,
      messages: [...(input.system ? [{ role: 'system', content: input.system }] : []), { role: 'user', content: input.prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/** Devuelve `null` si no hay ninguna API key configurada — nunca lanza por eso, es una mejora opcional. */
export async function completar(input: CompletarInput): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (anthropicKey) return completarAnthropic(input, anthropicKey);
  if (openaiKey) return completarOpenAi(input, openaiKey);
  return null;
}
