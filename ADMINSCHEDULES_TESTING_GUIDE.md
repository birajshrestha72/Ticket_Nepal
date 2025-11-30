# AdminSchedules Component - Testing Guide

## Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend dev server running on `http://localhost:5173`
3. Valid JWT token in localStorage
4. Database seeded with buses and routes

## Test Scenarios

### 1. Component Load Test
**Steps:**
1. Login as vendor or admin
2. Navigate to `/admin/schedules` or `/vendor/schedules`
3. Wait for data to load

**Expected:**
- Loading spinner appears briefly
- Schedules table displays with data (if any exist)
- Filters section shows bus and route dropdowns
- "Add New Schedule" button visible in header
- No console errors

---

### 2. Create Schedule Test
**Steps:**
1. Click "Add New Schedule" button
2. Fill in the form:
   - Select a bus from dropdown
   - Select a route from dropdown
   - Set departure time (e.g., 06:00)
   - Set arrival time (e.g., 14:30)
   - Enter price (e.g., 800)
   - Select operating days (check at least one)
   - Keep "Active Schedule" checked
3. Click "Create Schedule"

**Expected:**
- Form validation prevents empty fields
- Success message appears: "Schedule created successfully!"
- Modal closes automatically
- New schedule appears in the table
- Table updates without page refresh

**Test Variations:**
- Try submitting with empty fields (should show validation error)
- Try arrival time before departure time (should validate)
- Try with all days selected
- Try with only weekends selected

---

### 3. Edit Schedule Test
**Steps:**
1. Find an existing schedule in the table
2. Click the edit button (✏️)
3. Modal opens with pre-filled data
4. Change the price (e.g., from 800 to 850)
5. Change operating days
6. Click "Update Schedule"

**Expected:**
- Modal opens with all current values pre-filled
- Changes save successfully
- Success message: "Schedule updated successfully!"
- Modal closes
- Table refreshes with updated data
- Updated values visible in table

---

### 4. Toggle Status Test
**Steps:**
1. Find an active schedule (green "● Active" badge)
2. Click the toggle button (🔴)
3. Confirm the action

**Expected:**
- Success message: "Schedule deactivated successfully!"
- Status badge changes to red "● Inactive"
- Table row becomes slightly transparent (opacity: 0.6)
- Button icon changes to 🟢

**Repeat for reactivation:**
1. Click 🟢 button on inactive schedule
2. Status changes back to active

---

### 5. Delete Schedule Test
**Steps:**
1. Find a schedule you want to delete
2. Click the delete button (🗑️)
3. Browser confirmation dialog appears
4. Click "OK" to confirm

**Expected:**
- Confirmation dialog: "Are you sure you want to delete this schedule? This action cannot be undone."
- After confirmation: Success message "Schedule deleted successfully!"
- Schedule removed from table
- Table count updates in footer

**Test cancellation:**
1. Click delete button
2. Click "Cancel" in confirmation
3. Schedule should remain unchanged

---

### 6. Search Functionality Test
**Steps:**
1. Type "BA" in search box (to find bus numbers like "BA 2 KHA 1234")
2. Table filters in real-time
3. Clear search and type "Kathmandu"
4. Should show schedules with Kathmandu as origin or destination

**Expected:**
- Filtering happens instantly (no API call)
- Only matching schedules shown
- Summary footer updates to show filtered count
- Empty state appears if no matches

---

### 7. Filter Tests
**Steps:**

**Filter by Bus:**
1. Select a specific bus from "Bus" dropdown
2. Table shows only schedules for that bus

**Filter by Route:**
1. Select a specific route from "Route" dropdown
2. Table shows only schedules for that route

**Filter by Status:**
1. Select "Active" from Status dropdown
2. Only active schedules shown
3. Select "Inactive"
4. Only inactive schedules shown

**Combine filters:**
1. Select bus + route + status
2. Should show intersection of all filters

**Reset filters:**
1. Apply some filters
2. Click "🔄 Reset" button
3. All filters clear and full list appears

---

### 8. Responsive Layout Tests

**Desktop (1400px):**
- Full table with all columns visible
- Filters in horizontal row
- Modal centered, max-width 700px

**Tablet (768px):**
- Table slightly compressed
- Filters stack vertically
- All data still visible

**Mobile (375px):**
- Table converts to cards
- Each schedule is a card
- Filters full width
- Form fields stack
- Days grid becomes 3 columns
- Modal becomes full screen

**Test on:**
- Chrome DevTools device emulation
- Firefox Responsive Design Mode
- Real devices if available

---

### 9. Form Validation Tests

**Test empty fields:**
- Submit with no bus selected → "Please select a bus"
- Submit with no route selected → "Please select a route"
- Submit with no departure time → Browser validation
- Submit with no arrival time → Browser validation
- Submit with no price → Browser validation
- Submit with no days selected → "Please select at least one operating day"

**Test invalid data:**
- Negative price → Browser prevents (min="0")
- Arrival before departure → Should show warning (if implemented)

---

### 10. Error Handling Tests

**Test 401 Unauthorized:**
1. Clear localStorage token: `localStorage.removeItem('token')`
2. Try to fetch schedules
3. Should redirect to `/login`

**Test network error:**
1. Stop backend server
2. Try to create/edit/delete schedule
3. Should show error alert with message

**Test invalid data from API:**
1. (Requires backend modification)
2. Component should handle gracefully

---

### 11. Loading State Tests
**Steps:**
1. Add artificial delay to API response (or slow network throttling)
2. Reload component
3. Loading spinner should appear
4. After data loads, spinner disappears

---

### 12. Empty State Tests
**Steps:**
1. Delete all schedules OR filter with criteria that matches nothing
2. Empty state should appear with:
   - 📅 icon
   - "No schedules found" heading
   - Helpful message
   - "Add First Schedule" button (if no filters applied)

---

### 13. Success/Error Message Tests
**Success messages should auto-dismiss after 3 seconds:**
- Create schedule → Green banner appears → Auto-hides
- Update schedule → Green banner appears → Auto-hides
- Delete schedule → Green banner appears → Auto-hides
- Toggle status → Green banner appears → Auto-hides

**Error messages should have manual close:**
- Trigger an error → Red banner appears
- Click ✕ button → Banner closes

---

### 14. Modal Interaction Tests
**Open modal:**
- Click "Add New Schedule" → Modal opens
- Click edit button → Modal opens with data

**Close modal:**
- Click ✕ button → Modal closes
- Click "Cancel" button → Modal closes
- Click outside modal (overlay) → Modal closes
- Click inside modal content → Modal stays open

---

### 15. Integration Tests (with real data)
1. Create a schedule for tomorrow
2. Check if it appears in customer bus search
3. Try booking a seat on the schedule
4. Return to admin and check booking count
5. Deactivate the schedule
6. Verify it no longer appears in customer search

---

## Automated Testing (Future)

### Unit Tests (Jest + React Testing Library)
```javascript
describe('AdminSchedules Component', () => {
  test('renders loading state initially', () => {});
  test('fetches and displays schedules', () => {});
  test('opens modal on add button click', () => {});
  test('validates form before submission', () => {});
  test('filters schedules by search term', () => {});
  test('deletes schedule after confirmation', () => {});
});
```

### E2E Tests (Cypress)
```javascript
describe('Schedule Management Flow', () => {
  it('should create, edit, and delete a schedule', () => {
    cy.visit('/admin/schedules');
    cy.contains('Add New Schedule').click();
    // ... complete flow
  });
});
```

---

## Performance Testing
- Measure initial load time
- Check rendering performance with 100+ schedules
- Verify search/filter responsiveness
- Check modal open/close animation smoothness

---

## Accessibility Testing
- Tab navigation through form fields
- Screen reader announcements
- Keyboard shortcuts (Enter to submit, Esc to close modal)
- Focus management (modal should trap focus)
- Color contrast ratios (WCAG AA)

---

## Browser Compatibility
Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ⚠️ Older browsers (IE 11 - may need polyfills)

---

## Known Issues / Edge Cases
1. **Concurrent edits**: If two users edit same schedule simultaneously, last save wins
2. **Timezone handling**: Times stored in UTC, displayed in local time
3. **Operating days validation**: Minimum one day required
4. **Delete restrictions**: Can delete schedule even if it has future bookings (consider adding check)

---

## Debugging Tips

### Check API calls:
```javascript
// Open browser console
// Check Network tab for:
GET /schedules/vendor/all
POST /schedules/create
PUT /schedules/{id}
DELETE /schedules/{id}
```

### Check localStorage token:
```javascript
console.log(localStorage.getItem('token'));
```

### Enable React DevTools:
- Install React DevTools extension
- Inspect component state and props
- Check re-render causes

---

## Success Criteria
✅ All CRUD operations work without errors
✅ Responsive layout works on all screen sizes
✅ Form validation prevents invalid submissions
✅ Search and filters work in real-time
✅ Success/error messages display correctly
✅ Modal workflow is smooth and intuitive
✅ No console errors or warnings
✅ Component follows design system
✅ Accessibility standards met

---

## Test Data Requirements

### Minimum Data Needed:
- 3+ buses in database
- 5+ routes in database
- 10+ schedules for testing filters

### Sample Test Data:
```sql
-- Buses
INSERT INTO buses (bus_number, bus_type, total_seats, vendor_id)
VALUES 
  ('BA 2 KHA 1234', 'Deluxe', 40, 1),
  ('BA 3 PA 5678', 'AC Sleeper', 32, 1),
  ('BA 1 KHA 9012', 'Semi-Deluxe', 45, 1);

-- Routes
INSERT INTO routes (origin, destination, distance_km, estimated_duration)
VALUES
  ('Kathmandu', 'Pokhara', 200, '07:00:00'),
  ('Kathmandu', 'Chitwan', 150, '05:30:00'),
  ('Pokhara', 'Lumbini', 170, '06:00:00');

-- Schedules (will be created via UI)
```

---

## Report Bugs
If you find issues during testing:
1. Note the exact steps to reproduce
2. Include screenshots/screen recordings
3. Check browser console for errors
4. Note browser and device details
5. Check if issue persists after page reload

---

## Conclusion
This comprehensive test suite ensures the AdminSchedules component is production-ready. Execute all tests before deployment and after any code changes.
