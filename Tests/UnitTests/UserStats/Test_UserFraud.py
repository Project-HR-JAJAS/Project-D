import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.program import app

class TestFraudStats(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_fraud_data = [
            {
                "Authentication_ID": "USER01",
                "TransactionCount": 3,
                "TotalVolume": 75.0,
                "TotalCost": 35.5
            },
            {
                "Authentication_ID": None,
                "TransactionCount": 2,
                "TotalVolume": 20.0,
                "TotalCost": 8.0
            }
        ]

    @patch("backend.fraud_per_user.fraud_per_user.find_unique_authentication_ids_with_fraud")
    def test_get_auth_ids_with_fraud_success(self, mock_fraud_func):
        mock_fraud_func.return_value = self.mock_fraud_data

        response = self.client.get("/api/all-authentication-ids-with-fraud")

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)
        self.assertIn("Authentication_ID", data[0])
        self.assertIn("TransactionCount", data[0])
        self.assertIn("TotalVolume", data[0])
        self.assertIn("TotalCost", data[0])
    
    @patch("backend.fraud_per_user.fraud_per_user.find_unique_authentication_ids_with_specific_fraud")
    def test_get_specific_fraud_success(self, mock_fraud_func):
        mock_fraud_func.return_value = self.mock_fraud_data

        response = self.client.get("/api/all-authentication-ids-with-specific-fraud/Reason1")

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)

        first = data[0]
        self.assertIn("Authentication_ID", first)
        self.assertIn("TransactionCount", first)
        self.assertIn("TotalVolume", first)
        self.assertIn("TotalCost", first)


if __name__ == '__main__':
    unittest.main()
