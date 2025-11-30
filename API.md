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
- **Success (200)**: Server-Sent Events (SSE) stream containing the generated text.
- **Error (500)**: JSON object with error details.

**Internal Logic**:
- Calculates `tier` (1 if deflected/answered, 3 if not).
- Calculates `severity` (Default: "Medium").
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
    "3": 5
  },
  "deflectionRate": "75.0",
  "totalTickets": 20
}
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
