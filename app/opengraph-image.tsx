import { ImageResponse } from "next/og";
import { ShareCard } from "@/lib/og/share-card";

export const alt = "Are we Fcked? share card with risk dial and question mark";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <ShareCard
      eyebrow="Live global severity index"
      title="How bad is it?"
      subtitle="A live global severity index built from real-world events, risk signals, and current news."
      footer="Questionable vibes, measurable inputs"
      centerText="?"
      caption="Live risk dial"
    />,
    size
  );
}