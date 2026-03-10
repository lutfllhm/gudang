# iWare Warehouse - Frontend v2.0

Modern, clean, and professional frontend for iWare Warehouse Management System.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Recharts** - Charts
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **Headless UI** - Accessible components

## Features

✅ Modern & Clean UI
✅ Responsive Design
✅ Dark mode ready
✅ Authentication with JWT
✅ Auto token refresh
✅ Dashboard with statistics
✅ Items management
✅ Sales orders management
✅ User management
✅ Settings page
✅ Real-time notifications
✅ Loading states
✅ Error handling

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=iWare Warehouse
VITE_APP_VERSION=2.0.0
```

## Development

```bash
# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
frontend-new/
├── src/
│   ├── components/          # Reusable components
│   │   ├── DashboardLayout.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/            # React contexts
│   │   └── AuthContext.jsx
│   ├── pages/              # Page components
│   │   ├── DashboardPage.jsx
│   │   ├── ItemsPage.jsx
│   │   ├── SalesOrdersPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── utils/              # Utilities
│   │   ├── api.js          # Axios instance
│   │   └── helpers.js      # Helper functions
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Login Credentials

```
Email: superadmin@iware.id
Password: jasad666
```

## API Integration

Frontend automatically connects to backend API at `http://localhost:5000/api`.

Features:
- Auto token refresh on 401
- Request/response interceptors
- Error handling
- Loading states

## Build for Production

```bash
# Build
npm run build

# Output will be in dist/ folder
# Deploy dist/ folder to your web server
```

## Deployment

### With Nginx

```nginx
server {
    listen 80;
    server_name iwareid.com;
    
    root /var/www/accurate-app/frontend-new/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## License

© 2026 iWare. All rights reserved.
