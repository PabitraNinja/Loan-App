# System Architecture: Personal Loan & Interest Tracking System

## 1. System Architecture Overview
The system is designed as a scalable full-stack application utilizing a modern microservices-oriented backend and a cross-platform mobile frontend.

- **Frontend:** React Native (Expo) - For true cross-platform Android/iOS deployment with native performance.
- **Backend:** Node.js with Express & TypeScript.
- **Database:** PostgreSQL (Relational DB for strict financial data integrity).
- **Task Scheduler:** Node-Cron / Redis (for daily interest calculation engine).
- **Hosting:** AWS / Vercel (Frontend) + Render/Heroku (Backend) + Supabase (Database).

## 2. Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    pin_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    borrower_name VARCHAR(255) NOT NULL,
    borrower_phone VARCHAR(20),
    principal_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    interest_type VARCHAR(20) CHECK (interest_type IN ('Simple', 'Compound')),
    interest_cycle VARCHAR(20) CHECK (interest_cycle IN ('Daily', 'Monthly')),
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Overdue', 'Defaulter')),
    total_interest_earned DECIMAL(15, 2) DEFAULT 0.00,
    last_calculated_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id),
    amount DECIMAL(15, 2) NOT NULL,
    payment_type VARCHAR(20) CHECK (payment_type IN ('Principal', 'Interest', 'Penalty')),
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interest_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id),
    calculated_amount DECIMAL(15, 2) NOT NULL,
    calculation_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE
);
```

## 3. Backend API Structure (Node.js/Express)

### Auth & Security
- `POST /api/auth/setup-pin` - Setup app lock PIN.
- `POST /api/auth/verify-pin` - Authenticate via PIN/Biometrics.

### Loans
- `POST /api/loans` - Create a new loan.
- `GET /api/loans` - List all loans (with pagination & filters).
- `GET /api/loans/:id` - Get loan details with remaining balance.
- `PUT /api/loans/:id/status` - Mark loan as Completed or Defaulter.

### Payments
- `POST /api/payments` - Record a new payment (auto-adjusts principal or pays off interest).
- `GET /api/loans/:id/payments` - Get payment history.

### Analytics & Reports
- `GET /api/reports/dashboard` - Get totals (money in market, monthly profit, total earned).
- `GET /api/reports/export` - Export DB to CSV/PDF.

## 4. Auto Interest Calculation Engine (CRON Job Logic)

```typescript
// Runs daily at 12:00 AM
cron.schedule('0 0 * * *', async () => {
    const activeLoans = await db.query("SELECT * FROM loans WHERE status IN ('Active', 'Overdue')");
    
    for (const loan of activeLoans) {
        // 1. Calculate days since last calculation
        // 2. Apply Simple or Compound formula based on interest_cycle
        // 3. Add to interest_logs
        // 4. Update total_interest_earned and last_calculated_date in loans table
        // 5. Check if overdue threshold met -> update status to 'Defaulter'
    }
});
```

## 5. Folder Structure (Mobile App)
```text
/src
 ├── /assets           # Icons, images, fonts
 ├── /components       # Reusable UI (Cards, Buttons, Charts)
 ├── /screens          # Main Views (Dashboard, LoanList, LoanDetails)
 ├── /navigation       # Bottom Tabs, Stack Navigators
 ├── /services         # API calls, Axios instances
 ├── /store            # Redux or Zustand for state management
 ├── /utils            # Interest math, Date formatting
 └── App.tsx           # Entry point
```

## 6. Advanced Fintech Features Supported
- **Auto Interest Engine:** Decoupled CRON job ensuring exact daily/monthly calculations.
- **Defaulter Detection:** Flags borrowers whose interest logs remain `is_paid = FALSE` for > 60 days.
- **Security:** Hashed PIN stored in local keychain (React Native Keychain).
- **Export:** Generation of raw CSVs for Excel or PDF rendering via `react-native-html-to-pdf`.
