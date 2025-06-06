import pytest
import os
import pandas as pd
from pathlib import Path
from backend.endpoints.filetodb.importtodb import import_excel_to_db
from backend.data.DbContext import DbContext
import tempfile
import sqlite3
import time

@pytest.fixture
def sample_excel_file():
    # Create a temporary Excel file with test data
    data = {
        'CDR_ID': ['CDR001', 'CDR002'],
        'Start_datetime': ['2024-01-01 10:00:00', '2024-01-01 11:00:00'],
        'End_datetime': ['2024-01-01 11:00:00', '2024-01-01 12:00:00'],
        'Duration': [60, 60],
        'Volume': [10.5, 15.2],
        'Charge_Point_Address': ['Street 1', 'Street 2'],
        'Charge_Point_ZIP': ['1234AB', '5678CD'],
        'Charge_Point_City': ['Amsterdam', 'Rotterdam'],
        'Charge_Point_Country': ['Netherlands', 'Netherlands'],
        'Charge_Point_Type': ['Type1', 'Type2'],
        'Product_Type': ['Product1', 'Product2'],
        'Tariff_Type': ['Tariff1', 'Tariff2'],
        'Authentication_ID': ['Auth1', 'Auth2'],
        'Contract_ID': ['Contract1', 'Contract2'],
        'Meter_ID': ['Meter1', 'Meter2'],
        'OBIS_Code': ['OBIS1', 'OBIS2'],
        'Charge_Point_ID': ['CP1', 'CP2'],
        'Service_Provider_ID': ['SP1', 'SP2'],
        'Infra_Provider_ID': ['IP1', 'IP2'],
        'Calculated_Cost': [5.25, 7.60]
    }
    df = pd.DataFrame(data)
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
        df.to_excel(tmp.name, index=False)
        return tmp.name

@pytest.fixture
def db_context():
    # Create a test database
    db = DbContext()
    db.initialize_database()
    db.connect()
    
    # Add import_filename column if it doesn't exist
    cursor = db.connection.cursor()
    try:
        cursor.execute("ALTER TABLE CDR ADD COLUMN import_filename TEXT")
        db.connection.commit()
    except sqlite3.OperationalError:
        # Column might already exist
        pass
    
    # Clear existing data
    cursor.execute("DELETE FROM CDR")
    db.connection.commit()
    
    yield db
    
    # Cleanup
    db.close()

def test_import_excel_fields(sample_excel_file, db_context):
    """Test if fields are correctly imported from Excel file"""
    success, message, records_imported = import_excel_to_db(sample_excel_file)
    
    assert success is True
    assert records_imported == 2
    assert "Successfully imported" in message

def test_import_excel_database_storage(sample_excel_file, db_context):
    """Test if data is correctly stored in the database"""
    import_excel_to_db(sample_excel_file)
    
    # Query the database to verify stored data
    cursor = db_context.connection.cursor()
    cursor.execute("SELECT * FROM CDR")
    rows = cursor.fetchall()
    
    assert len(rows) == 2
    
    # Verify first record
    first_record = rows[0]
    assert first_record[0] == 'CDR001'  # CDR_ID
    assert first_record[1] == '2024-01-01 10:00:00'  # Start_datetime
    assert first_record[2] == '2024-01-01 11:00:00'  # End_datetime
    assert first_record[3] == 60  # Duration
    assert first_record[4] == 10.5  # Volume
    assert first_record[5] == 'Street 1'  # Charge_Point_Address
    assert first_record[6] == '1234AB'  # Charge_Point_ZIP
    assert first_record[7] == 'Amsterdam'  # Charge_Point_City
    assert first_record[8] == 'Netherlands'  # Charge_Point_Country

def test_import_invalid_file():
    """Test handling of invalid file format"""
    success, message, records_imported = import_excel_to_db('nonexistent.xlsx')
    
    assert success is False
    assert "File not found" in message
    assert records_imported is None

def test_import_empty_file():
    """Test handling of empty Excel file"""
    # Create an empty Excel file
    temp_file = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
    temp_file.close()
    
    try:
        df = pd.DataFrame()
        df.to_excel(temp_file.name, index=False)
        
        success, message, records_imported = import_excel_to_db(temp_file.name)
        
        assert success is False
        assert "Error importing file" in message
        assert records_imported is None
    finally:
        # Wait a bit to ensure file is not in use
        time.sleep(0.1)
        try:
            os.unlink(temp_file.name)
        except PermissionError:
            pass  # Ignore if we can't delete the file

def test_import_missing_required_fields(sample_excel_file, db_context):
    """Test handling of Excel file with missing required fields"""
    # Modify the Excel file to remove required fields
    df = pd.read_excel(sample_excel_file)
    df = df.drop(columns=['CDR_ID'])  # Remove required field
    df.to_excel(sample_excel_file, index=False)
    
    success, message, records_imported = import_excel_to_db(sample_excel_file)
    
    assert success is False
    assert "Error importing file" in message
    assert records_imported is None 