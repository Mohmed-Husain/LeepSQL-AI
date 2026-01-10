import psycopg2


def get_user_tables(db_url: str) -> str:
    """
    Fetch all user-defined tables from PostgreSQL database as a string.
    
    Args:
        db_url: Database connection string (e.g., 'postgresql://user:pass@host:port/dbname')
    
    Returns:
        String with each line in format "schema.table"
    """
    conn = None
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        query = """
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name
        """
        
        cur.execute(query)
        results = cur.fetchall()
        
        # Convert results to "schema.table" strings and join with newlines
        return "\n".join([f"{row[0]}.{row[1]}" for row in results])
        
    finally:
        if conn:
            conn.close()

# Example usage:
# if __name__ == "__main__":
#     url = "postgresql://user:password@localhost:5432/mydb"
#     tables_str = get_user_tables(url)
#     print(tables_str)
