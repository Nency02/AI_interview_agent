from typing import List, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from app.services.llm_service import get_llm

class ReportSchema(BaseModel):
    overall_score: float = Field(..., description="The mathematical average of the question scores, rounded to 1 decimal place.")
    strengths: List[str] = Field(default_factory=list, description="Aggregate list of the candidate's core strengths demonstrated across all questions.")
    weaknesses: List[str] = Field(default_factory=list, description="Aggregate list of the candidate's core weaknesses or knowledge gaps.")
    recommendations: List[str] = Field(default_factory=list, description="Actionable learning recommendations, topics to study, or practice plans based on weaknesses.")

async def generate_report(topic: str, history: List[Dict[str, Any]]) -> ReportSchema:
    """
    Generates a final performance report summarizing the candidate's interview session.
    """
    llm = get_llm(temperature=0.3)
    structured_llm = llm.with_structured_output(ReportSchema)
    
    # Calculate simple average score as default
    total_score = sum(item.get("score", 0) for item in history)
    avg_score = round(total_score / len(history), 1) if history else 0.0
    
    # Format the history into a string
    history_str = ""
    for idx, item in enumerate(history):
        history_str += (
            f"Question {idx+1}: {item.get('question')}\n"
            f"Answer: {item.get('answer')}\n"
            f"Difficulty: {item.get('difficulty')}\n"
            f"Score: {item.get('score')}/10\n"
            f"Feedback: {item.get('feedback')}\n\n"
        )
        
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a principal technical interviewer and career coach.\n"
            "Your task is to compile a comprehensive performance report for a candidate who just completed a 5-question mock interview.\n"
            "Analyze the entire transcript of questions, answers, scores, and feedback.\n"
            "Synthesize individual feedback items into broader, high-level strengths and weaknesses.\n"
            "Create actionable learning recommendations for topics they struggled with.\n\n"
            "Verify the overall score matches the average score calculated: {avg_score} out of 10."
        )),
        ("user", (
            "Interview Details:\n"
            "- Topic: {topic}\n"
            "- Average Score: {avg_score}/10\n\n"
            "Interview Transcript:\n"
            "{history_str}\n\n"
            "Please generate the performance report."
        ))
    ])
    
    chain = prompt_template | structured_llm
    
    result = await chain.ainvoke({
        "topic": topic,
        "avg_score": avg_score,
        "history_str": history_str
    })
    
    # Ensure overall score is correct
    if result.overall_score is None or result.overall_score == 0:
        result.overall_score = avg_score
        
    return result
