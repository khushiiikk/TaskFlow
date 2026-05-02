# Step-by-Step Guide: How to Deploy and Setup Team Task Manager

Follow these exact steps to connect your database and deploy the project to Railway so it is fully functional for your submission.

## Step 1: Push Your Code to GitHub (Required for Railway)
Railway connects directly to your GitHub repository to deploy your code automatically.
1. Open your terminal in this folder (`Assignment Team Task Manager`).
2. Run these commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Team Task Manager"
   ```
3. Go to GitHub, create a **New Repository**.
4. Copy the remote URL and run:
   ```bash
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

## Step 2: Create a Database on Railway
You need a PostgreSQL database to store users, projects, and tasks.
1. Go to [Railway.app](https://railway.app/) and log in.
2. Click **New Project** in your dashboard.
3. Select **Provision PostgreSQL**.
4. Wait a few seconds for it to provision. Click on the new **PostgreSQL** block in your Railway project canvas.
5. Go to the **Connect** tab.
6. Look for the **Postgres Connection URL** (it should look something like `postgresql://postgres:password@host:port/railway`). Copy this URL.

## Step 3: Test and Push Database Schema Locally
Before deploying, let's configure your local project.
1. In this project folder, open the `.env` file (or create one if it doesn't exist).
2. Add your database URL and a secret key:
   ```env
   DATABASE_URL="<paste-your-railway-url-here>"
   JWT_SECRET="my-super-secret-key-123"
   ```
3. Now, push the tables to the database by running:
   ```bash
   npx prisma db push
   ```
   *If successful, Prisma will create the User, Project, and Task tables in your Railway database.*

## Step 4: Deploy the App on Railway
1. Go back to your Railway project (where you created the database).
2. Click the **+ New** button (or "Create" button) on the canvas.
3. Select **GitHub Repo** and choose the repository you created in Step 1.
4. Click **Deploy Now**. Railway will automatically detect it's a Next.js app and start building.

## Step 5: Add Environment Variables in Railway
For the live app to work, you must tell Railway your secret keys.
1. Click on your newly deployed Next.js app block in the Railway canvas.
2. Go to the **Variables** tab.
3. Add a New Variable:
   - Variable Name: `DATABASE_URL`
   - Value: `<paste-your-railway-url-here>` (You can also type `${{Postgres.DATABASE_URL}}` to link it automatically).
4. Add another Variable:
   - Variable Name: `JWT_SECRET`
   - Value: `my-super-secret-key-123`
5. Railway will automatically redeploy the app with these variables. 

## Step 6: Test Your Live App
1. Once deployment is finished, go to the **Settings** tab of your Next.js app block on Railway.
2. Click **Generate Domain** under the Public Networking section.
3. Click the generated URL!
4. **Register the first user**: Go to `/register`. The first account you create will automatically be granted the **ADMIN** role.
5. Your application is live and ready for submission!
