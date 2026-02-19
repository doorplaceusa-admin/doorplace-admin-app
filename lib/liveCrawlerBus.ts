// lib/liveCrawlerBus.ts

export type LiveCrawlerHit = {
  id: string;
  source: "crawler";

  state: string;
  city: null;

  latitude: number;
  longitude: number;

  crawler_name: string;
  page_url: string;
  page_key: string;

  count: 1;
};

declare global {
  var crawlerSubscribers:
    | Set<(hit: LiveCrawlerHit) => void>
    | undefined;
}

global.crawlerSubscribers ||= new Set();

export function broadcastCrawler(hit: LiveCrawlerHit) {
  for (const fn of global.crawlerSubscribers!) {
    fn(hit);
  }
}

export function subscribeCrawler(fn: (hit: LiveCrawlerHit) => void) {
  global.crawlerSubscribers!.add(fn);

  return () => {
    global.crawlerSubscribers!.delete(fn);
  };
}
