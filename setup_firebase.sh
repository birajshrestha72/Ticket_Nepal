#!/bin/bash

# Firebase Google Sign-In Setup Script
# Automates database schema updates for Firebase Authentication

echo "🚀 Firebase Google Sign-In Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL first:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Database name
DB_NAME="ticket_nepal"
DB_USER="postgres"

echo "📊 Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo ""

# Check if database exists
if ! psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${RED}❌ Database '$DB_NAME' not found${NC}"
    echo "Please create the database first:"
    echo "  psql -U postgres -c 'CREATE DATABASE ticket_nepal;'"
    exit 1
fi

echo -e "${GREEN}✅ Database '$DB_NAME' exists${NC}"
echo ""

# Run schema update
echo "🔧 Updating database schema for Firebase..."
echo ""

psql -U $DB_USER -d $DB_NAME -f database/firebase_schema_update.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Firebase schema update complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Create Firebase project at https://console.firebase.google.com/"
    echo "  2. Enable Google Sign-In in Authentication"
    echo "  3. Copy Firebase config to .env file"
    echo "  4. Download service account JSON"
    echo ""
    echo "📖 See FIREBASE_GOOGLE_SETUP.md for detailed instructions"
else
    echo ""
    echo -e "${RED}❌ Schema update failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi
