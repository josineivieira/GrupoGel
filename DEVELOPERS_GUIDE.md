# 👨‍💻 Developer's Guide

Complete guide for developers working on the Delivery Documentation App.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Architecture Overview](#architecture-overview)
4. [Code Standards](#code-standards)
5. [Git Workflow](#git-workflow)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **MongoDB** 5.0+ or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git**
- **Docker** (optional, for isolated development)

### Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/josineivieira/GrupoGel.git
cd GrupoGel

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Start development servers (open 2 terminals)
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start
```

Visit http://localhost:3000

---

## Development Setup

### Option A: Local Setup (Recommended for Windows)

```bash
# Backend setup
cd backend
npm install

# Create or verify .env in project root
cat > ../.env << EOF
MONGODB_URI=mongodb://localhost:27017/delivery-docs
JWT_SECRET=dev-secret-key-2024
PORT=5000
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000/api
EOF

# Start backend
npm run dev
```

```bash
# Frontend setup (in new terminal)
cd frontend
npm install
npm start
```

### Option B: Docker Setup (Isolated)

```bash
# One command to start everything
docker-compose -f docker-compose.dev.yml up

# Services available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000/api
# - MongoDB: localhost:27017
# - MongoDB UI: http://localhost:8081
```

### Option C: Hybrid (Backend in Docker, Frontend Local)

```bash
# Start just MongoDB
docker-compose -f docker-compose.dev.yml up mongodb

# Then run backend and frontend locally with connection string:
# MONGODB_URI=mongodb://localhost:27017/delivery-docs
```

---

## Architecture Overview

### Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app setup
│   │   ├── models/                # MongoDB schemas
│   │   ├── controllers/           # Business logic
│   │   ├── routes/                # API endpoints
│   │   ├── middleware/            # Express middleware
│   │   ├── validators/            # Request validation
│   │   ├── utils/                 # Utility functions
│   │   └── mockdb.js              # Fallback in-memory DB
│   ├── seed.js                    # Database seeding
│   ├── migrate-data.js            # Migration script
│   ├── package.json
│   └── .eslintrc.json             # Linting config
│
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/                 # React pages
│   │   ├── components/            # Reusable components
│   │   ├── services/              # API clients
│   │   └── styles/                # Tailwind CSS
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── .github/workflows/             # CI/CD pipelines
├── docker-compose.dev.yml
├── MIGRATION_GUIDE.md
├── DEVELOPERS_GUIDE.md (this file)
└── .env.example
```

### Database Models

**Driver** (User)
- `_id`, `username`, `email`, `password` (bcrypt)
- `role` (ADMIN | CONTRATADO | MOTORISTA)
- `contractorId` (ref to CONTRATADO)
- `phone`, `name`, `isActive`

**Delivery**
- `_id`, `deliveryNumber`, `vehiclePlate`
- `driverId`, `contractorId` (required)
- `status` (draft | pending | submitted)
- `documents` (5 file references)
- `timestamps`

### API Routes

**Authentication** (`/api/auth`)
- `POST /register` - Create new driver
- `POST /login` - Authenticate user
- `GET /me` - Get current user

**Deliveries** (`/api/deliveries`)
- `POST /` - Create delivery
- `GET /` - List (role-scoped)
- `GET /:id` - Get delivery
- `POST /:id/documents/:type` - Upload document
- `POST /:id/submit` - Submit delivery
- `DELETE /:id` - Delete delivery

**Admin** (`/api/admin`)
- `GET /users` - List users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

---

## Code Standards

### Naming Conventions

```javascript
// Variables & functions: camelCase
const userData = {};
function getUserDeliveries() {}

// Classes & constructors: PascalCase
class Driver {}
const driver = new Driver();

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5000000;
const VALID_ROLES = ['ADMIN', 'CONTRATADO', 'MOTORISTA'];

// Private methods/properties: _prefix
method._initialize()
obj._internalState
```

### Code Style

```javascript
// Use const by default, let when reassignment needed, avoid var
const immutable = 'value';
let mutable = 0;

// Arrow functions for callbacks
const items = data.map((item) => item.value);

// Explicit error handling
try {
  await operation();
} catch (error) {
  console.error('Operation failed:', error.message);
  res.status(500).json({ success: false, message: 'Server error' });
}

// Async/await over promises
async function fetchData() {
  const data = await db.find('collection', {});
  return data;
}
```

### Linting & Formatting

```bash
# Run linter
npm run lint --workspace=backend

# Auto-fix issues
npm run lint --workspace=backend -- --fix

# Check formatting
npm run format:check --workspace=backend

# Auto-format code
npm run format --workspace=backend
```

### Comments & Documentation

```javascript
/**
 * Calculate delivery completion percentage
 * 
 * @param {Object} delivery - Delivery object
 * @param {Array<string>} delivery.documents - Document keys
 * @returns {number} Percentage 0-100
 */
function getCompletionPercentage(delivery) {
  // Implementation
}
```

---

## Git Workflow

### Branch Naming

```
feature/feature-name          # New feature
fix/bug-description           # Bug fix
chore/task-description        # Maintenance
docs/doc-name                 # Documentation
refactor/component-name       # Refactoring
```

### Commit Messages

```
feat: add user role system
fix: resolve upload timeout on slow networks
chore: update dependencies
docs: add migration guide
refactor: simplify delivery creation logic

# Format: type: description
# Types: feat, fix, chore, docs, refactor, perf, test
```

### Pull Request Process

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit with clear messages
3. Push to remote: `git push origin feature/my-feature`
4. Create Pull Request with description
5. Ensure CI passes (ESLint, build, tests)
6. Request review and merge when approved

---

## Testing

### Running Tests

```bash
# Backend tests (when available)
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Manual Testing Checklist

#### Authentication Flow
- [ ] Register new user (MOTORISTA role)
- [ ] Login with credentials
- [ ] Verify JWT token in localStorage
- [ ] Logout clears token

#### Delivery Management
- [ ] Create delivery (MOTORISTA)
- [ ] Upload documents
- [ ] Submit delivery
- [ ] View submitted deliveries
- [ ] Admin can see all deliveries
- [ ] Contractor can see their deliveries

#### Role-Based Access
- [ ] MOTORISTA can't access other motorista's deliveries
- [ ] CONTRATADO can't access deliveries outside their company
- [ ] ADMIN can access everything

---

## Common Tasks

### Add a New API Endpoint

1. **Create validation schema** in `backend/src/validators/index.js`
   ```javascript
   const myValidationRules = () => [
     body('field').isString().withMessage('Required'),
   ];
   ```

2. **Implement controller** in `backend/src/controllers/`
   ```javascript
   exports.myAction = async (req, res) => {
     try {
       const result = await db.find(...);
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ success: false, message: error.message });
     }
   };
   ```

3. **Add route** in `backend/src/routes/`
   ```javascript
   router.post('/my-endpoint', myValidationRules(), validate, authController.myAction);
   ```

4. **Test the endpoint**
   ```bash
   curl -X POST http://localhost:5000/api/my-endpoint \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"field":"value"}'
   ```

### Update Database Schema

1. Modify model in `backend/src/models/`
2. Create migration script if needed
3. Update validation rules
4. Update API documentation

### Deploy Changes

1. Push to `main` branch
2. GitHub Actions CI runs automatically
3. Once CI passes, merge to `main`
4. Render will auto-deploy from GitHub

---

## Troubleshooting

### Backend Won't Start

**Issue:** `listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Kill process using port 5000
npx kill-port 5000

# Or change port
PORT=5001 npm run dev
```

### MongoDB Connection Error

**Issue:** `MongoError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB (macOS)
brew services start mongodb-community

# Start MongoDB (Windows)
net start MongoDB

# Or use MongoDB Atlas (cloud):
# Update MONGODB_URI in .env
```

### npm install Takes Forever

**Issue:** `npm` is slow or hangs

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Use different registry
npm config set registry https://registry.npmjs.org/

# Try yarn instead
yarn install
```

### Hot Reload Not Working

**Issue:** Changes not reflecting on save

**Solution:**
- Backend: ensure `nodemon` is installed and `npm run dev` is running
- Frontend: ensure `npm start` is running (not `npm build`)
- Check file watchers: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`

### Docker Container Won't Start

**Issue:** Container exits immediately

**Solution:**
```bash
# Check logs
docker logs container-name

# Rebuild image
docker-compose -f docker-compose.dev.yml build --no-cache

# Restart
docker-compose -f docker-compose.dev.yml up
```

---

## Resources

- **Node.js Docs:** https://nodejs.org/docs/
- **Express Guide:** https://expressjs.com/
- **MongoDB Manual:** https://docs.mongodb.com/manual/
- **React Documentation:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/docs/

---

**Questions?** Create an issue or check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
