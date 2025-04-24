from data.DbContext import DbContext

class GetAll:
    def __init__(self):
        self.data = None

    def fetch_data(self):
        db = DbContext()
        db.connect()
        self.data = db.GetAllDataFromDatabase()
        db.close()
        return self.data

