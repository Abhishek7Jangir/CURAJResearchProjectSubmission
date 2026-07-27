# CURAJ Research Portal

A full-stack web application for managing university research projects at the Central University of Rajasthan (CURAJ). The portal handles the complete lifecycle of a research project — from proposal submission to final approval — across multiple departments and administrative roles, with budget tracking, indent approvals, project accounts, and utilization certificates.

---

## Features

### For Principal Investigators (PI / Professor)
- Submit new research project proposals with documents and budget breakdown
- Track project approval status through the full workflow
- View all projects in a compact table with filters (My Projects)
- View New Proposals with status filters and sortable cards
- Submit and track Indent Approval (resource purchase) requests per budget head
- Open Project Accounts (budget bifurcation) after project approval
- Submit Utilization Certificates
- Request budget revisions on approved projects
- Download approved project PDFs and supporting documents

### For Approvers (HOD, Dean, R&D Office, R&D Officer, IAO, Finance Office, Finance Officer, Registrar, VC Office, Vice Chancellor)
- Role-based dashboards showing only relevant pending items
- Approve, reject, or revert project proposals at each workflow stage
- Forward proposals to specific next-stage approvers (configurable)
- Approve indent requests, project accounts, and utilization certificates
- View full approval history for every item
- Department-scoped access for HOD and Dean roles

### System-wide
- OTP-based email verification for all new user registrations
- Forgot password flow with OTP reset
- Light and dark theme support
- Per-budget-head balance tracking — indent requests are validated and deducted against the specific budget head selected, not just the overall project total
- Historical snapshots of project and account data at the moment of final approval
- Institutional email enforcement (only `.curaj.ac.in` addresses accepted)
- One account per singleton role (only one Vice Chancellor, one Registrar, etc.)
- One HOD and one Dean per department

---

## Workflow

### Project Proposal (Module 1)
```
PI submits → HOD → Dean → R&D Office → R&D Officer → [IAO / Finance Office] → Registrar → APPROVED/REJECTED
```
The R&D Officer can forward to different paths depending on the project type (configurable per submission).

### Project Account Opening (Module 2)
```
PI submits → HOD → Dean → R&D Office → R&D Officer → Finance Office → Finance Officer → APPROVED/REJECTED
```

### Indent Approval
```
PI submits → HOD → Dean → R&D Office → R&D Officer → [IAO / Finance Office → Finance Officer/ Registrar / VC Office] → Vice Chancellor → APPROVED (budget deducted) / REJECTED
```

### Utilization Certificate
```
PI submits → HOD → Dean → R&D Office → R&D Officer → Finance Office → Finance Officer → APPROVED/REJECTED
```

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | ^18.3.1 | UI framework |
| Vite | ^7.2.4 | Build tool and dev server |
| React Router DOM | ^6.28.0 | Client-side routing |
| Tailwind CSS | ^3.4.16 | Styling |
| Framer Motion | ^11.15.0 | Animations and transitions |
| Lucide React | ^0.469.0 | Icons |
| React Icons | ^5.3.0 | Additional icons |
| Recharts | ^2.12.7 | Dashboard charts |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | — | Runtime |
| Express | ^5.2.1 | Web framework |
| MongoDB + Mongoose | ^8.21.1 | Database and ODM |
| JSON Web Token | ^9.0.3 | Authentication |
| bcrypt | ^6.0.0 | Password hashing |
| Nodemailer | ^9.0.1 | OTP emails via SMTP |
| Cloudinary | ^2.10.0 | PDF and file storage |
| pdf-lib | ^1.17.1 | Server-side PDF generation |
| dotenv | ^17.2.3 | Environment variable loading |
| cors | ^2.8.5 | Cross-origin request handling |
| multer | ^1.4.5-lts.1 | Multipart form handling |

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB** database (MongoDB Atlas free tier works fine)
- A **Cloudinary** account (free tier works fine) for file/PDF storage
- A **Gmail** account with an App Password enabled for OTP emails

---

## Setup and Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd UNIResearchUIFinal-main
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Open `.env` and fill in all values:

```env
# Server
PORT=3000

# Database (MongoDB)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_strong_random_secret_here_minimum_32_characters

# Email (SMTP - used for OTP emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password_here
SMTP_FROM=CURAJ Research <your_email@gmail.com>

# Cloudinary (used for PDF and file storage)
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> **Important:** `JWT_SECRET` must be set. The server will refuse to start without it.

Start the backend:

```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

The backend runs on `http://localhost:3000`.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies all `/api` calls to `http://localhost:3000` automatically.

### 4. Access from other devices on the same network

Vite is configured with `host: true`, so other devices on the same WiFi can access the app at:
```
http://<your-machine-ip>:5173
```
Your machine's IP is shown in the terminal when Vite starts (look for the `Network:` line).

---

## Project Structure

```
UNIResearchUIFinal-main/
├── backend/
│   ├── middleware/
│   │   └── auth.js                         # JWT authentication middleware
│   ├── models/
│   │   ├── ApprovalHistory.js              # Project proposal approval log
│   │   ├── AuthOtp.js                      # OTP records for signup/reset
│   │   ├── EquipmentApprovalHistory.js     # Indent approval log
│   │   ├── EquipmentRequest.js             # Indent approval requests
│   │   ├── Project.js                      # Research project proposals
│   │   ├── ProjectAccount.js               # Project account (budget bifurcation) forms
│   │   ├── ProjectAccountApprovalHistory.js
│   │   ├── ProjectAccountApprovalSnapshot.js  # Snapshot at final account approval
│   │   ├── ProjectApprovalSnapshot.js         # Snapshot at final project approval
│   │   ├── ProjectCounter.js               # Auto-incrementing project ID
│   │   ├── User.js                         # User accounts and roles
│   │   ├── UtilizationCertificate.js
│   │   └── UtilizationCertificateApprovalHistory.js
│   ├── routes/
│   │   ├── auth.js                         # Signup, login, OTP, password reset
│   │   ├── equipment.js                    # Indent approval CRUD and workflow
│   │   ├── projectAccounts.js              # Project account CRUD and workflow
│   │   ├── projects.js                     # Project proposal CRUD and workflow
│   │   └── utilizationCertificate.js       # UC CRUD and workflow
│   ├── scripts/
│   │   ├── add-sample-project.js           # Dev utility: seed sample data
│   │   ├── fix-budget-head-mismatch.js     # Migration: fix per-head budget balances
│   │   └── migrate-equipment-schema.js     # Migration: equipment schema update
│   ├── utils/
│   │   └── cloudinary.js                   # Cloudinary upload helper
│   ├── database.js                         # MongoDB connection
│   ├── server.js                           # Express app entry point
│   ├── .env.example                        # Environment variable template
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── University_logo.png             # Header logo
    │   ├── aj.jpeg                         # Developer photo
    │   ├── as.jpeg                         # Developer photo
    │   ├── tv.png                          # Developer photo
    │   ├── admin1.jpg                      # Administration photo
    │   ├── admin2.jpg                      # Administration photo
    │   └── admin3.jpg                      # Administration photo
    └── src/
        ├── components/
        │   ├── common/
        │   │   ├── forms/                  # ProjectForm, ProjectGrantForm,
        │   │   │                           #   ProjectAccountForm, UCForm, BudgetUpdateForm
        │   │   ├── modals/                 # ProjectDetailModal, EquipmentDetailModal,
        │   │   │                           #   ProjectAccountDetailModal, UCDetailModal
        │   │   ├── EquipmentTable.jsx      # Indent requests table
        │   │   ├── Pagination.jsx
        │   │   ├── ProjectFilters.jsx      # Reusable filter + search bar
        │   │   └── ProjectTable.jsx        # Compact project rows table
        │   └── professor/
        │       ├── DashboardStats.jsx
        │       ├── NeedsAttentionPanel.jsx
        │       └── StatCard.jsx
        ├── contexts/
        │   └── ThemeContext.jsx            # Light/dark theme provider
        ├── layouts/
        │   ├── approvers/
        │   │   └── ApproverLayout.jsx      # Shared sidebar for all approver roles
        │   └── professor/
        │       └── ProfessorLayout.jsx     # PI sidebar with all modules
        ├── pages/
        │   ├── auth/
        │   │   └── Landing.jsx             # Login, signup, about, team page
        │   ├── approvers/
        │   │   ├── HodDashboard.jsx
        │   │   ├── DeanDashboard.jsx
        │   │   ├── RndHelperDashboard.jsx
        │   │   ├── RndMainDashboard.jsx
        │   │   ├── AcademicIntegrityOfficerDashboard.jsx
        │   │   ├── FinanceOfficerHelperDashboard.jsx
        │   │   ├── FinanceOfficerMainDashboard.jsx
        │   │   ├── RegistrarDashboard.jsx
        │   │   ├── VcOfficeDashboard.jsx
        │   │   ├── ViceChancellorDashboard.jsx
        │   │   ├── ApproverProjects.jsx
        │   │   ├── ApproverEquipment.jsx
        │   │   ├── ApproverProjectAccounts.jsx
        │   │   ├── ApproverUtilizationCertificate.jsx
        │   │   └── VcApprovedProjects.jsx
        │   └── professor/
        │       ├── Dashboard.jsx
        │       ├── Projects.jsx            # New Proposal section (card view)
        │       ├── MyProjects.jsx          # My Projects section (table view, with snapshots)
        │       ├── Equipment.jsx           # Indent Approval section
        │       ├── ProjectAccounts.jsx     # Project Accounts section
        │       └── UtilizationCertificate.jsx
        └── utils/
            ├── stageLabels.js              # Maps internal stage codes to display labels
            └── storage.js                  # Status color/icon helpers
```

---

## User Roles and Designations

| Display Name | Internal Code | Scope |
|---|---|---|
| PI (Principal Investigator) | `pi` | Per department |
| HOD | `hod` | One per department |
| Dean | `dean` | One per department |
| R&D Office | `r&d_helper` | Singleton (one system-wide) |
| R&D Officer | `r&d_main` | Singleton |
| Internal Audit Officer (IAO) | `academic_integrity_officer` | Singleton |
| Finance Office | `finance_officer_helper` | Singleton |
| Finance Officer | `finance_officer_main` | Singleton |
| Registrar | `registrar` | Singleton |
| VC Office | `vc_office` | Singleton |
| Vice Chancellor | `vice_chancellor` | Singleton |

Singleton roles allow only one registered account system-wide. HOD and Dean allow one account per department.

---

## Budget Head Tracking

Each project has seven budget heads: **Equipment, Manpower, Consumables, Travel, Contingency, Overhead, Others**.

- When a PI submits an indent (resource purchase request), they select a specific budget head. The form shows the available balance for that head specifically.
- The backend validates that the requested amount does not exceed the available balance for the selected head.
- On Vice Chancellor final approval of an indent, the amount is deducted from both the specific budget head and the project's overall available budget simultaneously.
- Budget head balances are refreshed whenever a Project Account (Module 2 / Budget Bifurcation form) is submitted.

---

## Migration Scripts

Located in `backend/scripts/`. Run these manually when needed, never automatically.

```bash
# Preview which projects have mismatched budget head totals (dry run, no changes)
node backend/scripts/fix-budget-head-mismatch.js

# Apply the fix to the database
node backend/scripts/fix-budget-head-mismatch.js --apply
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default 3000) | Port the backend server listens on |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret for signing JWT tokens (min 32 chars) |
| `SMTP_HOST` | **Yes** | SMTP host for OTP emails |
| `SMTP_PORT` | **Yes** | SMTP port (587 for Gmail TLS) |
| `SMTP_USER` | **Yes** | SMTP sender email address |
| `SMTP_PASS` | **Yes** | SMTP password or Gmail App Password |
| `SMTP_FROM` | **Yes** | Display name and address for sent emails |
| `CLOUDINARY_NAME` | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret |

> The server will throw an error on startup if `JWT_SECRET` is not set, preventing insecure operation.

---

## License

ISC License — Central University of Rajasthan (CURAJ), 2025–2026.
