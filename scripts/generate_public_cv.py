from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = Path("attached_assets/Chrispine-Mndala-CV-2026.pdf")


def p(text, style):
    return Paragraph(text, style)


def bullet(text, style):
    return Paragraph(f"<bullet>&bull;</bullet>{text}", style)


def section(title, body, heading, normal, bullet_style):
    content = [Spacer(1, 4), p(title, heading), HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#B8C4D9")), Spacer(1, 4)]
    for item in body:
        if isinstance(item, tuple):
            content.append(bullet(item[1], bullet_style))
        else:
            content.append(p(item, normal))
    return KeepTogether(content)


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
    pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, rightMargin=17 * mm, leftMargin=17 * mm,
        topMargin=15 * mm, bottomMargin=14 * mm, title="Chrispine Mndala - CV",
        author="Chrispine Mndala",
    )
    styles = getSampleStyleSheet()
    navy = colors.HexColor("#102A43")
    muted = colors.HexColor("#52606D")
    blue = colors.HexColor("#1D4ED8")
    title = ParagraphStyle("Title", parent=styles["Title"], fontName="DejaVu-Bold", fontSize=23, leading=27, textColor=navy, spaceAfter=3)
    subtitle = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName="DejaVu-Bold", fontSize=10, leading=14, textColor=blue, spaceAfter=6)
    contact = ParagraphStyle("Contact", parent=styles["Normal"], fontName="DejaVu", fontSize=8.5, leading=11, textColor=muted)
    heading = ParagraphStyle("Heading", parent=styles["Heading2"], fontName="DejaVu-Bold", fontSize=10.5, leading=13, textColor=navy, spaceBefore=7, spaceAfter=2)
    normal = ParagraphStyle("NormalCustom", parent=styles["Normal"], fontName="DejaVu", fontSize=8.8, leading=12, textColor=colors.HexColor("#243B53"), spaceAfter=4)
    bullet_style = ParagraphStyle("Bullet", parent=normal, leftIndent=11, firstLineIndent=-7, bulletIndent=0, spaceAfter=2)
    role = ParagraphStyle("Role", parent=styles["Normal"], fontName="DejaVu-Bold", fontSize=9.2, leading=12, textColor=navy, spaceAfter=1)
    small = ParagraphStyle("Small", parent=styles["Normal"], fontName="DejaVu", fontSize=7.6, leading=10, textColor=muted)

    story = [
        p("CHRISPINE MNDALA", title),
        p("Software, Systems & Operations Professional", subtitle),
        p("Lilongwe, Malawi &nbsp; | &nbsp; peterschrispine@gmail.com &nbsp; | &nbsp; linkedin.com/in/chrispine-mndala-11a951206 &nbsp; | &nbsp; github.com/Chrispine-1210", contact),
        Spacer(1, 8),
        section("PROFILE", [
            "Technology and operations professional focused on full-stack delivery, networked systems, data analysis, project coordination, and practical digital transformation. Brings cross-functional experience in commercial operations, compliance reporting, field data workflows, and building web-based systems for organisations in Malawi.",
        ], heading, normal, bullet_style),
        section("CORE CAPABILITIES", [
            "<b>Software delivery:</b> React, TypeScript, JavaScript, Node.js, Express, REST APIs, PostgreSQL, Drizzle ORM, Git/GitHub, responsive UI development.",
            "<b>Networks and systems:</b> TCP/IP, LAN/WAN concepts, routing, DNS, device troubleshooting, server and cloud fundamentals, cybersecurity hygiene.",
            "<b>Data and operations:</b> Excel analysis, dashboards, reporting, RBM/MEL concepts, KoboToolbox/ODK, stakeholder coordination, documentation, risk tracking.",
        ], heading, normal, bullet_style),
        section("SELECTED EXPERIENCE", [
            "<b>Founder & Systems Lead | Aöthothe Technologies | 2026 - Present</b><br/>Building governed enterprise-software and digital-transformation delivery foundations. Defines operational controls, product architecture, evidence standards, and market-facing delivery materials.",
            "<b>Technical Consultant | Freelance / Contract, Malawi | 2020 - Present</b><br/>Delivers web platforms, dashboards, and digital workflows for local organisations. Work includes requirements discovery, interface delivery, data structures, operational documentation, and release support.",
            "<b>Marketing & Sales Compliance Officer | Farm Produce Marketing Association (FPMA), Lilongwe | 2025</b><br/>Managed auction-floor compliance activity, collected and analysed sales information, supported farmer consultations, and prepared market-performance reports.",
            "<b>Operations & Marketing Manager | CHL Investments, Lilongwe | 2022 - Present</b><br/>Supports operating processes, staff coordination, vendors, recruitment/training, digital marketing, and performance reporting for a family business.",
            "<b>Assistant Sales & Depot Manager | SBOF Ltd, Lilongwe | 2020 - 2021</b><br/>Supported depot operations, stock controls, dispatch coordination, team supervision, and operational briefs.",
        ], heading, normal, bullet_style),
        section("SELECTED PROJECT EVIDENCE", [
            "<b>Mtendere Education Consult platform:</b> Full-stack public platform and administration work using React, TypeScript, Node.js, PostgreSQL, Drizzle ORM, and automated test coverage. Public case study limits claims to inspectable engineering evidence.",
            "<b>Aöthothe Enterprise OS:</b> Governed internal commercial foundation covering catalogue, pricing, proposal, quotation, audit, and evidence controls. Recorded as a draft, non-deployed engineering release; no production or customer-outcome claim is made.",
        ], heading, normal, bullet_style),
        section("EDUCATION & CERTIFICATIONS", [
            "<b>Bachelor of Business Administration</b> - Jubilee University, Malawi (2018 - 2022)",
            "<b>Advanced Diploma, Computer Networks & Internet Protocols</b> - Alison (2024), Distinction",
            "<b>Diploma, Project Management</b> - Alison (2023), Distinction",
            "<b>Monitoring & Evaluation Certificate</b> - Green Cedar Consult (2024)",
            "<b>Additional learning:</b> Excel Data Analysis; Sales Techniques; Computer and Software Repair; Software and web-development practice.",
        ], heading, normal, bullet_style),
    ]
    doc.build(story)


if __name__ == "__main__":
    main()
