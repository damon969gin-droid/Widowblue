/**
 * Registro in memoria dei client in ascolto SSE per ogni contatto.
 * Funziona per sviluppo locale e hosting Node tradizionale (processo unico
 * e persistente). Su hosting serverless (funzioni stateless a ogni richiesta)
 * serve un broker condiviso come Redis pub/sub, indicato anche nella
 * specifica tecnica — stesso limite già segnalato per il backend Flask.
 */
const subscribers = new Map();

export function subscribe(contactId, controller) {
  if (!subscribers.has(contactId)) subscribers.set(contactId, new Set());
  subscribers.get(contactId).add(controller);
}

export function unsubscribe(contactId, controller) {
  subscribers.get(contactId)?.delete(controller);
}

export function publish(contactId, message) {
  const encoder = new TextEncoder();
  const chunk = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
  for (const controller of subscribers.get(contactId) || []) {
    try {
      controller.enqueue(chunk);
    } catch {
      // il client si è disconnesso, verrà rimosso dal suo stesso "cancel"
    }
  }
}
