import psycopg2
import logging

logger = logging.getLogger(__name__)


def get_detailed_schema(db_url: str) -> str:
    """
    Fetch detailed schema information for all user-defined tables from PostgreSQL database.
    
    Args:
        db_url: Database connection string (e.g., 'postgresql://user:pass@host:port/dbname')
    
    Returns:
        Formatted string with complete schema details including:
        - Table names with schema
        - Column names, data types, nullability, defaults
        - Primary keys
        - Foreign keys with references
        - Unique constraints
    """
    conn = None
    logger.info("[SCHEMA_EXTRACTOR] Attempting to connect to database...")
    
    try:
        conn = psycopg2.connect(db_url)
        logger.info("[SCHEMA_EXTRACTOR] Connected to database successfully")
        cur = conn.cursor()
        
        # Get all user tables (only from public schema)
        tables_query = """
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name
        """
        cur.execute(tables_query)
        tables = cur.fetchall()
        logger.info(f"[SCHEMA_EXTRACTOR] Found {len(tables)} tables")
        
        schema_output = []
        
        for table_schema, table_name in tables:
            table_info = [f"\n{'='*60}"]
            table_info.append(f"TABLE: {table_schema}.{table_name}")
            table_info.append(f"{'='*60}")
            
            # Get columns with details
            columns_query = """
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = %s AND table_name = %s
                ORDER BY ordinal_position
            """
            cur.execute(columns_query, (table_schema, table_name))
            columns = cur.fetchall()
            
            table_info.append("\nCOLUMNS:")
            table_info.append("-" * 40)
            for col in columns:
                col_name, data_type, char_len, num_prec, num_scale, nullable, default = col
                
                # Build type string with length/precision
                type_str = data_type
                if char_len:
                    type_str += f"({char_len})"
                elif num_prec and data_type in ('numeric', 'decimal'):
                    type_str += f"({num_prec},{num_scale or 0})"
                
                nullable_str = "NULL" if nullable == "YES" else "NOT NULL"
                default_str = f" DEFAULT {default}" if default else ""
                
                table_info.append(f"  {col_name}: {type_str} {nullable_str}{default_str}")
            
            # Get primary key
            pk_query = """
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = %s AND tc.table_name = %s
                ORDER BY kcu.ordinal_position
            """
            cur.execute(pk_query, (table_schema, table_name))
            pk_columns = [row[0] for row in cur.fetchall()]
            
            if pk_columns:
                table_info.append(f"\nPRIMARY KEY: ({', '.join(pk_columns)})")
            
            # Get foreign keys
            fk_query = """
                SELECT
                    kcu.column_name,
                    ccu.table_schema AS ref_schema,
                    ccu.table_name AS ref_table,
                    ccu.column_name AS ref_column
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = %s AND tc.table_name = %s
            """
            cur.execute(fk_query, (table_schema, table_name))
            fks = cur.fetchall()
            
            if fks:
                table_info.append("\nFOREIGN KEYS:")
                for fk in fks:
                    col, ref_schema, ref_table, ref_col = fk
                    table_info.append(f"  {col} -> {ref_schema}.{ref_table}({ref_col})")
            
            # Get unique constraints
            unique_query = """
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'UNIQUE'
                AND tc.table_schema = %s AND tc.table_name = %s
            """
            cur.execute(unique_query, (table_schema, table_name))
            unique_cols = [row[0] for row in cur.fetchall()]
            
            if unique_cols:
                table_info.append(f"\nUNIQUE CONSTRAINTS: ({', '.join(unique_cols)})")
            
            schema_output.append("\n".join(table_info))
        
        logger.info("[SCHEMA_EXTRACTOR] Schema extraction completed")
        return "\n".join(schema_output)
    
    except psycopg2.OperationalError as e:
        logger.error(f"[SCHEMA_EXTRACTOR] Database connection error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"[SCHEMA_EXTRACTOR] Error extracting schema: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()
            logger.info("[SCHEMA_EXTRACTOR] Database connection closed")


def get_user_tables(db_url: str) -> str:
    """
    Fetch all user-defined table names from PostgreSQL database as a string.
    
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
        
        return "\n".join([f"{row[0]}.{row[1]}" for row in results])
        
    finally:
        if conn:
            conn.close()

# Example usage:
if __name__ == "__main__":
    url = "postgresql://postgres:,C^qsk~wWdq7*p4@db.gmixhcrgxajwaligvyxz.supabase.co:5432/postgres"
    tables_str = get_detailed_schema(url)
    print(tables_str)
