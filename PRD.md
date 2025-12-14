# ProjContest - Product Requirements Document (PRD)

## Overview
ProjContest is a platform connecting clients with architects and engineers for architecture competitions and technical building services in Italy.

---

## User Roles

### 1. CLIENT (Committente)
Individuals or companies looking to launch architecture competitions or request technical services.

### 2. ARCHITECT (Architetto)
Design professionals participating in competitions and submitting proposals.

### 3. ENGINEER (Ingegnere/Tecnico)
Technical professionals providing building services (structural calculations, permits, certifications).

### 4. ADMIN (Amministratore)
Platform administrators managing users, contests, and content moderation.

---

## Feature Matrix by Role

### CLIENT Features

| Feature | Priority | Status |
|---------|----------|--------|
| Registration/Login | HIGH | DONE |
| Create contest (LaunchWizard) | HIGH | FIX NEEDED - doesn't save |
| View my contests | HIGH | DONE |
| View proposals received | HIGH | FIX NEEDED - add detail view |
| Select winner | HIGH | TODO |
| Request practice service | MEDIUM | FIX NEEDED - doesn't save |
| View my practice requests | MEDIUM | DONE |
| Edit profile | MEDIUM | TODO - add UI |
| Q&A with architects | LOW | TODO |
| Payment for services | LOW | FUTURE |

### ARCHITECT Features

| Feature | Priority | HIGH |
|---------|----------|------|
| Registration/Login | HIGH | DONE |
| Browse contests | HIGH | FIX - uses mock data |
| View contest details | HIGH | DONE |
| Submit proposal | HIGH | TODO - no form exists |
| View my proposals | HIGH | DONE |
| Edit/withdraw proposal | MEDIUM | TODO |
| Receive notifications | MEDIUM | TODO - no UI |
| View earnings | LOW | Mock data only |
| Portfolio management | LOW | FUTURE |

### ENGINEER Features

| Feature | Priority | Status |
|---------|----------|--------|
| Registration/Login | HIGH | DONE |
| View practice requests | HIGH | TODO - no dashboard |
| Accept/claim requests | HIGH | TODO |
| Submit quotes | MEDIUM | TODO |
| Deliver documents | MEDIUM | TODO |
| View earnings | LOW | FUTURE |

### ADMIN Features

| Feature | Priority | Status |
|---------|----------|--------|
| View platform stats | HIGH | DONE |
| Manage users | HIGH | DONE |
| Manage contests | HIGH | DONE |
| Delete contests | MEDIUM | DONE (API) / TODO (UI) |
| Content moderation | LOW | FUTURE |

---

## Implementation Plan

### Phase 1: Critical Fixes (Core Workflows)

1. **Fix LaunchWizard** - Actually save contests to database
2. **Fix PracticeWizard** - Actually save practice requests
3. **Fix Explore page** - Use real database data instead of mock
4. **Fix Home page** - Use real database data for featured contests
5. **Add Proposal Submission Form** - Architects can submit proposals
6. **Add Token Auto-Refresh** - Prevent session timeout issues

### Phase 2: Complete Role Features

7. **Client: Proposal Detail View** - View full proposal with accept/reject
8. **Client: Select Winner** - Mark proposal as winner, close contest
9. **Architect: View My Proposals** - Detailed view of submitted proposals
10. **Engineer: Dashboard** - View available practice requests
11. **Engineer: Claim Request** - Accept a practice request

### Phase 3: Enhanced Features

12. **Profile Edit UI** - All users can edit their profile
13. **Notifications UI** - Display notifications in navbar
14. **Status Management** - Clients can change contest status
15. **Delete Contest UI** - Admin can delete from UI

### Phase 4: Production Polish

16. **Loading States** - Add spinners and skeleton loaders
17. **Error Handling** - User-friendly error messages
18. **Form Validation** - Client-side validation
19. **Mobile Optimization** - Test and fix mobile issues
20. **SEO** - Meta tags and social sharing

---

## API Endpoints Required

### Existing (Working)
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
- GET /api/contests
- POST /api/contests
- GET /api/contests/[id]
- PUT /api/contests/[id]
- GET /api/contests/[id]/proposals
- POST /api/contests/[id]/proposals
- GET /api/practices/requests
- POST /api/practices/requests
- GET /api/user/dashboard
- GET/PUT /api/user/profile
- GET/PUT/DELETE /api/admin?action=stats|users|contests

### Need Implementation
- PUT /api/contests/[id]/proposals/[proposalId] - Update proposal status (winner)
- GET /api/user/notifications - Get user notifications
- PUT /api/user/notifications/[id] - Mark as read
- GET /api/practices/available - Engineer: view unassigned requests
- PUT /api/practices/requests/[id]/claim - Engineer: claim a request

---

## Database Schema (Existing)

```prisma
User: id, email, password, name, role, avatar, bio, portfolio, phone
Contest: id, title, description, brief, location, category, budget, deadline, status, isFeatured, mustHaves, constraints, deliverables, clientId
Proposal: id, contestId, architectId, description, images, files, status, createdAt
PracticeRequest: id, userId, type, description, status, address, notes, engineerId
Notification: id, userId, type, title, message, isRead, createdAt
RefreshToken: id, token, userId, expiresAt
```

---

## Success Metrics

1. Users can complete full contest creation flow
2. Architects can submit proposals to contests
3. Clients can select winners
4. Engineers can view and claim practice requests
5. All pages use real database data (no mock data)
6. Session persists without unexpected logouts

---

## Timeline

Implementation order follows priority in each phase. All features marked HIGH priority must be complete for production launch.
