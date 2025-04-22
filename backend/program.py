from Data.DbContext import DbContext
import os
from typing import Tuple, Optional
from tkinter import Tk
from tkinter.filedialog import askopenfilename
from tkinter.filedialog import asksaveasfilename


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

def export_db_to_file():
    db = DbContext()
    root = Tk()
    root.withdraw()  # hides the Tkinter window

    output_path = asksaveasfilename(
        title="Save as",
        defaultextension=".xlsx",
        filetypes=[
            ("Excel file", "*.xlsx *.xls"), ("CSV file", "*.csv")
        ]
    )

    root.destroy()

    if not output_path:
        print("Export cancelled.")
        return

    success = db.export_cdr_to_file(output_path)
    if success:
        print("Export completed.")
    else:
        print("Export failed.")


def main():
    print("Select an action:")
    print("1. Import Excel to DB")
    print("2. Export DB to CSV/XLSX")
    choice = input("Enter your choice (1 or 2): ").strip()

    if choice == "1":  # Use a file dialog to select the file
        root = Tk()
        root.withdraw()  # Hide the root Tkinter window
        file_path = askopenfilename(
            title="Select an Excel or CSV file",
            filetypes=[("Excel files", "*.xlsx *.xls"), ("CSV files", "*.csv"), ("All files", "*.*")]
        )
        root.destroy()  # Destroy the Tkinter root window

        if not file_path:
            print("No file selected.")
            return

        success, message, count = import_excel_to_db(file_path)
        print(message)
        if success:
            print(f"Total records imported: {count}")
    elif choice == "2":
        root = Tk()
        #root.withdraw()  # Hide the root Tkinter window
        export_db_to_file()
        root.destroy()  # Destroy the Tkinter root window
    else:
        print("Invalid choice.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"An error occurred: {str(e)}")