/**
 * Tiny SSE helper for Express.
 *
 * Usage:
 *   const sse = openStream(res);
 *   sse.send({ kind: "progress", percent: 25 });
 *   sse.close();
 */

import type { Response } from "express";

export interface SseChannel {
  send: (event: unknown, name?: string) => void;
  close: () => void;
  closed: boolean;
}

export function openStream(res: Response): SseChannel {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let closed = false;

  res.on("close", () => {
    closed = true;
  });

  const channel: SseChannel = {
    get closed() {
      return closed;
    },
    send(event, name) {
      if (closed) return;
      if (name) res.write(`event: ${name}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    },
    close() {
      if (closed) return;
      closed = true;
      res.end();
    },
  };

  return channel;
}
