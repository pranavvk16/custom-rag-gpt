export interface TicketMetadata {
  tier: "TIER_1" | "TIER_2";
  severity: "LOW" | "MEDIUM" | "HIGH";
  needsEscalation: boolean;
}

export function calculateTicketMetadata(
  query: string,
  docsFound: boolean,
  isBlocked: boolean
): TicketMetadata {
  const lowerQuery = query.toLowerCase();

  // 1. Blocked / Security Issues
  if (isBlocked) {
    return {
      tier: "TIER_1", // Blocked at L1
      severity: "HIGH",
      needsEscalation: true, // Flag for review
    };
  }

  // 2. Critical Infrastructure Keywords
  const criticalKeywords = [
    "kernel panic",
    "system crash",
    "data loss",
    "production down",
    "security breach"
  ];
  
  if (criticalKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      tier: "TIER_2",
      severity: "HIGH",
      needsEscalation: true
    };
  }

  // 3. Standard RAG Deflection
  if (docsFound) {
    return {
      tier: "TIER_1",
      severity: "MEDIUM",
      needsEscalation: false
    };
  }

  // 4. Fallback / Unknown
  return {
    tier: "TIER_2",
    severity: "MEDIUM",
    needsEscalation: true
  };
}
