from typing import List, Optional, Dict, Any
from typing_extensions import TypedDict

class InterviewState(TypedDict):
    user_id: str
    session_id: str
    topic: str
    current_difficulty: str
    questions_count: int
    current_question: Optional[str]
    current_answer: Optional[str]
    history: List[Dict[str, Any]]
    overall_score: Optional[float]
    strengths: Optional[List[str]]
    weaknesses: Optional[List[str]]
    recommendations: Optional[List[str]]
    is_completed: bool
    evaluation: Optional[Dict[str, Any]]
