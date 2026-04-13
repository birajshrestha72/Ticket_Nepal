from io import BytesIO
from datetime import datetime
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage


LOGO_PATH = Path(__file__).resolve().parents[3] / "frontend" / "src" / "assets" / "logo.png"


def generate_ticket_pdf(
    passenger_name: str,
    booking_reference: str,
    journey_date: str,
    departure_time: str,
    arrival_time: str,
    bus_name: str,
    route: str,
    seats: list[str],
    total_amount: float,
    passenger_email: str,
) -> bytes:
    """Generate ticket PDF and return bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    story = []

    # Header with title
    title_style = ParagraphStyle(
        "title",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=white,
        spaceAfter=4,
        alignment=1,
        background=HexColor("#0f766e"),
        padding=8,
    )

    subtitle_style = ParagraphStyle(
        "subtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=HexColor("#d1fae5"),
        alignment=1,
        spaceAfter=10,
        backColor=HexColor("#0f766e"),
    )

    # Custom styles
    heading_style = ParagraphStyle(
        "heading",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=HexColor("#0f766e"),
        spaceAfter=8,
        spaceBefore=12,
    )

    label_style = ParagraphStyle(
        "label",
        parent=styles["Normal"],
        fontSize=10,
        textColor=HexColor("#333333"),
        fontName="Helvetica-Bold",
    )

    # Brand header
    if LOGO_PATH.exists():
        logo = RLImage(str(LOGO_PATH), width=1.35 * inch, height=0.52 * inch)
        logo.hAlign = "CENTER"
        story.append(logo)
        story.append(Spacer(1, 0.1 * inch))

    story.append(Paragraph("Ticket Nepal", title_style))
    story.append(Paragraph("Official Bus Ticket Receipt", subtitle_style))
    story.append(Spacer(1, 0.2 * inch))

    # Booking Information Section
    story.append(Paragraph("BOOKING INFORMATION", heading_style))

    booking_data = [
        [Paragraph("Booking Reference:", label_style), booking_reference],
        [Paragraph("Passenger Name:", label_style), passenger_name],
        [Paragraph("Email:", label_style), passenger_email],
    ]

    booking_table = Table(booking_data, colWidths=[2 * inch, 3.5 * inch])
    booking_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [white, HexColor("#f9f9f9")]),
            ("GRID", (0, 0), (-1, -1), 1, HexColor("#e0e0e0")),
        ])
    )
    story.append(booking_table)
    story.append(Spacer(1, 0.2 * inch))

    # Journey Details Section
    story.append(Paragraph("JOURNEY DETAILS", heading_style))

    journey_data = [
        [Paragraph("Bus Name:", label_style), bus_name],
        [Paragraph("Route:", label_style), route],
        [Paragraph("Journey Date:", label_style), journey_date],
        [Paragraph("Departure Time:", label_style), departure_time],
        [Paragraph("Arrival Time:", label_style), arrival_time],
        [Paragraph("Seats:", label_style), ", ".join(seats) if seats else "N/A"],
    ]

    journey_table = Table(journey_data, colWidths=[2 * inch, 3.5 * inch])
    journey_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [white, HexColor("#f9f9f9")]),
            ("GRID", (0, 0), (-1, -1), 1, HexColor("#e0e0e0")),
        ])
    )
    story.append(journey_table)
    story.append(Spacer(1, 0.3 * inch))

    # Total Amount (highlighted)
    amount_style = ParagraphStyle(
        "amount",
        parent=styles["Normal"],
        fontSize=14,
        textColor=HexColor("#0f766e"),
        fontName="Helvetica-Bold",
        alignment=2,
    )
    story.append(Paragraph(f"Total Amount: Rs. {total_amount:.2f}", amount_style))
    story.append(Spacer(1, 0.2 * inch))

    # Footer
    footer_style = ParagraphStyle(
        "footer",
        parent=styles["Normal"],
        fontSize=9,
        textColor=HexColor("#666666"),
        alignment=1,
    )
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"Receipt generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style))
    story.append(Paragraph("Thank you for booking with Ticket Nepal.", footer_style))
    story.append(Paragraph("For support, contact: support@ticketnepal.com", footer_style))

    # Build PDF
    doc.build(story)

    # Get bytes and return
    buffer.seek(0)
    return buffer.getvalue()


def generate_refund_receipt_pdf(
    passenger_name: str,
    booking_reference: str,
    journey_date: str,
    bus_name: str,
    route: str,
    refunded_seats: list[str],
    refund_amount: float,
    refund_percent: int,
    refund_reason: str,
    passenger_email: str,
) -> bytes:
    """Generate refund receipt PDF and return bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        "refund_title",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=white,
        spaceAfter=6,
        alignment=1,
        background=HexColor("#1d4ed8"),
        padding=8,
    )

    heading_style = ParagraphStyle(
        "refund_heading",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=HexColor("#1d4ed8"),
        spaceAfter=8,
        spaceBefore=10,
    )

    label_style = ParagraphStyle(
        "refund_label",
        parent=styles["Normal"],
        fontSize=10,
        textColor=HexColor("#333333"),
        fontName="Helvetica-Bold",
    )

    if LOGO_PATH.exists():
        logo = RLImage(str(LOGO_PATH), width=1.35 * inch, height=0.52 * inch)
        logo.hAlign = "CENTER"
        story.append(logo)
        story.append(Spacer(1, 0.1 * inch))

    story.append(Paragraph("Ticket Nepal - Refund Receipt", title_style))
    story.append(Spacer(1, 0.15 * inch))

    seats_display = ", ".join(refunded_seats) if refunded_seats else "N/A"
    data = [
        [Paragraph("Booking Reference:", label_style), booking_reference],
        [Paragraph("Passenger Name:", label_style), passenger_name],
        [Paragraph("Passenger Email:", label_style), passenger_email],
        [Paragraph("Journey Date:", label_style), journey_date],
        [Paragraph("Bus Name:", label_style), bus_name],
        [Paragraph("Route:", label_style), route],
        [Paragraph("Refunded Seats:", label_style), seats_display],
        [Paragraph("Refund Type:", label_style), refund_reason],
        [Paragraph("Refund Percent:", label_style), f"{refund_percent}%"],
        [Paragraph("Refund Amount:", label_style), f"Rs. {refund_amount:.2f}"],
    ]

    story.append(Paragraph("REFUND DETAILS", heading_style))
    table = Table(data, colWidths=[2.1 * inch, 3.4 * inch])
    table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [white, HexColor("#f9fafb")]),
            ("GRID", (0, 0), (-1, -1), 1, HexColor("#d1d5db")),
        ])
    )
    story.append(table)
    story.append(Spacer(1, 0.25 * inch))

    footer_style = ParagraphStyle(
        "refund_footer",
        parent=styles["Normal"],
        fontSize=9,
        textColor=HexColor("#666666"),
        alignment=1,
    )
    story.append(Paragraph(f"Receipt generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style))
    story.append(Paragraph("This receipt confirms refund processing in Ticket Nepal.", footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
