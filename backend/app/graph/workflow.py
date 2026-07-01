from langgraph.graph import StateGraph, END
from app.graph.state import InterviewState
from app.agents.interviewer import generate_question
from app.agents.evaluator import evaluate_answer
from app.agents.report import generate_report

# Node 1: Interviewer Node
async def interviewer_node(state: InterviewState) -> dict:
    next_question_num = state["questions_count"] + 1
    question = await generate_question(
        topic=state["topic"],
        current_difficulty=state["current_difficulty"],
        question_num=next_question_num,
        history=state["history"]
    )
    return {
        "current_question": question,
        "questions_count": next_question_num
    }

# Node 2: Evaluator Node
async def evaluator_node(state: InterviewState) -> dict:
    evaluation = await evaluate_answer(
        topic=state["topic"],
        difficulty=state["current_difficulty"],
        question=state["current_question"],
        answer=state["current_answer"]
    )
    
    record = {
        "question": state["current_question"],
        "answer": state["current_answer"],
        "score": evaluation.score,
        "feedback": evaluation.feedback,
        "difficulty": state["current_difficulty"]
    }
    
    return {
        "history": state["history"] + [record],
        "evaluation": {
            "score": evaluation.score,
            "feedback": evaluation.feedback,
            "strengths": evaluation.strengths,
            "weaknesses": evaluation.weaknesses,
            "suggestions": evaluation.suggestions
        }
    }

# Node 3: Decision Node (updates difficulty)
def decision_node(state: InterviewState) -> dict:
    history = state["history"]
    if not history:
        return {}
        
    last_record = history[-1]
    last_score = last_record["score"]
    current = state["current_difficulty"]
    
    next_diff = current
    if last_score < 5:
        # Easier question
        if current == "Hard":
            next_diff = "Medium"
        elif current == "Medium":
            next_diff = "Easy"
    elif last_score > 8:
        # Harder question
        if current == "Easy":
            next_diff = "Medium"
        elif current == "Medium":
            next_diff = "Hard"
            
    return {
        "current_difficulty": next_diff
    }

# Node 4: Report Node
async def report_node(state: InterviewState) -> dict:
    report = await generate_report(
        topic=state["topic"],
        history=state["history"]
    )
    return {
        "overall_score": report.overall_score,
        "strengths": report.strengths,
        "weaknesses": report.weaknesses,
        "recommendations": report.recommendations,
        "is_completed": True
    }

# Router functions
def route_entry(state: InterviewState) -> str:
    # If no questions generated yet, start with interviewer node
    if state["questions_count"] == 0:
        return "interviewer"
    return "evaluator"

def route_after_decision(state: InterviewState) -> str:
    # Check if 5 questions have been completed
    if len(state["history"]) >= 5:
        return "report"
    return "interviewer"

# Compile Workflow Graph
workflow = StateGraph(InterviewState)

# Add Nodes
workflow.add_node("interviewer", interviewer_node)
workflow.add_node("evaluator", evaluator_node)
workflow.add_node("decision", decision_node)
workflow.add_node("report", report_node)

# Set Entry Point Conditionally
workflow.set_conditional_entry_point(
    route_entry,
    {
        "interviewer": "interviewer",
        "evaluator": "evaluator"
    }
)

# Set Edges
workflow.add_edge("interviewer", END)
workflow.add_edge("evaluator", "decision")

# Add Conditional Edge from Decision Node
workflow.add_conditional_edges(
    "decision",
    route_after_decision,
    {
        "interviewer": "interviewer",
        "report": "report"
    }
)

workflow.add_edge("report", END)

# Compile the Graph
interview_graph = workflow.compile()
