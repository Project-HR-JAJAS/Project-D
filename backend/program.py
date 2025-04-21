from Data.DbContext import DbContext
import os
from typing import Tuple, Optional

def import_excel_to_db(file_path: str) -> Tuple[bool, str, Optional[int]]:
    """
    Import an Excel file into the database.
    
    Args:
        file_path (str): Path to the Excel file
        
    Returns:
        Tuple[bool, str, Optional[int]]: 
            - Success status (True/False)
            - Message describing the result
            - Number of records imported (if successful, None if failed)
    """
    try:
        if not os.path.exists(file_path):
            return False, f"File not found at: {file_path}", None
            
        if not file_path.lower().endswith(('.xlsx', '.xls')):
            return False, "Invalid file format. Please provide an Excel file (.xlsx or .xls)", None
            
        # Initialize database
        db = DbContext()
        
        # Import the Excel file
        records_imported = db.import_excel_to_database(file_path)
        
        if records_imported > 0:
            return True, f"Successfully imported {records_imported} records", records_imported
        else:
            return False, "No records were imported. Please check the Excel file format.", None
            
    except Exception as e:
        return False, f"Error importing file: {str(e)}", None

def main():
    # Example usage of the import function
    file_path = r'C:\Users\Aymane\Downloads\report_20250212_141749 - 20250211 - 0000to0900.xlsx'
    success, message, count = import_excel_to_db(file_path)
    print(message)
    if success:
        print(f"Total records imported: {count}")

if __name__ == "__main__":
    main()