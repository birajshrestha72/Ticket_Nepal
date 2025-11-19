import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../css/bookingBill.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const BookingSuccess = () => {
  const location = useLocation();
  const bookingData = location.state;
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    // Auto-send email on component mount
    if (bookingData && !emailSent) {
      sendTicketEmail();
    }
  }, []);

  const sendTicketEmail = async () => {
    setSendingEmail(true);
    try {
      // Simulate email sending (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, call email API
      // const token = localStorage.getItem('token');
      // await fetch(`${API_URL}/bookings/${bookingData.bookingId}/send-email`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
      setEmailSent(true);
    } catch (err) {
      console.error('Email sending failed:', err);
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = () => {
    globalThis.print();
  };

  const handleDownload = async () => {
    try {
      // Generate PDF using browser print to PDF
      // In production, use libraries like jsPDF or pdfmake for better control
      globalThis.print();
      
      // Alternative: Call backend to generate PDF
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${API_URL}/bookings/${bookingData.bookingId}/download-pdf`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `ticket-${bookingData.bookingReference}.pdf`;
      // a.click();
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    }
  };

  if (!bookingData) {
    return (
      <div className="page booking-success">
        <div className="error-container">
          <h3>No booking data found</h3>
          <Link to="/search" className="btn-primary">Go to Search</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page booking-success">
      <div className="success-container">
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h1>Booking Confirmed!</h1>
          <p>Your bus ticket has been booked and payment is successful</p>
          {sendingEmail && (
            <p className="email-status">📧 Sending confirmation email...</p>
          )}
          {emailSent && (
            <p className="email-status success">✅ Confirmation email sent to {bookingData.passengerDetails.email}</p>
          )}
        </div>

        <div className="ticket-card">
          <div className="ticket-header">
            <h2>E-Ticket</h2>
            <span className="booking-ref">Ref: {bookingData.bookingReference}</span>
          </div>

          <div className="ticket-body">
            <div className="ticket-section">
              <h3>Bus Information</h3>
              <div className="detail-row">
                <span className="label">Bus:</span>
                <strong>{bookingData.busDetails.busType} - {bookingData.busDetails.busNumber}</strong>
              </div>
              <div className="detail-row">
                <span className="label">Vendor:</span>
                <span>{bookingData.busDetails.vendor}</span>
              </div>
              <div className="detail-row">
                <span className="label">Departure:</span>
                <span>{bookingData.busDetails.departureTime}</span>
              </div>
            </div>

            <div className="ticket-section">
              <h3>Passenger Details</h3>
              <div className="detail-row">
                <span className="label">Name:</span>
                <strong>{bookingData.passengerDetails.name}</strong>
              </div>
              <div className="detail-row">
                <span className="label">Phone:</span>
                <span>{bookingData.passengerDetails.phone}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span>{bookingData.passengerDetails.email}</span>
              </div>
            </div>

            <div className="ticket-section">
              <h3>Journey Details</h3>
              <div className="detail-row">
                <span className="label">Date:</span>
                <strong>{new Date(bookingData.journeyDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</strong>
              </div>
              <div className="detail-row">
                <span className="label">From:</span>
                <span>{bookingData.passengerDetails.pickupPoint}</span>
              </div>
              <div className="detail-row">
                <span className="label">To:</span>
                <span>{bookingData.passengerDetails.dropPoint}</span>
              </div>
              <div className="detail-row">
                <span className="label">Seats:</span>
                <strong>{bookingData.selectedSeats.join(', ')}</strong>
              </div>
            </div>

            <div className="ticket-section">
              <h3>Payment Details</h3>
              <div className="detail-row">
                <span className="label">Subtotal:</span>
                <span>Rs. {bookingData.breakdown.subtotal.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Service Fee + Tax:</span>
                <span>Rs. {(bookingData.breakdown.serviceFee + bookingData.breakdown.tax).toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Total Amount:</span>
                <strong className="amount">Rs. {bookingData.breakdown.grandTotal.toFixed(2)}</strong>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className="status-badge status-confirmed">Confirmed & Paid</span>
              </div>
            </div>
          </div>

          <div className="ticket-footer">
            <div className="qr-code-section">
              <div className="qr-placeholder">
                <span>📱 QR Code</span>
              </div>
              <p>Scan at boarding</p>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={handlePrint} className="btn-primary">
            🖨️ Print Ticket
          </button>
          <button onClick={handleDownload} className="btn-secondary">
            📥 Download PDF
          </button>
          <Link to="/customer" className="btn-secondary">
            🏠 Go to Dashboard
          </Link>
        </div>

        <div className="info-box">
          <h3>📌 Important Information</h3>
          <ul>
            <li>Please arrive at the boarding point 15 minutes before departure</li>
            <li>Carry a valid ID proof for verification</li>
            <li>Show this e-ticket or QR code to the conductor</li>
            <li>Keep your ticket safe until journey completion</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
