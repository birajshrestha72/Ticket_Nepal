"""
Update user passwords with properly hashed versions
Run this once to fix the seed data passwords
"""
import asyncio
from app.core.security import hash_password
from app.config.database import database

async def update_passwords():
    """Update all user passwords to 'password123' with proper bcrypt hash"""
    try:
        await database.connect()
        
        # Generate proper hash for 'password123'
        password = 'password123'
        hashed = hash_password(password)
        
        print(f"Updating all user passwords to: {password}")
        print(f"Using hash: {hashed}")
        
        # Update all users
        result = await database.execute(
            "UPDATE users SET password_hash = $1 WHERE auth_provider = 'email'",
            hashed
        )
        
        print(f"✅ Updated {result} user passwords")
        
        # Verify by fetching users
        users = await database.fetch_all(
            "SELECT user_id, name, email, role FROM users WHERE auth_provider = 'email'"
        )
        
        print(f"\n📋 Updated users:")
        for user in users:
            print(f"  - {user['name']} ({user['email']}) - Role: {user['role']}")
        
        print(f"\n✅ All users can now login with password: {password}")
        
        await database.disconnect()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(update_passwords())
