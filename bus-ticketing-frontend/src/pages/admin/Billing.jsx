import React, { useState, useEffect, useRef } from 'react';
import '../../css/billing.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Billing = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const invoiceRef = useRef();

  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all',
    status: 'all',
    minAmount: '',
    maxAmount: '',
    busNumber: ''
  });

  // Summary stats
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    refundedTransactions: 0
  });

  // Sample transactions data (replace with API call)
  const sampleTransactions = [
    {
      transaction_id: 'TXN-20251121-001',
      booking_id: 'BK-001',
      customer_name: 'John Doe',
      customer_phone: '9841234567',
      bus_number: 'BA 2 KHA 1234',
      route: 'Kathmandu → Pokhara',
      seats: ['A1', 'A2'],
      seat_count: 2,
      price_per_seat: 1200,
      total_amount: 2400,
      payment_method: 'eSewa',
      payment_status: 'completed',
      booking_date: '2025-11-21T10:30:00',
      travel_date: '2025-11-25',
      transaction_date: '2025-11-21T10:30:00'
    },
    {
      transaction_id: 'TXN-20251121-002',
      booking_id: 'BK-002',
      customer_name: 'Jane Smith',
      customer_phone: '9847654321',
      bus_number: 'BA 2 KHA 5678',
      route: 'Pokhara → Chitwan',
      seats: ['B3'],
      seat_count: 1,
      price_per_seat: 800,
      total_amount: 800,
      payment_method: 'Khalti',
      payment_status: 'completed',
      booking_date: '2025-11-21T11:15:00',
      travel_date: '2025-11-26',
      transaction_date: '2025-11-21T11:15:00'
    },
    {
      transaction_id: 'TXN-20251121-003',
      booking_id: 'BK-003',
      customer_name: 'Ram Sharma',
      customer_phone: '9801112233',
      bus_number: 'BA 2 KHA 1234',
      route: 'Kathmandu → Butwal',
      seats: ['C5', 'C6', 'C7'],
      seat_count: 3,
      price_per_seat: 1500,
      total_amount: 4500,
      payment_method: 'Bank Transfer',
      payment_status: 'pending',
      booking_date: '2025-11-20T14:20:00',
      travel_date: '2025-11-28',
      transaction_date: '2025-11-20T14:20:00'
    },
    {
      transaction_id: 'TXN-20251120-004',
      booking_id: 'BK-004',
      customer_name: 'Sita Gurung',
      customer_phone: '9823445566',
      bus_number: 'BA 2 KHA 5678',
      route: 'Kathmandu → Dharan',
      seats: ['D1', 'D2'],
      seat_count: 2,
      price_per_seat: 1800,
      total_amount: 3600,
      payment_method: 'Cash',
      payment_status: 'completed',
      booking_date: '2025-11-20T09:00:00',
      travel_date: '2025-11-24',
      transaction_date: '2025-11-20T09:00:00'
    },
    {
      transaction_id: 'TXN-20251119-005',
      booking_id: 'BK-005',
      customer_name: 'Hari Thapa',
      customer_phone: '9812334455',
      bus_number: 'BA 2 KHA 1234',
      route: 'Pokhara → Kathmandu',
      seats: ['A5'],
      seat_count: 1,
      price_per_seat: 1200,
      total_amount: 1200,
      payment_method: 'eSewa',
      payment_status: 'refunded',
      booking_date: '2025-11-19T16:45:00',
      travel_date: '2025-11-22',
      transaction_date: '2025-11-19T16:45:00'
    }
  ];

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [transactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // In production, replace with actual API call
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${API_URL}/transactions/vendor`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setTransactions(data.data?.transactions || []);
      
      // Simulated API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setTransactions(sampleTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const completed = transactions.filter(t => t.payment_status === 'completed');
    const pending = transactions.filter(t => t.payment_status === 'pending');
    const refunded = transactions.filter(t => t.payment_status === 'refunded');
    
    setStats({
      totalTransactions: transactions.length,
      totalRevenue: completed.reduce((sum, t) => sum + t.total_amount, 0),
      completedTransactions: completed.length,
      pendingTransactions: pending.length,
      refundedTransactions: refunded.length
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      paymentMethod: 'all',
      status: 'all',
      minAmount: '',
      maxAmount: '',
      busNumber: ''
    });
  };

  const applyFilters = () => {
    return transactions.filter(transaction => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          transaction.transaction_id.toLowerCase().includes(searchLower) ||
          transaction.customer_name.toLowerCase().includes(searchLower) ||
          transaction.customer_phone.includes(searchLower) ||
          transaction.booking_id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const transactionDate = new Date(transaction.transaction_date).toISOString().split('T')[0];
        if (transactionDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const transactionDate = new Date(transaction.transaction_date).toISOString().split('T')[0];
        if (transactionDate > filters.dateTo) return false;
      }

      // Payment method filter
      if (filters.paymentMethod !== 'all' && transaction.payment_method !== filters.paymentMethod) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && transaction.payment_status !== filters.status) {
        return false;
      }

      // Amount range filter
      if (filters.minAmount && transaction.total_amount < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && transaction.total_amount > parseFloat(filters.maxAmount)) {
        return false;
      }

      // Bus number filter
      if (filters.busNumber && !transaction.bus_number.toLowerCase().includes(filters.busNumber.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  const filteredTransactions = applyFilters();

  const handleViewInvoice = (transaction) => {
    setSelectedTransaction(transaction);
    setShowInvoice(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Transaction ID', 'Customer', 'Phone', 'Bus', 'Route', 'Seats', 'Amount', 'Payment Method', 'Status', 'Date'];
    const rows = filteredTransactions.map(t => [
      t.transaction_id,
      t.customer_name,
      t.customer_phone,
      t.bus_number,
      t.route,
      t.seats.join('; '),
      t.total_amount,
      t.payment_method,
      t.payment_status,
      new Date(t.transaction_date).toLocaleString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { class: 'status-completed', label: 'Completed', icon: '✓' },
      pending: { class: 'status-pending', label: 'Pending', icon: '⏳' },
      refunded: { class: 'status-refunded', label: 'Refunded', icon: '↩️' },
      failed: { class: 'status-failed', label: 'Failed', icon: '✗' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="billing-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">💰 Billing & Transactions</h1>
          <p className="page-subtitle">View and manage all your transactions</p>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={handleDownloadCSV}>
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">💵</div>
          <div className="stat-info">
            <p className="stat-label">Total Revenue</p>
            <h3 className="stat-value">Rs. {stats.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <p className="stat-label">Completed</p>
            <h3 className="stat-value">{stats.completedTransactions}</h3>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <p className="stat-label">Pending</p>
            <h3 className="stat-value">{stats.pendingTransactions}</h3>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">↩️</div>
          <div className="stat-info">
            <p className="stat-label">Refunded</p>
            <h3 className="stat-value">{stats.refundedTransactions}</h3>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        <div className="filters-header">
          <h3>🔍 Filters</h3>
          <button className="btn-reset" onClick={resetFilters}>Reset All</button>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Transaction ID, customer, phone..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Methods</option>
              <option value="eSewa">eSewa</option>
              <option value="Khalti">Khalti</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Min Amount</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Max Amount</label>
            <input
              type="number"
              placeholder="999999"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Bus Number</label>
            <input
              type="text"
              placeholder="e.g., BA 2 KHA 1234"
              value={filters.busNumber}
              onChange={(e) => handleFilterChange('busNumber', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-container">
        <div className="transactions-header">
          <h3>📋 Transactions List</h3>
          <p className="results-count">
            Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
          </p>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Bus & Route</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.transaction_id}>
                    <td className="transaction-id">{transaction.transaction_id}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{transaction.customer_name}</div>
                        <div className="customer-phone">{transaction.customer_phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="bus-info">
                        <div className="bus-number">{transaction.bus_number}</div>
                        <div className="route">{transaction.route}</div>
                      </div>
                    </td>
                    <td className="seats-info">
                      <span className="seat-badge">{transaction.seat_count} seat{transaction.seat_count > 1 ? 's' : ''}</span>
                      <div className="seat-numbers">{transaction.seats.join(', ')}</div>
                    </td>
                    <td className="amount">Rs. {transaction.total_amount.toLocaleString()}</td>
                    <td>
                      <span className="payment-method">{transaction.payment_method}</span>
                    </td>
                    <td>{getStatusBadge(transaction.payment_status)}</td>
                    <td className="date-info">{formatDate(transaction.transaction_date)}</td>
                    <td>
                      <button
                        className="btn-view-invoice"
                        onClick={() => handleViewInvoice(transaction)}
                        title="View Invoice"
                      >
                        📄
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoice && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowInvoice(false)}>
          <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Invoice</h2>
              <button className="close-modal" onClick={() => setShowInvoice(false)}>✕</button>
            </div>

            <div className="invoice-content" ref={invoiceRef}>
              <div className="invoice-header">
                <h1>INVOICE</h1>
                <div className="invoice-meta">
                  <div><strong>Transaction ID:</strong> {selectedTransaction.transaction_id}</div>
                  <div><strong>Date:</strong> {formatDate(selectedTransaction.transaction_date)}</div>
                </div>
              </div>

              <div className="invoice-section">
                <h3>Customer Details</h3>
                <div><strong>Name:</strong> {selectedTransaction.customer_name}</div>
                <div><strong>Phone:</strong> {selectedTransaction.customer_phone}</div>
              </div>

              <div className="invoice-section">
                <h3>Journey Details</h3>
                <div><strong>Bus Number:</strong> {selectedTransaction.bus_number}</div>
                <div><strong>Route:</strong> {selectedTransaction.route}</div>
                <div><strong>Travel Date:</strong> {selectedTransaction.travel_date}</div>
                <div><strong>Seats:</strong> {selectedTransaction.seats.join(', ')}</div>
              </div>

              <div className="invoice-section">
                <h3>Payment Details</h3>
                <table className="invoice-table">
                  <tbody>
                    <tr>
                      <td>Seat Count</td>
                      <td className="text-right">{selectedTransaction.seat_count}</td>
                    </tr>
                    <tr>
                      <td>Price per Seat</td>
                      <td className="text-right">Rs. {selectedTransaction.price_per_seat.toLocaleString()}</td>
                    </tr>
                    <tr className="total-row">
                      <td><strong>Total Amount</strong></td>
                      <td className="text-right"><strong>Rs. {selectedTransaction.total_amount.toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
                <div className="payment-info">
                  <div><strong>Payment Method:</strong> {selectedTransaction.payment_method}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedTransaction.payment_status)}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowInvoice(false)}>Close</button>
              <button className="btn-primary" onClick={handlePrintInvoice}>
                <span>🖨️</span> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
