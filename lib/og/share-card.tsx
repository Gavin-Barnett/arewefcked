type Point = { x: number; y: number };

type ShareCardProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: string;
  centerText: string;
  caption: string;
};

const dialBands = ["#2f6f4d", "#3e8657", "#5b9a4f", "#84a946", "#c89a34", "#de7d24", "#d95f23", "#c64922", "#a8351f", "#7e2319"] as const;

function polar(cx: number, cy: number, radius: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

function wedgePath(cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const outerStart = polar(cx, cy, outerRadius, startAngle);
  const outerEnd = polar(cx, cy, outerRadius, endAngle);
  const innerEnd = polar(cx, cy, innerRadius, endAngle);
  const innerStart = polar(cx, cy, innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z"
  ].join(" ");
}

function semicirclePath(cx: number, cy: number, radius: number) {
  const left = polar(cx, cy, radius, 180);
  const right = polar(cx, cy, radius, 360);

  return [`M ${left.x} ${left.y}`, `A ${radius} ${radius} 0 0 1 ${right.x} ${right.y}`, `L ${right.x} ${cy}`, `L ${left.x} ${cy}`, "Z"].join(" ");
}

function DialGraphic(props: { centerText: string; caption: string }) {
  const cx = 360;
  const cy = 320;
  const outerRadius = 250;
  const innerRadius = 152;
  const hubRadius = 118;
  const pointerAngle = 248;
  const pointerEnd = polar(cx, cy, outerRadius - 24, pointerAngle);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: 520,
        height: 360,
        alignItems: "flex-end",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(249,115,22,0.28), transparent 58%)"
        }}
      />
      <svg viewBox="0 0 720 392" width="520" height="284" style={{ display: "flex" }}>
        <path d={wedgePath(cx, cy, innerRadius - 10, outerRadius + 6, 180, 360)} fill="rgba(0,0,0,0.36)" />
        {dialBands.map((color, index) => (
          <path
            key={`${color}-${index}`}
            d={wedgePath(cx, cy, innerRadius, outerRadius, 180 + index * 18 + 0.8, 180 + (index + 1) * 18 - 0.8)}
            fill={color}
            stroke="rgba(10,10,12,0.82)"
            strokeWidth={3}
          />
        ))}
        <path d={semicirclePath(cx, cy, hubRadius)} fill="url(#share-hub)" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
        <defs>
          <linearGradient id="share-hub" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3f1e10" />
            <stop offset="100%" stopColor="#150b09" />
          </linearGradient>
          <linearGradient id="share-pointer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff1d2" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        <line x1={cx} y1={cy} x2={pointerEnd.x} y2={pointerEnd.y} stroke="url(#share-pointer)" strokeWidth={16} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={18} fill="#09090b" stroke="rgba(255,255,255,0.32)" strokeWidth={4} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 164,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 126,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: -6,
            color: "#fff4df",
            textShadow: "0 12px 40px rgba(0,0,0,0.48)"
          }}
        >
          {props.centerText}
        </div>
        <div
          style={{
            display: "flex",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(10,10,12,0.38)",
            padding: "10px 18px",
            fontSize: 17,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(245,240,232,0.82)"
          }}
        >
          {props.caption}
        </div>
      </div>
    </div>
  );
}

function TextBlock(props: { title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, maxWidth: 560 }}>
      <div
        style={{
          display: "flex",
          fontSize: 104,
          lineHeight: 0.92,
          fontWeight: 800,
          letterSpacing: -5,
          color: "#f5f0e8"
        }}
      >
        {props.title}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 31,
          lineHeight: 1.28,
          color: "rgba(245,240,232,0.76)"
        }}
      >
        {props.subtitle}
      </div>
    </div>
  );
}

export function ShareCard(props: ShareCardProps) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "radial-gradient(circle at 14% 16%, rgba(101,163,13,0.16), transparent 22%), radial-gradient(circle at 78% 16%, rgba(249,115,22,0.28), transparent 20%), linear-gradient(180deg, #2b180f 0%, #120d0b 52%, #070708 100%)",
        color: "#f5f0e8",
        padding: "54px 60px",
        fontFamily: "Arial"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Are we Fcked?</div>
        <div
          style={{
            display: "flex",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "10px 16px",
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#f7c45e"
          }}
        >
          {props.eyebrow}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <TextBlock title={props.title} subtitle={props.subtitle} />
        <DialGraphic centerText={props.centerText} caption={props.caption} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "rgba(245,240,232,0.72)"
          }}
        >
          <div style={{ display: "flex", width: 16, height: 16, borderRadius: 999, background: "#f97316" }} />
          {props.footer}
        </div>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "rgba(245,240,232,0.62)" }}>arewefcked.com</div>
      </div>
    </div>
  );
}