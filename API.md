# API Documentation

## Base URL
Local: `http://localhost:3000`
Production: `[Your Production URL]`

## Endpoints

### 1. Chat Completion
**Endpoint**: `POST /api/chat`

**Description**: Handles the main chat interaction. Receives a user message, performs retrieval, and streams back an AI response.

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "My VM is not starting."
    }
  ]
}
```

**Response**:
- **Success (200)**: JSON object containing the answer and metadata.
- **Error (500)**: JSON object with error details.

**Response Schema**:
```json
{
  "answer": "Here are the steps...",
  "kbReferences": [
    { "id": "kb-1", "title": "Troubleshooting", "similarity": 0.85 }
  ],
  "confidence": 0.95,
  "tier": "TIER_1",
  "severity": "MEDIUM",
  "needsEscalation": false,
  "guardrail": {
    "blocked": false,
    "reason": null
  }
}
```

**Internal Logic**:
- Checks **Guardrails** (keywords/patterns).
- Performs **RAG Retrieval** from Supabase.
- Generates answer via **Gemini 1.5 Flash**.
- Calculates `tier` and `severity` based on content.
- Logs ticket to Supabase.

---

### 2. Metrics Summary
**Endpoint**: `GET /api/metrics`

**Description**: Retrieves summary analytics for the dashboard.

**Response Body**:
```json
{
  "tierCounts": {
    "1": 15,
    "2": 5
  },
  "deflectionRate": "75.0",
  "totalTickets": 20
}
```

### 3. Tickets List
**Endpoint**: `GET /api/tickets`

**Description**: Retrieves a list of recent tickets.

**Response Body**:
```json
[
  {
    "id": 1,
    "session_id": "...",
    "user_query": "...",
    "tier": 1,
    "severity": "MEDIUM",
    "created_at": "..."
  }
]
```

### 4. Metrics Trends
**Endpoint**: `GET /api/metrics/trends`

**Description**: Retrieves daily trend data for tickets, tiers, and severity.

**Response Body**:
```json
[
  {
    "date": "2023-10-27",
    "total": 10,
    "tier1": 8,
    "tier2": 2,
    "highSeverity": 0,
    "blocked": 0
  }
]
```

## Error Patterns

- **500 Internal Server Error**: Returned when the LLM fails to generate a response, Supabase is unreachable, or an unhandled exception occurs.
- **Guardrail Block**: If a dangerous keyword is detected, the API returns a standard 200 OK stream but with a refusal message: "Request denied for security reasons."

## Database Schema (Supabase)

### `documents` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary Key |
| `content` | text | The text content of the KB chunk |
| `metadata` | jsonb | Title, source, etc. |
| `embedding` | vector(768) | Vector embedding of the content |

### `tickets` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary Key |
| `session_id` | uuid | Unique session identifier |
| `user_query` | text | The user's input |
| `ai_response` | text | The model's output |
| `tier` | integer | 1 (Deflected) or 3 (Escalated) |
| `severity` | text | "Low", "Medium", "High" |
| `deflected` | boolean | Whether the AI answered successfully |
| `created_at` | timestamp | Creation time |
