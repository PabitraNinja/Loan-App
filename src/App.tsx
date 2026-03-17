import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  BarChart3, 
  Settings, 
  Plus, 
  ChevronRight, 
  Phone, 
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Bell,
  Trash2,
  Lock,
  Download,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { Loan, Payment, LoanStatus, PaymentType, Role, User } from './types';
import './App.css';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('loans');
    return saved ? JSON.parse(saved) : [
      { id: '1', providerId: 'prov-1', takerId: 'tak-1', name: 'John Doe', phone: '123-456-7890', amount: 50000, rate: 2, startDate: '2023-10-01', type: 'Simple', cycle: 'Monthly', status: 'Active', notes: '' },
      { id: '2', providerId: 'prov-1', takerId: 'tak-2', name: 'Sarah Smith', phone: '987-654-3210', amount: 25000, rate: 3, startDate: '2023-11-15', type: 'Simple', cycle: 'Monthly', status: 'Overdue', notes: '' },
    ];
  });
  
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('payments');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', loanId: '1', amount: 1000, date: '2023-10-15', type: 'Interest', notes: '' },
      { id: 'p2', loanId: '1', amount: 1000, date: '2023-11-15', type: 'Interest', notes: '' },
    ];
  });

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Auth Handling
  const mockLogin = (role: Role) => {
    let mockUser: User;
    if (role === 'ADMIN') mockUser = { id: 'admin-1', name: 'Super Admin', email: 'admin@system.com', role: 'ADMIN', status: 'Active' };
    else if (role === 'PROVIDER') mockUser = { id: 'prov-1', name: 'Lender Pro', email: 'lender@system.com', role: 'PROVIDER', status: 'Active' };
    else mockUser = { id: 'tak-1', name: 'John Doe', email: 'john@system.com', role: 'TAKER', status: 'Active' };
    
    setCurrentUser(mockUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to log out?')) {
      setCurrentUser(null);
    }
  };

  // Export Data
  const exportToCSV = () => {
    const headers = ['ID', 'Borrower', 'Amount', 'Rate', 'Status'];
    const rows = loans.map(l => [l.id, l.name, l.amount, l.rate, l.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "loan_portfolio_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setupPin = () => {
    const newPin = window.prompt('Enter a 4-digit PIN to lock sensitive actions:');
    if (newPin && newPin.length >= 4) {
      localStorage.setItem('appPin', newPin);
      alert('Security PIN updated successfully.');
    }
  };

  // Interest Calculation Engine
  const getAccruedInterest = (loan: Loan) => {
    const start = new Date(loan.startDate);
    const today = new Date();
    const diffTime = Math.max(0, today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const monthlyRate = loan.rate / 100;
    const dailyRate = monthlyRate / 30;
    
    let accrued = 0;
    if (loan.type === 'Simple') {
      accrued = loan.amount * dailyRate * diffDays;
    } else {
      accrued = loan.amount * (Math.pow(1 + dailyRate, diffDays) - 1);
    }
    return Math.round(accrued);
  };

  const getLoanStats = (loan: Loan) => {
    const loanPayments = payments.filter(p => p.loanId === loan.id);
    const principalPaid = loanPayments.filter(p => p.type === 'Principal').reduce((acc, p) => acc + p.amount, 0);
    const interestPaid = loanPayments.filter(p => p.type === 'Interest').reduce((acc, p) => acc + p.amount, 0);
    
    const accruedInterest = getAccruedInterest(loan);
    const unpaidInterest = Math.max(0, accruedInterest - interestPaid);
    const remainingPrincipal = Math.max(0, loan.amount - principalPaid);
    
    return {
      remainingPrincipal,
      accruedInterest,
      unpaidInterest,
      interestPaid,
      totalOutstanding: remainingPrincipal + unpaidInterest
    };
  };

  // Derived Stats based on Context
  let contextualLoans = loans;
  if (currentUser?.role === 'PROVIDER') contextualLoans = loans.filter(l => l.providerId === currentUser.id);
  if (currentUser?.role === 'TAKER') contextualLoans = loans.filter(l => l.takerId === currentUser.id);

  const activeLoans = contextualLoans.filter(l => l.status !== 'Completed');
  const totalGiven = activeLoans.reduce((acc, l) => acc + l.amount, 0);
  
  const totalAccruedProfit = activeLoans.reduce((acc, l) => acc + getAccruedInterest(l), 0);
  const monthlyProfit = activeLoans.reduce((acc, l) => acc + (l.amount * l.rate / 100), 0);
  
  const contextualPayments = payments.filter(p => contextualLoans.some(l => l.id === p.loanId));
  const totalInterestPaid = contextualPayments.filter(p => p.type === 'Interest').reduce((acc, p) => acc + p.amount, 0);
  
  const activeCount = contextualLoans.filter(l => l.status === 'Active').length;
  const overdueCount = contextualLoans.filter(l => l.status === 'Overdue' || l.status === 'Defaulter').length;

  // Security Verification (Mocked for Prototype)
  const verifySecurityAction = () => {
    const savedPin = localStorage.getItem('appPin');
    if (!savedPin) return true; // Disabled for ease of demo
    const input = window.prompt('Enter your 4-digit security PIN to confirm:');
    if (input === savedPin) return true;
    
    alert('Incorrect PIN. Security check failed.');
    return false;
  };

  // Handlers
  const addLoan = (loan: Omit<Loan, 'id' | 'providerId' | 'takerId'>) => {
    if (!verifySecurityAction()) return;
    const newLoan: Loan = { 
      ...loan, 
      id: Date.now().toString(),
      providerId: currentUser?.id || 'prov-unknown',
      takerId: `tak-${Date.now()}` // Mocking taker assignment
    };
    setLoans([...loans, newLoan]);
    setActiveTab('dashboard');
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment = { ...payment, id: Date.now().toString() };
    setPayments([...payments, newPayment]);
    
    const loan = loans.find(l => l.id === payment.loanId);
    if (loan && payment.type === 'Principal') {
        const principalPaid = payments.filter(p => p.loanId === loan.id && p.type === 'Principal').reduce((acc, p) => acc + p.amount, 0) + payment.amount;
        if (principalPaid >= loan.amount) {
            setLoans(loans.map(l => l.id === loan.id ? { ...l, status: 'Completed' } : l));
        }
    }
    setActiveTab('loan-details');
  };

  const deleteLoan = (id: string) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      if (!verifySecurityAction()) return;
      setLoans(loans.filter(l => l.id !== id));
      setPayments(payments.filter(p => p.loanId !== id));
      setActiveTab('loans');
    }
  };

  const markStatus = (id: string, status: LoanStatus) => {
    setLoans(loans.map(l => l.id === id ? { ...l, status } : l));
    setActiveTab('loan-details');
  };

  if (!currentUser) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px', background: 'var(--primary-navy)', color: 'white' }}>
        <ShieldAlert size={64} style={{ marginBottom: '20px', color: 'var(--accent-green)' }} />
        <h1 style={{ marginBottom: '8px', color: 'white' }}>LoanManager Pro</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '40px', textAlign: 'center' }}>Select your role to access the system</p>
        
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={() => mockLogin('ADMIN')} className="btn" style={{ background: 'white', color: 'var(--primary-navy)' }}>
            <ShieldAlert size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Login as Admin
          </button>
          <button onClick={() => mockLogin('PROVIDER')} className="btn" style={{ background: 'white', color: 'var(--primary-navy)' }}>
            <Wallet size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Login as Provider
          </button>
          <button onClick={() => mockLogin('TAKER')} className="btn" style={{ background: 'white', color: 'var(--primary-navy)' }}>
            <UserCheck size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Login as Taker
          </button>
        </div>
      </div>
    );
  }

  const renderAdminDashboard = () => (
    <div className="screen">
      <div className="header">
        <h1>Admin Control</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>System Overview</p>
      </div>

      <div className="stats-grid">
        <div className="card" style={{ background: 'var(--primary-navy)', color: 'white' }}>
          <p className="card-title" style={{ color: 'rgba(255,255,255,0.7)' }}>Total Money in System</p>
          <p className="card-value" style={{ color: 'white' }}>₹{(loans.filter(l => l.status !== 'Completed').reduce((acc, l) => acc + l.amount, 0)/1000).toFixed(1)}k</p>
        </div>
        <div className="card">
          <p className="card-title">Total Users</p>
          <p className="card-value" style={{ color: 'var(--accent-green)' }}>3</p>
        </div>
      </div>

      <h3>System Actions</h3>
      <div className="card">
        <div className="list-item">
          <div className="item-icon"><Users size={20} /></div>
          <div className="item-info">
            <p className="item-name">Manage Users</p>
            <p className="item-subtitle">Approve or Reject KYC</p>
          </div>
          <ChevronRight size={20} color="#ccc" />
        </div>
        <div className="list-item">
          <div className="item-icon"><BarChart3 size={20} /></div>
          <div className="item-info">
            <p className="item-name">Platform Analytics</p>
            <p className="item-subtitle">View global profit charts</p>
          </div>
          <ChevronRight size={20} color="#ccc" />
        </div>
      </div>
    </div>
  );

  const renderProviderDashboard = () => (
    <div className="screen">
      <div className="header">
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Welcome, {currentUser.name}</p>
      </div>

      <div className="stats-grid">
        <div className="card" style={{ background: 'var(--primary-navy)', color: 'white' }}>
          <p className="card-title" style={{ color: 'rgba(255,255,255,0.7)' }}>Total Lent</p>
          <p className="card-value" style={{ color: 'white' }}>₹{(totalGiven/1000).toFixed(1)}k</p>
        </div>
        <div className="card">
          <p className="card-title">Monthly Profit</p>
          <p className="card-value" style={{ color: 'var(--accent-green)' }}>₹{monthlyProfit.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="card-title">Interest Earned</p>
          <p className="card-value">₹{totalInterestPaid.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="card-title">Overdue/Defaulters</p>
          <p className="card-value" style={{ color: 'var(--accent-red)' }}>{overdueCount}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}>
        <h3 style={{ margin: 0 }}>Recent Loans Given</h3>
        <button className="btn" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', background: 'transparent', color: 'var(--primary-navy)' }} onClick={() => setActiveTab('loans')}>View All</button>
      </div>

      {contextualLoans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <p>No loans yet. Tap + to add one.</p>
        </div>
      ) : (
        contextualLoans.slice(0, 5).map(loan => (
          <div key={loan.id} className="card" style={{ padding: '12px', cursor: 'pointer', borderLeft: loan.status === 'Defaulter' ? '4px solid var(--accent-red)' : '' }} onClick={() => { setSelectedLoanId(loan.id); setActiveTab('loan-details'); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="item-name">{loan.name} {loan.status === 'Defaulter' && '⚠️'}</p>
                <p className="item-subtitle">{loan.rate}% Interest • {loan.cycle}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="amount-main">₹{loan.amount.toLocaleString()}</p>
                <p className="amount-sub">+₹{(loan.amount * loan.rate / 100).toLocaleString()}/mo</p>
              </div>
            </div>
          </div>
        ))
      )}

      {currentUser.role === 'PROVIDER' && (
        <button className="fab" onClick={() => setActiveTab('add-loan')}>
          <Plus size={28} />
        </button>
      )}
    </div>
  );

  const renderTakerDashboard = () => (
    <div className="screen">
      <div className="header">
        <h1>My Loans</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Welcome, {currentUser.name}</p>
      </div>

      <div className="card" style={{ background: 'var(--accent-orange)', color: 'white' }}>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>Total Borrowed</p>
        <p style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0' }}>₹{totalGiven.toLocaleString()}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
          <div>
            <p style={{ opacity: 0.8, fontSize: '12px' }}>Total Unpaid Interest</p>
            <p style={{ fontWeight: '600' }}>₹{contextualLoans.reduce((acc, l) => acc + getLoanStats(l).unpaidInterest, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <h3>Active Borrowings</h3>
      {contextualLoans.filter(l => l.status !== 'Completed').map(loan => {
        const stats = getLoanStats(loan);
        return (
          <div key={loan.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedLoanId(loan.id); setActiveTab('loan-details'); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className={`badge badge-${loan.status.toLowerCase()}`}>{loan.status}</span>
              <p className="item-subtitle">Lender: Pro-Fin</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p className="item-name">Principal: ₹{stats.remainingPrincipal.toLocaleString()}</p>
                <p className="item-subtitle">Interest Due: ₹{stats.unpaidInterest.toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="amount-main">Total Owed</p>
                <p className="amount-sub" style={{ color: 'var(--accent-red)' }}>₹{stats.totalOutstanding.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDashboard = () => {
    if (currentUser.role === 'ADMIN') return renderAdminDashboard();
    if (currentUser.role === 'TAKER') return renderTakerDashboard();
    return renderProviderDashboard();
  };

  const renderLoansList = () => {
    const filteredLoans = loans.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.phone.includes(searchQuery)
    );

    return (
      <div className="screen">
        <div className="header">
          <h1>{currentUser.role === 'TAKER' ? 'My Borrowings' : 'All Loans'}</h1>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search..." 
                style={{ paddingLeft: '36px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn" style={{ width: '48px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2ff', color: 'var(--primary-navy)' }}>
              <Filter size={20} />
            </button>
          </div>
        </div>

        {filteredLoans.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
            <p>No matching loans found.</p>
          </div>
        ) : (
          filteredLoans.map(loan => (
            <div key={loan.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedLoanId(loan.id); setActiveTab('loan-details'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className={`badge badge-${loan.status.toLowerCase()}`}>{loan.status}</span>
                <p className="item-subtitle">{loan.startDate}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p className="item-name">{loan.name}</p>
                  <p className="item-subtitle">{loan.phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="amount-main">₹{loan.amount.toLocaleString()}</p>
                  <p className="amount-sub">{loan.rate}% Monthly</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderLoanDetails = () => {
    const loan = loans.find(l => l.id === selectedLoanId);
    if (!loan) return <div className="screen"><p>Loan not found</p></div>;

    const loanPayments = payments.filter(p => p.loanId === loan.id);
    const principalPaid = loanPayments.filter(p => p.type === 'Principal').reduce((acc, p) => acc + p.amount, 0);
    const interestPaid = loanPayments.filter(p => p.type === 'Interest').reduce((acc, p) => acc + p.amount, 0);
    const remainingBalance = loan.amount - principalPaid;

    return (
      <div className="screen">
        <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setActiveTab('loans')} style={{ background: 'none', border: 'none', color: 'var(--primary-navy)', cursor: 'pointer' }}>
             <ChevronRight style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h1>Loan Details</h1>
          {currentUser.role === 'PROVIDER' && (
            <button 
              onClick={() => deleteLoan(loan.id)} 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <div className="card" style={{ background: 'var(--primary-navy)', color: 'white' }}>
          <p style={{ opacity: 0.8, fontSize: '14px' }}>Remaining Balance</p>
          <p style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0' }}>₹{remainingBalance.toLocaleString()}</p>
          <p style={{ opacity: 0.8, fontSize: '12px' }}>Original: ₹{loan.amount.toLocaleString()}</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            <div>
              <p style={{ opacity: 0.7, fontSize: '12px' }}>Interest Rate</p>
              <p style={{ fontWeight: '600' }}>{loan.rate}% {loan.type}</p>
            </div>
            <div>
              <p style={{ opacity: 0.7, fontSize: '12px' }}>Monthly Earnings</p>
              <p style={{ fontWeight: '600', color: '#81c784' }}>+₹{(remainingBalance * loan.rate / 100).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: '16px' }}>
          <div className="card">
            <p className="card-title">Status</p>
            <span className={`badge badge-${loan.status.toLowerCase()}`}>{loan.status}</span>
          </div>
          <div className="card">
            <p className="card-title">Total Interest Paid</p>
            <p className="card-value" style={{ color: 'var(--accent-green)' }}>₹{interestPaid.toLocaleString()}</p>
          </div>
        </div>

        {loan.status !== 'Completed' && currentUser.role === 'PROVIDER' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {loan.status !== 'Defaulter' && (
              <button className="btn" style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#ffebee', color: 'var(--accent-red)' }} onClick={() => markStatus(loan.id, 'Defaulter')}>Mark Defaulter</button>
            )}
            <button className="btn" style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#fff3e0', color: 'var(--accent-orange)' }} onClick={() => markStatus(loan.id, 'Overdue')}>Mark Overdue</button>
            <button className="btn" style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#e8f5e9', color: 'var(--accent-green)' }} onClick={() => markStatus(loan.id, 'Completed')}>Complete Loan</button>
          </div>
        )}

        <h3>Borrower Info</h3>
        <div className="card">
          <div className="list-item">
            <div className="item-icon"><Users size={20} /></div>
            <div className="item-info">
              <p className="item-name">{loan.name}</p>
              <p className="item-subtitle">Borrower Name</p>
            </div>
          </div>
          <div className="list-item">
            <div className="item-icon"><Phone size={20} /></div>
            <div className="item-info">
              <p className="item-name">{loan.phone}</p>
              <p className="item-subtitle">Contact Number</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Payment History</h3>
          <p className="item-subtitle">{loanPayments.length} entries</p>
        </div>
        
        <div className="card" style={{ padding: '0 16px' }}>
          {loanPayments.length === 0 ? (
            <p style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No payments recorded yet.</p>
          ) : (
            loanPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
              <div key={p.id} className="list-item">
                <div className="item-info">
                  <p className="item-name">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="item-subtitle">{p.type} Payment</p>
                </div>
                <p className="amount-main" style={{ color: p.type === 'Interest' ? 'var(--accent-green)' : 'var(--primary-navy)' }}>+₹{p.amount.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>

        {loan.status !== 'Completed' && (
          <div style={{ display: 'flex', marginTop: '12px' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setActiveTab('add-payment')}>
              {currentUser.role === 'TAKER' ? 'Make Payment' : 'Add Payment'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAddLoan = () => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      addLoan({
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        amount: Number(formData.get('amount')),
        rate: Number(formData.get('rate')),
        startDate: formData.get('startDate') as string,
        type: formData.get('type') as 'Simple' | 'Compound',
        cycle: formData.get('cycle') as 'Monthly' | 'Daily',
        status: 'Active',
        notes: formData.get('notes') as string,
      });
    };

    return (
      <div className="screen">
        <div className="header">
          <h1>New Loan</h1>
        </div>
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>Borrower Name</label>
            <input name="name" type="text" placeholder="Enter name" required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input name="phone" type="tel" placeholder="Enter phone" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input name="amount" type="number" placeholder="50000" required />
            </div>
            <div className="form-group">
              <label>Interest Rate (%)</label>
              <input name="rate" type="number" step="0.1" placeholder="2" required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Interest Type</label>
              <select name="type">
                <option value="Simple">Simple</option>
                <option value="Compound">Compound</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Cycle</label>
              <select name="cycle">
                <option value="Monthly">Monthly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input name="startDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" rows={3} placeholder="Additional details..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Save Loan</button>
          <button type="button" className="btn" style={{ marginTop: '8px', background: 'transparent' }} onClick={() => setActiveTab('dashboard')}>Cancel</button>
        </form>
      </div>
    );
  };

  const renderAddPayment = () => {
    const loan = loans.find(l => l.id === selectedLoanId);
    if (!loan) return null;

    const remainingBalance = loan.amount - payments.filter(p => p.loanId === loan.id && p.type === 'Principal').reduce((acc, p) => acc + p.amount, 0);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      addPayment({
        loanId: loan.id,
        amount: Number(formData.get('amount')),
        type: formData.get('type') as PaymentType,
        date: formData.get('date') as string,
        notes: formData.get('notes') as string,
      });
    };

    return (
      <div className="screen">
        <div className="header">
          <h1>{currentUser.role === 'TAKER' ? 'Make Payment' : 'Add Payment'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>For {loan.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>Payment Amount (₹)</label>
            <input name="amount" type="number" defaultValue={remainingBalance * loan.rate / 100} required />
          </div>
          <div className="form-group">
            <label>Payment Type</label>
            <select name="type">
              <option value="Interest">Interest</option>
              <option value="Principal">Principal (Reduces Balance)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" rows={2} placeholder="Optional notes..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary">{currentUser.role === 'TAKER' ? 'Submit Payment' : 'Save Payment'}</button>
          <button type="button" className="btn" style={{ marginTop: '8px', background: 'transparent' }} onClick={() => setActiveTab('loan-details')}>Cancel</button>
        </form>
      </div>
    );
  };

  const renderReports = () => (
    <div className="screen">
      <div className="header">
        <h1>Analytics</h1>
      </div>
      
      <div className="stats-grid">
        <div className="card">
          <p className="card-title">Interest Earned (Total)</p>
          <p className="card-value" style={{ color: 'var(--accent-green)' }}>₹{(totalInterestPaid / 1000).toFixed(1)}k</p>
        </div>
        <div className="card">
          <p className="card-title">Principal Recovered</p>
          <p className="card-value">₹{(payments.filter(p => p.type === 'Principal').reduce((acc, p) => acc + p.amount, 0) / 1000).toFixed(1)}k</p>
        </div>
      </div>

      <h3>Loan Portfolio Distribution</h3>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
           <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--primary-navy)' }}></div>
           <p className="item-subtitle" style={{ flex: 1 }}>Active Loans</p>
           <p className="amount-main">{contextualLoans.length > 0 ? Math.round((activeCount / contextualLoans.length) * 100) : 0}%</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
           <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--accent-green)' }}></div>
           <p className="item-subtitle" style={{ flex: 1 }}>Completed</p>
           <p className="amount-main">{contextualLoans.length > 0 ? Math.round((contextualLoans.filter(l => l.status === 'Completed').length / contextualLoans.length) * 100) : 0}%</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--accent-red)' }}></div>
           <p className="item-subtitle" style={{ flex: 1 }}>Overdue / Defaulter</p>
           <p className="amount-main">{contextualLoans.length > 0 ? Math.round((overdueCount / contextualLoans.length) * 100) : 0}%</p>
        </div>
      </div>
    </div>
  );

  const renderReminders = () => (
    <div className="screen">
      <div className="header">
        <h1>Upcoming Dues</h1>
      </div>

      {activeLoans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <p>No active loans to track.</p>
        </div>
      ) : (
        activeLoans.map((loan, i) => {
          const remainingBalance = loan.amount - payments.filter(p => p.loanId === loan.id && p.type === 'Principal').reduce((acc, p) => acc + p.amount, 0);
          const interestDue = remainingBalance * loan.rate / 100;
          return (
            <div key={loan.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="item-name">{loan.name}</p>
                <p className="item-subtitle">Due in {Math.floor(Math.random() * 5) + 1} days</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="amount-main" style={{ color: loan.status === 'Overdue' || loan.status === 'Defaulter' ? 'var(--accent-red)' : 'var(--text-main)' }}>₹{interestDue.toLocaleString()}</p>
                {currentUser.role === 'PROVIDER' && (
                  <button className="btn" style={{ width: 'auto', padding: '4px 12px', fontSize: '12px', background: '#f0f2ff', color: 'var(--primary-navy)', marginTop: '4px' }}>
                    <Bell size={12} style={{ marginRight: '4px' }} /> Remind
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="screen">
      <div className="header">
        <h1>Settings</h1>
      </div>
      
      <div className="card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--primary-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
          {currentUser.name.charAt(0)}
        </div>
        <div>
          <p className="item-name">{currentUser.name}</p>
          <p className="item-subtitle">{currentUser.email} • {currentUser.role}</p>
        </div>
      </div>

      <div className="card">
        {currentUser.role !== 'TAKER' && (
          <>
            <div className="list-item" onClick={setupPin} style={{ cursor: 'pointer' }}>
              <div className="item-icon"><Lock size={20} /></div>
              <div className="item-info">
                <p className="item-name">App Security</p>
                <p className="item-subtitle">{localStorage.getItem('appPin') ? 'Update PIN code' : 'Setup App Lock PIN'}</p>
              </div>
              <ChevronRight size={20} color="#ccc" />
            </div>
            <div className="list-item" onClick={exportToCSV} style={{ cursor: 'pointer' }}>
              <div className="item-icon"><Download size={20} /></div>
              <div className="item-info">
                <p className="item-name">Export to CSV</p>
                <p className="item-subtitle">Download database report</p>
              </div>
              <ChevronRight size={20} color="#ccc" />
            </div>
          </>
        )}
        <div className="list-item" onClick={handleLogout} style={{ cursor: 'pointer', borderBottom: 'none' }}>
          <div className="item-icon" style={{ background: '#ffeeee', color: 'var(--accent-red)' }}><UserCheck size={20} /></div>
          <div className="item-info">
            <p className="item-name" style={{ color: 'var(--accent-red)' }}>Log Out</p>
            <p className="item-subtitle">Switch account</p>
          </div>
          <ChevronRight size={20} color="#ccc" />
        </div>
      </div>
      
      {currentUser.role === 'ADMIN' && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="list-item" onClick={() => { if(window.confirm('Wipe all data globally?')) { localStorage.clear(); window.location.reload(); } }} style={{ cursor: 'pointer', borderBottom: 'none' }}>
            <div className="item-icon" style={{ background: '#ffeeee', color: 'var(--accent-red)' }}><Trash2 size={20} /></div>
            <div className="item-info">
              <p className="item-name" style={{ color: 'var(--accent-red)' }}>Factory Reset</p>
              <p className="item-subtitle">Clear all system data</p>
            </div>
            <ChevronRight size={20} color="#ccc" />
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LoanManager Pro v2.0</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Multi-User Enterprise Edition</p>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'loans' && renderLoansList()}
      {activeTab === 'loan-details' && renderLoanDetails()}
      {activeTab === 'add-loan' && renderAddLoan()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'reminders' && renderReminders()}
      {activeTab === 'settings' && renderSettings()}
      {activeTab === 'add-payment' && renderAddPayment()}

      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={24} />
          <span>Home</span>
        </div>
        <div className={`nav-item ${activeTab === 'loans' || activeTab === 'loan-details' ? 'active' : ''}`} onClick={() => setActiveTab('loans')}>
          <Users size={24} />
          <span>Loans</span>
        </div>
        <div className={`nav-item ${activeTab === 'reminders' ? 'active' : ''}`} onClick={() => setActiveTab('reminders')}>
          <Bell size={24} />
          <span>Dues</span>
        </div>
        {currentUser.role !== 'TAKER' && (
          <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <BarChart3 size={24} />
            <span>Reports</span>
          </div>
        )}
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={24} />
          <span>Account</span>
        </div>
      </nav>
    </div>
  );
};

export default App;
