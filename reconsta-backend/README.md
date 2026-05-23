# Reconsta Backend

Reconsta is a MERN-stack payment reconciliation intelligence platform for internal banking and finance operations.

It compares Bank Ledger transactions with Merchant/POS transactions, detects anomalies, creates exceptions, tracks SLA breaches, stores audit logs, sends realtime Socket.io updates, and generates **privacy-aware AI insights** with Gemini.

## Project Overview

Reconsta backend is designed for internal operations teams, not for public customers. It supports the full reconciliation workflow used by bank staff, supervisors, and analysts when reviewing transaction batches from different sources.

The system groups uploaded records into a reconciliation session, runs matching and anomaly detection, and then helps teams investigate, assign, escalate, and resolve exceptions with full audit history.

## Problem Statement

Manual reconciliation in finance teams is slow and hard to control at scale. Common issues include missing records, duplicate entries, amount mismatches, delayed settlement files, SLA breaches, and poor visibility across investigation work.

Without a structured workflow, teams can miss high-risk cases, lose traceability, and spend too much time moving between spreadsheets, notes, and separate dashboards.

## Solution

Reconsta provides a backend workflow that:

1. Accepts Bank and POS CSV uploads for the same reconciliation session
2. Stores all transactions with a shared sessionId
3. Runs reconciliation to identify matched, fuzzy, unmatched, duplicate, and mismatch cases
4. Creates anomalies and risk scores
5. Creates exceptions for operational follow-up
6. Supports assignment, resolution, and escalation
7. Tracks SLA health
8. Records audit logs for important actions
9. Sends realtime workflow updates through Socket.io
10. Generates **AI Powered** privacy-aware Gemini insights for investigation support on each anomaly

## Core Features

### Authentication and Access Control

- JWT-based authentication
- Cookie-based session support
- Role-based access control
- User profile lookup and logout flow
- Admin-only user registration

### Transaction Management

- CSV upload for Bank and POS files
- Session-based transaction grouping
- Transaction filtering and pagination
- Session list and session summary APIs

### Reconciliation Engine

- Runs batch reconciliation by sessionId
- Detects matched, fuzzy, unmatched, and duplicate transactions
- Supports mismatch detection in the broader reconciliation flow
- Keeps results tied to the original upload session

### Anomaly Management

- Stores anomaly records created from reconciliation results
- Supports anomaly detail lookup
- Supports status updates
- Tracks anomaly type, risk score, and risk breakdown

### Exception Workflow

- Creates and manages investigation exceptions
- Supports assignment to staff
- Supports resolution and escalation
- Tracks SLA status alongside the exception lifecycle

### Audit and SLA

- Stores action history for investigation work
- Supports full audit log review for supervisors and admins
- Supports exception-level audit history
- Runs SLA checks and updates SLA status

### Dashboard and Insights

- Dashboard summary, metrics, risk, recent activity, and SLA views
- **AI Powered** insight generation for anomaly investigation
- Privacy-aware data sanitization before sending data to Gemini

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Realtime | Socket.io |
| AI | Gemini API |
| File Upload | Multer |
| CSV Parsing | csv-parse |
| Security | bcryptjs, cookie-parser, CORS |

## System Workflow

Bank CSV + POS CSV upload
↓
Transactions stored with one sessionId
↓
Reconciliation run starts
↓
Matched, fuzzy, unmatched, duplicate, and mismatch cases are identified
↓
Anomalies are created and risk is scored
↓
High-risk anomalies become exceptions
↓
Admin or supervisor assigns work to an analyst
↓
Analyst investigates, escalates, or resolves the case
↓
Audit logs and SLA status are updated
↓
Socket.io updates the dashboard and workflow in realtime

## Roles and Permissions

| Role | Main Access | Typical Responsibility |
|---|---|---|
| Admin | Full access to all modules, user registration, assignments, escalations, resolutions, dashboard, audit logs, and AI insights | Manages the full reconciliation operation |
| Supervisor | Dashboard, transactions, anomalies, exceptions, audit logs, SLA checks, reconciliation run, and AI insights | Monitors workflow and oversees investigations |
| Analyst | Assigned exceptions, related anomaly details, exception history, and allowed AI insight access for assigned cases | Investigates and resolves assigned work |

## Project Folder Structure

| Path | Purpose |
|---|---|
| src/app.js | Express app setup, middleware, routes, and health endpoint |
| src/server.js | HTTP server bootstrap and Socket.io setup |
| src/config/ | Environment and database configuration |
| src/controllers/ | Request handlers for each module |
| src/middleware/ | Authentication, role checks, error handling, and upload handling |
| src/models/ | Mongoose models for users, transactions, anomalies, exceptions, and audit logs |
| src/routes/ | API route definitions |
| src/services/ | Reconciliation, matching, scoring, SLA, realtime, and Gemini logic |
| src/socket/ | Socket.io server and event helpers |
| src/utils/ | Shared helpers such as error and response formatting |
| docs/backend-api-checklist.md | Backend API checklist and implementation notes |
| scripts/seedAdmin.js | Script for creating the initial admin user |
| sample-data/ | Example Bank and POS CSV files |

## Environment Variables

Create a .env file in the backend root folder.

| Variable | Purpose |
|---|---|
| PORT | Server port |
| MONGODB_URI | MongoDB connection string |
| CLIENT_URL | Frontend origin allowed by CORS |
| JWT_ACCESS_SECRET | Secret for access tokens |
| JWT_ACCESS_EXPIRE | Access token lifetime |
| JWT_REFRESH_SECRET | Secret for refresh tokens |
| JWT_REFRESH_EXPIRE | Refresh token lifetime |
| GEMINI_API_KEY | Gemini API key for AI insights |
| NODE_ENV | Application environment |
| SEED_ADMIN_NAME | Optional seed admin name |
| SEED_ADMIN_EMAIL | Optional seed admin email |
| SEED_ADMIN_PASSWORD | Optional seed admin password |

## Installation

Install dependencies in the backend folder:

```bash
npm install
```

If you want an initial admin account, set the seed variables in .env and run the seed script after installation.

## Run Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Expected output:

- MongoDB connected
- Server is running on port 5000

## API Overview

### Health APIs

| API | Usage |
|---|---|
| GET /health | Checks whether the backend is running. |

### Auth APIs

| API | Usage |
|---|---|
| POST /api/auth/login | Logs in a user and creates an authenticated session. |
| POST /api/auth/refresh-token | Issues a new access token using a refresh token. |
| GET /api/auth/me | Returns the current logged-in user profile. |
| POST /api/auth/logout | Ends the current authenticated session. |
| POST /api/auth/register | Creates a new user; admin only. |

### Transactions APIs

| API | Usage |
|---|---|
| POST /api/transactions/upload | Uploads Bank and POS CSV files for one reconciliation session. |
| GET /api/transactions | Returns transactions with filters and pagination. |
| GET /api/transactions/sessions | Returns uploaded transaction sessions. |
| GET /api/transactions/session/:sessionId/summary | Returns transaction counts for one session. |
| GET /api/transactions/:id | Returns a single transaction by id. |

Upload requires multipart form data with bankFile and posFile.

### Anomalies APIs

| API | Usage |
|---|---|
| GET /api/anomalies | Returns anomaly records with filtering. |
| GET /api/anomalies/:id | Returns one anomaly by id. |
| PATCH /api/anomalies/:id/status | Updates anomaly status. |

### Exceptions APIs

| API | Usage |
|---|---|
| GET /api/exceptions | Returns exception records with filtering. |
| GET /api/exceptions/:id | Returns one exception by id. |
| PATCH /api/exceptions/:id/assign | Assigns an exception to a user. |
| PATCH /api/exceptions/:id/resolve | Marks an exception as resolved. |
| PATCH /api/exceptions/:id/escalate | Escalates an exception for higher review. |

### Audit Logs APIs

| API | Usage |
|---|---|
| GET /api/audit-logs | Returns audit logs with filters and pagination. |
| GET /api/audit-logs/exception/:exceptionId | Returns audit history for one exception. |

### SLA APIs

| API | Usage |
|---|---|
| POST /api/sla/run | Runs SLA checks and updates exception SLA status. |

### Reconciliation APIs

| API | Usage |
|---|---|
| POST /api/reconciliation/run | Runs reconciliation for one sessionId and updates workflow state. |

Example request body:

| Field | Type | Usage |
|---|---|---|
| sessionId | string | Identifies the uploaded batch to reconcile. |

### Dashboard APIs

| API | Usage |
|---|---|
| GET /api/dashboard/overview | Returns summary counts for the dashboard cards. |
| GET /api/dashboard/metrics | Returns grouped dashboard metrics for charts. |
| GET /api/dashboard/risk | Returns risk distribution and top risky anomalies. |
| GET /api/dashboard/recent | Returns recent anomalies and exceptions. |
| GET /api/dashboard/sla | Returns SLA summary data for operations monitoring. |

### AI Insights APIs

| API | Usage |
|---|---|
| GET /api/insights/anomalies/:anomalyId/insight | Generates an **AI Powered** privacy-aware suggestion for one anomaly and helps reduce manual checking by pointing to likely fault areas. |

## Socket.io Realtime Events

Socket.io is used to push workflow updates to the frontend in realtime. The backend emits events for dashboard and investigation changes.

| Event | Usage |
|---|---|
| dashboard:updated | Sent when dashboard data changes. |
| reconciliation:completed | Sent after reconciliation finishes for a session. |
| anomaly:created | Sent when a new anomaly is created. |
| exception:created | Sent when a new exception is created. |
| exception:assigned | Sent when an exception is assigned. |
| exception:resolved | Sent when an exception is resolved. |
| exception:escalated | Sent when an exception is escalated. |
| sla:updated | Sent when SLA status changes. |
| sla:breached | Sent when an exception breaches SLA. |

Socket room support:

| Room | Usage |
|---|---|
| user:USER_ID | Sends user-specific updates. |
| role:admin | Sends admin updates. |
| role:supervisor | Sends supervisor updates. |
| role:analyst | Sends analyst updates. |
| dashboard:operations | Shared room for admin and supervisor dashboard updates. |
| session:SESSION_ID | Sends updates for one reconciliation session. |

## AI Insight Privacy Design

The AI insight flow is designed for internal banking use and avoids sending sensitive raw data to Gemini. It gives **AI Powered** suggestions for each anomaly, reduces manual checking work, and helps analysts focus on where the fault is most likely happening.

| Privacy Rule | Implementation |
|---|---|
| No raw DB IDs | Internal MongoDB ids are not sent to the AI prompt. |
| No employee emails | User email addresses are not included in the AI payload. |
| No full CSV upload | The full uploaded file is never sent to Gemini. |
| Sanitized references only | Transaction and session references are masked before AI processing. |
| Minimum required context | Only the fields needed for investigation are sent. |
| Human review first | The AI response is advisory and does not replace analyst judgment. |

## Backend Status

| Area | Status |
|---|---|
| Authentication | Implemented |
| Transaction upload | Implemented |
| Reconciliation engine | Implemented |
| Anomaly management | Implemented |
| Exception workflow | Implemented |
| Audit logging | Implemented |
| SLA monitoring | Implemented |
| Dashboard APIs | Implemented |
| Socket.io realtime updates | Implemented |
| Gemini AI insights | Implemented |

## Interview Explanation

If you describe this project in an interview, keep it simple:

Reconsta is an internal banking backend for payment reconciliation. It takes Bank and POS CSV files, stores them under one session, runs reconciliation, detects anomalies, creates exceptions for investigation, and tracks SLA status. Admins and supervisors manage the workflow, analysts handle assigned exceptions, and the system keeps audit logs for traceability. It also sends realtime updates through Socket.io and generates privacy-aware AI summaries with Gemini using sanitized data only.