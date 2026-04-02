import { verdictMessages } from "@/lib/verdicts/catalog";
import { selectVerdictMessage } from "@/lib/verdicts/select";

describe("verdict catalog", () => {
  it("contains 300 stored verdicts with 30 messages per band", () => {
    expect(verdictMessages).toHaveLength(300);

    for (let band = 0; band < 10; band += 1) {
      expect(verdictMessages.filter((message) => message.band === band)).toHaveLength(30);
    }
  });

  it("selects a verdict from the correct band pool", () => {
    const verdict = selectVerdictMessage({
      score: 18,
      scope: "global",
      scopeKey: "global",
      confidence: 0.8,
      salt: "test"
    });

    expect(verdict.band).toBe(1);
    expect(verdict.allowedScopes).toContain("global");
  });
});
