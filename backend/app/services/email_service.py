import os
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@ticketnepal.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "")


def send_email(
    recipient: str,
    subject: str,
    html_content: str,
    attachments: list[tuple[str, bytes, str]] | None = None,
) -> bool:
    """Send HTML email to recipient. Returns True if successful."""
    if not recipient or not SENDER_PASSWORD:
        return False

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SENDER_EMAIL
        message["To"] = recipient

        part = MIMEText(html_content, "html")
        message.attach(part)

        if attachments:
            for filename, content, mime_subtype in attachments:
                if not content:
                    continue
                pdf_part = MIMEApplication(content, _subtype=mime_subtype)
                pdf_part.add_header("Content-Disposition", "attachment", filename=filename)
                message.attach(pdf_part)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient, message.as_string())

        return True
    except Exception:
        return False


def format_ticket_email(
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
) -> str:
    """Generate formatted HTML email body for ticket confirmation."""
    seats_display = ", ".join(seats) if seats else "N/A"

    html = f"""
    <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .ticket-body {{ border: 1px solid #e0e0e0; padding: 20px; border-radius: 0 0 8px 8px; background: #f9f9f9; }}
                .ticket-section {{ margin-bottom: 20px; }}
                .ticket-section h3 {{ margin: 0 0 10px 0; color: #0f766e; text-transform: uppercase; font-size: 12px; }}
                .ticket-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }}
                .ticket-row:last-child {{ border-bottom: none; }}
                .ticket-label {{ font-weight: bold; }}
                .highlight {{ background: #ecfeff; padding: 10px; border-left: 4px solid #0f766e; margin: 15px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                a {{ color: #0f766e; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Booking Confirmed</h1>
                </div>
                <div class="ticket-body">
                    <p>Dear <strong>{passenger_name}</strong>,</p>
                    <p>Your booking is confirmed. Below are your ticket details:</p>

                    <div class="ticket-section">
                        <h3>Booking Information</h3>
                        <div class="ticket-row">
                            <span class="ticket-label">Booking Reference:</span>
                            <span>{booking_reference}</span>
                        </div>
                        <div class="ticket-row">
                            <span class="ticket-label">Passenger:</span>
                            <span>{passenger_name}</span>
                        </div>
                        <div class="ticket-row">
                            <span class="ticket-label">Email:</span>
                            <span>{passenger_email}</span>
                        </div>
                    </div>

                    <div class="ticket-section">
                        <h3>Journey Details</h3>
                        <div class="ticket-row">
                            <span class="ticket-label">Bus Name:</span>
                            <span>{bus_name}</span>
                        </div>
                        <div class="ticket-row">
                            <span class="ticket-label">Route:</span>
                            <span>{route}</span>
                        </div>
                        <div class="ticket-row">
                            <span class="ticket-label">Journey Date:</span>
                            <span>{journey_date}</span>
                        </div>
                        <div class="ticket-row">
                            <span class="ticket-label">Departure Time:</span>
                            <span>{departure_time}</span>
                        </div>
                        <div class="ticket-row">
                            <span class="ticket-label">Arrival Time:</span>
                            <span>{arrival_time}</span>
                        </div>
                        <div class="ticket-row">
                            <span class="ticket-label">Seats:</span>
                            <span><strong>{seats_display}</strong></span>
                        </div>
                    </div>

                    <div class="highlight">
                        <strong>Total Amount: Rs. {total_amount:.2f}</strong>
                    </div>

                    <p>Please download your ticket from the booking confirmation page or use your booking reference to check your booking status anytime.</p>

                    <div class="footer">
                        <p>Thank you for booking with Ticket Nepal!<br>
                        Questions? Contact us at support@ticketnepal.com</p>
                    </div>
                </div>
            </div>
        </body>
    </html>
    """
    return html


def format_refund_email(
    passenger_name: str,
    booking_reference: str,
    refund_amount: float,
    refund_percent: int,
    refunded_seats: list[str],
    refund_reason: str,
) -> str:
    """Generate formatted HTML email body for refund confirmation."""
    seats_display = ", ".join(refunded_seats) if refunded_seats else "N/A"

    return f"""
    <html>
        <head>
            <meta charset=\"UTF-8\">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
                .content {{ border: 1px solid #e0e0e0; padding: 20px; border-radius: 0 0 8px 8px; background: #f9f9f9; }}
                .row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }}
                .row:last-child {{ border-bottom: none; }}
                .label {{ font-weight: bold; }}
                .highlight {{ background: #eff6ff; padding: 10px; border-left: 4px solid #1d4ed8; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class=\"container\">
                <div class=\"header\">
                    <h1>Refund Confirmation</h1>
                </div>
                <div class=\"content\">
                    <p>Dear <strong>{passenger_name}</strong>,</p>
                    <p>Your refund has been processed in Ticket Nepal.</p>

                    <div class=\"row\"><span class=\"label\">Booking Reference:</span><span>{booking_reference}</span></div>
                    <div class=\"row\"><span class=\"label\">Refund Type:</span><span>{refund_reason}</span></div>
                    <div class=\"row\"><span class=\"label\">Refunded Seats:</span><span>{seats_display}</span></div>
                    <div class=\"row\"><span class=\"label\">Policy Percent:</span><span>{refund_percent}%</span></div>

                    <div class=\"highlight\">
                        <strong>Refund Amount: Rs. {refund_amount:.2f}</strong>
                    </div>

                    <p>A refund receipt PDF is attached for your records.</p>
                </div>
            </div>
        </body>
    </html>
    """
