from .DbContext import DbContext
import re

class GetAll:
    def __init__(self):
        self.data = None

    def fetch_data(self):
        db = DbContext()
        db.connect()
        self.data = db.GetAllDataFromDatabase()
        db.close()
        return self.data
    
    def fetch_one_data(self, cdr_id):
        db = DbContext()
        db.connect()
        self.data = db.get_cdr(cdr_id)
        db.close()
        return self.data
    
    def parse_import_log_line(self, line: str):
        pattern = r"^(?P<date>\d{4}-\d{2}-\d{2}) \S+ - (?P<level>INFO|ERROR) - .*?(imported (?P<records>\d+) records|Failed).*?from (?P<filename>[^.]+\.xlsx)"
        match = re.search(pattern, line)
        if not match:
            return None

        status = "Success" if match.group("level") == "INFO" else "Fail"
        records = int(match.group("records")) if status == "Success" and match.group("records") else 0

        return {
            "date": match.group("date"),
            "filename": match.group("filename"),
            "status": status,
            "records": records
        }




