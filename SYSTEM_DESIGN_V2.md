# Production Loan Management System Architecture

## 1. System Architecture
- **Frontend:** React Native (Mobile App) & React.js (Web Admin Panel)
- **Backend:** Node.js with Express / NestJS (TypeScript)
- **Database:** PostgreSQL (Relational Database for Financial Data Integrity)
- **Caching & Queues:** Redis (For JWT blacklisting and background jobs)
- **Task Scheduler:** BullMQ / Node-Cron (For Auto Interest Engine)
- **Cloud Storage:** AWS S3 (For ID Proofs and Loan Agreements)

## 2. Database Schema (PostgreSQL)

```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'PROVIDER', 'TAKER');
CREATE TYPE loan_status AS ENUM ('ACTIVE', 'COMPLETED', 'OVERDUE', 'DEFAULTER');
CREATE TYPE payment_type AS ENUM ('INTEREST', 'PRINCIPAL', 'PENALTY');
CREATE TYPE interest_cycle AS ENUM ('DAILY', 'MONTHLY');
CREATE TYPE interest_type AS ENUM ('SIMPLE', 'COMPOUND');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES users(id),
    taker_id UUID REFERENCES users(id),
    principal_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    interest_type interest_type NOT NULL,
    interest_cycle interest_cycle NOT NULL,
    loan_start_date DATE NOT NULL,
    last_calculated_date DATE,
    total_interest_earned DECIMAL(15, 2) DEFAULT 0.00,
    status loan_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id),
    amount DECIMAL(15, 2) NOT NULL,
    payment_type payment_type NOT NULL,
    payment_date DATE NOT NULL,
    document_url VARCHAR(500), -- Proof of payment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interest_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id),
    calculation_date DATE NOT NULL,
    interest_amount DECIMAL(15, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    loan_id UUID REFERENCES loans(id),
    document_type VARCHAR(50) NOT NULL, -- 'ID_PROOF', 'AGREEMENT'
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Entity Relationship (ER) Context
- **Users (Provider)** `1 : N` **Loans**
- **Users (Taker)** `1 : N` **Loans**
- **Loans** `1 : N` **Payments**
- **Loans** `1 : N` **Interest Logs**

## 4. API Endpoints Design

### Auth
- `POST /api/auth/register` - Register user (select Provider/Taker)
- `POST /api/auth/login` - Returns JWT token

### Admin
- `GET /api/admin/users` - View all users
- `PUT /api/admin/users/:id/status` - Activate/Deactivate
- `GET /api/admin/analytics` - System-wide money flow

### Loans
- `POST /api/loans` - Create loan (Provider only)
- `GET /api/loans` - Get loans based on context (Provider gets their lent loans, Taker gets their borrowed loans)
- `GET /api/loans/:id` - Loan Details

### Payments
- `POST /api/payments` - Add payment
- `GET /api/loans/:id/payments` - Get payment history
