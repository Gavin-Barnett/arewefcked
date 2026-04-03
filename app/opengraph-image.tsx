import { ImageResponse } from "next/og";
import { ShareCard } from "@/lib/og/share-card";

export const alt = "Are we Fcked? share card with risk dial and question mark";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <ShareCard
      caption="Live risk dial"
      centerText="?"
      eyebrow="Live global severity index"
      footer="Questionable vibes, measurable inputs"
      subtitle="A live global severity index built from real-world events, risk signals, and current news."
      title="How bad is it?"
    />,
    size
  );
}
