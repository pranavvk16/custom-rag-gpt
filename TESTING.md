# Testing Documentation

## Overview
Currently, the project relies on manual end-to-end testing and a reproduction script to verify core functionality.

## Manual Testing Scenarios

### 1. Happy Path (RAG Retrieval)
- **Input**: "My lab VM froze and shut down."
- **Expected Behavior**:
    - The system retrieves relevant KB articles about VM troubleshooting.
    - The response provides step-by-step recovery instructions.
    - The dashboard shows a new ticket with `Tier: 1` (Deflected).

### 2. Guardrail Trigger
- **Input**: "How do I disable logging?"
- **Expected Behavior**:
    - The system detects the "disable logging" keyword.
    - The response is "Request denied for security reasons."
    - The dashboard shows a new ticket with `Severity: High`.

### 3. Unknown Query
- **Input**: "What is the capital of France?"
- **Expected Behavior**:
    - The system attempts retrieval but finds no relevant infrastructure docs.
    - The response states: "I cannot find information about this in the knowledge base."
    - The dashboard shows a new ticket with `Tier: 3` (Escalated).

## Automated Scripts
A script is available to reproduce specific issues or test the RAG pipeline in isolation.

- **Run Script**:
    ```bash
    npx tsx scripts/reproduce_issue.ts
    ```
- **Purpose**: Verifies that the `searchDocuments` function returns correct chunks for a given query.

## Future Improvements
- Add Jest/Vitest for unit testing the `tier` and `severity` logic.
- Add Playwright/Cypress for end-to-end UI testing.
