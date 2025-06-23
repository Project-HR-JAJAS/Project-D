"""
Unit tests for overlap-related queries in DbContext.

Pure Python / SQL – no FastAPI, no HTTP.
"""

import os
import tempfile
import unittest
from datetime import datetime, timedelta

from backend.data.DbContext import DbContext

ISO = "%Y-%m-%d %H:%M:%S"


class OverlapLogicTests(unittest.TestCase):
    """Verify get_overlapping_stats / sessions / details."""

    @classmethod
    def setUpClass(cls) -> None:
        # ── 1. create throw-away file DB ─────────────────────────────────
        cls._tmpdir = tempfile.TemporaryDirectory()
        cls.db_path = os.path.join(cls._tmpdir.name, "unit.db")

        cls.db = DbContext(db_name="ignored")   # let __init__ run
        cls.db.db_name = cls.db_path           # force our temp file

        # ── 2. build schema & seed rows ─────────────────────────────────
        cls.db.initialize_database()           # creates the CDR table, closes
        cls.db.connect()                       # reopen same file, table persists

        now = datetime.now()
        base = dict(
            Charge_Point_Address="",
            Charge_Point_ZIP="",
            Charge_Point_City="Rotterdam",
            Charge_Point_Country="NL",
            Charge_Point_Type="",
            Product_Type="",
            Tariff_Type="",
            Authentication_ID="AUTH-1",
            Contract_ID="",
            Meter_ID="",
            OBIS_Code="",
            Charge_Point_ID="CP-1",
            Service_Provider_ID="",
            Infra_Provider_ID="",
            import_filename="unit",
        )

        rows = [
            {**base, "CDR_ID": "A",
             "Start_datetime": now.strftime(ISO),
             "End_datetime": (now + timedelta(hours=1)).strftime(ISO),
             "Duration": 3600, "Volume": 10.0, "Calculated_Cost": 2.5},
            {**base, "CDR_ID": "B",
             "Start_datetime": (now + timedelta(minutes=30)).strftime(ISO),
             "End_datetime": (now + timedelta(hours=1, minutes=30)).strftime(ISO),
             "Duration": 3600, "Volume": 8.0, "Calculated_Cost": 2.0},
            {**base, "CDR_ID": "C",
             "Start_datetime": (now + timedelta(hours=2)).strftime(ISO),
             "End_datetime": (now + timedelta(hours=3)).strftime(ISO),
             "Duration": 3600, "Volume": 5.0, "Calculated_Cost": 1.0},
        ]
        for r in rows:
            cls.db.insert_cdr(r)

    # ───────────────── TESTS ─────────────────────────────────────────────

    def test_get_overlapping_stats(self):
        stats = self.db.get_overlapping_stats()
        self.assertEqual(len(stats), 1)

        rec = stats[0]
        self.assertEqual(rec["Authentication_ID"], "AUTH-1")
        self.assertEqual(rec["ClusterCount"], 2)                 # A + B
        self.assertAlmostEqual(rec["TotalVolume"], 18.0, 2)      # 10 + 8
        self.assertAlmostEqual(rec["TotalCost"], 4.5, 2)         # 2.5 + 2.0

    def test_get_sessions_by_auth_id(self):
        sessions = self.db.get_overlapping_sessions_by_auth_id("AUTH-1")
        self.assertSetEqual({s["CDR_ID"] for s in sessions}, {"A", "B"})
        for s in sessions:
            self.assertEqual(s["OverlappingCount"], 1)

    def test_get_all_overlapping_for_cdr(self):
        rows = self.db.get_all_overlapping_for_cdr("A")
        self.assertSetEqual({r["CDR_ID"] for r in rows}, {"A", "B"})

    # ───────────────── CLEAN-UP ──────────────────────────────────────────
    @classmethod
    def tearDownClass(cls) -> None:
        cls.db.close()
        cls._tmpdir.cleanup()


if __name__ == "__main__":
    unittest.main()
