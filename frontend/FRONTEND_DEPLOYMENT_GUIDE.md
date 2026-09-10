# Frontend Deployment Guide (Vercel & Netlify)

This frontend is a Next.js application built to work with your live Render backend at `https://budgetflowbackend.onrender.com/api/`.

---

## Option A: Deploying on Vercel (Recommended - Zero Config)

1. Go to [vercel.com](https://vercel.com/) and log in (e.g. with GitHub).
2. Click **Add New...** -> **Project**.
3. Import your repository: `Chandu-challa/BudgetFlow` (or your frontend repo).
4. Configure the project:
   - **Framework Preset**: `Next.js` (detected automatically)
   - **Root Directory**:
     - If your repository has both `backend` and `frontend`, click **Edit** next to Root Directory and choose **`frontend`**.
     - If your repository contains only frontend code at the root, leave it as default (`./`).
   - **Build and Output Settings**: Leave defaults (`npm run build`).
5. **Environment Variables**:
   Add the following variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://budgetflowbackend.onrender.com/api/`
6. Click **Deploy**.

---

## Option B: Deploying on Netlify

1. Go to [netlify.com](https://netlify.com/) and log in.
2. Click **Add new site** -> **Import an existing project**.
3. Connect your GitHub repository.
4. Configure site settings:
   - **Base directory**: `frontend` (if inside a monorepo, otherwise leave blank).
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. **Environment Variables**:
   Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://budgetflowbackend.onrender.com/api/`
6. Click **Deploy site**.

---

## Testing After Deployment

1. Visit your deployed Vercel or Netlify URL (e.g., `https://budgetflow.vercel.app`).
2. Register a new user or log in with existing credentials.
3. Test creating an income/expense, viewing budgets, and downloading PDF/Excel reports.
