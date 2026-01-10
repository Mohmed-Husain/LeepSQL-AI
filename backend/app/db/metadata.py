"""
Database metadata extraction module.
Retrieves schema information for AI context without exposing sensitive data.
"""

from typing import Dict, List, Optional
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.schemas.request import DatabaseType

logger = logging.getLogger(__name__)


class MetadataExtractor:
    """
    Extracts database schema metadata for AI agent context.
    Provides table structures, columns, and relationships.
    """
    
    @staticmethod
    def get_schema_info(engine: Engine, db_type: DatabaseType) -> Optional[Dict]:
        """
        Extract comprehensive schema information from database.
        
        Args:
            engine: SQLAlchemy engine
            db_type: Database type
        
        Returns:
            Dictionary containing schema metadata, None if error
        """
        
        try:
            inspector = inspect(engine)
            
            schema_info = {
                "tables": [],
                "table_count": 0
            }
            
            # Get all table names
            table_names = inspector.get_table_names()
            schema_info["table_count"] = len(table_names)
            
            # Extract metadata for each table
            for table_name in table_names:
                table_info = MetadataExtractor._get_table_info(
                    inspector, table_name, engine, db_type
                )
                schema_info["tables"].append(table_info)
            
            logger.info(f"Schema extracted: {len(table_names)} tables")
            return schema_info
        
        except SQLAlchemyError as e:
            logger.error(f"Schema extraction failed: {str(e)}")
            return None
        
        except Exception as e:
            logger.error(f"Unexpected error during schema extraction: {str(e)}")
            return None
    
    @staticmethod
    def _get_table_info(
        inspector,
        table_name: str,
        engine: Engine,
        db_type: DatabaseType
    ) -> Dict:
        """Extract metadata for a single table."""
        
        table_info = {
            "name": table_name,
            "columns": [],
            "primary_keys": [],
            "foreign_keys": []
        }
        
        # Get columns
        columns = inspector.get_columns(table_name)
        for column in columns:
            table_info["columns"].append({
                "name": column["name"],
                "type": str(column["type"]),
                "nullable": column.get("nullable", True),
                "default": str(column.get("default")) if column.get("default") else None
            })
        
        # Get primary keys
        pk_constraint = inspector.get_pk_constraint(table_name)
        if pk_constraint:
            table_info["primary_keys"] = pk_constraint.get("constrained_columns", [])
        
        # Get foreign keys
        foreign_keys = inspector.get_foreign_keys(table_name)
        for fk in foreign_keys:
            table_info["foreign_keys"].append({
                "columns": fk.get("constrained_columns", []),
                "referred_table": fk.get("referred_table"),
                "referred_columns": fk.get("referred_columns", [])
            })
        
        # Get approximate row count (for context)
        try:
            row_count = MetadataExtractor._get_row_count(
                engine, table_name, db_type
            )
            table_info["approximate_rows"] = row_count
        except:
            table_info["approximate_rows"] = None
        
        return table_info
    
    @staticmethod
    def _get_row_count(engine: Engine, table_name: str, db_type: DatabaseType) -> Optional[int]:
        """Get approximate row count for a table."""
        
        try:
            with engine.connect() as conn:
                if db_type == DatabaseType.POSTGRES:
                    # Use pg_class for fast approximate count
                    query = text(
                        "SELECT reltuples::bigint FROM pg_class "
                        "WHERE relname = :table_name"
                    )
                    result = conn.execute(query, {"table_name": table_name})
                    row = result.fetchone()
                    return int(row[0]) if row else None
                
                elif db_type == DatabaseType.MYSQL:
                    # Use information_schema for MySQL
                    query = text(
                        "SELECT TABLE_ROWS FROM information_schema.TABLES "
                        "WHERE TABLE_NAME = :table_name"
                    )
                    result = conn.execute(query, {"table_name": table_name})
                    row = result.fetchone()
                    return int(row[0]) if row else None
                
                else:
                    # Fallback: actual count (may be slow)
                    query = text(f"SELECT COUNT(*) FROM {table_name}")
                    result = conn.execute(query)
                    row = result.fetchone()
                    return int(row[0]) if row else None
        
        except:
            return None
    
    @staticmethod
    def format_schema_for_ai(schema_info: Dict) -> str:
        """
        Format schema information as a concise string for AI agent.
        
        Args:
            schema_info: Schema metadata dictionary
        
        Returns:
            Formatted schema string
        """
        
        if not schema_info or not schema_info.get("tables"):
            return "No tables found in database"
        
        lines = [f"Database contains {schema_info['table_count']} tables:\n"]
        
        for table in schema_info["tables"]:
            lines.append(f"\nTable: {table['name']}")
            
            # Primary keys
            if table.get("primary_keys"):
                lines.append(f"  Primary Key(s): {', '.join(table['primary_keys'])}")
            
            # Columns
            lines.append("  Columns:")
            for col in table["columns"]:
                null_str = "NULL" if col["nullable"] else "NOT NULL"
                lines.append(f"    - {col['name']}: {col['type']} ({null_str})")
            
            # Foreign keys
            if table.get("foreign_keys"):
                lines.append("  Foreign Keys:")
                for fk in table["foreign_keys"]:
                    fk_str = f"{', '.join(fk['columns'])} -> {fk['referred_table']}({', '.join(fk['referred_columns'])})"
                    lines.append(f"    - {fk_str}")
            
            # Row count
            if table.get("approximate_rows") is not None:
                lines.append(f"  Approximate Rows: {table['approximate_rows']:,}")
        
        return "\n".join(lines)
