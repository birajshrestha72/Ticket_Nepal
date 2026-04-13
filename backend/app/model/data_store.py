users = [
    {
        "user_id": 1,
        "name": "Demo Customer",
        "email": "customer@example.com",
        "role": "customer",
    },
    {
        "user_id": 2,
        "name": "Demo Vendor",
        "email": "vendor@example.com",
        "role": "vendor",
    },
]

buses = [
    {
        "bus_id": 1,
        "bus_name": "Greenline Express",
        "from_city": "Kathmandu",
        "to_city": "Pokhara",
        "price": 1200,
        "seat_capacity": 40,
        "is_active": True,
    },
    {
        "bus_id": 2,
        "bus_name": "Mountain Rider",
        "from_city": "Kathmandu",
        "to_city": "Chitwan",
        "price": 900,
        "seat_capacity": 35,
        "is_active": True,
    },
]

routes = [
    {
        "route_id": 1,
        "from_city": "Kathmandu",
        "to_city": "Pokhara",
        "distance_km": 200,
        "is_active": True,
    },
    {
        "route_id": 2,
        "from_city": "Kathmandu",
        "to_city": "Chitwan",
        "distance_km": 160,
        "is_active": True,
    },
]

schedules = [
    {
        "schedule_id": 1,
        "bus_id": 1,
        "route_id": 1,
        "departure_time": "2026-03-22T07:00",
        "arrival_time": "2026-03-22T13:00",
        "fare": 1200,
        "is_active": True,
    },
    {
        "schedule_id": 2,
        "bus_id": 2,
        "route_id": 2,
        "departure_time": "2026-03-22T08:30",
        "arrival_time": "2026-03-22T13:30",
        "fare": 900,
        "is_active": True,
    },
]

bookings = []

next_ids = {
    "user_id": 3,
    "bus_id": 3,
    "route_id": 3,
    "schedule_id": 3,
    "booking_id": 1,
}
