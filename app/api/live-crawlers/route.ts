import { subscribeCrawler } from "@/lib/liveCrawlerBus";

export const runtime = "nodejs";

export async function GET() {
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      /* ============================================
         ✅ 1) HANDSHAKE (Stops Infinite Spinner)
      ============================================ */
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ ok: true })}\n\n`)
      );

      /* ============================================
         ✅ 2) SUBSCRIBE TO LIVE CRAWLER EVENTS
      ============================================ */
      unsubscribe = subscribeCrawler((hit) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(hit)}\n\n`)
          );
        } catch (err) {
          // ✅ Client disconnected — stop sending
          unsubscribe?.();
        }
      });
    },

    /* ============================================
       ✅ 3) CLEANUP ON DISCONNECT
    ============================================ */
    cancel() {
      unsubscribe?.();
    },
  });

  /* ============================================
     ✅ 4) RETURN TRUE SSE RESPONSE HEADERS
     (Kamatera + Nginx Safe)
  ============================================ */
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",

      // ✅ Prevent caching + transformation
      "Cache-Control": "no-cache, no-transform",

      // ✅ Keep connection open
      Connection: "keep-alive",

      // ✅ REQUIRED for Nginx/Kamatera streaming
      "X-Accel-Buffering": "no",
    },
  });
}
