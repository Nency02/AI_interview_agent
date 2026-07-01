from typing import List
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from app.services.llm_service import get_llm

class EvaluationSchema(BaseModel):
    score: int = Field(..., description="Integer score from 1 to 10 representing the answer quality. 10 is flawless/perfect, 1 is completely wrong/blank.")
    feedback: str = Field(..., description="Constructive, professional critique of the candidate's answer.")
    strengths: List[str] = Field(default_factory=list, description="Specific concepts or points the candidate got correct.")
    weaknesses: List[str] = Field(default_factory=list, description="Key concepts missed, logical errors, or inaccuracies in the candidate's answer.")
    suggestions: List[str] = Field(default_factory=list, description="Concrete suggestions on how to improve this answer.")

async def evaluate_answer(topic: str, difficulty: str, question: str, answer: str) -> EvaluationSchema:
    """
    Evaluates the user's answer to the given question using Groq structured output.
    """
    llm = get_llm(temperature=0.2)  # Low temp for consistent evaluation
    structured_llm = llm.with_structured_output(EvaluationSchema)
    
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an expert technical interviewer and code evaluator.\n"
            "Your task is to grade the candidate's response to the given question.\n"
            "Evaluate strictly based on the technical topic: {topic} and question difficulty: {difficulty}.\n\n"
            "Grading Criteria:\n"
            "- Score 9-10: Flawless, comprehensive, accurate, covers all edge cases/key concepts.\n"
            "- Score 7-8: Mostly accurate and correct, contains minor gaps or lacks deep optimization/technical details.\n"
            "- Score 5-6: Displays basic understanding but has noticeable errors, omissions, or lack of depth.\n"
            "- Score 3-4: Significantly incorrect, incomplete, or contains major conceptual misunderstandings.\n"
            "- Score 1-2: Totally wrong, irrelevant, or blank answer.\n\n"
            "Always be encouraging but technically rigorous."
        )),
        ("user", (
            "Interview Question & Answer details:\n"
            "- Topic: {topic}\n"
            "- Question Difficulty: {difficulty}\n"
            "- Question: {question}\n"
            "- Candidate's Answer: {answer}\n\n"
            "Please analyze and evaluate the response."
        ))
    ])
    
    chain = prompt_template | structured_llm
    
    result = await chain.ainvoke({
        "topic": topic,
        "difficulty": difficulty,
        "question": question,
        "answer": answer
    })
    
    return result
