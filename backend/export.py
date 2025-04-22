from Data.DbContext import DbContext
from tkinter import Tk
from tkinter.filedialog import asksaveasfilename

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

if __name__ == "__main__":
    try:
        export_db_to_file()
    except Exception as e:
        print(f"An error occurred: {str(e)}") 