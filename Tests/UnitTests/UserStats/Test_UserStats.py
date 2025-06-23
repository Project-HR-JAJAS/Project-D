import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.program import app

class TestUserStats(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_db_data = [
            {
                "Authentication_ID": "USER01",
                "TransactionCount": 3,
                "TotalVolume": 50,
                "TotalCost": 100.50,
            },
            {
                "Authentication_ID": "USER02",
                "TransactionCount": 8,
                "TotalVolume": 80,
                "TotalCost": 40.75,
            }
        ]

        self.mock_cdr_data = [
        {
            "CDR_ID": 101,
            "Start_datetime": "2025-06-20T10:00:00",
            "End_datetime": "2025-06-20T11:00:00",
            "Duration": 60,
            "Volume": 22.5,
            "Charge_Point_ID": "CP-001",
            "Charge_Point_City": "Rotterdam",
            "Charge_Point_Country": "Netherlands",
            "Calculated_Cost": 7.50
        },
        {
            "CDR_ID": 102,
            "Start_datetime": "2025-06-19T15:30:00",
            "End_datetime": "2025-06-19T16:00:00",
            "Duration": 30,
            "Volume": 12.0,
            "Charge_Point_ID": "CP-002",
            "Charge_Point_City": "Amsterdam",
            "Charge_Point_Country": "Netherlands",
            "Calculated_Cost": 4.00
        },
        {
            "CDR_ID": 103,
            "Start_datetime": "2025-06-18T09:15:00",
            "End_datetime": "2025-06-18T09:45:00",
            "Duration": 30,
            "Volume": 15.0,
            "Charge_Point_ID": "CP-003",
            "Charge_Point_City": "Utrecht",
            "Charge_Point_Country": "Netherlands",
            "Calculated_Cost": 5.25
        }
    ]

    @patch("backend.endpoints.user_stats.DbContext")
    def test_get_user_stats_success(self, mock_db_class):
        # Setup the mock to return your mock data
        mock_db_instance = mock_db_class.return_value
        mock_db_instance.get_user_stats.return_value = self.mock_db_data

        response = self.client.get("/api/user-stats")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)

        first_item = data[0]
        self.assertIn("Authentication_ID", first_item)
        self.assertIn("TransactionCount", first_item)
        self.assertIn("TotalVolume", first_item)
        self.assertIn("TotalCost", first_item)

    @patch("backend.endpoints.user_stats.DbContext")
    def test_get_user_details_success(self, mock_db_class):
        mock_db_instance = mock_db_class.return_value
        mock_db_instance.get_cdrs_by_authentication_id.return_value = self.mock_cdr_data

        response = self.client.get("/api/user-details/USER01")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 3)

        first_item = data[0]
        self.assertIn("CDR_ID", first_item)
        self.assertIn("Start_datetime", first_item)
        self.assertIn("End_datetime", first_item)
        self.assertIn("Duration", first_item)
        self.assertIn("Volume", first_item)
        self.assertIn("Charge_Point_ID", first_item)
        self.assertIn("Charge_Point_City", first_item)
        self.assertIn("Charge_Point_Country", first_item)
        self.assertIn("Calculated_Cost", first_item)

if __name__ == '__main__':
    unittest.main()
