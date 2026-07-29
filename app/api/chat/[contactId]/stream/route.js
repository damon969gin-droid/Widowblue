import { getUserId, unauthorized } from "../../../../../lib/server/authHelper.js";
import { subscribe, unsubscribe } from "../../../../../lib/server/pubsub.js";

export async function GET(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const { contactId } = params;

  let controllerRef;
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      controller.enqueue(new TextEncoder().encode("retry: 2000\n\n"));
      subscribe(contactId, controller);
    },
    cancel() {
      unsubscribe(contactId, controllerRef);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
