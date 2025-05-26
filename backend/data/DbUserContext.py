import sqlite3

# from datetime import datetime
import pandas as pd
import os
import bcrypt

class Hashing:
    def hash_password(self, plain_password: str) -> str:
        """Hash a plain password using bcrypt."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(plain_password.encode('utf-8'), salt)
        return hashed.decode('utf-8')  # Store as string in DB

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against the hashed one."""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

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

        # Define the schema for the USERS table
        user_schema = """
            User_ID TEXT PRIMARY KEY,
            User_Name TEXT,
            User_Password TEXT 
        """

        self.create_table("USERS", user_schema)

        cursor = self.connection.cursor()
        cursor.execute("SELECT 1 FROM USERS WHERE User_ID = ?", ('1',))
        if cursor.fetchone() is None:
            # Hash the password before inserting
            hasher = Hashing()
            hashed_password = hasher.hash_password('Admin')

            cursor.execute(
                "INSERT INTO USERS (User_ID, User_Name, User_Password) VALUES (?, ?, ?)",
                ('1', 'Admin', hashed_password)
            )
            self.connection.commit()
            print("Default admin user inserted.")
        else:
            print("Default admin user already exists.")
        self.close()

    def insert_user(self, user_data):
        """Insert a new USER record with:
        - no duplicate usernames,
        - auto-incremented User_ID,
        - bcrypt-hashed password.
        """
        if not self.connection:
            print("No database connection. Call connect() first.")
            return False  # indicate failure

        cursor = self.connection.cursor()

        # 1) Check for duplicate username
        username = user_data.get('User_Name')
        if username:
            cursor.execute(
                "SELECT 1 FROM USERS WHERE User_Name = ?",
                (username,)
            )
            if cursor.fetchone():
                print(f"Username '{username}' already exists. Aborting insert.")
                return False

        # 2) Hash the password
        hasher = Hashing()
        plain_password = user_data.get('User_Password')
        if plain_password is not None:
            user_data['User_Password'] = hasher.hash_password(plain_password)

        # 3) Determine the next User_ID
        cursor.execute("SELECT MAX(CAST(User_ID AS INTEGER)) FROM USERS")
        max_id_row = cursor.fetchone()
        max_id = max_id_row[0] if max_id_row and max_id_row[0] is not None else 0
        next_id = max_id + 1
        user_data['User_ID'] = str(next_id)

        # 4) Build and execute the INSERT
        columns      = ", ".join(user_data.keys())
        placeholders = ", ".join(["?"] * len(user_data))
        sql          = f"INSERT INTO USERS ({columns}) VALUES ({placeholders})"

        cursor.execute(sql, list(user_data.values()))
        self.connection.commit()
        print(f"Inserted new USER record with ID: {user_data['User_ID']}")
        return True  # indicate success

    def get_user(self, username, password):
        if self.connection:
            cursor = self.connection.cursor()
            cursor.execute("SELECT * FROM USERS WHERE User_Name = ?", (username,))
            user = cursor.fetchone()
            if user is None:
                return None
            
            stored_hashed_password = user[2]  # index van User_Password in SELECT * results
            hasher = Hashing()
            if hasher.verify_password(password, stored_hashed_password):
                return user
            else:
                return None
        else:
            print("No database connection. Call connect() first.")
            return None

    def get_user_by_id(self, user_id):
        cursor = self.connection.cursor()
        cursor.execute("SELECT * FROM USERS WHERE User_ID = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, row))
        return None

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            print(f"Connection to {self.db_name} closed.")
    
    