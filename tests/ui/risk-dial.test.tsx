import React from "react";
import { render, screen } from "@testing-library/react";
import { RiskDial } from "@/components/dial/risk-dial";

describe("RiskDial", () => {
  it("renders the score, label, and confidence", () => {
    render(<RiskDial score={42.6} shortLabel="Serious Trouble" confidence={0.58} freshness="fresh" />);

    expect(screen.getByText("42.6")).toBeInTheDocument();
    expect(screen.getByText("Serious Trouble")).toBeInTheDocument();
    expect(screen.getByText("58% confidence")).toBeInTheDocument();
  });
});
