"""
Database Configuration - PostgreSQL connection pool
asyncpg library use garera async database operations
"""

import asyncpg
from typing import Optional
from .settings import settings


class Database:
    """Database connection pool manager"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create connection pool"""
        if self.pool is None:
            self.pool = await asyncpg.create_pool(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                database=settings.DB_NAME,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            print("✅ Database pool created")
    
    async def disconnect(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            print("👋 Database pool closed")
    
    async def fetch_one(self, query: str, *args):
        """Execute query and return single row"""
        await self.connect()
        async with self.pool.acquire() as connection:
            return await connection.fetchrow(query, *args)
    
    async def fetch_all(self, query: str, *args):
        """Execute query and return all rows"""
        await self.connect()
        async with self.pool.acquire() as connection:
            return await connection.fetch(query, *args)
    
    async def execute(self, query: str, *args):
        """Execute query without returning results"""
        await self.connect()
        async with self.pool.acquire() as connection:
            return await connection.execute(query, *args)
    
    async def execute_many(self, query: str, args_list):
        """Execute same query with multiple parameter sets"""
        await self.connect()
        async with self.pool.acquire() as connection:
            return await connection.executemany(query, args_list)


# Global database instance
database = Database()


async def test_connection():
    """Test database connection"""
    try:
        await database.connect()
        result = await database.fetch_one("SELECT version();")
        print(f"📊 PostgreSQL version: {result['version'][:50]}...")
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise
