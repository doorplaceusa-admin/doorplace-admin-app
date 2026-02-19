import { subscribeCrawler } from "@/lib/liveCrawlerBus";

export const runtime = "nodejs";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const unsubscribe = subscribeCrawler((hit) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(hit)}\n\n`)
        );
      });

      return () => unsubscribe();
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
