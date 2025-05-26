import sqlite3
import time

class FraudDecisionManager:
    def __init__(self, db_path):
        self.db_path = db_path

    def create_decision_table(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS fraud_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cdr_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            approved BOOLEAN NOT NULL,
            reason TEXT NOT NULL,
            decision_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        conn.commit()
        conn.close()

    def add_decision(self, cdr_id, user_id, user_name, approved, reason):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO fraud_decisions (cdr_id, user_id, user_name, approved, reason)
        VALUES (?, ?, ?, ?, ?)
        ''', (cdr_id, user_id, user_name, approved, reason))
        conn.commit()
        conn.close()

    def get_decisions_for_cdr(self, cdr_id):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        SELECT id, cdr_id, user_id, user_name, approved, reason, decision_time
        FROM fraud_decisions
        WHERE cdr_id = ?
        ORDER BY decision_time DESC
        ''', (cdr_id,))
        decisions = cursor.fetchall()
        conn.close()
        return decisions
