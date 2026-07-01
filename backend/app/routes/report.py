from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from app.database.mongodb import get_collection
from app.models.user import UserResponse
from app.services.auth_service import get_current_user
from app.models.interview import ReportDB
from app.agents.report import generate_report

router = APIRouter(prefix="/api/report", tags=["report"])

class ReportGenerateRequest(BaseModel):
    interview_id: str = Field(..., description="The session ID to generate the report for.")

@router.post("/generate", response_model=ReportDB)
async def trigger_generate_report(
    request: ReportGenerateRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Manually generates or retrieves a report for a given interview session.
    Checks if a report already exists, if so returns it.
    Otherwise compiles the history and runs the Report Agent to generate it.
    """
    reports_col = await get_collection("reports")
    sessions_col = await get_collection("interview_sessions")
    
    # Check if report already exists
    existing_report = await reports_col.find_one({
        "session_id": ObjectId(request.interview_id),
        "user_id": ObjectId(current_user.id)
    })
    
    if existing_report:
        return ReportDB(
            id=str(existing_report["_id"]),
            session_id=str(existing_report["session_id"]),
            user_id=str(existing_report["user_id"]),
            overall_score=existing_report["overall_score"],
            strengths=existing_report["strengths"],
            weaknesses=existing_report["weaknesses"],
            recommendations=existing_report["recommendations"],
            created_at=existing_report["created_at"]
        )
        
    # Get session details to compile report
    session = await sessions_col.find_one({
        "_id": ObjectId(request.interview_id),
        "user_id": ObjectId(current_user.id)
    })
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
        )
        
    history = session["history"]
    if not history:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate report for an interview session with no questions answered."
        )
        
    try:
        # Generate report using Report Agent
        report_data = await generate_report(topic=session["topic"], history=history)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report Agent compilation failed: {str(e)}"
        )
        
    # Save new report to database
    report_doc = {
        "user_id": ObjectId(current_user.id),
        "session_id": ObjectId(request.interview_id),
        "overall_score": float(report_data.overall_score),
        "strengths": report_data.strengths,
        "weaknesses": report_data.weaknesses,
        "recommendations": report_data.recommendations,
        "created_at": datetime.utcnow()
    }
    
    result = await reports_col.insert_one(report_doc)
    
    # Mark session as completed
    await sessions_col.update_one(
        {"_id": ObjectId(request.interview_id)},
        {"$set": {
            "status": "completed",
            "updated_at": datetime.utcnow()
        }}
    )
    
    return ReportDB(
        id=str(result.inserted_id),
        session_id=request.interview_id,
        user_id=str(current_user.id),
        overall_score=report_data.overall_score,
        strengths=report_data.strengths,
        weaknesses=report_data.weaknesses,
        recommendations=report_data.recommendations,
        created_at=report_doc["created_at"]
    )
