import os
import csv
import psycopg2
from urllib.parse import urlparse, urlunparse

def import_csv_to_postgres(connection_url: str, database: str, csv_path: str) -> None:
    """
    Import CSV data into PostgreSQL database with table name matching CSV filename.
    
    Args:
        connection_url: Base PostgreSQL connection URL (e.g., 'postgresql://user:pass@host:port')
        database: Database name to connect to
        csv_path: Path to CSV file to import
    
    Raises:
        ValueError: If CSV file is invalid or connection fails
        RuntimeError: If database operations fail
    """
    # Validate inputs
    if not os.path.exists(csv_path):
        raise ValueError(f"CSV file not found: {csv_path}")
    if not csv_path.lower().endswith('.csv'):
        raise ValueError("File must be a CSV")
    
    # Create proper connection string
    parsed = urlparse(connection_url)
    if parsed.path and parsed.path != '/':
        raise ValueError("Connection URL should not include database name")
    
    # Create connection string with database
    conn_str = urlunparse(parsed._replace(path=f"/{database}"))
    
    # Extract table name from filename (without extension)
    table_name = os.path.splitext(os.path.basename(csv_path))[0].lower()
    
    try:
        # Connect to database
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        # Read CSV and infer schema
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            # Handle BOM in UTF-8 files
            sample = f.read(2048)
            f.seek(0)
            has_header = csv.Sniffer().has_header(sample)
            
            reader = csv.reader(f)
            headers = next(reader)
            
            # Skip empty lines
            while not headers:
                headers = next(reader)
            
            # Validate headers
            if not headers:
                raise ValueError("CSV file has no headers")
            
            # Create CREATE TABLE statement with type inference
            columns = []
            for header in headers:
                clean_header = header.strip().replace('"', '""')
                columns.append(f'"{clean_header}" TEXT')
            
            create_table = f"""
            CREATE TABLE IF NOT EXISTS "{table_name}" (
                {', '.join(columns)}
            );
            """
            cur.execute(create_table)
            
        # Import data using COPY - FIXED: Don't skip header manually
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            # Use CSV format with proper quoting
            # HEADER true means the first line IS a header and should be skipped
            cur.copy_expert(
                f"""
                COPY "{table_name}" 
                FROM STDIN 
                WITH (
                    FORMAT CSV,
                    DELIMITER ',',
                    QUOTE '"',
                    ESCAPE '"',
                    HEADER true
                )
                """,
                f
            )
        
        conn.commit()
        
        # Verify data was imported
        cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        count = cur.fetchone()[0]
        print(f"Successfully imported {count} rows from {csv_path} into {database}.{table_name}")
    
    except psycopg2.Error as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        raise RuntimeError(f"Database error: {e.pgerror or e}") from e
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        raise RuntimeError(f"Import failed: {str(e)}") from e
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

# Example usage
if __name__ == "__main__":
    try:
        import_csv_to_postgres(
            connection_url="postgresql://postgres:,C^qsk~wWdq7*p4@db.gmixhcrgxajwaligvyxz.supabase.co:5432",
            database="postgres",
            csv_path="k.csv"
        )
    except Exception as e:
        print(f"Error: {e}")