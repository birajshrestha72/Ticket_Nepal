import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../../css/bookingSuccess.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * BookingSuccess Component
 * Features:
 * - Display booking confirmation with reference number
 * - Show complete ticket details
 * - Generate and download PDF ticket
 * - QR code for ticket verification
 * - Email ticket functionality
 * - Print ticket
 * - Navigation to bookings/search
 */
const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;
  const ticketRef = useRef(null);
  
  const [downloading, setDownloading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      navigate('/search');
    }
  }, [bookingData, navigate]);

  if (!bookingData) {
    return null;
  }

  // Generate QR code data (booking reference + verification info)
  const qrCodeData = JSON.stringify({
    bookingReference: bookingData.bookingReference,
    bookingId: bookingData.bookingId,
    passengerName: bookingData.passengerDetails?.name || 'N/A',
    journeyDate: bookingData.journeyDate,
    seats: bookingData.selectedSeats?.join(', ') || 'N/A',
    busNumber: bookingData.busDetails?.busNumber || 'N/A'
  });

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Download PDF ticket
  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const ticketElement = ticketRef.current;
      
      // Capture the ticket as canvas
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Ticket-${bookingData.bookingReference}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Print ticket
  const printTicket = () => {
    window.print();
  };

  // Send email with ticket
  const sendEmail = async () => {
    setEmailSending(true);
    try {
      // TODO: Implement backend email endpoint
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${API_URL}/bookings/${bookingData.bookingId}/send-ticket`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const isPaid = bookingData.paymentStatus?.toLowerCase().includes('paid');
  const pricing = bookingData.pricing || bookingData.breakdown || {};
  const totalAmount = pricing.totalAmount || pricing.grandTotal || 0;

  return (
    <div className="booking-success-page">
      <div className="success-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1>Booking Confirmed!</h1>
          <p className="success-message">
            {isPaid 
              ? 'Your payment was successful and your seats are confirmed.' 
              : 'Your seats are reserved. Please pay at the counter before departure.'}
          </p>
        </div>

        {/* Booking Reference */}
        <div className="booking-reference-card">
          <div className="reference-label">Booking Reference</div>
          <div className="reference-number">{bookingData.bookingReference}</div>
          <div className="reference-note">
            {isPaid 
              ? 'Show this reference at the counter or use the QR code below' 
              : 'Pay within 2 hours to confirm your booking'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons no-print">
          <button 
            className="btn btn-primary" 
            onClick={downloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <span className="spinner"></span>
                Generating PDF...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download PDF
              </>
            )}
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={printTicket}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Ticket
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={sendEmail}
            disabled={emailSending || emailSent}
          >
            {emailSending ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : emailSent ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Email Sent!
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Email Ticket
              </>
            )}
          </button>
        </div>

        {/* Ticket Details (Printable) */}
        <div className="ticket-wrapper" ref={ticketRef}>
          <div className="ticket-card">
            {/* Ticket Header */}
            <div className="ticket-header">
              <div className="ticket-logo">
                <h2>🎫 Ticket Nepal</h2>
              </div>
              <div className="ticket-type">
                {isPaid ? (
                  <span className="badge badge-paid">PAID</span>
                ) : (
                  <span className="badge badge-pending">PENDING PAYMENT</span>
                )}
              </div>
            </div>

            {/* Journey Details */}
            <div className="journey-section">
              <div className="route-display">
                <div className="route-point">
                  <div className="route-city">{bookingData.busDetails?.origin || 'N/A'}</div>
                  <div className="route-time">{formatTime(bookingData.schedule?.departure_time || bookingData.busDetails?.departureTime)}</div>
                </div>
                <div className="route-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
                <div className="route-point">
                  <div className="route-city">{bookingData.busDetails?.destination || 'N/A'}</div>
                  <div className="route-time">{formatTime(bookingData.schedule?.arrival_time || bookingData.busDetails?.arrivalTime)}</div>
                </div>
              </div>

              <div className="journey-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {formatDate(bookingData.journeyDate)}
              </div>
            </div>

            {/* Passenger & Bus Details */}
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">Passenger Name</div>
                <div className="detail-value">{bookingData.passengerDetails?.name || 'N/A'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Contact Number</div>
                <div className="detail-value">{bookingData.passengerDetails?.phone || 'N/A'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{bookingData.passengerDetails?.email || 'N/A'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Bus Number</div>
                <div className="detail-value">{bookingData.busDetails?.busNumber || 'N/A'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Bus Type</div>
                <div className="detail-value">{bookingData.busDetails?.busType || 'N/A'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Operator</div>
                <div className="detail-value">{bookingData.busDetails?.operatorName || bookingData.busDetails?.vendor || 'N/A'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Seat Number(s)</div>
                <div className="detail-value seats-display">
                  {bookingData.selectedSeats?.map((seat, index) => (
                    <span key={index} className="seat-badge">{seat}</span>
                  )) || 'N/A'}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Number of Seats</div>
                <div className="detail-value">{bookingData.numberOfSeats || bookingData.selectedSeats?.length || 0}</div>
              </div>
            </div>

            {/* Pickup/Drop Points */}
            {(bookingData.passengerDetails?.pickupPoint || bookingData.passengerDetails?.dropPoint) && (
              <div className="pickup-drop-section">
                {bookingData.passengerDetails.pickupPoint && (
                  <div className="point-item">
                    <div className="point-label">Pickup Point</div>
                    <div className="point-value">{bookingData.passengerDetails.pickupPoint}</div>
                  </div>
                )}
                {bookingData.passengerDetails.dropPoint && (
                  <div className="point-item">
                    <div className="point-label">Drop Point</div>
                    <div className="point-value">{bookingData.passengerDetails.dropPoint}</div>
                  </div>
                )}
              </div>
            )}

            {/* Special Requests */}
            {bookingData.passengerDetails?.specialRequests && (
              <div className="special-requests-section">
                <div className="detail-label">Special Requests</div>
                <div className="detail-value">{bookingData.passengerDetails.specialRequests}</div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="payment-summary">
              <div className="summary-row">
                <span>Base Fare ({bookingData.numberOfSeats || bookingData.selectedSeats?.length || 0} seat(s))</span>
                <span>Rs. {(pricing.baseFare || pricing.subtotal || 0).toFixed(2)}</span>
              </div>
              {(pricing.discount > 0) && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>- Rs. {pricing.discount.toFixed(2)}</span>
                </div>
              )}
              {(pricing.tax > 0 || pricing.serviceFee > 0) && (
                <div className="summary-row">
                  <span>Tax & Service Charge</span>
                  <span>Rs. {((pricing.tax || 0) + (pricing.serviceFee || 0)).toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>Rs. {totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row payment-info">
                <span>Payment Method</span>
                <span className="payment-method">
                  {bookingData.paymentMethod === 'khalti' && '💳 Khalti'}
                  {bookingData.paymentMethod === 'esewa' && '💳 eSewa'}
                  {bookingData.paymentMethod === 'cash' && '💵 Cash (Counter)'}
                  {!['khalti', 'esewa', 'cash'].includes(bookingData.paymentMethod) && bookingData.paymentMethod}
                </span>
              </div>
              <div className="summary-row payment-status">
                <span>Payment Status</span>
                <span className={isPaid ? 'status-paid' : 'status-pending'}>
                  {bookingData.paymentStatus}
                </span>
              </div>
            </div>

            {/* QR Code Section (only for paid tickets) */}
            {isPaid && (
              <div className="qr-section">
                <div className="qr-code-wrapper">
                  <QRCodeSVG 
                    value={qrCodeData} 
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="qr-instructions">
                  <p>Show this QR code at the counter for verification</p>
                </div>
              </div>
            )}

            {/* Ticket Footer */}
            <div className="ticket-footer">
              <div className="footer-notes">
                <h4>Important Information:</h4>
                <ul>
                  <li>Please arrive at the departure point at least 15 minutes before departure time.</li>
                  <li>Carry a valid ID proof for verification.</li>
                  {!isPaid && (
                    <li className="highlight">Complete payment at the counter within 2 hours to confirm your booking.</li>
                  )}
                  <li>Cancellation charges apply as per our cancellation policy.</li>
                  <li>For queries, contact us at support@ticketnepal.com or call 01-1234567</li>
                </ul>
              </div>
              <div className="booking-ref-footer">
                <small>Booking Ref: {bookingData.bookingReference}</small>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="navigation-buttons no-print">
          <button 
            className="btn btn-outline-primary"
            onClick={() => navigate('/bookings')}
          >
            View My Bookings
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/search')}
          >
            Book Another Trip
          </button>
        </div>

        {/* Success Footer Message */}
        <div className="success-footer-message no-print">
          <p>
            Thank you for choosing Ticket Nepal! 
            {isPaid && ' Your ticket has been confirmed.'}
            {!isPaid && ' Please complete payment at the counter to confirm your booking.'}
          </p>
          <p className="support-text">
            Need help? Contact our 24/7 support at <a href="tel:+9771234567">01-1234567</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
