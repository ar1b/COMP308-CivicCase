# CivicCase — Codebase Reference

A full-stack municipal issue-tracking web application. Residents report community problems; staff triage and resolve them. AI auto-categorizes submissions, sends urgent alerts, powers trend analysis, and drives an intelligent chatbot.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Repository Structure](#2-repository-structure)
3. [Frontend — Shell Application](#3-frontend--shell-application)
4. [Frontend — Micro-Frontend Modules](#4-frontend--micro-frontend-modules)
5. [Backend — Microservices](#5-backend--microservices)
6. [Database Models](#6-database-models)
7. [AI & Agent Services](#7-ai--agent-services)
8. [GraphQL API Reference](#8-graphql-api-reference)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Data Flows](#10-data-flows)
11. [Environment Configuration](#11-environment-configuration)
12. [Running the Project](#12-running-the-project)
13. [Tech Stack](#13-tech-stack)

---

## 1. Architecture Overview

```
Browser (React 19 + Vite)
  └── Shell App (port 5173)
        ├── Apollo routing link → Auth Service    (port 4001)
        ├── Apollo routing link → Issue Service   (port 4002)
        └── Apollo routing link → Analytics Svc  (port 4003)

Three standalone Express + Apollo GraphQL servers
  ├── Auth Service     (4001) — register, login, me
  ├── Issue Service    (4002) — CRUD for issues + notifications
  └── Analytics Svc   (4003) — analytics, AI trends, chatbot

Shared infrastructure
  ├── MongoDB Atlas (cloud) — Users, Issues, Notifications
  └── Google Gemini 2.0 Flash — categorization, trend analysis, LangGraph agent
```

**Apollo routing** — a single client uses a custom `ApolloLink` to read the GraphQL operation name and forward the request to the correct backend port. No API gateway is needed.

**Micro-frontends** — three MFE bundles exist in `client/auth-mfe/`, `client/issues-mfe/`, and `client/analytics-mfe/`, each built with `@originjs/vite-plugin-federation`. The shell currently imports these pages as local modules due to a known CSS bug in the federation plugin, but the MFE directories serve as an architectural demonstration.

---

## 2. Repository Structure

```
CivicCaseCOMP308Project/
├── client/                     # React frontend
│   ├── src/                    # Shell application source
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── apolloClient.js
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   └── NotificationBell.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── SubmitIssue.jsx
│   │       ├── StaffDashboard.jsx
│   │       └── Analytics.jsx
│   ├── auth-mfe/               # Auth micro-frontend (Login, Register)
│   ├── issues-mfe/             # Issues micro-frontend (Dashboard, SubmitIssue, NotificationBell)
│   ├── analytics-mfe/          # Analytics micro-frontend (Analytics, StaffDashboard, Chatbot)
│   ├── vite.config.js
│   ├── package.json
│   └── patch-remote.js         # Post-build patch for federation CSS bug
├── server/
│   ├── auth-service/           # Standalone auth server (port 4001)
│   │   ├── index.js
│   │   ├── typeDefs.js
│   │   └── resolvers.js
│   ├── issue-service/          # Standalone issue server (port 4002)
│   │   ├── index.js
│   │   ├── typeDefs.js
│   │   └── resolvers.js
│   ├── analytics-service/      # Standalone analytics server (port 4003)
│   │   ├── index.js
│   │   ├── typeDefs.js
│   │   └── resolvers.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Issue.js
│   │   └── Notification.js
│   ├── services/
│   │   ├── aiService.js        # Gemini categorization + trend analysis
│   │   └── agentService.js     # LangGraph ReAct agent for chatbot
│   ├── resolvers/
│   │   └── index.js            # Combined resolvers for main server
│   ├── typeDefs/
│   │   └── index.js            # Combined schema for main server
│   ├── index.js                # Main server entry (port 4000, aggregated)
│   └── package.json
└── CODEBASE.md                 # This file
```

---

## 3. Frontend — Shell Application

### `client/src/main.jsx`

Entry point. Wraps the app in `<ApolloProvider>` (with the routing client) and `<BrowserRouter>`.

### `client/src/App.jsx`

Root component. Reads `token` and `role` from `localStorage` on each render to determine auth state. Defines all routes:

| Path | Component | Guard |
|------|-----------|-------|
| `/` | `Dashboard` | requires token |
| `/login` | `Login` | public |
| `/register` | `Register` | public |
| `/submit` | `SubmitIssue` | requires token |
| `/staff` | `StaffDashboard` | requires token + role === 'staff' |
| `/analytics` | `Analytics` | requires token + role === 'staff' |

Renders `<Chatbot />` globally at the bottom of the page whenever a token exists.

### `client/src/apolloClient.js`

Builds the Apollo Client with a two-link chain:

1. **`authLink`** — reads the JWT from `localStorage` and sets the `Authorization: Bearer <token>` header on every request.
2. **`routingLink`** — inspects `operation.operationName` and sets the target `uri`:
   - `Login`, `Register`, `Me` → `http://localhost:4001/graphql`
   - `GetAnalytics`, `GetAITrendAnalysis`, `Chat` → `http://localhost:4003/graphql`
   - Everything else → `http://localhost:4002/graphql`

### `client/src/index.css`

Imports Tailwind CSS v4 via `@import "tailwindcss"`. No config file needed (v4 auto-detection).

---

### Components

#### `client/src/components/Navbar.jsx`

Top navigation bar with role-aware rendering:

- **All authenticated users**: My Issues, Report Issue, notification bell, username, Logout
- **Staff only**: Analytics link, Staff Panel link (yellow, bold)
- **Unauthenticated**: Login, Register

Logout clears all `localStorage` and reloads the page.

#### `client/src/components/NotificationBell.jsx`

Bell icon in the navbar with an unread badge count.

- Polls `getUnreadCount` every 30 seconds
- Dropdown fetches `getMyNotifications` on open
- Icon by type: 📋 status update, 🚨 urgent alert, 🔔 general
- Each notification: click marks it read; "Mark all read" button at top
- Click-outside handler closes the dropdown

#### `client/src/components/Chatbot.jsx`

Fixed-position chat widget in the bottom-right corner.

- Opens as a 480 px tall panel when the 💬 bubble is clicked
- First-open shows four quick-suggestion buttons
- User messages and bot replies displayed in bubbles (blue = user, grey = bot)
- Animated three-dot typing indicator while loading
- Sends `query Chat($message)` → `chatWithAI` → routed to Analytics Service (port 4003)
- Uses `fetchPolicy: 'no-cache'` to always get a fresh AI response
- Network errors are caught and shown as a friendly error message in the chat

---

### Pages

#### `client/src/pages/Login.jsx`

Simple email + password form. Executes the `Login` mutation (routed to port 4001). On success: stores `token`, `role`, and `username` in `localStorage`, then navigates to `/`.

#### `client/src/pages/Register.jsx`

Username, email, password, and a role selector (Resident / Staff). Executes the `Register` mutation. Same token storage and redirect as Login.

#### `client/src/pages/Dashboard.jsx`

Resident's personal issue list.

- Queries `GetMyIssues` → `getMyIssues` (returns only the logged-in user's submissions)
- Each issue card: title, location, category badge, date, status badge (color-coded), urgent flag
- Status colours: `open` = red, `in_progress` = yellow, `resolved` = green
- Urgent issues get a red left border; others get a blue border
- Empty state shown when no issues exist
- "+ Report Issue" link in the header

#### `client/src/pages/SubmitIssue.jsx`

Issue submission form: title, description, location, image URL. Executes `submitIssue` mutation. On success displays a modal showing the AI-assigned category and whether the issue was marked urgent.

#### `client/src/pages/StaffDashboard.jsx`

Staff-only full issue list.

- Queries `GetIssuesStaff` → `getIssues` (all issues, optionally filtered)
- Filter buttons: All / Open / In Progress / Resolved
- Each card has an inline status dropdown (`updateIssueStatus`) and a Delete button (`deleteIssue`)
- Reporter name and assignment shown

#### `client/src/pages/Analytics.jsx`

Staff-only analytics view.

- Queries `GetAnalytics` → `getAnalytics` for KPI cards (total, open, in-progress, resolved)
- Resolution rate shown as a progress bar
- Category breakdown listed below
- "🤖 AI Trend Analysis" button lazy-loads `GetAITrendAnalysis` → `getAITrendAnalysis` on first click
- AI insight displayed in a styled blockquote panel

---

### Build Config

#### `client/vite.config.js`

Standard Vite + React config. Uses `@tailwindcss/vite` plugin for Tailwind v4. The `@originjs/vite-plugin-federation` dependency is installed but federation is **not enabled in this config** due to a persistent CSS loading bug. MFE exports remain available for demonstration/future use.

#### `client/patch-remote.js`

Post-build Node script that patches the federation plugin's generated `remoteEntry.js` to work around a CSS `forEach` error. Run after `npm run build` on each MFE if federation is re-enabled.

---

## 4. Frontend — Micro-Frontend Modules

Each MFE lives in its own directory with its own `vite.config.js`, `package.json`, and `apolloClient.js` pointing to the relevant backend service.

### `client/auth-mfe/`

- **Exposes**: `./Login`, `./Register`
- **Apollo target**: `http://localhost:4001/graphql`
- **Dev port**: 5174

### `client/issues-mfe/`

- **Exposes**: `./Dashboard`, `./SubmitIssue`, `./NotificationBell`
- **Apollo target**: `http://localhost:4002/graphql`
- **Dev port**: 5175
- Note: This MFE's `Dashboard` shows all issues (for potential staff use); the shell's `Dashboard` uses `getMyIssues` for residents.

### `client/analytics-mfe/`

- **Exposes**: `./Analytics`, `./StaffDashboard`, `./Chatbot`
- **Apollo target**: `http://localhost:4003/graphql`
- **Dev port**: 5176

---

## 5. Backend — Microservices

### Auth Service — `server/auth-service/` (port 4001)

Self-contained Express + Apollo server.

**GraphQL Schema:**

```graphql
type User { id, username, email, role, createdAt }
type AuthPayload { token: String!, user: User! }
type Query { me: User }
type Mutation {
  register(username, email, password, role): AuthPayload!
  login(email, password): AuthPayload!
}
```

**Resolvers:**

- `me` — returns the authenticated user from context, or throws `Not authenticated`
- `register` — checks for duplicate email, bcrypt-hashes password (cost 10), creates User document, signs a 7-day JWT, returns `{ token, user }`
- `login` — finds user by email, compares bcrypt hash, signs JWT, returns `{ token, user }`

**Middleware:** JWT auth applied so `me` can read from context.

---

### Issue Service — `server/issue-service/` (port 4002)

Handles all issue and notification logic.

**GraphQL Schema:**

```graphql
type Issue { id, title, description, category, status, location, imageUrl, urgent, reportedBy, assignedTo, createdAt, updatedAt }
type Notification { id, message, type, issueId, read, createdAt }
type Query {
  getIssues(status: String): [Issue!]!
  getMyIssues: [Issue!]!
  getIssue(id: ID!): Issue
  getMyNotifications: [Notification!]!
  getUnreadCount: Int!
}
type Mutation {
  submitIssue(title, description, location, imageUrl): Issue!
  updateIssueStatus(id, status, assignedTo): Issue!
  deleteIssue(id): Boolean!
  markNotificationRead(id): Boolean!
  markAllNotificationsRead: Boolean!
}
```

**Resolvers:**

- `getIssues` — returns all issues, optionally filtered by `status`; populates `reportedBy` and `assignedTo`
- `getMyIssues` — returns only issues where `reportedBy === context.user.id` (requires auth)
- `getIssue` — returns a single issue by ID with populated fields
- `getMyNotifications` — returns the authenticated user's 25 most recent notifications
- `getUnreadCount` — returns count of unread notifications for the authenticated user
- `submitIssue` — creates an issue; calls `categorizeIssue()` (AI) to assign category; sets `urgent = true` if category is `Safety Hazard` or `Flooding`; if urgent, creates `urgent_alert` notifications for every staff user in the database
- `updateIssueStatus` — staff-only; updates status and optional `assignedTo`; creates a `status_update` notification for the issue reporter
- `deleteIssue` — staff-only; deletes the issue and all its associated notifications
- `markNotificationRead` — sets `read: true` on a single notification (must belong to the authenticated user)
- `markAllNotificationsRead` — bulk-marks all unread notifications for the authenticated user

---

### Analytics Service — `server/analytics-service/` (port 4003)

No authentication required. Reads Issue data and calls AI services.

**GraphQL Schema:**

```graphql
type Analytics { totalIssues, openIssues, inProgressIssues, resolvedIssues, categoryBreakdown: [CategoryCount!]! }
type CategoryCount { category: String!, count: Int! }
type Query {
  getAnalytics: Analytics!
  getAITrendAnalysis: String!
  chatWithAI(message: String!): String!
}
```

**Resolvers:**

- `getAnalytics` — scans all Issue documents; counts by status; builds a `categoryBreakdown` frequency map; returns the `Analytics` object
- `getAITrendAnalysis` — delegates to `aiService.getAITrendAnalysis()`
- `chatWithAI` — delegates to `agentService.chatWithAgent(message)`

---

### Main Server — `server/index.js` (port 4000)

Aggregates all three services into a single Apollo schema (used for development convenience or presentation). Imports combined `typeDefs` and `resolvers` from `server/typeDefs/index.js` and `server/resolvers/index.js`. Applies JWT auth middleware. Connects to MongoDB.

---

### Middleware — `server/middleware/auth.js`

Exported function used by each service's Apollo `context` callback:

1. Reads `Authorization` header
2. Strips `Bearer ` prefix
3. Calls `jwt.verify(token, process.env.JWT_SECRET)`
4. Returns `{ user: { id, role } }` on success, or `{ user: null }` on failure (expired, invalid, missing)

---

## 6. Database Models

### `server/models/User.js`

| Field | Type | Notes |
|-------|------|-------|
| `username` | String | required, unique, trimmed |
| `email` | String | required, unique, lowercase |
| `password` | String | bcrypt hash, never returned to client |
| `role` | String | enum: `resident` \| `staff`; default `resident` |
| `createdAt` | Date | auto (timestamps) |
| `updatedAt` | Date | auto (timestamps) |

### `server/models/Issue.js`

| Field | Type | Notes |
|-------|------|-------|
| `title` | String | required |
| `description` | String | required |
| `category` | String | AI-assigned; one of: Pothole, Streetlight, Flooding, Safety Hazard, Vandalism, Garbage, Other |
| `status` | String | enum: `open` \| `in_progress` \| `resolved`; default `open` |
| `location` | String | optional free-text |
| `imageUrl` | String | optional URL |
| `urgent` | Boolean | true if category is Safety Hazard or Flooding |
| `reportedBy` | ObjectId | ref: User |
| `assignedTo` | ObjectId | ref: User (optional) |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

### `server/models/Notification.js`

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref: User; required |
| `message` | String | required |
| `type` | String | enum: `status_update` \| `urgent_alert` \| `general`; default `general` |
| `issueId` | ObjectId | ref: Issue; optional |
| `read` | Boolean | default `false` |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

---

## 7. AI & Agent Services

### `server/services/aiService.js`

Uses `@google/generative-ai` SDK directly with the `gemini-2.0-flash` model.

#### `categorizeIssue(title, description)`

Sends a prompt asking Gemini to classify the issue into exactly one of seven categories: **Pothole, Streetlight, Flooding, Safety Hazard, Vandalism, Garbage, Other**. Returns the category string. Falls back to `"Other"` if the API call fails.

#### `getAITrendAnalysis()`

1. Fetches all Issue documents from MongoDB
2. Computes: total count, counts per status, resolution rate (%), urgent unresolved, issues created in the last 7 days, and a sorted category frequency map
3. Sends all this data to Gemini with a prompt requesting 3–4 plain-text insights (no markdown)
4. Returns the analysis string. Falls back to a generic unavailability message on error.

---

### `server/services/agentService.js`

Builds a **LangGraph ReAct agent** using `@langchain/langgraph`, `@langchain/google-genai`, and `@langchain/core/tools`.

#### LLM

`ChatGoogleGenerativeAI` with model `gemini-2.0-flash`, temperature 0.3.

#### System Prompt

Positions the agent as **CivicBot** for a Canadian municipality. Instructs it to: always use tools before answering, be concise (under 200 words), flag urgent issues proactively, and handle trend and status queries.

#### Tools

| Tool | Input | Purpose |
|------|-------|---------|
| `get_issues_summary` | none | Returns JSON: `{ total, open, inProgress, resolved, urgentUnresolved }` |
| `get_issues_by_category` | `category: string` | Returns issues matching the category (regex, case-insensitive); empty string returns all |
| `get_urgent_issues` | none | Returns all urgent issues that are not yet resolved |
| `get_category_breakdown` | none | Returns categories sorted by frequency |
| `get_recent_issues` | `limit?: number` | Returns the N most recently submitted issues (max 10) |

#### `chatWithAgent(message)`

1. Lazy-initialises the agent (singleton `agentInstance`)
2. Invokes the agent with `{ messages: [{ role: 'user', content: message }] }`
3. Extracts the final message content (handles both string and multipart responses)
4. On any LangGraph error: falls back to `fallbackChat(message)`

#### `fallbackChat(message)` (internal)

Direct Gemini call using `@google/generative-ai`. Fetches the 20 most recent issues for context, then generates a concise response. Returns an apology message if this also fails.

---

## 8. GraphQL API Reference

### Auth Service (port 4001)

| Operation | Type | Auth | Description |
|-----------|------|------|-------------|
| `me` | Query | Required | Returns current user |
| `register(username, email, password, role?)` | Mutation | None | Creates account, returns JWT |
| `login(email, password)` | Mutation | None | Validates credentials, returns JWT |

### Issue Service (port 4002)

| Operation | Type | Auth | Description |
|-----------|------|------|-------------|
| `getIssues(status?)` | Query | None | All issues, optional status filter |
| `getMyIssues` | Query | Required | Authenticated user's issues only |
| `getIssue(id)` | Query | None | Single issue by ID |
| `getMyNotifications` | Query | Required | User's 25 most recent notifications |
| `getUnreadCount` | Query | Required | Count of unread notifications |
| `submitIssue(title, description, location?, imageUrl?)` | Mutation | Required | Creates issue, triggers AI categorization |
| `updateIssueStatus(id, status, assignedTo?)` | Mutation | Staff only | Updates status, notifies reporter |
| `deleteIssue(id)` | Mutation | Staff only | Deletes issue and its notifications |
| `markNotificationRead(id)` | Mutation | Required | Marks single notification read |
| `markAllNotificationsRead` | Mutation | Required | Marks all user notifications read |

### Analytics Service (port 4003)

| Operation | Type | Auth | Description |
|-----------|------|------|-------------|
| `getAnalytics` | Query | None | KPI stats + category breakdown |
| `getAITrendAnalysis` | Query | None | Gemini-generated trend insights |
| `chatWithAI(message)` | Query | None | LangGraph agent response |

---

## 9. Authentication & Authorization

**Token format:** JWT signed with `JWT_SECRET`, 7-day expiry. Payload: `{ id, role }`.

**Storage:** `localStorage` keys: `token`, `role`, `username`.

**Client-side guards:**
- Routes with `token` check: redirect to `/login` if not authenticated
- Routes with `role === 'staff'` check: redirect to `/` if not staff
- Navbar: Analytics and Staff Panel links only rendered for staff

**Server-side guards:**
- `me`, `getMyIssues`, `getMyNotifications`, `getUnreadCount`, `submitIssue`, `markNotificationRead`, `markAllNotificationsRead` — throw `Not authenticated` if no valid token
- `updateIssueStatus`, `deleteIssue` — throw `Only staff can ...` if role is not `staff`
- Analytics service endpoints — no auth required (read-only aggregate data)

---

## 10. Data Flows

### Issue Submission

```
1. Resident fills SubmitIssue form
2. submitIssue mutation → Issue Service (4002)
3. Issue Service calls categorizeIssue() → Gemini 2.0 Flash
4. Gemini returns category string
5. Issue saved to MongoDB with category + urgent flag
6. If urgent: query all staff users → create urgent_alert notifications for each
7. Success modal shown with AI category + urgent status
```

### Status Update

```
1. Staff changes status dropdown in StaffDashboard
2. updateIssueStatus mutation → Issue Service (4002)
3. Issue document updated in MongoDB
4. status_update notification created for the issue's original reporter
5. Reporter sees badge increment on their NotificationBell
```

### Notification Polling

```
1. NotificationBell mounts → getUnreadCount query runs immediately
2. Every 30 seconds: getUnreadCount re-runs
3. User clicks bell → getMyNotifications query runs
4. User clicks individual notification → markNotificationRead mutation
5. "Mark all read" → markAllNotificationsRead mutation
```

### Chatbot

```
1. User types in Chatbot widget
2. Chat query (operation: "Chat") → routed to Analytics Service (4003)
3. Analytics resolver calls chatWithAgent(message)
4. LangGraph agent invokes relevant tools (DB queries)
5. Gemini LLM synthesizes response with tool outputs
6. If LangGraph fails → fallback direct Gemini call
7. Response returned as string, displayed in chat bubble
```

### AI Trend Analysis

```
1. Staff clicks "AI Trend Analysis" button on Analytics page
2. GetAITrendAnalysis query → Analytics Service (4003)
3. getAITrendAnalysis() fetches all issues, computes stats
4. Stats sent to Gemini with analysis prompt
5. Plain-text insights returned and displayed
```

---

## 11. Environment Configuration

Located at `server/.env`:

```
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<secret key for JWT signing>
GEMINI_API_KEY=<Google AI Studio API key>
PORT=4000
```

All three microservice `index.js` files load this file with:
```js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
```

---

## 12. Running the Project

### Prerequisites

- Node.js 18+
- MongoDB Atlas URI
- Google AI Studio API key (Gemini)

### Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### Start backend services

```bash
# All three services concurrently
cd server && npm run dev:all

# Or individually
npm run dev:auth       # port 4001
npm run dev:issue      # port 4002
npm run dev:analytics  # port 4003
```

### Start frontend

```bash
cd client && npm run dev    # port 5173
```

### Ports summary

| Service | Port |
|---------|------|
| Shell (Vite dev) | 5173 |
| Auth Service | 4001 |
| Issue Service | 4002 |
| Analytics Service | 4003 |
| Main Server (aggregated) | 4000 |

---

## 13. Tech Stack

### Frontend

| Package | Version | Role |
|---------|---------|------|
| React | 19 | UI framework |
| React DOM | 19 | DOM renderer |
| React Router DOM | 7 | Client-side routing |
| Apollo Client | 3.14 | GraphQL client + caching |
| Tailwind CSS | 4 | Utility-first styling |
| `@tailwindcss/vite` | 4 | Vite integration for Tailwind v4 |
| Vite | 8 | Build tool + dev server |
| `@originjs/vite-plugin-federation` | 1.4 | Module federation (MFE builds) |

### Backend

| Package | Version | Role |
|---------|---------|------|
| Express | 4.21 | HTTP server |
| apollo-server-express | 3 | GraphQL server |
| graphql | 16 | GraphQL runtime |
| Mongoose | 9 | MongoDB ODM |
| bcryptjs | 3 | Password hashing |
| jsonwebtoken | 9 | JWT signing/verification |
| dotenv | 17 | Environment variable loading |
| cors | 2.8 | Cross-origin request handling |
| concurrently | — | Run all three services in one terminal |

### AI / ML

| Package | Version | Role |
|---------|---------|------|
| `@google/generative-ai` | 0.24 | Gemini SDK (categorization, trend analysis) |
| `@langchain/google-genai` | 2.1 | LangChain Gemini wrapper for agent LLM |
| `@langchain/langgraph` | 1.2 | ReAct agent framework |
| `@langchain/core` | 1.1 | LangChain base types and tools |
| zod | 4 | Tool input schema validation |

### Database

| Service | Notes |
|---------|-------|
| MongoDB Atlas | Cloud-hosted cluster; three collections: `users`, `issues`, `notifications` |
