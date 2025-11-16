#!/bin/bash

# Complete Authentication & RBAC Test Script
# Tests login, signup, and role-based access control

API_URL="http://localhost:8000/api/v1"
echo "======================================"
echo "🧪 TICKET NEPAL - AUTH & RBAC TESTS"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local token=$6
    
    echo -n "Testing: $name... "
    
    if [ -z "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed \$d)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status)"
        PASSED=$((PASSED + 1))
        echo "$body"
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status)"
        FAILED=$((FAILED + 1))
        echo "$body"
    fi
    echo ""
}

echo "======================================"
echo "1️⃣  CUSTOMER LOGIN TEST"
echo "======================================"

# Test 1: Customer Login
customer_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "bikash@gmail.com",
        "password": "password123"
    }')

echo "Response:"
echo "$customer_response" | jq '.'
echo ""

customer_token=$(echo "$customer_response" | jq -r '.data.token // empty')
customer_role=$(echo "$customer_response" | jq -r '.data.user.role // empty')

if [ -n "$customer_token" ] && [ "$customer_role" = "customer" ]; then
    echo -e "${GREEN}✓ Customer login successful${NC}"
    echo "Role: $customer_role"
    echo "Token: ${customer_token:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Customer login failed${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "======================================"
echo "2️⃣  VENDOR LOGIN TEST"
echo "======================================"

# Test 2: Vendor Login
vendor_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "ram@abctravels.com",
        "password": "password123"
    }')

echo "Response:"
echo "$vendor_response" | jq '.'
echo ""

vendor_token=$(echo "$vendor_response" | jq -r '.data.token // empty')
vendor_role=$(echo "$vendor_response" | jq -r '.data.user.role // empty')

if [ -n "$vendor_token" ] && [ "$vendor_role" = "vendor" ]; then
    echo -e "${GREEN}✓ Vendor login successful${NC}"
    echo "Role: $vendor_role"
    echo "Token: ${vendor_token:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Vendor login failed${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "======================================"
echo "3️⃣  SYSTEM ADMIN LOGIN TEST"
echo "======================================"

# Test 3: System Admin Login
admin_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "superadmin@ticketnepal.com",
        "password": "password123"
    }')

echo "Response:"
echo "$admin_response" | jq '.'
echo ""

admin_token=$(echo "$admin_response" | jq -r '.data.token // empty')
admin_role=$(echo "$admin_response" | jq -r '.data.user.role // empty')

if [ -n "$admin_token" ] && [ "$admin_role" = "system_admin" ]; then
    echo -e "${GREEN}✓ System Admin login successful${NC}"
    echo "Role: $admin_role"
    echo "Token: ${admin_token:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ System Admin login failed${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "======================================"
echo "4️⃣  INVALID LOGIN TEST"
echo "======================================"

# Test 4: Invalid credentials
test_endpoint \
    "Invalid password" \
    "POST" \
    "/auth/login" \
    '{"email": "bikash@gmail.com", "password": "wrongpassword"}' \
    "401"

echo "======================================"
echo "5️⃣  CUSTOMER REGISTRATION TEST"
echo "======================================"

# Test 5: New customer registration
random_email="testcustomer_$(date +%s)@test.com"
test_endpoint \
    "New customer registration" \
    "POST" \
    "/auth/register" \
    "{\"name\": \"Test Customer\", \"email\": \"$random_email\", \"phone\": \"9801234567\", \"password\": \"test123\", \"role\": \"customer\"}" \
    "201"

echo "======================================"
echo "6️⃣  VENDOR REGISTRATION TEST"
echo "======================================"

# Test 6: New vendor registration
random_vendor_email="testvendor_$(date +%s)@test.com"
test_endpoint \
    "New vendor registration" \
    "POST" \
    "/auth/register" \
    "{\"name\": \"Test Vendor\", \"email\": \"$random_vendor_email\", \"phone\": \"9807654321\", \"password\": \"test123\", \"role\": \"vendor\"}" \
    "201"

echo "======================================"
echo "7️⃣  DUPLICATE EMAIL TEST"
echo "======================================"

# Test 7: Duplicate email registration
test_endpoint \
    "Duplicate email registration" \
    "POST" \
    "/auth/register" \
    '{"name": "Duplicate User", "email": "bikash@gmail.com", "phone": "9801111111", "password": "test123", "role": "customer"}' \
    "409"

echo "======================================"
echo "8️⃣  PROFILE ACCESS TEST (Customer)"
echo "======================================"

# Test 8: Customer accessing profile
if [ -n "$customer_token" ]; then
    profile_response=$(curl -s -X GET "$API_URL/auth/me" \
        -H "Authorization: Bearer $customer_token")
    
    echo "Response:"
    echo "$profile_response" | jq '.'
    
    profile_role=$(echo "$profile_response" | jq -r '.data.user.role // empty')
    
    if [ "$profile_role" = "customer" ]; then
        echo -e "${GREEN}✓ Customer profile access successful${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Customer profile access failed${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}✗ No customer token available${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "======================================"
echo "9️⃣  UNAUTHORIZED ACCESS TEST"
echo "======================================"

# Test 9: Access without token
test_endpoint \
    "Profile access without token" \
    "GET" \
    "/auth/me" \
    "" \
    "401"

echo "======================================"
echo "🔟 INVALID TOKEN TEST"
echo "======================================"

# Test 10: Invalid token
invalid_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token"
profile_invalid=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/me" \
    -H "Authorization: Bearer $invalid_token")

status=$(echo "$profile_invalid" | tail -n1)
if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ Invalid token rejected (401)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Invalid token test failed${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review.${NC}"
    exit 1
fi
