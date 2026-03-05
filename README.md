# MyTibangaPortal — Barangay Profiling System

A web-based barangay profiling and document management system for **Barangay Tibanga, Iligan City**.

Built as a thesis project, this system digitizes resident records, document requests, and barangay operations into a modern, user-friendly portal.

---

## Features

### Public Portal
- **Home Page** — Barangay information and announcements
- **Document Request** — Browse and request barangay documents (clearance, certificates, etc.)
- **Payment & Summary** — View fees and generate request confirmations
- **User Profile** — View/edit personal info, change password, upload profile picture
- **Authentication** — Login system with session-based auth (JWT via cookies)

### Admin Panel
- **Dashboard** — Overview stats (total residents, pending requests, etc.)
- **Resident Records** — Full CRUD for resident profiles with search, filter, and view
- **Document Management** — Manage available document types, pricing, and templates
- **Request History** — Review, approve, and track document requests

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Frontend | React 19, CSS Modules |
| Auth | JWT via HTTP-only cookies ([jose](https://github.com/panva/jose)) |
| Password | [bcryptjs](https://www.npmjs.com/package/bcryptjs) |
| Data | JSON file-based storage (`data/`) |

---

## Project Structure

```
Thesis/
├── frontend/
│   ├── app/
│   │   ├── (public)/          # Public-facing pages
│   │   │   ├── page.js        # Home page
│   │   │   ├── login/         # Login page
│   │   │   ├── document-request/
│   │   │   ├── payment/
│   │   │   ├── payment-summary/
│   │   │   └── profile/
│   │   ├── (admin)/           # Admin panel pages
│   │   │   ├── admin-dashboard/
│   │   │   ├── resident-records/
│   │   │   ├── document-management/
│   │   │   └── request-history/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Login, logout, session
│   │   │   ├── admin/         # Admin endpoints
│   │   │   └── profile/       # Profile CRUD
│   │   └── components/        # App-level components (Portal)
│   ├── components/            # Shared components
│   │   ├── PublicNavbar.js
│   │   ├── Footer.js
│   │   ├── TimeDisplay.js
│   │   └── AnnouncementBanner.js
│   ├── data/                  # JSON data files
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Auth utilities
│   └── public/                # Static assets
│       ├── images/
│       └── documents/
└── .gitignore
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Jubil1/Thesis.git
cd Thesis/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Default Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | *(check `data/users.json`)* |

---

## License

This project is developed as an academic thesis and is not licensed for commercial use.
