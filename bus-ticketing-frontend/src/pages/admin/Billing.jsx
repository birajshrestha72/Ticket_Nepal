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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    paymentStatus: 'all',
    busId: ''
  });

  // Summary stats
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    refundedTransactions: 0,
    pendingAmount: 0,
    refundedAmount: 0,
    averageTransactionValue: 0,
    todayRevenue: 0,
    monthRevenue: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, itemsPerPage, filters]);

  useEffect(() => {
    calculateStats();
  }, [transactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
      });

      // Add date filters
      if (filters.dateFrom) {
        params.append('date_from', filters.dateFrom);
        console.log('📅 Date from:', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('date_to', filters.dateTo);
        console.log('📅 Date to:', filters.dateTo);
      }

      // Add status filter
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        params.append('status', filters.paymentStatus);
        console.log('📊 Status filter:', filters.paymentStatus);
      }

      // Add bus filter
      if (filters.busId) {
        params.append('bus_id', filters.busId);
        console.log('🚌 Bus filter:', filters.busId);
      }

      const url = `${API_URL}/bookings/vendor/all?${params}`;
      console.log('📡 Fetching from:', url);

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.detail || 'Failed to fetch transactions');
      }

      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.status === 'success' && data.data) {
        const bookings = data.data.bookings || [];
        console.log('✅ Bookings received:', bookings.length);
        
        // Transform bookings to transaction format
        const transformedTransactions = bookings.map(booking => ({
          transaction_id: booking.booking_reference || `BK-${booking.booking_id}`,
          booking_id: booking.booking_id,
          customer_name: booking.customer?.name || 'N/A',
          customer_phone: booking.customer?.phone || 'N/A',
          customer_email: booking.customer?.email || 'N/A',
          bus_number: booking.bus?.bus_number || 'N/A',
          bus_type: booking.bus?.bus_type || 'N/A',
          route: `${booking.route?.origin || 'N/A'} → ${booking.route?.destination || 'N/A'}`,
          seats: booking.seat_numbers || [],
          seat_count: booking.seat_numbers?.length || 0,
          price_per_seat: booking.seat_numbers?.length > 0 ? booking.total_amount / booking.seat_numbers.length : 0,
          total_amount: booking.total_amount || 0,
          payment_method: booking.payment_method || 'N/A',
          payment_status: booking.payment_status || 'pending',
          booking_status: booking.status || 'pending',
          booking_date: booking.created_at,
          travel_date: booking.journey_date,
          departure_time: booking.departure_time,
          arrival_time: booking.arrival_time,
          transaction_date: booking.created_at
        }));

        setTransactions(transformedTransactions);
        setTotalItems(data.data.total || 0);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const completed = transactions.filter(t => t.payment_status === 'completed' || t.payment_status === 'paid');
    const pending = transactions.filter(t => t.payment_status === 'pending');
    const refunded = transactions.filter(t => t.payment_status === 'refunded');
    
    const totalRevenue = completed.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const pendingAmount = pending.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const refundedAmount = refunded.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    
    // Calculate today's revenue
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = completed.filter(t => t.transaction_date?.split('T')[0] === today);
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    
    // Calculate this month's revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthTransactions = completed.filter(t => {
      const date = new Date(t.transaction_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    const monthRevenue = monthTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    
    setStats({
      totalTransactions: transactions.length,
      totalRevenue,
      completedTransactions: completed.length,
      pendingTransactions: pending.length,
      refundedTransactions: refunded.length,
      pendingAmount,
      refundedAmount,
      averageTransactionValue: completed.length > 0 ? totalRevenue / completed.length : 0,
      todayRevenue,
      monthRevenue
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      paymentStatus: 'all',
      busId: ''
    });
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleViewInvoice = (transaction) => {
    setSelectedTransaction(transaction);
    setShowInvoice(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Transaction ID', 'Customer', 'Phone', 'Bus', 'Route', 'Seats', 'Amount', 'Payment Method', 'Status', 'Date'];
    const rows = transactions.map(t => [
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
    window.URL.revokeObjectURL(url);
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
      paid: { class: 'status-completed', label: 'Paid', icon: '✓' },
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

  if (error) {
    return (
      <div className="billing-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Transactions</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchTransactions}>
            🔄 Retry
          </button>
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
            <p className="stat-label">Total Revenue (Completed)</p>
            <h3 className="stat-value">Rs. {stats.totalRevenue.toLocaleString()}</h3>
            <p className="stat-subtext">{stats.completedTransactions} completed transactions</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <p className="stat-label">Pending Payments</p>
            <h3 className="stat-value">Rs. {stats.pendingAmount.toLocaleString()}</h3>
            <p className="stat-subtext">{stats.pendingTransactions} pending transactions</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <p className="stat-label">Today's Revenue</p>
            <h3 className="stat-value">Rs. {stats.todayRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <p className="stat-label">This Month</p>
            <h3 className="stat-value">Rs. {stats.monthRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <p className="stat-label">Average Transaction</p>
            <h3 className="stat-value">Rs. {Math.round(stats.averageTransactionValue).toLocaleString()}</h3>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">↩️</div>
          <div className="stat-info">
            <p className="stat-label">Refunded</p>
            <h3 className="stat-value">Rs. {stats.refundedAmount.toLocaleString()}</h3>
            <p className="stat-subtext">{stats.refundedTransactions} refunded</p>
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
            <label>Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Bus ID (Optional)</label>
            <input
              type="text"
              placeholder="Enter bus ID"
              value={filters.busId}
              onChange={(e) => handleFilterChange('busId', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={applyFilters} className="btn-apply-filter">
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-container">
        <div className="transactions-header">
          <h3>📋 Transactions List</h3>
          <div className="transactions-controls">
            <p className="results-count">
              Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> transactions
            </p>
            <div className="per-page-selector">
              <label>Items per page:</label>
              <select 
                value={itemsPerPage} 
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="per-page-select"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <>
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
                  {transactions.map(transaction => (
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

            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  «
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  ‹
                </button>
                
                {/* Page numbers */}
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  ›
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last Page"
                >
                  »
                </button>
              </div>
            </div>
          </>
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
