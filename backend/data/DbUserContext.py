import sqlite3

# from datetime import datetime
import pandas as pd
import logging
import os


class DbUserContext:
    def __init__(self, db_name="user.db"):
        # Get the parent directory of the current file's directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Construct the correct db path
        self.db_name = os.path.join(base_dir, db_name)
        print("Database path:", self.db_name)
        self.connection = None

    def connect(self):
        """Establish a connection to the SQLite database."""
        self.connection = sqlite3.connect(self.db_name)
        print(f"Connected to {self.db_name}")

    def create_table(self, table_name, schema):
        if self.connection:
            cursor = self.connection.cursor()
            cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_name} ({schema})")
            self.connection.commit()
            print(f"Table '{table_name}' created or already exists.")
        else:
            print("No database connection. Call connect() first.")

    def initialize_user_database(self):
        """Initialize the database by creating all required tables."""
        self.connect()

        # Define the schema for the CDR (Charge Detail Record) table
        user_schema = """
            User_ID TEXT PRIMARY KEY,
            User_Name TEXT,
            User_Password TEXT 
        """

        # Create the CDR table
        self.create_table("USERS", user_schema)

        cursor = self.connection.cursor()
        cursor.execute("SELECT 1 FROM USERS WHERE User_ID = ?", ('1',))
        if cursor.fetchone() is None:
            cursor.execute(
                "INSERT INTO USERS (User_ID, User_Name, User_Password) VALUES (?, ?, ?)",
                ('1', 'Admin', 'Admin')
            )
            self.connection.commit()
            print("Default admin user inserted.")
        else:
            print("Default admin user already exists.")

        self.close()

    def insert_user(self, user_data):
        """Insert a new USER record into the database."""
        if self.connection:
            cursor = self.connection.cursor()
            columns = ", ".join(user_data.keys())
            placeholders = ", ".join(["?"] * len(user_data))
            sql = f"INSERT INTO USERS ({columns}) VALUES ({placeholders})"
            cursor.execute(sql, list(user_data.values()))
            self.connection.commit()
            print(f"Inserted new USER record with ID: {user_data['User_ID']}")
        else:
            print("No database connection. Call connect() first.")
    
    def get_user(self, username, password):
        """Retrieve a USER record by matching User_Name and User_Password."""
        if self.connection:
            cursor = self.connection.cursor()
            cursor.execute(
                "SELECT * FROM USERS WHERE User_Name = ? AND User_Password = ?",
                (username, password)
            )
            return cursor.fetchone()
        else:
            print("No database connection. Call connect() first.")
            return None
    
    # def GetAllDataFromDatabase(self):
    #     """Retrieve all USER records."""
    #     if self.connection:
    #         cursor = self.connection.cursor()
    #         cursor.execute("SELECT * FROM USERS")
    #         return cursor.fetchall()
    #     else:
    #         print("No database connection. Call connect() first.")
    #         return None
        
    # def GetAllDataFromDatabaseNumber(self):
    #     """Retrieve all USER records."""
    #     if self.connection:
    #         cursor = self.connection.cursor()
    #         cursor.execute("SELECT COUNT(*) FROM USERS")
    #         return cursor.fetchone()[0]
    #     else:
    #         print("No database connection. Call connect() first.")
    #         return None

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            print(f"Connection to {self.db_name} closed.")
    
    