import sqlite3
import uuid
import datetime

class SessionManager:
    def __init__(self, db_path):
        self.db_path = db_path

    def create_sessions_table(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Sessions (
                    session_token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES USERS(User_ID)
                )
            """)
            conn.commit()

    def create_session(self, user_id):
        session_token = str(uuid.uuid4())
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO Sessions (session_token, user_id) VALUES (?, ?)",
                (session_token, user_id)
            )
            conn.commit()
        return session_token

    def get_user_id(self, session_token):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT user_id FROM Sessions WHERE session_token = ?",
                (session_token,)
            )
            row = cursor.fetchone()
            return row[0] if row else None
