# Ticket Nepal - Bus Ticketing System

## Architecture Overview

This is a React-based bus ticketing platform with role-based access for users, vendors, admins, and superadmins. The frontend is built with Vite + React 19 and uses React Router v7 for navigation.

### Key Components

- **Role-based routing**: All protected routes use `<ProtectedRoute allowedRoles={[...]}>` wrapper (see `src/components/ProtectedRoute.jsx`)
- **Authentication**: Mock auth system via `AuthContext` with `loginAs(role)` and `logout()` methods - Firebase config exists in `src/firebase.js` but not yet integrated
- **Four user roles**: `user`, `vendor`, `admin`, `superadmin` - each has dedicated dashboard and route namespace

### Directory Structure

```
src/
├── pages/
│   ├── common/     # Public pages (Landing, Search, Login, Signup)
│   ├── customer/   # User-facing booking flow (BusSearch, Booking, Payment)
│   ├── vendor/     # Vendor operations (Dashboard, Buses, Billing, Seat Management)
│   ├── admin/      # Admin CRUD (ManageBuses, ManageVendors, SystemForms)
│   └── superadmin/ # Top-level oversight
├── components/
│   └── common/     # Header/Footer - note: Header.jsx proxies to HeaderNew.jsx
├── context/        # AuthContext with mock role-based auth
└── css/            # Per-page CSS files + _design_tokens.css
```

## Development Workflow

### Commands
- `npm run dev` - Start Vite dev server (default: http://localhost:5173)
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run preview` - Preview production build

### Mock Authentication
The app uses a temporary mock auth system for prototyping:
```jsx
const { user, loginAs, logout } = useAuth();
loginAs('vendor'); // Sets user role without real backend
```
Header shows quick login buttons for each role. Replace with Firebase auth when backend is ready.

## Styling Conventions

### Design Tokens
All components should reference CSS variables from `_design_tokens.css`:
- `--primary: #2e7d32` (green)
- `--accent: #f9a825` (yellow)
- `--surface: #fbfff8` (light tint)
- `--radius: 10px`
- `--shadow: 0 6px 18px rgba(34,50,32,0.08)`

Each page has a dedicated CSS file in `src/css/` (e.g., `booking.css`, `vendorDashboard.css`) imported directly in the component.

### Component Pattern
Standard page component structure:
```jsx
import React, { useState } from 'react';
import '../../css/pageName.css';

const PageName = () => {
  // Local state with useState
  // Sample/mock data arrays at top
  return <div className="page pageName">...</div>;
};

export default PageName;
```

## Data Flow Patterns

### Sample Data Convention
Pages use inline sample/mock data arrays (e.g., `sampleBuses`, `busResults`) defined at module top. This is temporary scaffolding - replace with API calls when backend endpoints are available.

Example from `BusSearch.jsx`:
```jsx
const busResults = [
  { id: 1, vendor: 'ABC Travels', busNo: 'BA 2 KHA 1234', ... },
  // ...
];
```

### State Management
- **Local state only**: Components use `useState` for local data
- **Global state**: Only `AuthContext` for user/role
- **No Redux/Zustand**: Keep state minimal and co-located

### Forms Pattern
Admin management pages follow a consistent CRUD pattern:
- List view (table of items)
- Form component for add/edit (e.g., `BusForm.jsx`, `VendorForm.jsx`)
- State-driven `editing` mode toggle
- Example: `ManageBuses.jsx` with `addBus()`, `updateBus()`, `removeBus()`

## Integration Points

### Planned Backend Integration
- Firebase Authentication (config in `src/firebase.js` - needs real credentials)
- API endpoints TBD - currently all data is mocked client-side
- Payment integration placeholders in `src/pages/customer/Payment.jsx`

### Route Structure
Routes are defined in `src/App.jsx`:
- Public: `/`, `/search`, `/buses/:id`, `/login`, `/signup`
- User: `/bookings`, `/profile`
- Vendor: `/vendor/*`, `/vendor/buses`
- Admin: `/admin/*`, `/admin/buses`
- SuperAdmin: `/superadmin/*`

Protected routes auto-redirect to `/login` if not authenticated, `/403` if wrong role.

## Key Files

- **`src/App.jsx`**: Main router configuration and role-based route protection
- **`src/context/AuthContext.jsx`**: Mock auth provider - replace with real Firebase integration
- **`src/components/ProtectedRoute.jsx`**: Role guard wrapper for private routes
- **`src/css/_design_tokens.css`**: Global design system variables
- **`src/pages/customer/BusSearch.jsx`**: Reference for form handling and filtering patterns
- **`src/pages/admin/ManageBuses.jsx`**: Reference for CRUD list/form pattern

## Special Notes

- **Header proxying**: `src/components/common/Header.jsx` exports `HeaderNew.jsx` - modify HeaderNew directly
- **Seat selection**: Uses button grid pattern (see `Booking.jsx` and `BusSeatManagement.jsx`)
- **Billing**: `window.print()` used for receipt download (vendor `Billing.jsx`)
- **No TypeScript**: Project uses plain JavaScript with `.jsx` extensions
- **React 19**: Uses latest React - be aware of breaking changes from v18
