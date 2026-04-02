"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot(props: { className?: string; slotId?: string }) {
  const client = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;
  const slotId = props.slotId ?? process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_PRIMARY;
  const [scriptReady, setScriptReady] = useState(false);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!client || !slotId || !scriptReady || requestedRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      requestedRef.current = true;
    } catch {
      requestedRef.current = false;
    }
  }, [client, slotId, scriptReady]);

  if (!client || !slotId) {
    return (
      <aside
        aria-label="Reserved ad slot"
        className={cn(
          "rounded-[1.2rem] border border-dashed border-white/12 bg-white/[0.03] px-5 py-6 shadow-panel backdrop-blur-xl",
          props.className
        )}
      >
        <div className="flex min-h-[108px] flex-col items-center justify-center gap-2 text-center">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-primary/72">Google ad slot ready</p>
          <p className="text-base font-medium text-ink">Add your real AdSense IDs to enable this placement</p>
          <p className="max-w-2xl text-sm leading-6 text-ink/62">
            Set <code className="font-mono">NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT</code> and <code className="font-mono">NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_PRIMARY</code>, then rebuild.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Google ad" className={cn("rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-3 py-3 shadow-panel backdrop-blur-xl", props.className)}>
      <Script
        id="google-adsense"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />
      <div className="flex min-h-[110px] items-center justify-center overflow-hidden rounded-[0.9rem] border border-white/6 bg-black/20 px-2 py-2">
        <ins
          className="adsbygoogle block w-full"
          style={{ display: "block", minHeight: 96 }}
          data-ad-client={client}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}