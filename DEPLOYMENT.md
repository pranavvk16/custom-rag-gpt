# Deployment Documentation

## Prerequisites
- Docker installed locally.
- A Supabase project created.
- A Google Cloud project with Gemini API enabled.

## Environment Variables
Create a `.env` file (or configure in your deployment platform) with the following:

```env
# Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Local Deployment (Docker)

1.  **Build the Image**:
    ```bash
    docker build -t ai-helpdesk .
    ```

2.  **Run the Container**:
    ```bash
    docker run -p 3000:3000 --env-file .env ai-helpdesk
    ```

3.  **Access**: Open `http://localhost:3000` in your browser.

## Cloud Deployment (Example: Vercel)

1.  Push the repository to GitHub.
2.  Import the project in Vercel.
3.  Add the environment variables in the Vercel dashboard.
4.  Deploy. Vercel will automatically detect the Next.js framework and build it.

## Cloud Deployment (Example: Cloud Run)

1.  **Build & Push**:
    ```bash
    gcloud builds submit --tag gcr.io/PROJECT-ID/ai-helpdesk
    ```

2.  **Deploy**:
    ```bash
    gcloud run deploy ai-helpdesk \
      --image gcr.io/PROJECT-ID/ai-helpdesk \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars GOOGLE_GENERATIVE_AI_API_KEY=...,NEXT_PUBLIC_SUPABASE_URL=...
    ```
