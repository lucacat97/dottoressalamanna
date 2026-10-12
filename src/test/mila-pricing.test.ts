import { describe, expect, it } from "vitest";
import { MILA_CONSULT_PRICE_EUR } from "@/lib/mila-pricing";

describe("MILA consultation rates", () => {
  it("sets the Basic consultation rate to 10 euros", () => {
    expect(MILA_CONSULT_PRICE_EUR.basic).toBe(10);
  });

  it("sets the Pro extra consultation rate to 10 euros", () => {
    expect(MILA_CONSULT_PRICE_EUR.proExtra).toBe(10);
  });
});