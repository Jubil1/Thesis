# MyTibangaPortal — Barangay Profiling System

A web-based barangay profiling and document management system for **Barangay Tibanga, Iligan City**.

Built as a thesis project, this system digitizes resident records, document requests, and barangay operations into a modern, user-friendly portal.

---

## Features

### Public Portal
- **Home Page** — Barangay information and announcements (content editable by admins)
- **Document Request** — Browse and request barangay documents (clearance, certificates, etc.)
- **Payment & Summary** — View fees and generate request confirmations
- **User Profile** — View/edit personal info, change password, upload profile picture
- **Authentication** — Login system with session-based auth (JWT via HTTP-only cookies)

### Admin Panel
- **Dashboard** — Overview stats (total residents, pending requests, approved, completed)
- **Resident Records** — Full CRUD for resident profiles with search, filter, and view
- **Document Management** — Manage available document types, pricing, and file templates
- **Request History** — Review, approve, reject, and track document requests
- **Reports** — Analytics with KPI summaries, monthly trends, document popularity, and filterable request table
- **System Settings** — Manage admin profiles, document fees, announcements, and puroks
- **Edit Homepage** — Admins can directly edit public-facing homepage content in the browser

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Frontend | React 19, CSS Modules |
| Auth | JWT via HTTP-only cookies ([jose](https://github.com/panva/jose)) |
| Password | [bcryptjs](https://www.npmjs.com/package/bcryptjs) |
| Database | [PostgreSQL](https://www.postgresql.org/) via [node-postgres (pg)](https://node-postgres.com/) |

---

## Project Structure

```
Thesis/
├── frontend/
│   ├── app/
│   │   ├── (public)/                # Public-facing pages
│   │   │   ├── page.js              # Home page
│   │   │   ├── login/               # Login page
│   │   │   ├── document-request/
│   │   │   ├── payment/
│   │   │   ├── payment-summary/
│   │   │   └── profile/
│   │   ├── (admin)/                 # Admin panel pages
│   │   │   ├── admin-dashboard/
│   │   │   ├── resident-records/
│   │   │   ├── document-management/
│   │   │   ├── request-history/
│   │   │   ├── reports/             # NEW: Analytics & reports
│   │   │   ├── system-settings/     # NEW: Settings management
│   │   │   └── edit-homepage/       # NEW: Inline homepage editor
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # Login, logout, session
│   │   │   ├── admin/               # Admin endpoints
│   │   │   │   ├── residents/
│   │   │   │   ├── requests/
│   │   │   │   ├── documents/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/
│   │   │   │   ├── homepage/
│   │   │   │   └── stats/
│   │   │   └── profile/             # Profile CRUD
│   │   └── components/              # App-level components
│   ├── components/                  # Shared UI components
│   │   ├── PublicNavbar.js
│   │   ├── Footer.js
│   │   ├── TimeDisplay.js
│   │   ├── AdminBar.js
│   │   └── AnnouncementBanner.js
│   ├── db/                          # Database setup
│   │   ├── schema.sql               # Table definitions
│   │   └── seed.js                  # Seed script (migrates JSON → PostgreSQL)
│   ├── lib/                         # Shared utilities
│   │   ├── auth.js                  # JWT helpers
│   │   └── db.js                    # PostgreSQL connection pool
│   ├── hooks/                       # Custom React hooks
│   ├── data/                        # Legacy JSON files (used by seed.js)
│   └── public/                      # Static assets
│       ├── images/
│       └── documents/
└── .gitignore
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm
- [PostgreSQL](https://www.postgresql.org/) (v14 or later)

### 1. Clone the Repository

```bash
git clone https://github.com/Jubil1/Thesis.git
cd Thesis/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

Create a PostgreSQL database named `barangay`, then run the schema script to create all tables:

```bash
psql -U postgres -d barangay -f db/schema.sql
```

> **Note:** If the database doesn't exist yet, create it first:
> ```sql
> CREATE DATABASE barangay;
> ```

### 4. Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/barangay
```

### 5. Seed the Database *(Optional)*

If you have existing JSON data files in the `data/` directory, run the seed script to migrate them into PostgreSQL:

```bash
node db/seed.js
```

### 6. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## Default Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | *(set via seed script or manually in the database)* |

---

## License

This project is developed as an academic thesis and is not licensed for commercial use.
