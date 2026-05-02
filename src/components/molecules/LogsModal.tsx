import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/atoms/Modal";

interface Props {
  open: boolean;
  siteId: string;
  siteName: string;
  onClose: () => void;
}

function lineColor(line: string) {
  if (/error|ERR!|fatal|FATAL/i.test(line)) return "text-red-400";
  if (/warn|WARN/i.test(line)) return "text-yellow-400";
  if (/success|ready|started|running/i.test(line)) return "text-green-400";
  return "text-slate-400";
}

export function LogsModal({ open, siteId, siteName, onClose }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLines([]);
    autoScrollRef.current = true;

    let unlisten: (() => void) | null = null;

    const start = async () => {
      unlisten = await listen<string>(`site:log:${siteId}`, (e) => {
        setLines((prev) => {
          const next = [...prev, e.payload];
          return next.length > 500 ? next.slice(-500) : next;
        });
      });
      await invoke("stream_site_logs", { siteId });
    };

    start();

    return () => {
      unlisten?.();
      invoke("stop_site_logs", { siteId });
    };
  }, [open, siteId]);

  useEffect(() => {
    if (autoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [lines]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    autoScrollRef.current = atBottom;
  };

  return (
    <Modal open={open} onClose={onClose} title={`Logs — ${siteName}`} maxWidth="max-w-3xl">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="bg-black rounded-lg overflow-y-auto h-96 p-3 font-mono text-xs leading-5"
      >
        {lines.length === 0 && (
          <span className="text-slate-500">En attente des logs…</span>
        )}
        {lines.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all ${lineColor(line)}`}>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </Modal>
  );
}
