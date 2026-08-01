"""
PDF Service - Generates professional interview report PDFs using ReportLab.
"""
import os
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import Flowable

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
#  Directory where PDFs are saved
# --------------------------------------------------------------------------- #
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
REPORTS_DIR = os.path.join(BASE_DIR, "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

# --------------------------------------------------------------------------- #
#  Brand colour palette (AI-theme dark blues / indigo)
# --------------------------------------------------------------------------- #
BRAND_DARK   = colors.HexColor("#0f111d")
BRAND_NAVY   = colors.HexColor("#1b1f32")
BRAND_BLUE   = colors.HexColor("#5465ff")
BRAND_LIGHT  = colors.HexColor("#798dff")
BRAND_WHITE  = colors.white
BRAND_GRAY   = colors.HexColor("#b8c3da")
BRAND_SUBTLE = colors.HexColor("#2f3752")
GREEN_OK     = colors.HexColor("#22c55e")
RED_WEAK     = colors.HexColor("#ef4444")
AMBER_MID    = colors.HexColor("#f59e0b")


# --------------------------------------------------------------------------- #
#  Custom header / footer flowable
# --------------------------------------------------------------------------- #
class HeaderFooter(Flowable):
    """Draws the page header and footer on each page."""

    def __init__(self, page_num: int, total_pages: int):
        super().__init__()
        self.page_num  = page_num
        self.total_pages = total_pages
        self.width = A4[0]
        self.height = A4[1]

    def draw(self):
        pass  # Not called directly – we use onPage callback instead


def _on_page(canvas, doc):
    """Called by ReportLab for every page – draws header + footer."""
    w, h = A4
    canvas.saveState()

    # ── Header bar ──────────────────────────────────────────────────────────
    canvas.setFillColor(BRAND_DARK)
    canvas.rect(0, h - 50, w, 50, fill=True, stroke=False)

    canvas.setFillColor(BRAND_BLUE)
    canvas.rect(0, h - 53, w, 3, fill=True, stroke=False)

    canvas.setFillColor(BRAND_WHITE)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(20 * mm, h - 32, "AI Interview Coach")

    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(BRAND_GRAY)
    canvas.drawRightString(w - 20 * mm, h - 32, "Interview Performance Report")

    # ── Footer bar ───────────────────────────────────────────────────────────
    canvas.setFillColor(BRAND_SUBTLE)
    canvas.rect(0, 0, w, 28, fill=True, stroke=False)

    canvas.setFillColor(BRAND_GRAY)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(20 * mm, 10,
                      "Generated automatically by AI Interview Coach")
    canvas.drawRightString(w - 20 * mm, 10,
                           f"Page {doc.page} of {doc.multiPage}")

    canvas.restoreState()


# --------------------------------------------------------------------------- #
#  Style helpers
# --------------------------------------------------------------------------- #
def _styles() -> dict:
    base = getSampleStyleSheet()

    def s(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        "title": s("rpt_title",
                   fontName="Helvetica-Bold", fontSize=22,
                   textColor=BRAND_WHITE, alignment=TA_CENTER, spaceAfter=4),
        "subtitle": s("rpt_subtitle",
                      fontName="Helvetica", fontSize=11,
                      textColor=BRAND_GRAY, alignment=TA_CENTER, spaceAfter=12),
        "section": s("rpt_section",
                     fontName="Helvetica-Bold", fontSize=13,
                     textColor=BRAND_BLUE, spaceBefore=16, spaceAfter=6),
        "label": s("rpt_label",
                   fontName="Helvetica-Bold", fontSize=9,
                   textColor=BRAND_GRAY, spaceAfter=1),
        "value": s("rpt_value",
                   fontName="Helvetica", fontSize=10,
                   textColor=BRAND_WHITE, spaceAfter=6),
        "body": s("rpt_body",
                  fontName="Helvetica", fontSize=9,
                  textColor=BRAND_GRAY, leading=14,
                  alignment=TA_JUSTIFY, spaceAfter=6),
        "q_num": s("rpt_qnum",
                   fontName="Helvetica-Bold", fontSize=10,
                   textColor=BRAND_LIGHT, spaceAfter=4),
        "question": s("rpt_question",
                      fontName="Helvetica-Bold", fontSize=10,
                      textColor=BRAND_WHITE, leading=14, spaceAfter=4),
        "answer": s("rpt_answer",
                    fontName="Helvetica", fontSize=9,
                    textColor=BRAND_GRAY, leading=13,
                    alignment=TA_JUSTIFY, spaceAfter=4),
        "feedback": s("rpt_feedback",
                      fontName="Helvetica-Oblique", fontSize=9,
                      textColor=BRAND_GRAY, leading=13,
                      alignment=TA_JUSTIFY, spaceAfter=4),
        "bullet": s("rpt_bullet",
                    fontName="Helvetica", fontSize=9,
                    textColor=BRAND_GRAY, leading=14,
                    leftIndent=12, spaceAfter=2),
    }


def _score_color(score: float) -> colors.Color:
    if score >= 8:
        return GREEN_OK
    if score >= 5:
        return AMBER_MID
    return RED_WEAK


def _info_table(data: List[List], col_widths=None) -> Table:
    """Two-column key-value info table."""
    t = Table(data, colWidths=col_widths or [55 * mm, 100 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, -1), BRAND_NAVY),
        ("TEXTCOLOR",   (0, 0), (0, -1),  BRAND_GRAY),
        ("TEXTCOLOR",   (1, 0), (1, -1),  BRAND_WHITE),
        ("FONTNAME",    (0, 0), (0, -1),  "Helvetica-Bold"),
        ("FONTNAME",    (1, 0), (1, -1),  "Helvetica"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1),
         [BRAND_NAVY, colors.HexColor("#232843")]),
        ("GRID", (0, 0), (-1, -1), 0.3, BRAND_SUBTLE),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    return t


# --------------------------------------------------------------------------- #
#  Main PDF generation function
# --------------------------------------------------------------------------- #
def generate_interview_pdf(
    user_name: str,
    user_email: str,
    topic: str,
    overall_score: float,
    strengths: List[str],
    weaknesses: List[str],
    recommendations: List[str],
    qa_history: List[Dict[str, Any]],
    user_id: str,
    interview_date: Optional[datetime] = None,
) -> str:
    """
    Generate a PDF interview report and save it to REPORTS_DIR.

    Returns the absolute file path of the generated PDF.
    """
    start_ts = time.time()
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename  = f"report_{user_id}_{timestamp}.pdf"
    filepath  = os.path.join(REPORTS_DIR, filename)

    logger.info(f"[PDF] Generating report for user={user_id} → {filename}")

    # ── Document setup ────────────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=60,     # space below header bar
        bottomMargin=40,  # space above footer bar
    )
    # Store total pages for footer (two-pass trick via multiPage attribute)
    doc.multiPage = "?"   # placeholder; updated at save time

    st = _styles()
    story: List = []

    w = A4[0] - 40 * mm   # usable width

    # ── Cover band ───────────────────────────────────────────────────────────
    cover_data = [[
        Paragraph("INTERVIEW PERFORMANCE REPORT", st["title"]),
    ]]
    cover_table = Table(cover_data, colWidths=[w])
    cover_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), BRAND_DARK),
        ("TOPPADDING",    (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 6 * mm))

    # ── Candidate Info ───────────────────────────────────────────────────────
    story.append(Paragraph("Candidate Information", st["section"]))
    story.append(HRFlowable(width=w, thickness=0.5, color=BRAND_SUBTLE))
    story.append(Spacer(1, 3 * mm))

    date_str = (interview_date or datetime.utcnow()).strftime("%d %B %Y, %I:%M %p UTC")
    info_data = [
        ["Candidate Name",  user_name],
        ["Email Address",   user_email],
        ["Interview Date",  date_str],
        ["Topic",           topic],
        ["Questions Asked", str(len(qa_history))],
    ]
    story.append(_info_table(info_data, col_widths=[55 * mm, w - 55 * mm]))
    story.append(Spacer(1, 6 * mm))

    # ── Score Summary ────────────────────────────────────────────────────────
    story.append(Paragraph("Interview Summary", st["section"]))
    story.append(HRFlowable(width=w, thickness=0.5, color=BRAND_SUBTLE))
    story.append(Spacer(1, 3 * mm))

    score_label = (
        "Excellent" if overall_score >= 8 else
        "Good"      if overall_score >= 6 else
        "Average"   if overall_score >= 5 else
        "Needs Improvement"
    )

    score_data = [
        ["Overall Score",    f"{overall_score:.1f} / 10  ({score_label})"],
        ["Total Questions",  str(len(qa_history))],
        ["Difficulty Range", _difficulty_range(qa_history)],
    ]
    score_table = Table(score_data, colWidths=[55 * mm, w - 55 * mm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), BRAND_NAVY),
        ("TEXTCOLOR",     (0, 0), (0, -1),  BRAND_GRAY),
        ("TEXTCOLOR",     (1, 0), (1, -1),  _score_color(overall_score)),
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, BRAND_SUBTLE),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 6 * mm))

    # ── Per-question details ─────────────────────────────────────────────────
    story.append(Paragraph("Question-by-Question Breakdown", st["section"]))
    story.append(HRFlowable(width=w, thickness=0.5, color=BRAND_SUBTLE))
    story.append(Spacer(1, 3 * mm))

    for idx, qa in enumerate(qa_history, start=1):
        score = float(qa.get("score", 0))
        sc    = _score_color(score)

        block = []

        # Question header row
        hdr_data = [[
            Paragraph(f"Q{idx}  ·  {qa.get('difficulty','Medium')} difficulty",
                      st["q_num"]),
            Paragraph(f"Score: {score:.0f}/10", ParagraphStyle(
                "sc", fontName="Helvetica-Bold", fontSize=10,
                textColor=sc, alignment=TA_RIGHT)),
        ]]
        hdr_table = Table(hdr_data, colWidths=[w * 0.7, w * 0.3])
        hdr_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), BRAND_SUBTLE),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ]))
        block.append(hdr_table)

        # Content rows (question / answer / feedback)
        q_text = qa.get("question", "")
        a_text = qa.get("answer",   "N/A")
        f_text = qa.get("feedback", "No feedback provided.")

        rows = [
            ["Question",  Paragraph(q_text[:500], st["question"])],
            ["Answer",    Paragraph(a_text[:600], st["answer"])],
            ["AI Feedback", Paragraph(f_text[:600], st["feedback"])],
        ]
        detail_table = Table(rows, colWidths=[28 * mm, w - 28 * mm])
        detail_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), BRAND_DARK),
            ("TEXTCOLOR",     (0, 0), (0, -1),  BRAND_BLUE),
            ("FONTNAME",      (0, 0), (0, -1),  "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, -1), 9),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
            ("GRID",          (0, 0), (-1, -1), 0.3, BRAND_SUBTLE),
        ]))
        block.append(detail_table)
        block.append(Spacer(1, 4 * mm))

        story.append(KeepTogether(block))

    story.append(Spacer(1, 4 * mm))

    # ── Final Analysis ───────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Final Analysis", st["section"]))
    story.append(HRFlowable(width=w, thickness=0.5, color=BRAND_SUBTLE))
    story.append(Spacer(1, 3 * mm))

    def _bullet_list(title: str, items: List[str], color: colors.Color):
        if not items:
            return
        story.append(Paragraph(title, ParagraphStyle(
            "fa_title", fontName="Helvetica-Bold", fontSize=10,
            textColor=color, spaceBefore=8, spaceAfter=4)))
        for item in items:
            story.append(Paragraph(f"• {item}", st["bullet"]))

    _bullet_list("✓  Key Strengths",        strengths,       GREEN_OK)
    _bullet_list("✗  Areas for Improvement", weaknesses,      RED_WEAK)
    _bullet_list("📚  Recommended Study Topics", recommendations, BRAND_LIGHT)

    story.append(Spacer(1, 8 * mm))

    # ── Closing note ─────────────────────────────────────────────────────────
    closing = Table([[Paragraph(
        "Keep practising! Consistent revision of weak areas combined with "
        "timed mock interviews is the fastest way to improve your score.",
        ParagraphStyle("closing", fontName="Helvetica-Oblique", fontSize=9,
                       textColor=BRAND_GRAY, alignment=TA_CENTER)
    )]], colWidths=[w])
    closing.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), BRAND_NAVY),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
    ]))
    story.append(closing)

    # ── Build PDF ────────────────────────────────────────────────────────────
    # First pass to count pages
    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)

    elapsed = round(time.time() - start_ts, 2)
    logger.info(f"[PDF] Generated successfully in {elapsed}s → {filepath}")
    return filepath


# --------------------------------------------------------------------------- #
#  Helper
# --------------------------------------------------------------------------- #
def _difficulty_range(qa_history: List[Dict]) -> str:
    levels = [qa.get("difficulty", "Medium") for qa in qa_history]
    unique = sorted(set(levels), key=lambda x: {"Easy":0,"Medium":1,"Hard":2}.get(x,1))
    return " → ".join(unique) if unique else "Medium"
