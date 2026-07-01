from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, BeforeValidator
from typing_extensions import Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

# Request Schemas
class InterviewStartRequest(BaseModel):
    topic: str = Field(..., description="Topic of the interview: DSA, DBMS, OS, OOP, HR")
    difficulty: str = Field("Medium", description="Initial difficulty: Easy, Medium, Hard")

class InterviewAnswerRequest(BaseModel):
    interview_id: str = Field(..., description="The ID of the active interview session")
    answer: str = Field(..., description="Candidate's answer to the current question")

# DB Schemas & Response Schemas
class InterviewQARecord(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    session_id: PyObjectId = Field(..., description="Linked session ID")
    user_id: PyObjectId
    topic: str
    difficulty: str
    question: str
    answer: str
    score: float
    feedback: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

class ReportDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    session_id: PyObjectId = Field(..., description="Linked session ID")
    user_id: PyObjectId
    overall_score: float
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

class InterviewSessionDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: PyObjectId
    topic: str
    status: str = Field("in_progress")  # "in_progress", "completed"
    current_difficulty: str
    current_question: Optional[str] = None
    questions_count: int = 0
    history: List[Dict[str, Any]] = Field(default_factory=list)  # list of QA details
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

class InterviewStartResponse(BaseModel):
    interview_id: str
    topic: str
    difficulty: str
    question: str
    questions_count: int

class AnswerEvaluationResponse(BaseModel):
    score: float
    feedback: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    next_question: Optional[str] = None
    next_difficulty: Optional[str] = None
    is_completed: bool
    report: Optional[ReportDB] = None
