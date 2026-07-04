"use client";

import { useState } from "react";

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="relative inline-block">
      {copied && (
        <span className="tt-pop absolute -top-8 right-0 whitespace-nowrap rounded-lg bg-ink text-white text-[11px] font-semibold px-2.5 py-1">
          Copied! ✓
        </span>
      )}
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="tt-chunky rounded-[14px] bg-sunny text-ink px-4 py-2 text-xs font-bold"
      >
        {label}
      </button>
    </span>
  );
}
