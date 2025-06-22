# import unittest
# from fastapi.testclient import TestClient
# from backend.program import app

# class TestChargePointStats(unittest.TestCase):
#     def setUp(self):
#         self.client = TestClient(app)
#         self.mock_db_data = [
#             {
#                 "Authentication_ID": "USER01",
#                 "TransactionCount": 5,
#                 "TotalVolume": 50,
#                 "TotalCost": 100.50,
#             },
#             {
#                 "Authentication_ID": "USER02",
#                 "TransactionCount": 8,
#                 "TotalVolume": 80,
#                 "TotalCost": 40.75,
#             }
#         ]

#     def test_get_charge_point_stats_success(self):
#         # Test the API endpoint
#         response = self.client.get("/api/all-authentication-ids-with-fraud")
        
#         # Assert response
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertIn("results", data)
#         self.assertIn("total", data)
        
#         # Verify data structure
#         if len(data["results"]) > 0:
#             first_item = data["results"][0]
#             self.assertIn("Charge_Point_ID", first_item)
#             self.assertIn("Charge_Point_Country", first_item)
#             self.assertIn("transaction_count", first_item)
#             self.assertIn("total_volume", first_item)
#             self.assertIn("total_cost", first_item)

#     def test_get_charge_point_stats_pagination(self):
#         # Test pagination
#         response = self.client.get("/api/charge-point-stats?page=1&page_size=1")
        
#         # Assert response
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertLessEqual(len(data["results"]), 1)
#         self.assertIsInstance(data["total"], int)

#     def test_get_charge_point_stats_invalid_page(self):
#         # Test invalid page number
#         response = self.client.get("/api/charge-point-stats?page=0&page_size=20")
#         self.assertEqual(response.status_code, 422)  # Validation error

#     def test_get_charge_point_stats_invalid_page_size(self):
#         # Test invalid page size
#         response = self.client.get("/api/charge-point-stats?page=1&page_size=101")
#         self.assertEqual(response.status_code, 422)  # Validation error

#     def test_get_charge_point_stats_data_types(self):
#         response = self.client.get("/api/charge-point-stats?page=1&page_size=20")
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
        
#         if len(data["results"]) > 0:
#             first_item = data["results"][0]
#             # Verify data types
#             self.assertIsInstance(first_item["Charge_Point_ID"], str)
#             self.assertIsInstance(first_item["Charge_Point_Country"], str)
#             self.assertIsInstance(first_item["transaction_count"], int)
#             self.assertIsInstance(first_item["total_volume"], (int, float))
#             self.assertIsInstance(first_item["total_cost"], (int, float))

# if __name__ == '__main__':
#     unittest.main()
