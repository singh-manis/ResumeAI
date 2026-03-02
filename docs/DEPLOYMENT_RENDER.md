# 🚀 Deploying to Render_com

This guide provides step-by-step instructions for deploying your **AI-Powered Resume Analyzer** to [Render](https://render.com), a unified cloud platform.

## 1. Create a Render Account
Go to [Render.com](https://render.com) and create an account if you haven't already.

## 2. Connect to GitHub
Connect your GitHub account to Render to automatically deploy changes when you push code.

---

## 🏗️ 3. Deploy Database (PostgreSQL)

Since Render offers managed PostgreSQL, this is the easiest option.

1.  Click **New +** > **PostgreSQL**.
2.  **Name:** `resume-analyzer-db`
3.  **Database:** `resume_analyzer`
4.  **User:** `render`
5.  **Region:** Choose closest to you (e.g., Singapore).
6.  **Plan:** Free (or Starter).
7.  Click **Create Database**.
8.  **Wait** for creation.
9.  Copy the **Internal Database URL** (starts with `postgres://...`). You'll need this for the backend.

---

## ⚙️ 4. Deploy Backend (Web Service)

1.  Click **New +** > **Web Service**.
2.  Select your GitHub repository (`resume-analyzer`).
3.  **Name:** `resume-analyzer-api`
4.  **Region:** Same as database.
5.  **Branch:** `main`
6.  **Root Directory:** `backend` (⚠️ Important!)
7.  **Runtime:** **Node**
8.  **Build Command:** `npm install && npx prisma generate`
9.  **Start Command:** `npm start`
10. **Environment Variables:**
    *   `DATABASE_URL`: Paste the **Internal Database URL** from Step 3.
    *   `JWT_SECRET`: Random string.
    *   `JWT_REFRESH_SECRET`: Random string.
    *   `GEMINI_API_KEY`: Your API key.
    *   `FRONTEND_URL`: URL of your frontend (e.g. `https://resume-analyzer-frontend.onrender.com`). Use `http://localhost:5173` temporarily if unknown.
    *   `NODE_ENV`: `production`

11. Click **Create Web Service**.
12. Wait for deployment. Copy the **Service URL**.

---

## 🎨 5. Deploy Frontend (Static Site)

1.  Click **New +** > **Static Site**.
2.  Select the same repository.
3.  **Name:** `resume-analyzer-frontend`
4.  **Branch:** `main`
5.  **Root Directory:** `frontend` (⚠️ Important!)
6.  **Build Command:** `npm install && npm run build`
7.  **Publish Directory:** `dist`
8.  **Environment Variables:**
    *   `VITE_API_URL`: Paste the **Backend Service URL** from Step 4.
9.  Click **Create Static Site**.

### ⚠️ crucial Step for React Router (Rewrite Rule)
1.  Go to the new Frontend Site settings > **Redirects/Rewrites**.
2.  Add Rule:
    *   **Source:** `/*`
    *   **Destination:** `/index.html`
    *   **Action:** `Rewrite`
3.  Save.

---

## 🔄 6. Final Config

1.  Go back to **Backend Service** settings.
2.  Update `FRONTEND_URL` to the actual frontend URL.
3.  **Redeploy** the backend (Manual Deploy > Clear cache & deploy).

---

## ✅ Verification
1.  Open your frontend URL.
2.  Try registering a user.
3.  If successful, full stack deployment is complete!
