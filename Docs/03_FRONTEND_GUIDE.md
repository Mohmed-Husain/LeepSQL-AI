# LeepSQL-AI: Frontend Guide

## 📌 Overview

The LeepSQL-AI frontend is a modern React application built with TypeScript that provides an intuitive interface for users to query databases using natural language. The UI emphasizes simplicity, security awareness, and a smooth user experience.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND APPLICATION                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                         App.tsx                                  │ │
│  │                    (Root Component)                              │ │
│  │         State: isAuthenticated, user, connectionInfo             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│              ┌───────────────┴───────────────┐                       │
│              ▼                               ▼                        │
│  ┌─────────────────────┐         ┌─────────────────────┐             │
│  │     AuthPage        │         │    ConsolePage      │             │
│  │  (Login + DB Conn)  │         │  (Query Interface)  │             │
│  └─────────────────────┘         └──────────┬──────────┘             │
│                                              │                        │
│                         ┌────────────────────┼────────────────────┐  │
│                         ▼                    ▼                    ▼  │
│              ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│              │ConsoleHeader │    │ QueryInput   │    │QueryWorkspace││
│              │(Nav + Mode)  │    │(NL Input)    │    │(Results)     ││
│              └──────────────┘    └──────────────┘    └──────────────┘│
│                                                             │        │
│                                                             ▼        │
│                                                   ┌──────────────┐   │
│                                                   │ SimpleChart  │   │
│                                                   │(Viz Output)  │   │
│                                                   └──────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── App.tsx                 # Root component with routing logic
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles (Tailwind)
│   ├── vite-env.d.ts          # Vite type declarations
│   ├── components/
│   │   ├── AuthPage.tsx       # Authentication & DB connection
│   │   ├── ConsolePage.tsx    # Main query console
│   │   ├── ConsoleHeader.tsx  # Navigation header
│   │   ├── QueryInput.tsx     # Natural language input
│   │   ├── QueryWorkspace.tsx # Results display
│   │   ├── HeroSection.tsx    # Welcome screen
│   │   └── SimpleChart.tsx    # Data visualization
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── assets/
│       └── databaseIcon.png   # Logo asset
├── index.html                 # HTML template
├── package.json               # Dependencies
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS config
├── tsconfig.json             # TypeScript config
└── eslint.config.js          # Linting rules
```

---

## 🔧 Component Deep Dive

### 1. App.tsx - Root Component

**Purpose:** Application state management and routing logic

```typescript
function App() {
  // Core state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ userId: string; name: string } | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);

  // Conditional rendering based on auth state
  if (!isAuthenticated) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }
  return <ConsolePage userName={user!.name} ... />;
}
```

**State Flow:**
```
Initial Load → AuthPage → User Authenticates → ConsolePage
```

---

### 2. AuthPage.tsx - Authentication & Connection

**Purpose:** Two-step authentication:
1. User credential verification
2. Database connection setup

```typescript
// State for user auth
const [userId, setUserId] = useState('');
const [password, setPassword] = useState('');

// State for database connection
const [dbType, setDbType] = useState<'postgresql' | 'mysql' | 'sqlite'>('postgresql');
const [connectionString, setConnectionString] = useState('');
// OR individual fields:
const [host, setHost] = useState('');
const [port, setPort] = useState('');
const [dbName, setDbName] = useState('');
const [dbUsername, setDbUsername] = useState('');
const [dbPassword, setDbPassword] = useState('');
```

**UI Sections:**

| Section | Fields |
|---------|--------|
| User Auth | User ID, Password |
| DB Type | PostgreSQL, MySQL, SQLite |
| Connection Mode | Connection String OR Individual Fields |
| Database Select | List of available databases |

**Connection String Builder:**
```typescript
const finalConnectionString = useConnectionString 
  ? connectionString 
  : `${dbType}://${dbUsername}:${dbPassword}@${host}:${port}/${dbName}`;
```

---

### 3. ConsolePage.tsx - Main Query Interface

**Purpose:** The primary workspace for querying databases

```typescript
interface ConsolePageProps {
  userName: string;
  databaseName: string;
  connectionInfo: ConnectionInfo;
}
```

**Key State:**
```typescript
const [developerMode, setDeveloperMode] = useState(false);     // Toggle approval mode
const [hasQueried, setHasQueried] = useState(false);           // Show results vs hero
const [isProcessing, setIsProcessing] = useState(false);       // Loading state
const [error, setError] = useState<string | null>(null);       // Error display
const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
const [pendingSqlQuery, setPendingSqlQuery] = useState<string | null>(null);
```

**Query Flow:**
```
User Types Query
       │
       ▼
handleQuery() triggered
       │
       ▼
POST to /api/generate
       │
       ▼
Show SQL in Approval Modal
       │
       ▼
User Approves/Rejects
       │
       ▼
Display Results
```

**API Integration:**
```typescript
const API_BASE_URL = "http://10.184.196.252:8000";

const handleQuery = async (query: string) => {
  const requestBody = {
    postgres_url: connectionInfo.connectionString,
    db_name: connectionInfo.dbName,
    user_query: query,
  };

  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  
  const data = await response.json();
  setPendingSqlQuery(data.sql_query);  // Show for approval
};
```

**SQL Approval Modal:**
```tsx
{pendingSqlQuery && (
  <div className="bg-slate-100 border-t border-slate-300 px-6 py-4">
    <pre>{pendingSqlQuery}</pre>
    <button onClick={handleApproveQuery}>✓ Approve</button>
    <button onClick={handleDiscardQuery}>✗ Reject</button>
  </div>
)}
```

---

### 4. QueryInput.tsx - Natural Language Input

**Purpose:** Text input for user queries

```typescript
interface QueryInputProps {
  onSubmit: (query: string) => void;
  isProcessing: boolean;
}
```

**Features:**
- Textarea for multi-line queries
- Enter to submit (Shift+Enter for new line)
- Disabled state during processing
- Clear after submit

**Implementation:**
```tsx
<textarea
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onKeyDown={handleKeyDown}
  disabled={isProcessing}
  placeholder="Ask LeapSQL about your data…"
  rows={2}
/>
<button onClick={handleSubmit} disabled={!query.trim() || isProcessing}>
  {isProcessing ? "Processing..." : "Run Query"}
</button>
```

---

### 5. QueryWorkspace.tsx - Results Display

**Purpose:** Display query results and visualizations

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                     QueryWorkspace                           │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  Natural Language       │  │   Visual Analytics      │   │
│  │  Output                 │  │   (Collapsible)         │   │
│  │                         │  │                         │   │
│  │  "Your query returned   │  │   ┌───────────────────┐ │   │
│  │   15 customers from     │  │   │    SimpleChart    │ │   │
│  │   New York..."          │  │   │   (Bar/Line/Pie)  │ │   │
│  │                         │  │   └───────────────────┘ │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Error Handling:**
```tsx
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <h3>Query Error</h3>
      <p>{error}</p>
    </div>
  );
}
```

---

### 6. ConsoleHeader.tsx - Navigation

**Purpose:** Top navigation bar with user info and controls

**Elements:**
- Logo and app name
- Current database name
- User name display
- Developer Mode toggle

---

### 7. HeroSection.tsx - Welcome Screen

**Purpose:** Landing screen before first query

**Content:**
- Welcome message
- Quick tips for using LeapSQL
- Example queries

---

## 📊 Type Definitions

```typescript
// types/index.ts

export interface User {
  userId: string;
  name: string;
}

export interface DatabaseCredentials {
  type: 'postgresql' | 'mysql' | 'sqlite';
  connectionString?: string;
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
}

export interface ConnectionInfo {
  connectionString: string;
  dbName: string;
}

export interface QueryResult {
  sql_query: string;
  visualizationData?: any;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}
```

---

## 🎨 Styling with Tailwind CSS

### Design System

| Element | Style |
|---------|-------|
| Primary Color | `bg-black`, `text-white` |
| Secondary | `bg-slate-50`, `bg-slate-100` |
| Borders | `border-slate-200`, `border-slate-300` |
| Focus | `ring-blue-900` |
| Error | `bg-red-50`, `text-red-700` |
| Success | `bg-green-600` |

### Common Patterns

```tsx
// Input field
className="w-full px-3 py-2 border border-slate-300 rounded-md 
           focus:outline-none focus:ring-2 focus:ring-blue-900"

// Primary button
className="px-6 py-3 bg-black text-white rounded-md font-medium
           hover:bg-gray-700 disabled:opacity-50"

// Card container
className="bg-white shadow-sm border border-slate-200 p-8"
```

---

## 🔄 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
│                                                                   │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │   Open App  │ ──▶  │  Auth Page  │ ──▶  │   Verify    │      │
│  │             │      │  (Login)    │      │  Credentials│      │
│  └─────────────┘      └─────────────┘      └──────┬──────┘      │
│                                                    │             │
│                                                    ▼             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │  Configure  │ ◀──  │  Select DB  │ ◀──  │   Success   │      │
│  │ Connection  │      │             │      │             │      │
│  └──────┬──────┘      └─────────────┘      └─────────────┘      │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │   Console   │ ──▶  │   Type NL   │ ──▶  │  See SQL    │      │
│  │    Page     │      │   Query     │      │  Preview    │      │
│  └─────────────┘      └─────────────┘      └──────┬──────┘      │
│                                                    │             │
│                                    ┌───────────────┴───────────┐ │
│                                    ▼                           ▼ │
│                         ┌─────────────┐             ┌───────────┐│
│                         │   Approve   │             │  Reject   ││
│                         └──────┬──────┘             └───────────┘│
│                                │                                 │
│                                ▼                                 │
│                         ┌─────────────┐                          │
│                         │   Results   │                          │
│                         │  + Charts   │                          │
│                         └─────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration Files

### vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  // Development server configuration
})
```

### tailwind.config.js
```javascript
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

---

## 🚀 Running the Frontend

### Development
```bash
cd frontend
npm install
npm run dev
```

Opens at: `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

---

## ❓ Cross Questions & Answers

### Q1: Why use connection string instead of API-based auth?

**A:** The current implementation passes connection strings directly for:
1. **Flexibility** - Works with any PostgreSQL database
2. **No stored credentials** - Backend doesn't persist credentials
3. **Direct access** - User controls which database to query
4. **Hackathon scope** - Production would use OAuth + stored connections

### Q2: Why show SQL before execution?

**A:** **Human-in-the-Loop Safety:**
- Users can verify the AI understood their intent
- Prevents accidental data exposure
- Builds trust in the AI system
- Catches edge cases AI might misinterpret

### Q3: Why is there no data table component?

**A:** The current implementation focuses on:
- Natural language output interpretation
- Visual charts for data insights
- SQL display for technical users
- Full data tables would be added for v2

### Q4: How does the frontend handle offline scenarios?

**A:** Currently, it shows error states:
```typescript
catch (err) {
  const errorMessage = err instanceof Error 
    ? err.message 
    : "An error occurred while processing your query";
  setError(errorMessage);
}
```
Production would add retry logic and offline indicators.

### Q5: Why use Tailwind instead of a component library?

**A:** Tailwind provides:
- Full design control
- Smaller bundle size
- No component conflicts
- Hackathon-friendly rapid development
- Easy to customize for branding

---

*Next: [04_AI_AGENTS_DEEP_DIVE.md](04_AI_AGENTS_DEEP_DIVE.md)*
