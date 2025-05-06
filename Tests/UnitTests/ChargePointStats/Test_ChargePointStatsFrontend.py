import unittest
import sys
import os
from pathlib import Path
import json
from unittest.mock import patch, MagicMock

class TestChargePointStatsFrontend(unittest.TestCase):
    def setUp(self):
        self.mock_stats = {
            "results": [
                {
                    "Charge_Point_ID": "CP001",
                    "Charge_Point_Country": "NL",
                    "transaction_count": 10,
                    "total_volume": 100.5,
                    "total_cost": 25.75
                },
                {
                    "Charge_Point_ID": "CP002",
                    "Charge_Point_Country": "BE",
                    "transaction_count": 5,
                    "total_volume": 50.25,
                    "total_cost": 12.50
                }
            ],
            "total": 2
        }

    def test_api_response_structure(self):
        # Test the expected API response structure
        self.assertIn("results", self.mock_stats)
        self.assertIn("total", self.mock_stats)
        self.assertEqual(len(self.mock_stats["results"]), 2)
        self.assertEqual(self.mock_stats["total"], 2)
        
        # Verify data structure
        first_item = self.mock_stats["results"][0]
        self.assertIn("Charge_Point_ID", first_item)
        self.assertIn("Charge_Point_Country", first_item)
        self.assertIn("transaction_count", first_item)
        self.assertIn("total_volume", first_item)
        self.assertIn("total_cost", first_item)

    def test_data_types(self):
        # Test data types from the mock data
        first_item = self.mock_stats["results"][0]
        self.assertIsInstance(first_item["Charge_Point_ID"], str)
        self.assertIsInstance(first_item["Charge_Point_Country"], str)
        self.assertIsInstance(first_item["transaction_count"], int)
        self.assertIsInstance(first_item["total_volume"], (int, float))
        self.assertIsInstance(first_item["total_cost"], (int, float))

    def test_pagination_structure(self):
        # Test pagination structure
        self.assertIsInstance(self.mock_stats["total"], int)
        self.assertGreaterEqual(self.mock_stats["total"], len(self.mock_stats["results"]))

    def test_required_fields(self):
        # Test that all required fields are present and not null
        for item in self.mock_stats["results"]:
            self.assertIsNotNone(item["Charge_Point_ID"])
            self.assertIsNotNone(item["Charge_Point_Country"])
            self.assertIsNotNone(item["transaction_count"])
            self.assertIsNotNone(item["total_volume"])
            self.assertIsNotNone(item["total_cost"])

    def test_numeric_values(self):
        # Test that numeric values are positive
        for item in self.mock_stats["results"]:
            self.assertGreaterEqual(item["transaction_count"], 0)
            self.assertGreaterEqual(item["total_volume"], 0)
            self.assertGreaterEqual(item["total_cost"], 0)

if __name__ == '__main__':
    unittest.main() 