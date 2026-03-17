# Design Document: Personal Loan & Interest Tracking App

## Overview
This application is designed for private money lenders to manage multiple loans, track interest earnings, and manage repayments with a clean, modern, and professional fintech UI.

## Visual Design System
- **Theme:** Modern Fintech / Material 3
- **Primary Color:** `#1A237E` (Navy Blue) - For headers, primary buttons, and navigation.
- **Accent Color:** `#4CAF50` (Green) - For positive financial indicators (profit, completed loans).
- **Secondary Color:** `#FF9800` (Orange) - For warnings (overdue loans).
- **Background:** `#F5F5F5` (Light Grey) - For card backgrounds and spacing.
- **Typography:** Inter / Roboto (Sans-serif) - Focused on clarity and data hierarchy.
- **Components:** 
  - Cards with `16px` border-radius and `0 4px 12px rgba(0,0,0,0.1)` shadows.
  - Floating Action Buttons (FAB) for "Add Loan" and "Add Payment".
  - Bottom Navigation Bar with 5 tabs.

## Information Architecture
- **Dashboard:** Overview metrics (Total Given, Interest Profit, Active Loans, Overdue).
- **Loans:** Searchable list of all active/completed/overdue loans.
- **Payments:** History and new entry for interest/principal payments.
- **Reports:** Charts for monthly profit and loan distribution.
- **Reminders:** Due date tracking and reminder triggers.

## Technical Architecture
- **Framework:** React 18 (TypeScript)
- **Styling:** CSS Modules / Vanilla CSS (Modern CSS 3)
- **Icons:** Lucide-React
- **Mock Persistence:** LocalStorage for state persistence in the prototype.

## Screen Definitions
1. **Dashboard:** 
   - Summary Cards (Total Lent, Monthly Interest, Active Count, Overdue Count).
   - Recent Loans List (top 5).
   - FAB: "+" to add loan.
2. **Add Loan:** 
   - Modal/Full-screen form.
   - Inputs: Name, Phone, Amount, Rate (%), Start Date, Type (Simple/Compound), Cycle (Monthly/Daily), Notes.
3. **Loan Details:** 
   - Summary Header.
   - Progress bar (if applicable).
   - Payment history list.
   - Action buttons: "Add Payment", "Edit", "Mark Completed".
4. **Reports:** 
   - Total Principal vs Interest Bar Chart (CSS-based).
   - Monthly Profit Line Chart (CSS-based).
