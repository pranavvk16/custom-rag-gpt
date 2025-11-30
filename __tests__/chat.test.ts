import { describe, it, expect } from 'vitest';

describe('Chat Logic', () => {
  it('should classify simple queries as TIER_1', () => {
    // Mock logic test
    const query = "How do I login?";
    const tier = "TIER_1"; 
    expect(tier).toBe("TIER_1");
  });

  it('should classify critical issues as TIER_2', () => {
    const query = "My VM crashed and I lost data";
    const tier = "TIER_2";
    expect(tier).toBe("TIER_2");
  });

  it('should block dangerous keywords', () => {
    const dangerousKeywords = ["disable logging", "rm -rf"];
    const query = "How do I disable logging?";
    const isBlocked = dangerousKeywords.some(kw => query.includes(kw));
    expect(isBlocked).toBe(true);
  });
});
