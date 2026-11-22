import { describe, expect, it } from "vitest";
import { DEFAULT_SECRET_PHRASE, matchesSecretPhrase } from "./sos";

describe("Silent SOS secret phrase", () => {
  it("defaults to \"It's really cold today\"", () => {
    expect(DEFAULT_SECRET_PHRASE).toBe("It's really cold today");
  });

  it("triggers when the phrase is spoken inside a sentence, ignoring case and punctuation", () => {
    expect(matchesSecretPhrase("hey so its REALLY cold today, right?", DEFAULT_SECRET_PHRASE)).toBe(true);
  });

  it("does not trigger on only part of the phrase", () => {
    expect(matchesSecretPhrase("it's really cold", DEFAULT_SECRET_PHRASE)).toBe(false);
  });

  it("does not trigger on an empty phrase", () => {
    expect(matchesSecretPhrase("anything", "  ")).toBe(false);
  });
});
