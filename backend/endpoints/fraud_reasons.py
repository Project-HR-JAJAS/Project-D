from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response
from backend.data.DbContext import DbContext
import json
from backend.data.DbUserContext import DbUserContext
from backend.sessions.session_manager import SessionManager
from backend.fraud_decision.decision_manager import FraudDecisionManager
from fastapi import Header

router = APIRouter()
session_manager = SessionManager("user.db")  # or your user DB path
decision_manager = FraudDecisionManager("backend/project-d.db")  # or your main DB path

decision_manager.create_decision_table()
session_manager.create_sessions_table()



@router.get("/api/fraud-reasons%")
async def get_fraud_reasons(reason: str):
    db = DbContext()
    db.connect()
    cursor = db.connection.cursor()
    cursor.execute("SELECT * FROM FraudCase")
    columns = [desc[0] for desc in cursor.description]
    fraud_cases = [dict(zip(columns, row)) for row in cursor.fetchall()]
    # Calculate total fraud cases
    total_cases = len(fraud_cases)
    
    # Initialize counters for each reason
    reason_counts = {
        'Reason1': 0,
        'Reason2': 0,
        'Reason3': 0,
        'Reason4': 0,
        'Reason5': 0,
        'Reason6': 0,
        'Reason7': 0
    }
    
    # Count occurrences of each reason (non-null)
    for case in fraud_cases:
        for reason in reason_counts.keys():
            if case[reason] is not None and case[reason] != '':
                reason_counts[reason] += 1
    
    # Calculate percentages
    reason_percentages = {}
    for reason, count in reason_counts.items():
        percentage = (count / total_cases * 100) if total_cases > 0 else 0
        reason_percentages[reason] = round(percentage, 2)
    
    # Prepare response data
    response_data = {
        'total_cases': total_cases,
        'reason_counts': reason_counts,
        'reason_percentages': reason_percentages
    }
    
    return Response(
        content=json.dumps(response_data),
        media_type="application/json",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@router.post("/api/fraud-decision")
async def add_fraud_decision(
    cdr_id: str,
    status: str,
    reason: str,
    authorization: str = Header(None)
):
    # Get user from session token
    user_id = session_manager.get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Validate status
    if status not in ['approve', 'deny', 'maybe']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'approve', 'deny', or 'maybe'")
    
    # Fetch user_name from user.db
    db_user = DbUserContext()
    db_user.connect()
    user = db_user.get_user_by_id(user_id)
    user_name = user["User_Name"] if user else "Unknown"
    db_user.close()

    decision_manager.add_decision(cdr_id, user_id, user_name, status, reason)
    return {"success": True}


@router.get("/api/fraud-decision/{cdr_id}")
async def get_fraud_decisions(cdr_id: str):
    decisions = decision_manager.get_decisions_for_cdr(cdr_id)
    # Optionally, format the result for frontend
    return [
        {
            "id": d[0],
            "cdr_id": d[1],
            "user_id": d[2],
            "user_name": d[3],
            "status": d[4],
            "reason": d[5],
            "decision_time": d[6]
        }
        for d in decisions
    ]
