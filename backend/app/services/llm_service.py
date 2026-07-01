from langchain_groq import ChatGroq
from app.config import settings

def get_llm(temperature: float = 0.7, streaming: bool = False) -> ChatGroq:
    """
    Returns an instance of ChatGroq using the model specified in settings.
    """
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your_groq_api_key_here":
        raise ValueError("GROQ_API_KEY is not configured. Please set it in your environment or backend/.env file.")
    
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.DEFAULT_MODEL,
        temperature=temperature,
        streaming=streaming
    )
