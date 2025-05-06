from Data.DbContext import DbContext

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

