import sqlite3
import os

class FraudDecisionManager:
    def __init__(self, db_path):
        self.db_path = db_path

    def create_decision_table(self):
        # Ensure the directory for the database exists
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS fraud_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cdr_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('approve', 'deny', 'maybe')),
            reason TEXT NOT NULL,
            decision_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        conn.commit()
        conn.close()

    def add_decision(self, cdr_id, user_id, user_name, status, reason):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO fraud_decisions (cdr_id, user_id, user_name, status, reason)
        VALUES (?, ?, ?, ?, ?)
        ''', (cdr_id, user_id, user_name, status, reason))
        conn.commit()
        conn.close()

    def get_decisions_for_cdr(self, cdr_id):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        SELECT id, cdr_id, user_id, user_name, status, reason, decision_time
        FROM fraud_decisions
        WHERE cdr_id = ?
        ORDER BY decision_time DESC
        ''', (cdr_id,))
        decisions = cursor.fetchall()
        conn.close()
        return decisions
