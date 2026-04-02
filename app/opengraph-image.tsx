import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, #2a140c 0%, #120d0b 52%, #080808 100%)",
          color: "#f5f0e8",
          padding: "56px 64px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 24, letterSpacing: 8, textTransform: "uppercase" }}>Are we Fcked?</div>
          <div style={{ fontSize: 18, letterSpacing: 4, textTransform: "uppercase", color: "#f7c45e" }}>Live global severity index</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 860 }}>
          <div style={{ fontSize: 112, lineHeight: 0.92, fontWeight: 700, letterSpacing: -5 }}>A live global severity index.</div>
          <div style={{ fontSize: 34, lineHeight: 1.25, color: "rgba(245,240,232,0.74)" }}>
            Real-world events, risk signals, and current news without pretending the situation is simpler than it is.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, color: "#f7c45e" }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, background: "#f97316" }} />
            arewefcked.com
          </div>
          <div style={{ fontSize: 28, color: "rgba(245,240,232,0.76)" }}>Global and country score sharing</div>
        </div>
      </div>
    ),
    size
  );
}
