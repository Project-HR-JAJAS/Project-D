# tests/test_overlapping_backend.py
"""
Integration-style tests for the overlapping endpoints.

Creates a temporary SQLite DB with three rows:
  • A and B overlap for AUTH-1
  • C does not overlap
All DbContext() objects (also those created inside FastAPI routes)
are forced to use the very same file.
"""
import os
import gc
import tempfile
import unittest
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from backend.program import app
from backend.data.DbContext import DbContext  # original class

ISO = "%Y-%m-%d %H:%M:%S"


class TestOverlappingBackend(unittest.TestCase):
    """End-to-end backend tests (FastAPI + SQLite)."""

    @classmethod
    def setUpClass(cls):
        # ------------------------------------------------------------------ #
        # 1.  Create isolated temp DB and insert synthetic rows
        # ------------------------------------------------------------------ #
        cls.tmp_dir = tempfile.TemporaryDirectory()           # auto-cleanup later
        cls.db_path = os.path.join(cls.tmp_dir.name, "test_overlaps.db")

        # Use one DbContext instance to prepare the table + seed rows
        cls.db = DbContext(db_name="ignored")   # will be patched below anyway
        cls.db.db_name = cls.db_path            # absolute path for the seed
        cls.db.initialize_database()
        cls.db.connect()
    
            # CDR	StartTime	EindtTime	Overlap
            # A	    14:00	    15:00	    with B
            # B	    14:30	    15:30	    with A
            # C	    16:00	    17:00	    no
        now = datetime.now()
        template = {
            "Charge_Point_Address": "",
            "Charge_Point_ZIP": "",
            "Charge_Point_City": "Rotterdam",
            "Charge_Point_Country": "NL",
            "Charge_Point_Type": "",
            "Product_Type": "",
            "Tariff_Type": "",
            "Authentication_ID": "AUTH-1",
            "Contract_ID": "",
            "Meter_ID": "",
            "OBIS_Code": "",
            "Charge_Point_ID": "CP-1",
            "Service_Provider_ID": "",
            "Infra_Provider_ID": "",
            "import_filename": "unit",
        }
        rows = [
            {
                **template,
                "CDR_ID": "A",
                "Start_datetime": (now).strftime(ISO),
                "End_datetime": (now + timedelta(hours=1)).strftime(ISO),
                "Duration": 3600,
                "Volume": 10.0,
                "Calculated_Cost": 2.5,
            },
            {
                **template,
                "CDR_ID": "B",
                "Start_datetime": (now + timedelta(minutes=30)).strftime(ISO),
                "End_datetime": (now + timedelta(hours=1, minutes=30)).strftime(ISO),
                "Duration": 3600,
                "Volume": 8.0,
                "Calculated_Cost": 2.0,
            },
            {
                **template,
                "CDR_ID": "C",
                "Start_datetime": (now + timedelta(hours=2)).strftime(ISO),
                "End_datetime": (now + timedelta(hours=3)).strftime(ISO),
                "Duration": 3600,
                "Volume": 5.0,
                "Calculated_Cost": 1.0,
            },
        ]
        for row in rows:
            cls.db.insert_cdr(row)
        cls.db.close()  # seed done

        # ------------------------------------------------------------------ #
        # 2.  Monkey-patch DbContext so *every* new instance uses same file
        # ------------------------------------------------------------------ #
        from backend.data import DbContext as db_mod
        cls._orig_init = db_mod.DbContext.__init__
        cls._db_instances = []

        def _test_init(self, db_name="ignored", *args, **kwargs):
            """Replacement __init__ that forces db_path."""
            cls._orig_init(self, db_name)        # run original init
            self.db_name = cls.db_path           # override with temp file
            cls._db_instances.append(self)       # remember for later cleanup

        db_mod.DbContext.__init__ = _test_init

        # ------------------------------------------------------------------ #
        # 3.  Start FastAPI test client
        # ------------------------------------------------------------------ #
        cls.client = TestClient(app)

    # --------------------------   TESTS   --------------------------------- #

    def test_overlapping_stats_single_cluster(self):
        """AUTH-1 should have exactly 2 CDRs in one overlap cluster."""
        res = self.client.get("/api/overlapping-stats")
        self.assertEqual(res.status_code, 200)
        stats = res.json()
        obj = next(item for item in stats if item["Authentication_ID"] == "AUTH-1")
        self.assertEqual(obj["ClusterCount"], 2)      # A & B
        self.assertAlmostEqual(obj["TotalVolume"], 18.0, delta=0.01)

    def test_sessions_endpoint_returns_two_rows(self):
        """/api/overlapping-sessions/{auth_id} must return rows for A & B only."""
        res = self.client.get("/api/overlapping-sessions/AUTH-1")
        self.assertEqual(res.status_code, 200)
        sessions = res.json()
        cdr_ids = {s["CDR_ID"] for s in sessions}
        self.assertSetEqual(cdr_ids, {"A", "B"})
        for s in sessions:
            self.assertEqual(s["OverlappingCount"], 1)

    def test_details_endpoint_returns_pair(self):
        """Details for CDR A must include both A and B."""
        res = self.client.get("/api/overlapping-details/A")
        self.assertEqual(res.status_code, 200)
        details = {d["CDR_ID"] for d in res.json()}
        self.assertSetEqual(details, {"A", "B"})

    # ---------------------------  CLEANUP  -------------------------------- #

    @classmethod
    def tearDownClass(cls):
        # Close FastAPI TestClient (shuts down the ASGI app)
        cls.client.close()

        # Close every DbContext created by the routes
        for inst in cls._db_instances:
            try:
                inst.close()
            except Exception:
                pass

        # Restore original constructor
        from backend.data import DbContext as db_mod
        db_mod.DbContext.__init__ = cls._orig_init

        # Garbage-collect to ensure sqlite releases file handles
        gc.collect()

        # Finally remove the temp directory (and its DB file)
        cls.tmp_dir.cleanup()


if __name__ == "__main__":
    unittest.main()
