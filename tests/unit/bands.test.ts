import { bandLabelOptions, getBand, normalizeScore, pickShortLabel } from "@/lib/scoring/bands";

describe("band helpers", () => {
  it("maps score boundaries to the expected bands", () => {
    expect(getBand(0)).toBe(0);
    expect(getBand(9.9)).toBe(0);
    expect(getBand(10)).toBe(1);
    expect(getBand(57)).toBe(5);
    expect(getBand(100)).toBe(9);
  });

  it("clamps scores before band selection", () => {
    expect(normalizeScore(-8)).toBe(0);
    expect(normalizeScore(188)).toBe(100);
  });

  it("provides ten label options per band", () => {
    for (const labels of Object.values(bandLabelOptions)) {
      expect(labels).toHaveLength(10);
    }
  });

  it("keeps every short label headline-safe", () => {
    for (const labels of Object.values(bandLabelOptions)) {
      for (const label of labels) {
        expect(label.toLowerCase()).toContain("fucked");
      }
    }
  });

  it("picks deterministic short labels", () => {
    expect(pickShortLabel(3, "global")).toBe(pickShortLabel(3, "global"));
  });
});
