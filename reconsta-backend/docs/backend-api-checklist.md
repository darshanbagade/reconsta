# Reconsta Backend API Testing Checklist

Use this checklist to manually test the backend in Postman before frontend integration and before deployment.

## 1. Basic Server Check

Purpose: Confirm the backend is running and connected before testing any API.

- [ ] GET /health returns success
- [ ] Server responds with the expected health message
- [ ] MongoDB connection is active

## 2. Auth APIs

Purpose: Verify login, session handling, token refresh, and protected auth routes.

- [ ] POST /api/auth/login works with valid credentials
- [ ] Login creates cookie or token as expected
- [ ] POST /api/auth/refresh-token returns a new access token
- [ ] GET /api/auth/me returns the current logged-in user
- [ ] POST /api/auth/logout clears the session
- [ ] POST /api/auth/register works for admin only

## 3. Transaction APIs

Purpose: Check CSV upload, transaction storage, and session-based transaction views.

- [ ] POST /api/transactions/upload accepts bankFile and posFile
- [ ] Upload creates one shared sessionId for both files
- [ ] Uploaded transactions are stored correctly in MongoDB
- [ ] GET /api/transactions returns filtered transaction data
- [ ] GET /api/transactions/sessions returns uploaded sessions
- [ ] GET /api/transactions/session/:sessionId/summary returns session counts
- [ ] GET /api/transactions/:id returns one transaction by id

## 4. Anomaly APIs

Purpose: Verify anomaly listing, detail view, and status updates.

- [ ] GET /api/anomalies returns anomaly records
- [ ] GET /api/anomalies/:id returns one anomaly
- [ ] PATCH /api/anomalies/:id/status updates anomaly status
- [ ] Reconciliation creates anomalies correctly

## 5. Exception APIs

Purpose: Confirm exception workflow for assignment, resolution, and escalation.

- [ ] GET /api/exceptions returns exception records
- [ ] GET /api/exceptions/:id returns one exception
- [ ] PATCH /api/exceptions/:id/assign assigns an exception correctly
- [ ] PATCH /api/exceptions/:id/resolve marks an exception as resolved
- [ ] PATCH /api/exceptions/:id/escalate escalates an exception correctly
- [ ] High-risk anomalies create exceptions

## 6. Audit Log APIs

Purpose: Check that important actions are being tracked for review.

- [ ] GET /api/audit-logs returns audit logs for admin and supervisor
- [ ] GET /api/audit-logs/exception/:exceptionId returns exception history
- [ ] Audit log entries show the correct action and timestamp

## 7. SLA APIs

Purpose: Verify SLA status checks and exception timing updates.

- [ ] POST /api/sla/run completes successfully
- [ ] SLA run updates on_track, at_risk, and breached exceptions
- [ ] SLA run ignores resolved exceptions in active SLA status

## 8. Reconciliation APIs

Purpose: Check batch reconciliation for one uploaded session.

- [ ] POST /api/reconciliation/run works with a valid sessionId
- [ ] Reconciliation creates the expected anomaly records
- [ ] Reconciliation updates transaction status correctly
- [ ] Reconciliation returns a clear result summary

## 9. Dashboard APIs

Purpose: Verify summary cards, charts, risk, and activity data for operations.

- [ ] GET /api/dashboard/overview returns summary counts
- [ ] GET /api/dashboard/metrics returns grouped metrics
- [ ] GET /api/dashboard/risk returns risk buckets and top anomalies
- [ ] GET /api/dashboard/recent returns recent activity
- [ ] GET /api/dashboard/sla returns SLA dashboard data

## 10. Socket.io Realtime Events

Purpose: Confirm realtime workflow updates do not break API responses.

- [ ] dashboard:updated is received after dashboard changes
- [ ] reconciliation:completed is emitted after reconciliation finishes
- [ ] anomaly:created is emitted when a new anomaly is created
- [ ] exception:created is emitted when a new exception is created
- [ ] exception:assigned is emitted after assignment
- [ ] exception:resolved is emitted after resolution
- [ ] exception:escalated is emitted after escalation
- [ ] sla:updated is emitted when SLA status changes
- [ ] sla:breached is emitted when SLA is breached
- [ ] Socket events do not break API responses

## 11. AI Insight APIs

Purpose: Check that anomaly insights are generated safely and use sanitized data.

- [ ] GET /api/insights/anomalies/:anomalyId/insight returns an insight response
- [ ] AI Powered suggestions are shown for each anomaly
- [ ] AI insight reduces manual checking work
- [ ] AI insight helps point to the likely fault area
- [ ] AI insight response contains privacy metadata
- [ ] Raw DB IDs are not exposed in the AI response
- [ ] Employee emails are not exposed in the AI response
- [ ] Full CSV data is not sent to Gemini

## 12. Security and Role Access Checks

Purpose: Verify that protected routes and role rules are enforced.

- [ ] Unauthenticated users cannot access protected APIs
- [ ] Analyst can only access assigned exceptions
- [ ] Analyst cannot access admin-only audit log list
- [ ] Supervisor can access dashboard and reconciliation routes
- [ ] Admin can access user registration and all operational routes
- [ ] Invalid token requests are rejected

## 13. Final Backend Readiness

Purpose: Do one last check before frontend integration and deployment.

- [ ] Server starts without error
- [ ] MongoDB connects successfully
- [ ] .env is not committed
- [ ] .env.example is committed
- [ ] All main APIs tested in Postman
- [ ] Ready for frontend integration

