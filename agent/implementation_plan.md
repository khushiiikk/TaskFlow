# Team Task Manager Implementation Plan

This plan outlines the architecture, features, and deployment steps for the Team Task Manager full-stack web application.

## Architecture
- **Frontend framework**: Next.js 14+ (App Router)
- **Styling**: Vanilla CSS (Modern, dynamic, glassmorphism, responsive)
- **Database ORM**: Prisma
- **Authentication**: Custom JWT / Cookie-based authentication
- **Deployment**: Railway via GitHub integration

## Features Breakdown

### 1. Database Schema
- **User**: `id`, `name`, `email`, `password` (hashed), `role` (ADMIN, MEMBER)
- **Project**: `id`, `name`, `description`, `createdAt`
- **Task**: `id`, `title`, `description`, `status` (TODO, IN_PROGRESS, DONE), `dueDate`, `projectId`, `assignedToId`

### 2. Authentication Flow
- `/register`: Users can sign up. First user automatically determines ADMIN role, others default to MEMBER.
- `/login`: Standard email/password login.
- Middleware protects routes based on authentication and role.

### 3. Application Pages
- **Dashboard (`/dashboard`)**: Overview of projects, tasks assigned to the current user, and overdue tasks.
- **Projects (`/projects`)**: List of all projects (Admins can create).
- **Tasks (`/tasks`)**: List of tasks, dropdown to update status. Admins can assign tasks to members.

### 4. UI/UX Design System
The app features a premium aesthetic.
- **Color Palette**: Dark mode by default, sleek glassmorphism panels, and vibrant accent colors.
- **Typography**: Google Fonts (Outfit) for clean readability.
- **Interactions**: Subtle hover micro-animations and smooth page transitions.
