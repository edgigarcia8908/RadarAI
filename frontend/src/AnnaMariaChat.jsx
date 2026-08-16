import { useEffect, useRef, useState } from 'react';

import { radarService } from './services/radar.service';
import colombia from './colombia.json';

/**
 * Busca un municipio real dentro de un texto libre — para que cuando el
 * chat pregunta "¿de qué municipio hablamos?" y el usuario responde
 * "Tocancipá" o "vivo en Tocancipá, Cundinamarca", se pueda extraer sin
 * necesitar un LLM (no hay API key configurada por defecto en este repo).
 * Coincidencia exacta de nombre de municipio (normalizado), no parcial —
 * para no confundir "Cota" con cualquier palabra que la contenga.
 */
function buscarMunicipioEnTexto(texto) {
  const normalizado = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
  const palabras = new Set(normalizado.split(/\s+/).filter(Boolean));

  for (const { departamento, ciudades } of colombia) {
    for (const ciudad of ciudades) {
      const ciudadNormalizada = ciudad
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim();
      const tokensCiudad = ciudadNormalizada.split(/\s+/).filter(Boolean);
      if (tokensCiudad.every((t) => palabras.has(t))) {
        return { departamento, ciudad };
      }
    }
  }
  return null;
}

const SUGERENCIAS = [
  '¿En qué se gasta mi municipio el presupuesto este año?',
  '¿Qué contratos firmó mi alcaldía en los últimos 6 meses?',
  '¿Hay alertas de corrupción en mi departamento?',
  '¿Cuánto dinero de regalías llegó a mi municipio y en qué se invirtió?',
  '¿Qué obras públicas están paralizadas en mi territorio?',
  '¿Qué proveedores ganan más contratos en mi región?',
];

/**
 * Detecta si una línea es parte de una barra ASCII (empieza con █ o contiene
 * %), para agruparlas en un bloque de código. Las líneas vacías no rompen un
 * bloque de barras ya iniciado.
 */
function esLineaAscii(linea, enBloqueAscii) {
  const t = linea.trim();
  if (!t) return enBloqueAscii;
  return t.startsWith('█') || t.includes('%');
}

/** Divide la respuesta de Anna María en bloques de texto plano y de barras ASCII. */
function dividirEnBloques(texto) {
  const lineas = texto.split('\n');
  const bloques = [];
  let actual = [];
  let enBloqueAscii = false;

  for (const linea of lineas) {
    const esAscii = esLineaAscii(linea, enBloqueAscii);
    if (esAscii !== enBloqueAscii) {
      if (actual.length) bloques.push({ tipo: enBloqueAscii ? 'ascii' : 'texto', lineas: actual });
      actual = [];
      enBloqueAscii = esAscii;
    }
    actual.push(linea);
  }
  if (actual.length) bloques.push({ tipo: enBloqueAscii ? 'ascii' : 'texto', lineas: actual });
  return bloques;
}

function MensajeBot({ texto }) {
  const bloques = dividirEnBloques(texto);

  return (
    <div className="chat-message bot">
      <div className="chat-bubble">
        {bloques.map((bloque, i) =>
          bloque.tipo === 'ascii' ? (
            <pre className="chat-ascii" key={i}>{bloque.lineas.join('\n')}</pre>
          ) : (
            <p className="chat-texto" key={i}>{bloque.lineas.join('\n')}</p>
          ),
        )}
      </div>
    </div>
  );
}

/**
 * Chat flotante de Anna María: experta cívica de RADAR. Botón flotante (FAB)
 * verde lima que abre un panel de conversación. El panel es el primer
 * elemento fijo del proyecto y usa un z-index alto para no chocar con la
 * barra superior sticky (z-index 10).
 */
export default function AnnaMariaChat({ radar }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  // Cuando el backend pide territorio (requiereTerritorio), se guarda la
  // pregunta original acá — el próximo mensaje del usuario se interpreta
  // como "¿cuál es tu municipio?" en vez de una pregunta nueva, y se
  // combinan las dos para responder lo que realmente se preguntó.
  const [preguntaPendiente, setPreguntaPendiente] = useState(null);
  const listaRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensajes, escribiendo]);

  function rellenarSugerencia(sugerencia) {
    setInput(sugerencia);
    if (inputRef.current) inputRef.current.focus();
  }

  async function enviar(event) {
    event.preventDefault();
    const mensaje = input.trim();
    if (!mensaje) return;

    setInput('');
    setMensajes((prev) => [...prev, { rol: 'usuario', texto: mensaje }]);
    setEscribiendo(true);
    try {
      // Si el ciudadano ya eligió territorio en la app, se lo pasamos a Anna
      // María para que responda con datos reales de esa región en SECOP II.
      let departamento = radar?.department || radar?.selectedDepartment || undefined;
      let ciudad = radar?.municipality || undefined;
      let mensajeParaBackend = mensaje;

      if (preguntaPendiente && !ciudad) {
        const encontrado = buscarMunicipioEnTexto(mensaje);
        if (encontrado) {
          departamento = encontrado.departamento;
          ciudad = encontrado.ciudad;
          mensajeParaBackend = preguntaPendiente;
        } else {
          setMensajes((prev) => [
            ...prev,
            { rol: 'bot', texto: `No reconocí ese municipio — escribe el nombre tal como aparece en SECOP (por ejemplo "Tocancipá" o "Zipaquirá").` },
          ]);
          setEscribiendo(false);
          return;
        }
      }

      const { respuesta, requiereTerritorio } = await radarService.consultarChatAnnaMaria({ mensaje: mensajeParaBackend, departamento, ciudad });
      setMensajes((prev) => [...prev, { rol: 'bot', texto: respuesta }]);
      setPreguntaPendiente(requiereTerritorio ? mensaje : null);
    } catch (error) {
      setMensajes((prev) => [...prev, { rol: 'bot', texto: `No pude responder en este momento. ${error.message}` }]);
    } finally {
      setEscribiendo(false);
    }
  }

  return (
    <>
      {!abierto && (
        <button
          className="chat-fab"
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir chat con Anna María"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3C7.03 3 3 6.58 3 11c0 2.12.9 4.05 2.37 5.47L4 20l3.86-1.3c1.3.5 2.74.8 4.14.8 4.97 0 9-3.58 9-8s-4.03-8-9-8Z"
              fill="currentColor"
            />
            <circle cx="8.5" cy="11" r="1.1" fill="#151f00" />
            <circle cx="12" cy="11" r="1.1" fill="#151f00" />
            <circle cx="15.5" cy="11" r="1.1" fill="#151f00" />
          </svg>
        </button>
      )}

      {abierto && (
        <section className="chat-panel" aria-label="Chat con Anna María">
          <header className="chat-header">
            <div>
              <strong>Anna María</strong>
              <span>Experta cívica de RADAR</span>
            </div>
            <button className="chat-close" type="button" onClick={() => setAbierto(false)} aria-label="Cerrar chat">
              ✕
            </button>
          </header>

          <div className="chat-messages" ref={listaRef}>
            {mensajes.length === 0 && (
              <div className="chat-welcome">
                <p>Hola, soy Anna María. Pregúntame cualquier cosa sobre contratación pública o el estado de tu municipio y te lo explico fácil.</p>
                <div className="chat-chips">
                  {SUGERENCIAS.map((sugerencia) => (
                    <button key={sugerencia} className="chat-chip" type="button" onClick={() => rellenarSugerencia(sugerencia)}>
                      {sugerencia}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((mensaje, i) =>
              mensaje.rol === 'usuario' ? (
                <div className="chat-message user" key={i}>
                  <span>{mensaje.texto}</span>
                </div>
              ) : (
                <MensajeBot texto={mensaje.texto} key={i} />
              ),
            )}

            {escribiendo && (
              <div className="chat-typing">
                <span>Anna María está escribiendo…</span>
              </div>
            )}
          </div>

          <form className="chat-input-row" onSubmit={enviar}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu pregunta…"
              aria-label="Mensaje para Anna María"
            />
            <button className="chat-send" type="submit" disabled={!input.trim()} aria-label="Enviar mensaje">
              ➤
            </button>
          </form>
        </section>
      )}
    </>
  );
}