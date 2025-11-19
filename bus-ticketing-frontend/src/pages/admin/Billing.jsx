import React, { useRef } from 'react';
import '../../css/billing.css';

const sampleBill = {
  id: 'INV-20251020-001',
  customerName: 'Jane Smith',
  customerPhone: '9840000000',
  vendor: 'ABC Travels',
  busNo: 'BA 2 KHA 1234',
  seats: [3,4,5],
  pricePerSeat: 500,
  total: 1500,
  bookingDate: '2025-10-20',
  ticketDate: '2025-10-22',
  paymentMethod: 'eSewa',
};

const Billing = () => {
  const billRef = useRef();
  const handleDownload = () => window.print();

  return (
    <div className="vendor-billing">
      <h2>Billing / Receipt</h2>
      <div className="bill" ref={billRef}>
        <div><strong>Invoice ID:</strong> {sampleBill.id}</div>
        <div><strong>Customer:</strong> {sampleBill.customerName}</div>
        <div><strong>Phone:</strong> {sampleBill.customerPhone}</div>
        <div><strong>Vendor:</strong> {sampleBill.vendor}</div>
        <div><strong>Bus No:</strong> {sampleBill.busNo}</div>
        <div><strong>Seats:</strong> {sampleBill.seats.join(', ')}</div>
        <div><strong>Price/Seat:</strong> Rs. {sampleBill.pricePerSeat}</div>
        <div><strong>Total:</strong> Rs. {sampleBill.total}</div>
        <div><strong>Booking Date:</strong> {sampleBill.bookingDate}</div>
        <div><strong>Ticket Date:</strong> {sampleBill.ticketDate}</div>
        <div><strong>Payment Method:</strong> {sampleBill.paymentMethod}</div>
      </div>
      <button onClick={handleDownload} className="bill-download">Download / Print</button>
    </div>
  );
};

export default Billing;
