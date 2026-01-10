# import os
# import csv
# import psycopg2
# from urllib.parse import urlparse, urlunparse

# def import_csv_to_postgres(
#     csv_path: str,
#     table_name: str,
#     database: str = "postgres",
#     connection_url: str = "postgresql://postgres:,C^qsk~wWdq7*p4@db.gmixhcrgxajwaligvyxz.supabase.co:5432"
# ) -> None:
#     """
#     Import CSV into Supabase with EXACT table name specified.
#     """
#     print(f"🎯 TARGET TABLE NAME: {table_name}")
    
#     if not os.path.exists(csv_path):
#         raise ValueError(f"CSV file not found: {csv_path}")
    
#     if not csv_path.lower().endswith(".csv"):
#         raise ValueError("File must be a CSV")
    
#     # Parse connection URL
#     parsed = urlparse(connection_url)
#     if parsed.path and parsed.path != "/":
#         raise ValueError("Connection URL should not include database name")
    
#     conn_str = urlunparse(parsed._replace(path=f"/{database}"))
    
#     conn = None
#     cur = None
    
#     try:
#         # Connect to database
#         conn = psycopg2.connect(conn_str)
#         cur = conn.cursor()
        
#         print(f"✅ Connected to database")
        
#         # Read CSV headers
#         with open(csv_path, "r", encoding="utf-8-sig") as f:
#             reader = csv.reader(f)
#             headers = next(reader)
            
#             # Skip empty rows
#             while not headers or not any(headers):
#                 headers = next(reader)
            
#             if not headers:
#                 raise ValueError("CSV has no headers")
        
#         print(f"📋 Found columns: {headers}")
        
#         # Create columns for table
#         columns = []
#         for h in headers:
#             clean = h.strip().replace('"', '""')
#             columns.append(f'"{clean}" TEXT')
        
#         # ⚠️ CRITICAL: Use the exact table_name parameter here
#         create_table_sql = f'''
#             CREATE TABLE IF NOT EXISTS "{table_name}" (
#                 {", ".join(columns)}
#             );
#         '''
        
#         print(f"🔨 Creating table: {table_name}")
#         print(f"SQL: {create_table_sql[:100]}...")
        
#         cur.execute(create_table_sql)
        
#         # Import CSV data using COPY command
#         with open(csv_path, "r", encoding="utf-8-sig") as f:
#             copy_sql = f'''
#                 COPY "{table_name}"
#                 FROM STDIN WITH (
#                     FORMAT CSV,
#                     DELIMITER ',',
#                     QUOTE '"',
#                     ESCAPE '"',
#                     HEADER true
#                 )
#             '''
            
#             print(f"📥 Importing data into: {table_name}")
#             cur.copy_expert(copy_sql, f)
        
#         conn.commit()
#         print(f"✅ SUCCESS! Data imported into table: {table_name}")
        
#         # Verify the data
#         cur.execute(f'SELECT COUNT(*) FROM "{table_name}";')
#         count = cur.fetchone()[0]
#         print(f"📊 Total rows in {table_name}: {count}")
        
#     except psycopg2.Error as e:
#         if conn:
#             conn.rollback()
#         print(f"❌ Database error: {e}")
#         raise RuntimeError(f"Database error: {e.pgerror or e}") from e
    
#     except Exception as e:
#         print(f"❌ Error: {e}")
#         raise
    
#     finally:
#         if cur:
#             cur.close()
#         if conn:
#             conn.close()
#         print("🔌 Database connection closed")




"""
🎯 MANUAL CSV IMPORT SCRIPT
Run this directly to import your CSV with exact table name
"""

import csv
import psycopg2

# ⭐⭐⭐ CONFIGURATION - CHANGE THESE ⭐⭐⭐
CSV_FILE_PATH = "k.csv"  # <-- Put your CSV file path here
TABLE_NAME = "fuckers"            # <-- Your desired table name
SUPABASE_URL = "postgresql://postgres:,C^qsk~wWdq7*p4@db.gmixhcrgxajwaligvyxz.supabase.co:5432/postgres"

def import_csv_two_step(csv_path, table_name, connection_url):
    """
    Two-step import:
    1. Create table with exact name
    2. Insert CSV data
    
    Returns: dict with import statistics
    """
    
    print(f"\n{'='*70}")
    print(f"🎯 IMPORTING CSV TO SUPABASE")
    print(f"{'='*70}")
    print(f"CSV File: {csv_path}")
    print(f"Table Name: {table_name}")
    print(f"{'='*70}\n")
    
    # ============================================================
    # STEP 1: Read CSV and create table
    # ============================================================
    print("📖 STEP 1: Reading CSV headers...")
    
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader)
        headers = [h.strip() for h in headers if h.strip()]
    
    print(f"✅ Found {len(headers)} columns:")
    for i, col in enumerate(headers, 1):
        print(f"   {i}. {col}")
    
    # Connect to database
    print(f"\n🔗 Connecting to Supabase...")
    conn = psycopg2.connect(connection_url)
    cur = conn.cursor()
    print(f"✅ Connected!")
    
    try:
        # Check if table exists
        print(f"\n🔍 Checking if table '{table_name}' exists...")
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, (table_name,))
        
        table_exists = cur.fetchone()[0]
        
        if table_exists:
            print(f"⚠️  Table '{table_name}' already exists!")
            print(f"🗑️  Dropping it to create fresh...")
            cur.execute(f'DROP TABLE "{table_name}" CASCADE;')
            conn.commit()
            print(f"✅ Old table dropped")
        
        # Create table
        print(f"\n🔨 Creating table '{table_name}'...")
        
        columns_def = []
        for header in headers:
            clean = header.replace('"', '""')
            columns_def.append(f'"{clean}" TEXT')
        
        create_sql = f'''
            CREATE TABLE "{table_name}" (
                {", ".join(columns_def)}
            );
        '''
        
        cur.execute(create_sql)
        conn.commit()
        print(f"✅ Table '{table_name}' created!")
        
        # Verify table was created
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s;
        """, (table_name,))
        
        result = cur.fetchone()
        if result:
            print(f"✅ VERIFIED: Table '{result[0]}' exists in database")
        else:
            raise Exception(f"❌ Table creation failed!")
        
        # ============================================================
        # STEP 2: Insert CSV data
        # ============================================================
        print(f"\n📥 STEP 2: Inserting CSV data into '{table_name}'...")
        
        with open(csv_path, "r", encoding="utf-8-sig") as f:
            column_list = ", ".join([f'"{h.replace(chr(34), chr(34)+chr(34))}"' for h in headers])
            
            copy_sql = f'''
                COPY "{table_name}" ({column_list})
                FROM STDIN WITH (
                    FORMAT CSV,
                    DELIMITER ',',
                    QUOTE '"',
                    ESCAPE '"',
                    HEADER true
                )
            '''
            
            cur.copy_expert(copy_sql, f)
        
        conn.commit()
        print(f"✅ Data inserted!")
        
        # ============================================================
        # STEP 3: Verify the import
        # ============================================================
        print(f"\n📊 STEP 3: Verifying import...")
        
        cur.execute(f'SELECT COUNT(*) FROM "{table_name}";')
        row_count = cur.fetchone()[0]
        
        print(f"✅ Total rows: {row_count}")
        
        # Show first 3 rows as sample
        cur.execute(f'SELECT * FROM "{table_name}" LIMIT 3;')
        sample_rows = cur.fetchall()
        
        print(f"\n📋 Sample data (first 3 rows):")
        print("-" * 70)
        for i, row in enumerate(sample_rows, 1):
            print(f"Row {i}: {row[:3]}..." if len(row) > 3 else f"Row {i}: {row}")
        print("-" * 70)
        
        print(f"\n{'='*70}")
        print(f"✅✅✅ SUCCESS! ✅✅✅")
        print(f"{'='*70}")
        print(f"Table Name: '{table_name}'")
        print(f"Rows Imported: {row_count}")
        print(f"Columns: {len(headers)}")
        print(f"{'='*70}\n")
        
        # ⭐⭐⭐ THIS IS THE FIX - RETURN THE RESULT! ⭐⭐⭐
        return {
            "success": True,
            "table_name": table_name,
            "rows_imported": row_count,
            "columns": headers,
            "column_count": len(headers)
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    
    finally:
        # Close connection
        cur.close()
        conn.close()


