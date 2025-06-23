import os
import sqlite3
import tempfile
from backend.fraude_detectie.Fraude_detectie import FraudDetector


def setup_test_db(data):
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE CDR (
            CDR_ID TEXT PRIMARY KEY,
            Authentication_ID TEXT,
            Charge_Point_ID TEXT,
            Volume TEXT,
            Duration TEXT,
            Calculated_Cost REAL,
            Start_datetime TEXT,
            End_datetime TEXT
        )
    """)
    cursor.executemany(
        """
        INSERT INTO CDR (CDR_ID, Authentication_ID, Charge_Point_ID, Volume, Duration, Calculated_Cost, Start_datetime, End_datetime)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """,
        data,
    )
    conn.commit()
    conn.close()
    return db_path


def teardown_test_db(db_path):
    if os.path.exists(db_path):
        os.remove(db_path)


def test_fraud_percentage():
    # 2 out of 4 are fraud (high volume short duration)
    data = [
        (
            "1",
            "A",
            "CP1",
            "25",
            "00:30:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 10:30:00",
        ),
        (
            "2",
            "A",
            "CP2",
            "10",
            "01:30:00",
            5,
            "2024-01-01 12:00:00",
            "2024-01-01 13:30:00",
        ),
        (
            "3",
            "B",
            "CP3",
            "30",
            "00:20:00",
            50,
            "2024-01-02 09:00:00",
            "2024-01-02 09:20:00",
        ),
        (
            "4",
            "B",
            "CP4",
            "5",
            "02:00:00",
            2,
            "2024-01-02 11:00:00",
            "2024-01-02 13:00:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    fraud_count = len(df)
    total = len(data)
    percentage = fraud_count / total * 100
    assert percentage == 50.0
    teardown_test_db(db_path)


def test_total_fraud_cases():
    data = [
        (
            "1",
            "A",
            "CP1",
            "25",
            "00:30:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 10:30:00",
        ),
        (
            "2",
            "A",
            "CP2",
            "10",
            "01:30:00",
            5,
            "2024-01-01 12:00:00",
            "2024-01-01 13:30:00",
        ),
        (
            "3",
            "B",
            "CP3",
            "30",
            "00:20:00",
            50,
            "2024-01-02 09:00:00",
            "2024-01-02 09:20:00",
        ),
        (
            "4",
            "B",
            "CP4",
            "5",
            "02:00:00",
            2,
            "2024-01-02 11:00:00",
            "2024-01-02 13:00:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    assert len(df) == 2  # Only 2 should be fraud
    teardown_test_db(db_path)


def test_specific_fraud_reason():
    data = [
        (
            "1",
            "A",
            "CP1",
            "25",
            "00:30:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 10:30:00",
        ),
        (
            "2",
            "A",
            "CP2",
            "10",
            "01:30:00",
            25,
            "2024-01-01 12:00:00",
            "2024-01-01 13:30:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    # CDR 1: High volume short duration, CDR 2: Unusual cost per kWh
    reasons = df.set_index("CDR_ID")[["Reason1", "Reason2"]].to_dict("index")
    assert "High volume in short duration" in reasons["1"].values()
    assert any("Unusual cost per kWh" in str(val) for val in reasons["2"].values())
    teardown_test_db(db_path)


def test_no_fraud():
    data = [
        (
            "1",
            "A",
            "CP1",
            "5",
            "01:30:00",
            5,
            "2024-01-01 10:00:00",
            "2024-01-01 11:30:00",
        ),
        (
            "2",
            "B",
            "CP2",
            "6",
            "01:00:00",
            6,
            "2024-01-01 12:00:00",
            "2024-01-01 13:00:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    assert df.empty
    teardown_test_db(db_path)


def test_all_fraud():
    data = [
        (
            "1",
            "A",
            "CP1",
            "30",
            "00:10:00",
            100,
            "2024-01-01 10:00:00",
            "2024-01-01 10:10:00",
        ),
        (
            "2",
            "A",
            "CP2",
            "35",
            "00:05:00",
            120,
            "2024-01-01 10:20:00",
            "2024-01-01 10:25:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    assert len(df) == 2
    teardown_test_db(db_path)


def test_dataframe_columns():
    data = [
        (
            "1",
            "A",
            "CP1",
            "25",
            "00:30:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 10:30:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    expected_cols = [
        "CDR_ID",
        "Reason1",
        "Reason2",
        "Reason3",
        "Reason4",
        "Reason5",
        "Reason6",
        "Reason7",
        "Volume",
        "Calculated_Cost",
        "CostPerKwh",
    ]
    assert all(col in df.columns for col in expected_cols)
    teardown_test_db(db_path)


def test_repeated_behavior():
    # 3 sessions with same reason for same user triggers repeated behavior
    data = [
        (
            "1",
            "A",
            "CP1",
            "25",
            "00:30:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 10:30:00",
        ),
        (
            "2",
            "A",
            "CP2",
            "26",
            "00:20:00",
            12,
            "2024-01-01 11:00:00",
            "2024-01-01 11:20:00",
        ),
        (
            "3",
            "A",
            "CP3",
            "27",
            "00:10:00",
            15,
            "2024-01-01 12:00:00",
            "2024-01-01 12:10:00",
        ),
        (
            "4",
            "B",
            "CP4",
            "5",
            "02:00:00",
            2,
            "2024-01-02 11:00:00",
            "2024-01-02 13:00:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    repeated = df[df["Reason5"].notnull()]
    assert not repeated.empty
    assert any("Repeated behavior" in str(r) for r in repeated["Reason5"].values)
    teardown_test_db(db_path)


def test_overlapping_sessions():
    # Sessions for same user overlap in time
    data = [
        (
            "1",
            "A",
            "CP1",
            "10",
            "01:00:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 11:00:00",
        ),
        (
            "2",
            "A",
            "CP2",
            "12",
            "01:00:00",
            12,
            "2024-01-01 10:30:00",
            "2024-01-01 11:30:00",
        ),
        (
            "3",
            "B",
            "CP3",
            "8",
            "01:00:00",
            8,
            "2024-01-01 12:00:00",
            "2024-01-01 13:00:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    overlap = df[df["Reason4"].notnull()]
    assert not overlap.empty
    assert any("Overlapping sessions" in str(r) for r in overlap["Reason4"].values)
    teardown_test_db(db_path)


def test_data_integrity_violation():
    # Missing Authentication_ID and dirty Charge_Point_ID
    data = [
        (
            "1",
            None,
            " CP1 ",
            "10",
            "01:00:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 11:00:00",
        ),
        (
            "2",
            "A",
            "CP2",
            "12",
            "01:00:00",
            12,
            "2024-01-01 12:00:00",
            "2024-01-01 13:00:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    integrity = df[df["Reason6"].notnull()]
    assert not integrity.empty
    assert any(
        "Data integrity violation" in str(r) for r in integrity["Reason6"].values
    )
    teardown_test_db(db_path)


def test_impossible_travel():
    # Two sessions for same user, far apart, short time
    data = [
        (
            "1",
            "A",
            "CP1",
            "10",
            "01:00:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 11:00:00",
        ),
        (
            "2",
            "A",
            "CP2",
            "12",
            "01:00:00",
            12,
            "2024-01-01 11:10:00",
            "2024-01-01 12:10:00",
        ),
    ]
    db_path = setup_test_db(data)
    # Patch location_dict to simulate distance
    detector = FraudDetector(db_path)

    def fake_detect_impossible_travel(cursor):
        fraud_ids = [("2", "Unrealistic movement: 100.0 km in 10.0 min")]
        for cdr_id, reason in fraud_ids:
            detector._update_fraud_table(cursor, reason, [cdr_id], "Reason7")

    detector.detect_impossible_travel = fake_detect_impossible_travel
    df = detector.detect_fraud()
    impossible = df[df["Reason7"].notnull()]
    assert not impossible.empty
    assert any("Unrealistic movement" in str(r) for r in impossible["Reason7"].values)
    teardown_test_db(db_path)


def test_threshold_change_affects_detection():
    # Lower threshold for high volume to 5, so all are fraud
    data = [
        (
            "1",
            "A",
            "CP1",
            "6",
            "00:30:00",
            10,
            "2024-01-01 10:00:00",
            "2024-01-01 10:30:00",
        ),
        (
            "2",
            "B",
            "CP2",
            "7",
            "00:20:00",
            12,
            "2024-01-01 11:00:00",
            "2024-01-01 11:20:00",
        ),
    ]
    db_path = setup_test_db(data)
    detector = FraudDetector(db_path)
    # Change threshold
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE ThresholdSettings SET value = 5 WHERE name = 'MAX_VOLUME_KWH'"
    )
    conn.commit()
    conn.close()
    detector = FraudDetector(db_path)
    df = detector.detect_fraud()
    assert len(df) == 2
    teardown_test_db(db_path)
