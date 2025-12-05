# Complete Booking System Flow - Implementation Guide

## 📋 Overview

This document describes the complete booking system flow with individual bus listings, interactive seat picker, and payment options.

## 🗂️ New Files Created

### 1. **SeatPicker Component**
- **Path**: `/src/components/SeatPicker.jsx`
- **CSS**: `/src/css/seatPicker.css`
- **Features**:
  - Realistic bus layout with driver section
  - 2-2 seating arrangement (Left 2 - Aisle - Right 2)
  - Color-coded seats (Available/Selected/Booked)
  - Real-time seat availability from API
  - Interactive seat selection/deselection
  - Visual seat status indicators

### 2. **Updated Search Page**
- **Path**: `/src/pages/common/SearchNew.jsx`
- **Features**:
  - Lists individual buses (not grouped by type)
  - Shows complete bus details:
    - Bus registration number
    - Departure/arrival times
    - Total & available seats
    - Price per seat
    - Bus type and amenities
    - Vendor name and rating
  - Filters: Bus type, vendor, price range
  - Direct "Select Seats" button for each bus

### 3. **Updated Booking Page**
- **Path**: `/src/pages/customer/BookingNew.jsx`
- **Features**:
  - Clean, simplified UI
  - Uses SeatPicker component
  - Journey date selector
  - Passenger details form
  - Real-time booking summary
  - Proceeds to payment

### 4. **Updated Payment Page**
- **Path**: `/src/pages/customer/PaymentNew.jsx`
- **Features**:
  - **Pay Now** option:
    - Khalti wallet integration
    - eSewa wallet integration
    - Wallet login simulation
    - Instant confirmation
  - **Pay Later** option:
    - Reserve seats
    - Pay at counter
    - 2-hour hold period
  - Complete booking summary
  - Terms & conditions checkbox

## 🔄 Complete Booking Flow

```
1. SEARCH PAGE (SearchNew.jsx)
   ├── User enters: From, To, Date
   ├── Displays individual buses with full details:
   │   ├── Bus reg number (e.g., BA 2 KHA 1234)
   │   ├── Departure time
   │   ├── Price per seat
   │   ├── Available seats count
   │   ├── Bus type (AC, Deluxe, etc.)
   │   ├── Amenities (WiFi, Charging, etc.)
   │   └── Vendor name & rating
   └── User clicks "Select Seats" button
       ↓

2. BOOKING PAGE (BookingNew.jsx)
   ├── Shows selected bus info
   ├── Journey date selector
   ├── SEAT PICKER COMPONENT displays:
   │   ├── Driver section with icon
   │   ├── Bus layout (A1, A2, A3, A4, B1, B2, ...)
   │   ├── Left seats - Aisle - Right seats
   │   ├── Color-coded seat status
   │   └── Selected seats summary
   ├── Passenger details form:
   │   ├── Full name *
   │   ├── Phone number *
   │   ├── Email *
   │   ├── Pickup point
   │   ├── Drop point
   │   └── Special requests
   ├── Booking summary (seats, price, total)
   └── User clicks "Proceed to Payment"
       ↓

3. PAYMENT PAGE (PaymentNew.jsx)
   ├── Complete booking summary displayed
   ├── TWO PAYMENT OPTIONS:
   │   
   │   A) PAY NOW:
   │      ├── Click Khalti or eSewa button
   │      ├── Wallet login modal appears
   │      ├── Enter mobile number
   │      ├── Enter MPIN/password
   │      ├── Agree to terms
   │      ├── Click "Pay Rs. X"
   │      ├── Payment processing (API integration)
   │      └── Instant confirmation
   │   
   │   B) PAY LATER:
   │      ├── Agree to terms
   │      ├── Click "Reserve Seats - Pay Later"
   │      ├── Seats reserved for 2 hours
   │      ├── Booking reference generated
   │      └── Pay at counter before departure
   │
   └── Redirect to Success Page
       ↓

4. SUCCESS PAGE
   ├── Booking reference number
   ├── Payment status (Paid/Pending)
   ├── Ticket details
   ├── QR code (if paid)
   └── Download/Print options
```

## 🔧 Integration Steps

### Step 1: Replace Existing Files

```bash
# Backup originals
mv src/pages/common/Search.jsx src/pages/common/SearchOld.jsx
mv src/pages/customer/Booking.jsx src/pages/customer/BookingOld.jsx
mv src/pages/customer/Payment.jsx src/pages/customer/PaymentOld.jsx

# Rename new files
mv src/pages/common/SearchNew.jsx src/pages/common/Search.jsx
mv src/pages/customer/BookingNew.jsx src/pages/customer/Booking.jsx
mv src/pages/customer/PaymentNew.jsx src/pages/customer/Payment.jsx
```

### Step 2: Verify SeatPicker Component

The SeatPicker component is already in the correct location:
- `src/components/SeatPicker.jsx`
- `src/css/seatPicker.css`

### Step 3: Update CSS (if needed)

Ensure the following CSS files exist and are properly styled:
- `src/css/busSearch.css` - For Search page
- `src/css/booking.css` - For Booking page
- `src/css/seatPicker.css` - For SeatPicker component
- `src/css/payment.css` - For Payment page

### Step 4: Test the Flow

1. **Search Test**:
   ```
   - Navigate to /search
   - Enter: From=Kathmandu, To=Pokhara, Date=Tomorrow
   - Click "Search Buses"
   - Verify individual buses display with full details
   ```

2. **Booking Test**:
   ```
   - Click "Select Seats" on any bus
   - Verify SeatPicker displays correctly
   - Select 2-3 seats
   - Fill passenger details
   - Click "Proceed to Payment"
   ```

3. **Payment Test**:
   ```
   - Verify booking summary shows correct info
   - Test "Pay Now":
     * Click Khalti or eSewa
     * Enter mobile: 9851234567
     * Enter PIN: 1234 (simulation)
     * Agree to terms
     * Click Pay
   - Test "Pay Later":
     * Agree to terms
     * Click "Reserve Seats"
   ```

## 📊 API Endpoints Used

### 1. Search Page
```
GET /api/v1/schedules/available?origin={from}&destination={to}&journey_date={date}
```

### 2. Seat Availability
```
GET /api/v1/schedules/{schedule_id}/seats?journey_date={date}
```

### 3. Create Booking
```
POST /api/v1/bookings/create
Body: {
  scheduleId, journeyDate, numberOfSeats, seatNumbers,
  passengerName, passengerPhone, passengerEmail,
  pickupPoint, dropPoint, specialRequests,
  totalAmount, paymentMethod, paymentStatus
}
```

## 🎨 Key Features Implemented

### Search Page
✅ Individual bus listings (not grouped)
✅ Full bus details (reg number, times, seats, price, amenities)
✅ Vendor information with rating
✅ Multiple filter options
✅ Responsive design

### Seat Picker
✅ Realistic bus layout
✅ Driver seat indicator
✅ 2-2 seating arrangement with central aisle
✅ Color-coded seat status
✅ Interactive seat selection
✅ Real-time availability check
✅ Selected seats summary with remove option

### Booking Page
✅ Clean, simplified UI
✅ Journey date selector
✅ Integrated SeatPicker component
✅ Passenger details form
✅ Real-time booking summary
✅ Form validation

### Payment Page
✅ Two payment options (Pay Now / Pay Later)
✅ Khalti wallet integration ready
✅ eSewa wallet integration ready
✅ Wallet login simulation
✅ Complete booking summary
✅ Terms & conditions
✅ Secure payment badge

## 🔐 Payment Integration Notes

### For Khalti Integration:
```javascript
// In production, replace simulation with:
import KhaltiCheckout from 'khalti-checkout-web';

const config = {
  publicKey: 'YOUR_KHALTI_PUBLIC_KEY',
  productIdentity: bookingData.schedule.schedule_id,
  productName: 'Bus Ticket',
  productUrl: window.location.href,
  eventHandler: {
    onSuccess(payload) {
      // Create booking with payment success
    },
    onError(error) {
      // Handle error
    }
  }
};
```

### For eSewa Integration:
```javascript
// eSewa payment form submission
const esewaForm = {
  amt: amount,
  psc: 0,
  pdc: 0,
  txAmt: 0,
  tAmt: amount,
  pid: bookingReference,
  scd: 'YOUR_ESEWA_MERCHANT_ID',
  su: successUrl,
  fu: failureUrl
};
```

## 📱 Mobile Responsiveness

All components are fully responsive:
- Search page: Stacked cards on mobile
- Seat picker: Scaled layout for smaller screens
- Booking form: Single column on mobile
- Payment options: Vertical stack on mobile

## 🐛 Testing Checklist

- [ ] Search displays individual buses correctly
- [ ] Bus details show registration number, times, seats
- [ ] Amenities display with icons
- [ ] Seat picker shows correct layout
- [ ] Seats can be selected/deselected
- [ ] Booked seats are non-clickable
- [ ] Passenger form validates required fields
- [ ] Booking summary updates in real-time
- [ ] Payment page shows correct total amount
- [ ] Pay Now wallet login works
- [ ] Pay Later creates pending booking
- [ ] Success page displays booking reference

## 🚀 Next Steps

1. **Backend Integration**:
   - Ensure all API endpoints return correct data format
   - Implement actual wallet payment gateways
   - Add payment verification webhooks

2. **Enhancements**:
   - Add booking confirmation email
   - Implement QR code generation for tickets
   - Add seat hold timer (15 minutes)
   - Implement booking cancellation

3. **Testing**:
   - End-to-end flow testing
   - Payment gateway testing with real accounts
   - Mobile device testing
   - Cross-browser compatibility

## 📞 Support

If you encounter any issues:
1. Check console for errors
2. Verify API responses match expected format
3. Ensure all CSS files are loaded
4. Check authentication token is valid

---

**Created**: December 4, 2025
**Version**: 1.0
**Status**: Ready for Testing
