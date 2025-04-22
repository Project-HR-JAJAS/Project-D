from Data.DbContext import DbContext
import os
from typing import Tuple, Optional
from tkinter import Tk
from tkinter.filedialog import askopenfilename


def import_excel_to_db(file_path: str) -> Tuple[bool, str, Optional[int]]:
    try:
        if not os.path.exists(file_path):
            return False, f"File not found at: {file_path}", None

        if not file_path.lower().endswith(('.xlsx', '.xls')):
            return False, "Invalid file format. Please provide an Excel file (.xlsx or .xls)", None

        # Initialize database
        db = DbContext()
        db.initialize_database()  # Ensure the table is created

        # Import the Excel file
        records_imported = db.import_excel_to_database(file_path)

        if records_imported > 0:
            return True, f"Successfully imported {records_imported} records", records_imported
        else:
            return False, "No records were imported. Please check the Excel file format.", None

    except Exception as e:
        return False, f"Error importing file: {str(e)}", None

def main():
    # Use a file dialog to select the file
    Tk().withdraw()  # Hide the root Tkinter window
    file_path = askopenfilename(
        title="Select an Excel or CSV file",
        filetypes=[("Excel files", "*.xlsx *.xls"), ("CSV files", "*.csv"), ("All files", "*.*")]
    )
    
    if not file_path:
        print("No file selected.")
        return
    
    success, message, count = import_excel_to_db(file_path)
    print(message)
    if success:
        print(f"Total records imported: {count}")

if __name__ == "__main__":
    main()