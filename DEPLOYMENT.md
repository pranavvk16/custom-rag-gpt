# Deployment Documentation

## Prerequisites
- Node.js 18+ installed locally.
- A Supabase project created.
- A Google Cloud project with Gemini API enabled.

## Local Deployment

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
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
