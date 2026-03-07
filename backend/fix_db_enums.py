import os, sys
from sqlalchemy import text

sys.path.append(os.getcwd())
from app.database import SessionLocal

def fix_enum():
    db = SessionLocal()
    
    # Needs to be run OUTSIDE a transaction block since ALTER TYPE ADD VALUE cannot run inside a transaction block in older Postgres, 
    # but wait, it CAN in newer Postgres or with auto-commit.
    # We will use raw connection with isolation_level AUTOCOMMIT:
    try:
        conn = db.connection().engine.connect()
        conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            conn.execute(text("ALTER TYPE transactiontype ADD VALUE 'CANTEEN_PURCHASE';"))
            print("Added CANTEEN_PURCHASE to transactiontype.")
        except Exception as e:
            print("Failed to add CANTEEN_PURCHASE (might already exist):", e)
            
        try:
            conn.execute(text("ALTER TYPE transactiontype ADD VALUE 'LIBRARY_RENTAL';"))
            print("Added LIBRARY_RENTAL to transactiontype.")
        except Exception as e:
            print("Failed to add LIBRARY_RENTAL (might already exist):", e)
            
        conn.close()
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    fix_enum()
