"""
Feedback route - POST /feedback

Validates the incoming feedback payload and forwards it to the configured
n8n webhook (N8N_FEEDBACK_WEBHOOK). Does NOT persist data to MongoDB.
"""
import logging
from datetime import datetime, timezone
from typing   import Literal

import httpx
from fastapi  import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, EmailStr

from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["feedback"])


# ──────────────────────────────────────────────────────────────────────────────
#  Request / Response schemas
# ──────────────────────────────────────────────────────────────────────────────
class FeedbackRequest(BaseModel):
    name:           str   = Field(..., min_length=1, max_length=100)
    email:          EmailStr
    subject:        str   = Field(..., min_length=1, max_length=100,
                                  description="Interview topic / subject")
    difficulty:     str   = Field(..., min_length=1, max_length=50)
    overall_rating: int   = Field(..., ge=1, le=5,
                                  description="Overall interview rating 1-5")
    ai_rating:      int   = Field(..., ge=1, le=5,
                                  description="AI question quality rating 1-5")
    feedback:       str   = Field(..., min_length=1, max_length=2000,
                                  description="Written feedback / comments")
    recommend:      Literal["Yes", "No"] = Field(...,
                                  description="Would you recommend this platform?")


class FeedbackResponse(BaseModel):
    success: bool
    message: str


# ──────────────────────────────────────────────────────────────────────────────
#  Endpoint
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/feedback", response_model=FeedbackResponse,
             status_code=status.HTTP_200_OK)
async def submit_feedback(payload: FeedbackRequest):
    """
    Receive user feedback after a completed interview and forward it to
    the n8n webhook.

    Steps
    -----
    1. Validate incoming payload (handled by Pydantic).
    2. Append a server-side ``submitted_at`` UTC timestamp.
    3. POST the enriched payload to the n8n webhook URL.
    4. Return a success / error response to the caller.
    """
    webhook_url = settings.N8N_FEEDBACK_WEBHOOK

    # Build the enriched payload that n8n will receive
    n8n_payload = {
        **payload.model_dump(),
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }

    logger.info(
        f"[Feedback] Forwarding feedback from {payload.email!r} "
        f"(subject={payload.subject!r}) to n8n webhook: {webhook_url}"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(webhook_url, json=n8n_payload)
            response.raise_for_status()

        logger.info(
            f"[Feedback] n8n webhook responded with HTTP {response.status_code} "
            f"for {payload.email!r}"
        )
        return FeedbackResponse(
            success=True,
            message="Thank you! Your feedback has been submitted successfully.",
        )

    except httpx.ConnectError:
        logger.warning(
            f"[Feedback Fallback] Cannot connect to n8n at {webhook_url}. "
            f"Logging feedback locally for {payload.email!r}: {n8n_payload}"
        )
        return FeedbackResponse(
            success=True,
            message="Thank you! Your feedback has been submitted successfully.",
        )

    except httpx.TimeoutException:
        logger.error(f"[Feedback] n8n webhook timed out: {webhook_url}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Feedback service did not respond in time. Please try again.",
        )

    except httpx.HTTPStatusError as exc:
        logger.error(
            f"[Feedback] n8n returned error status {exc.response.status_code}: "
            f"{exc.response.text}"
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Feedback service returned an error: {exc.response.status_code}.",
        )

    except Exception as exc:
        logger.error(f"[Feedback] Unexpected error forwarding to n8n: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )
