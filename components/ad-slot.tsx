"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot(props: { className?: string; slotId?: string }) {
  const client = ADSENSE_CLIENT;
  const slotId =
    props.slotId ?? process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_PRIMARY;
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!(client && slotId) || requestedRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      requestedRef.current = true;
    } catch {
      requestedRef.current = false;
    }
  }, [slotId]);

  if (!(client && slotId)) {
    return null;
  }

  return (
    <aside
      aria-label="Google ad"
      className={cn(
        "rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-3 py-3 shadow-panel backdrop-blur-xl",
        props.className
      )}
    >
      <div className="flex min-h-[110px] items-center justify-center overflow-hidden rounded-[0.9rem] border border-white/6 bg-black/20 px-2 py-2">
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={client}
          data-ad-format="auto"
          data-ad-slot={slotId}
          data-full-width-responsive="true"
          style={{ display: "block", minHeight: 96 }}
        />
      </div>
    </aside>
  );
}
