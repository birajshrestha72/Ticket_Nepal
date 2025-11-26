#!/bin/bash

echo "Testing Seat Availability API..."
echo ""
echo "Test 1: Get seat availability for schedule 1 on 2024-11-25"
curl -s "http://localhost:8000/api/v1/schedules/1/seats?journey_date=2024-11-25"
echo ""
echo ""
echo "Test 2: Get seat availability for schedule 1 on 2024-12-01"
curl -s "http://localhost:8000/api/v1/schedules/1/seats?journey_date=2024-12-01"
echo ""
