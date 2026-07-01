from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional

from app.database.mongodb import get_collection
from app.models.user import UserResponse
from app.services.auth_service import get_current_user
from app.models.interview import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewAnswerRequest,
    AnswerEvaluationResponse,
    ReportDB
)
from app.graph.workflow import interview_graph

router = APIRouter(prefix="/api/interview", tags=["interview"])

@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(
    request: InterviewStartRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Starts a new interview session.
    Invokes the LangGraph Interviewer Agent to generate the first question.
    Saves the session state in the database.
    """
    session_id = str(ObjectId())
    
    # Initialize the LangGraph state
    initial_state = {
        "user_id": str(current_user.id),
        "session_id": session_id,
        "topic": request.topic,
        "current_difficulty": request.difficulty,
        "questions_count": 0,
        "current_question": None,
        "current_answer": None,
        "history": [],
        "overall_score": None,
        "strengths": None,
        "weaknesses": None,
        "recommendations": None,
        "is_completed": False,
        "evaluation": None
    }
    
    try:
        # Run graph (triggers interviewer node to generate Q1)
        result = await interview_graph.ainvoke(initial_state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate first question: {str(e)}"
        )
    
    # Save the session to interview_sessions collection
    sessions_col = await get_collection("interview_sessions")
    session_doc = {
        "_id": ObjectId(session_id),
        "user_id": ObjectId(current_user.id),
        "topic": request.topic,
        "status": "in_progress",
        "current_difficulty": result["current_difficulty"],
        "current_question": result["current_question"],
        "questions_count": result["questions_count"],
        "history": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await sessions_col.insert_one(session_doc)
    
    return InterviewStartResponse(
        interview_id=session_id,
        topic=request.topic,
        difficulty=result["current_difficulty"],
        question=result["current_question"],
        questions_count=result["questions_count"]
    )

@router.post("/answer", response_model=AnswerEvaluationResponse)
async def submit_answer(
    request: InterviewAnswerRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Submits an answer to the current question.
    Runs Evaluator Agent -> Decision Agent -> Interviewer Agent (or Report Agent).
    Updates state in MongoDB and returns evaluation + next steps.
    """
    sessions_col = await get_collection("interview_sessions")
    
    # Find session
    session = await sessions_col.find_one({
        "_id": ObjectId(request.interview_id),
        "user_id": ObjectId(current_user.id)
    })
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
        )
    if session["status"] == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This interview has already been completed"
        )
        
    # Reconstruct state
    state = {
        "user_id": str(session["user_id"]),
        "session_id": str(session["_id"]),
        "topic": session["topic"],
        "current_difficulty": session["current_difficulty"],
        "questions_count": session["questions_count"],
        "current_question": session["current_question"],
        "current_answer": request.answer,
        "history": session["history"],
        "overall_score": None,
        "strengths": None,
        "weaknesses": None,
        "recommendations": None,
        "is_completed": False,
        "evaluation": None
    }
    
    try:
        # Run graph
        result = await interview_graph.ainvoke(state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph execution failed: {str(e)}"
        )
        
    latest_qa = result["history"][-1]
    evaluation = result["evaluation"]
    
    # 1. Store QA record in interviews collection to strictly match requested schema
    interviews_col = await get_collection("interviews")
    interview_doc = {
        "user_id": ObjectId(current_user.id),
        "session_id": ObjectId(request.interview_id),
        "topic": session["topic"],
        "difficulty": latest_qa["difficulty"],
        "question": latest_qa["question"],
        "answer": latest_qa["answer"],
        "score": float(latest_qa["score"]),
        "feedback": evaluation["feedback"],
        "created_at": datetime.utcnow()
    }
    await interviews_col.insert_one(interview_doc)
    
    # 2. Check if interview is completed
    if result["is_completed"]:
        # Generate and save report
        reports_col = await get_collection("reports")
        report_doc = {
            "user_id": ObjectId(current_user.id),
            "session_id": ObjectId(request.interview_id),
            "overall_score": float(result["overall_score"]),
            "strengths": result["strengths"],
            "weaknesses": result["weaknesses"],
            "recommendations": result["recommendations"],
            "created_at": datetime.utcnow()
        }
        report_result = await reports_col.insert_one(report_doc)
        report_id = str(report_result.inserted_id)
        
        # Update session status
        await sessions_col.update_one(
            {"_id": ObjectId(request.interview_id)},
            {"$set": {
                "status": "completed",
                "history": result["history"],
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Prepare report representation for response
        report_response = ReportDB(
            id=report_id,
            session_id=request.interview_id,
            user_id=str(current_user.id),
            overall_score=result["overall_score"],
            strengths=result["strengths"],
            weaknesses=result["weaknesses"],
            recommendations=result["recommendations"],
            created_at=report_doc["created_at"]
        )
        
        return AnswerEvaluationResponse(
            score=evaluation["score"],
            feedback=evaluation["feedback"],
            strengths=evaluation["strengths"],
            weaknesses=evaluation["weaknesses"],
            suggestions=evaluation["suggestions"],
            is_completed=True,
            report=report_response
        )
    else:
        # Update session for the next question
        await sessions_col.update_one(
            {"_id": ObjectId(request.interview_id)},
            {"$set": {
                "current_difficulty": result["current_difficulty"],
                "current_question": result["current_question"],
                "questions_count": result["questions_count"],
                "history": result["history"],
                "updated_at": datetime.utcnow()
            }}
        )
        
        return AnswerEvaluationResponse(
            score=evaluation["score"],
            feedback=evaluation["feedback"],
            strengths=evaluation["strengths"],
            weaknesses=evaluation["weaknesses"],
            suggestions=evaluation["suggestions"],
            next_question=result["current_question"],
            next_difficulty=result["current_difficulty"],
            is_completed=False
        )

@router.get("/history")
async def get_interview_history(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retrieves the logged history of interviews and reports for the user.
    """
    sessions_col = await get_collection("interview_sessions")
    reports_col = await get_collection("reports")
    
    # Get all sessions
    cursor = sessions_col.find({"user_id": ObjectId(current_user.id)}).sort("created_at", -1)
    sessions = await cursor.to_list(length=100)
    
    history_list = []
    for s in sessions:
        session_id_str = str(s["_id"])
        
        # Try to find corresponding report
        report = await reports_col.find_one({"session_id": ObjectId(session_id_str)})
        
        history_list.append({
            "interview_id": session_id_str,
            "topic": s["topic"],
            "status": s["status"],
            "questions_count": s["questions_count"],
            "created_at": s["created_at"],
            "overall_score": report["overall_score"] if report else None,
            "report_id": str(report["_id"]) if report else None
        })
        
    return history_list

@router.get("/report/{id}")
async def get_interview_report(
    id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retrieves a specific performance report including the individual QA history.
    The ID can be either the session ID or the report ID itself.
    """
    reports_col = await get_collection("reports")
    interviews_col = await get_collection("interviews")
    sessions_col = await get_collection("interview_sessions")
    
    # Try looking up by report ID first
    report = None
    if ObjectId.is_valid(id):
        report = await reports_col.find_one({"_id": ObjectId(id), "user_id": ObjectId(current_user.id)})
        
    # If not found, try by session ID
    if not report and ObjectId.is_valid(id):
        report = await reports_col.find_one({"session_id": ObjectId(id), "user_id": ObjectId(current_user.id)})
        
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Performance report not found"
        )
        
    session_id = report["session_id"]
    
    # Retrieve the topic from the session
    session = await sessions_col.find_one({"_id": session_id})
    topic = session["topic"] if session else "Technical"
    
    # Retrieve individual QAs
    cursor = interviews_col.find({"session_id": session_id}).sort("created_at", 1)
    qas = await cursor.to_list(length=100)
    
    qa_history = []
    for q in qas:
        qa_history.append({
            "question": q["question"],
            "answer": q["answer"],
            "score": q["score"],
            "feedback": q["feedback"],
            "difficulty": q["difficulty"],
            "created_at": q["created_at"]
        })
        
    return {
        "report": {
            "id": str(report["_id"]),
            "session_id": str(session_id),
            "overall_score": report["overall_score"],
            "strengths": report["strengths"],
            "weaknesses": report["weaknesses"],
            "recommendations": report["recommendations"],
            "created_at": report["created_at"]
        },
        "topic": topic,
        "qa_history": qa_history
    }
