from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from app.services.llm_service import get_llm

async def generate_question(topic: str, current_difficulty: str, question_num: int, history: List[Dict[str, Any]]) -> str:
    """
    Generates an interview question using Groq based on topic, difficulty, and history.
    """
    llm = get_llm(temperature=0.7)
    
    # Format history for the prompt
    history_str = ""
    if history:
        for idx, item in enumerate(history):
            history_str += f"Q{idx+1}: {item.get('question')}\nAnswer: {item.get('answer')}\n\n"
    else:
        history_str = "No questions asked yet."

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a professional, elite technical interviewer conducting a mock interview.\n"
            "Your goal is to ask realistic, standard, and deep interview questions on the topic: {topic}.\n"
            "You must adapt the question to the requested difficulty level: {current_difficulty}.\n\n"
            "Rules for questions:\n"
            "- DSA (Data Structures & Algorithms): Ask conceptual questions, optimization problems, code dry runs, or algorithmic complexity.\n"
            "- DBMS (Database Management Systems): Ask about SQL query construction, normalization, transactions (ACID), indexing, or architecture.\n"
            "- OS (Operating Systems): Ask about processes/threads, memory management (virtual memory, paging), scheduling algorithms, or deadlocks.\n"
            "- OOP (Object Oriented Programming): Ask about design principles (SOLID), polymorphism, inheritance, encapsulation, abstraction, or design patterns.\n"
            "- HR (Human Resources): Ask behavioral questions (STAR method), conflict resolution, teamwork, or situational scenarios.\n\n"
            "IMPORTANT:\n"
            "- DO NOT repeat or ask very similar questions to what has already been asked in this session.\n"
            "- Output ONLY the question itself. No introductory remarks (like 'Sure, here is your question:'), no filler, and no closing remarks.\n"
            "- Keep the question clear and directly answerable."
        )),
        ("user", (
            "Interview Session Details:\n"
            "- Topic: {topic}\n"
            "- Current Difficulty: {current_difficulty}\n"
            "- Question Number: {question_num} of 5\n\n"
            "History of previous questions & answers:\n"
            "{history_str}\n\n"
            "Please generate the next question:"
        ))
    ])
    
    chain = prompt_template | llm
    response = await chain.ainvoke({
        "topic": topic,
        "current_difficulty": current_difficulty,
        "question_num": question_num,
        "history_str": history_str
    })
    
    return response.content.strip()
