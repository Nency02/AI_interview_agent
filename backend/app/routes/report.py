"""
Report routes:
  POST /api/report/generate       - Generate / retrieve a report
  POST /api/report/send-email     - Generate PDF + email it
  GET  /api/report/download/{id}  - Download the PDF for a session
"""
import logging
import os
from bson        import ObjectId
from datetime    import datetime
from fastapi     import APIRouter, HTTPException, Depends, BackgroundTasks, status
from fastapi.responses import FileResponse
from pydantic    import BaseModel, Field, EmailStr
from typing      import Optional

from app.database.mongodb      import get_collection
from app.models.user           import UserResponse
from app.services.auth_service import get_current_user
from app.models.interview      import ReportDB
from app.agents.report         import generate_report
from app.services.pdf_service  import generate_interview_pdf
from app.services.email_service import email_service, EmailAuthError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/report", tags=["report"])


# ─────────────────────────────────────────────────────────────────────────────
#  Request schemas
# ─────────────────────────────────────────────────────────────────────────────
class ReportGenerateRequest(BaseModel):
    interview_id: str = Field(..., description="The session ID to generate the report for.")

class SendEmailRequest(BaseModel):
    interview_id: str  = Field(..., description="Session ID of the completed interview.")
    email:        EmailStr = Field(..., description="Recipient email address.")


# ─────────────────────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────────────────────
async def _get_full_report_data(interview_id: str, user_id: str) -> dict:
    """
    Fetch session, report, and QA history from MongoDB.
    Returns a combined dict; raises HTTPException if not found.
    """
    reports_col  = await get_collection("reports")
    sessions_col = await get_collection("interview_sessions")
    interviews_col = await get_collection("interviews")

    report = await reports_col.find_one({
        "session_id": ObjectId(interview_id),
        "user_id":    ObjectId(user_id),
    })
    if not report:
        raise HTTPException(status_code=404, detail="Report not found for this session.")

    session = await sessions_col.find_one({"_id": ObjectId(interview_id)})
    topic   = session["topic"] if session else "Technical"

    cursor = interviews_col.find(
        {"session_id": ObjectId(interview_id)}
    ).sort("created_at", 1)
    qa_history = await cursor.to_list(length=100)

    return {
        "report":     report,
        "topic":      topic,
        "qa_history": qa_history,
    }


async def _build_pdf(interview_id: str, user_id: str, user_name: str, user_email: str) -> str:
    """Generate the PDF for a session and return its filepath."""
    data       = await _get_full_report_data(interview_id, user_id)
    report     = data["report"]
    qa_history = data["qa_history"]

    filepath = generate_interview_pdf(
        user_name      = user_name,
        user_email     = user_email,
        topic          = data["topic"],
        overall_score  = float(report["overall_score"]),
        strengths      = report.get("strengths", []),
        weaknesses     = report.get("weaknesses", []),
        recommendations= report.get("recommendations", []),
        qa_history     = [
            {
                "question":   q.get("question",  ""),
                "answer":     q.get("answer",    ""),
                "feedback":   q.get("feedback",  ""),
                "score":      q.get("score",     0),
                "difficulty": q.get("difficulty","Medium"),
            }
            for q in qa_history
        ],
        user_id        = user_id,
        interview_date = report.get("created_at"),
    )
    return filepath


# ─────────────────────────────────────────────────────────────────────────────
#  POST /api/report/generate
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/generate", response_model=ReportDB)
async def trigger_generate_report(
    request:      ReportGenerateRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Manually generates or retrieves a report for a given interview session.
    Checks if a report already exists; if so returns it.
    Otherwise compiles the history and runs the Report Agent to generate it.
    """
    reports_col  = await get_collection("reports")
    sessions_col = await get_collection("interview_sessions")

    # Return existing report if present
    existing = await reports_col.find_one({
        "session_id": ObjectId(request.interview_id),
        "user_id":    ObjectId(current_user.id),
    })
    if existing:
        return ReportDB(
            id             = str(existing["_id"]),
            session_id     = str(existing["session_id"]),
            user_id        = str(existing["user_id"]),
            overall_score  = existing["overall_score"],
            strengths      = existing["strengths"],
            weaknesses     = existing["weaknesses"],
            recommendations= existing["recommendations"],
            created_at     = existing["created_at"],
        )

    session = await sessions_col.find_one({
        "_id":     ObjectId(request.interview_id),
        "user_id": ObjectId(current_user.id),
    })
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    history = session.get("history", [])
    if not history:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate report for a session with no answers.",
        )

    try:
        report_data = await generate_report(topic=session["topic"], history=history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report Agent failed: {e}")

    report_doc = {
        "user_id":        ObjectId(current_user.id),
        "session_id":     ObjectId(request.interview_id),
        "overall_score":  float(report_data.overall_score),
        "strengths":      report_data.strengths,
        "weaknesses":     report_data.weaknesses,
        "recommendations":report_data.recommendations,
        "created_at":     datetime.utcnow(),
    }
    result = await reports_col.insert_one(report_doc)

    await sessions_col.update_one(
        {"_id": ObjectId(request.interview_id)},
        {"$set": {"status": "completed", "updated_at": datetime.utcnow()}},
    )

    return ReportDB(
        id             = str(result.inserted_id),
        session_id     = request.interview_id,
        user_id        = str(current_user.id),
        overall_score  = report_data.overall_score,
        strengths      = report_data.strengths,
        weaknesses     = report_data.weaknesses,
        recommendations= report_data.recommendations,
        created_at     = report_doc["created_at"],
    )


# ─────────────────────────────────────────────────────────────────────────────
#  GET /api/report/download/{interview_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/download/{interview_id}")
async def download_report_pdf(
    interview_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Generates a PDF for the given interview session and returns it
    as a downloadable file attachment.
    """
    logger.info(
        f"[PDF Download] user={current_user.id}  session={interview_id}"
    )
    try:
        filepath = await _build_pdf(
            interview_id = interview_id,
            user_id      = str(current_user.id),
            user_name    = current_user.name,
            user_email   = current_user.email,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[PDF Download] Generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    return FileResponse(
        path             = filepath,
        media_type       = "application/pdf",
        filename         = os.path.basename(filepath),
        headers          = {"Content-Disposition": f'attachment; filename="{os.path.basename(filepath)}"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
#  POST /api/report/send-email
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/send-email")
async def send_report_email(
    request:      SendEmailRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    1. Fetch interview data from MongoDB
    2. Generate a PDF report
    3. Send the PDF to the requested email address
    4. Return success / failure response
    """
    logger.info(
        f"[Email Route] user={current_user.id}  "
        f"session={request.interview_id}  to={request.email}"
    )

    # Step 1 & 2 – generate PDF
    try:
        filepath = await _build_pdf(
            interview_id = request.interview_id,
            user_id      = str(current_user.id),
            user_name    = current_user.name,
            user_email   = current_user.email,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Email Route] PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    # Step 3 – send email
    try:
        success = email_service.send_report_email(
            to_email     = request.email,
            user_name    = current_user.name,
            pdf_path     = filepath,
            user_id      = str(current_user.id),
            interview_id = request.interview_id,
        )
    except EmailAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )

    if not success:
        raise HTTPException(
            status_code=500,
            detail=(
                "Email could not be sent. Please check SMTP credentials in "
                "backend/.env (SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, EMAIL_FROM)."
            ),
        )

    return {"success": True, "message": "Report emailed successfully"}
