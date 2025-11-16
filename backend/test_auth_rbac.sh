#!/bin/bash

# Backend Authentication & RBAC Testing Script
# Tests login, signup, and role-based access control

API_URL="http://localhost:8000/api/v1"

echo "=========================================="
echo "🧪 Ticket Nepal Backend Testing"
echo "=========================================="
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
    
    echo "Testing: $name"
    
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
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# ========== 1. CUSTOMER SIGNUP ==========
echo -e "${YELLOW}=== 1. Customer Signup Tests ===${NC}"
echo ""

test_endpoint \
    "Customer Signup - Valid Data" \
    "POST" \
    "/auth/register" \
    '{
        "name": "Test Customer",
        "email": "testcustomer'$RANDOM'@test.com",
        "phone": "9801234567",
        "password": "password123",
        "role": "customer"
    }' \
    201

test_endpoint \
    "Customer Signup - Invalid Phone" \
    "POST" \
    "/auth/register" \
    '{
        "name": "Test Customer",
        "email": "invalid@test.com",
        "phone": "1234567890",
        "password": "password123",
        "role": "customer"
    }' \
    422

# ========== 2. VENDOR SIGNUP ==========
echo -e "${YELLOW}=== 2. Vendor Signup Tests ===${NC}"
echo ""

test_endpoint \
    "Vendor Signup - Valid Data" \
    "POST" \
    "/auth/register" \
    '{
        "name": "Test Vendor",
        "email": "testvendor'$RANDOM'@test.com",
        "phone": "9807654321",
        "password": "password123",
        "role": "vendor"
    }' \
    201

test_endpoint \
    "Signup - Invalid Role" \
    "POST" \
    "/auth/register" \
    '{
        "name": "Test User",
        "email": "invalid@test.com",
        "phone": "9801234567",
        "password": "password123",
        "role": "superadmin"
    }' \
    422

# ========== 3. LOGIN TESTS ==========
echo -e "${YELLOW}=== 3. Login Tests ===${NC}"
echo ""

test_endpoint \
    "Login - Valid Customer" \
    "POST" \
    "/auth/login" \
    '{
        "email": "bikash@gmail.com",
        "password": "password123"
    }' \
    200

# Store token for customer
CUSTOMER_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "bikash@gmail.com",
        "password": "password123"
    }')
CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

test_endpoint \
    "Login - Valid Vendor" \
    "POST" \
    "/auth/login" \
    '{
        "email": "ram@abctravels.com",
        "password": "password123"
    }' \
    200

# Store token for vendor
VENDOR_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "ram@abctravels.com",
        "password": "password123"
    }')
VENDOR_TOKEN=$(echo $VENDOR_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

test_endpoint \
    "Login - Valid Admin" \
    "POST" \
    "/auth/login" \
    '{
        "email": "superadmin@ticketnepal.com",
        "password": "password123"
    }' \
    200

# Store token for admin
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "superadmin@ticketnepal.com",
        "password": "password123"
    }')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

test_endpoint \
    "Login - Invalid Password" \
    "POST" \
    "/auth/login" \
    '{
        "email": "bikash@gmail.com",
        "password": "wrongpassword"
    }' \
    401

test_endpoint \
    "Login - Non-existent User" \
    "POST" \
    "/auth/login" \
    '{
        "email": "notexist@test.com",
        "password": "password123"
    }' \
    401

# ========== 4. PROFILE ACCESS TESTS ==========
echo -e "${YELLOW}=== 4. Profile Access Tests ===${NC}"
echo ""

test_endpoint \
    "Get Profile - Customer Token" \
    "GET" \
    "/auth/me" \
    "" \
    200 \
    "$CUSTOMER_TOKEN"

test_endpoint \
    "Get Profile - Vendor Token" \
    "GET" \
    "/auth/me" \
    "" \
    200 \
    "$VENDOR_TOKEN"

test_endpoint \
    "Get Profile - Admin Token" \
    "GET" \
    "/auth/me" \
    "" \
    200 \
    "$ADMIN_TOKEN"

test_endpoint \
    "Get Profile - No Token" \
    "GET" \
    "/auth/me" \
    "" \
    401

test_endpoint \
    "Get Profile - Invalid Token" \
    "GET" \
    "/auth/me" \
    "" \
    401 \
    "invalid.token.here"

# ========== 5. VENDOR ENDPOINTS RBAC ==========
echo -e "${YELLOW}=== 5. Vendor Endpoints RBAC Tests ===${NC}"
echo ""

test_endpoint \
    "Get My Vendor Profile - Vendor Token" \
    "GET" \
    "/vendors/me" \
    "" \
    200 \
    "$VENDOR_TOKEN"

test_endpoint \
    "Get My Vendor Profile - Customer Token (Should Fail)" \
    "GET" \
    "/vendors/me" \
    "" \
    403 \
    "$CUSTOMER_TOKEN"

test_endpoint \
    "List All Vendors - No Token (Public)" \
    "GET" \
    "/vendors/" \
    "" \
    200

test_endpoint \
    "Get Specific Vendor - No Token (Public)" \
    "GET" \
    "/vendors/1" \
    "" \
    200

# ========== 6. ADMIN ONLY ENDPOINTS ==========
echo -e "${YELLOW}=== 6. Admin-Only Endpoint Tests ===${NC}"
echo ""

test_endpoint \
    "Verify Vendor - Admin Token" \
    "PATCH" \
    "/vendors/1/verify" \
    "" \
    200 \
    "$ADMIN_TOKEN"

test_endpoint \
    "Verify Vendor - Vendor Token (Should Fail)" \
    "PATCH" \
    "/vendors/2/verify" \
    "" \
    403 \
    "$VENDOR_TOKEN"

test_endpoint \
    "Verify Vendor - Customer Token (Should Fail)" \
    "PATCH" \
    "/vendors/3/verify" \
    "" \
    403 \
    "$CUSTOMER_TOKEN"

# ========== SUMMARY ==========
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed${NC}"
    exit 1
fi
