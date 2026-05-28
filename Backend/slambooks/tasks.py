import os
import hashlib
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import SlamBook, SlamEntry

# ReportLab imports
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

User = get_user_model()

def draw_page_background(canvas, doc):
    """
    Master page canvas callback. Runs at the absolute beginning of rendering
    each page, painting full-page rich thematic backgrounds and margins.
    """
    canvas.saveState()
    width, height = letter
    
    # Safely retrieve theme set on the doc template
    theme = getattr(doc, 'theme', 'School Notebook')

    if theme == 'School Notebook':
        # 1. School Notebook: Warm off-white lined paper background
        canvas.setFillColor(colors.HexColor('#fbfbf6'))
        canvas.rect(0, 0, width, height, fill=True, stroke=False)
        
        # Blue horizontal ruled notebook lines
        canvas.setStrokeColor(colors.HexColor('#e2e8f0'))
        canvas.setLineWidth(0.75)
        for y in range(40, int(height) - 40, 24):
            canvas.line(40, y, width - 40, y)
            
        # Red vertical binder margin line
        canvas.setStrokeColor(colors.HexColor('#fca5a5'))
        canvas.setLineWidth(1.5)
        canvas.line(80, 0, 80, height)

    elif theme == 'Y2K Cyber':
        # 2. Y2K Cyber: High contrast pitch-black grid background
        canvas.setFillColor(colors.HexColor('#0d0c1d'))
        canvas.rect(0, 0, width, height, fill=True, stroke=False)
        
        # Retro cybernetic grid
        canvas.setStrokeColor(colors.HexColor('#ff007f'))
        canvas.setLineWidth(0.2)
        # horizontal lines
        for y in range(0, int(height), 25):
            canvas.line(0, y, width, y)
        # vertical lines
        for x in range(0, int(width), 25):
            canvas.line(x, 0, x, height)

    elif theme == 'Vintage Diary':
        # 3. Vintage Diary: Gold radial dots with double gold borders
        canvas.setFillColor(colors.HexColor('#f7f1e3'))
        canvas.rect(0, 0, width, height, fill=True, stroke=False)
        
        # Gold framing borders
        canvas.setStrokeColor(colors.HexColor('#d1ccc0'))
        canvas.setLineWidth(3.0)
        canvas.rect(30, 30, width - 60, height - 60, fill=False, stroke=True)
        canvas.setLineWidth(1.0)
        canvas.rect(35, 35, width - 70, height - 70, fill=False, stroke=True)

    elif theme == 'Dark Academia':
        # 4. Dark Academia: Vintage sepia sheet with typewriter ink borders
        canvas.setFillColor(colors.HexColor('#eae3d2'))
        canvas.rect(0, 0, width, height, fill=True, stroke=False)
        
        # Dark brown top/bottom binder bars
        canvas.setStrokeColor(colors.HexColor('#5d4037'))
        canvas.setLineWidth(2.0)
        canvas.line(50, height - 40, width - 50, height - 40)
        canvas.line(50, 40, width - 50, 40)

    else: # Polaroid Memory: Clean polaroid board white frame
        canvas.setFillColor(colors.HexColor('#ffffff'))
        canvas.rect(0, 0, width, height, fill=True, stroke=False)
        
        # Slate outer border
        canvas.setStrokeColor(colors.HexColor('#cbd5e1'))
        canvas.setLineWidth(1.0)
        canvas.rect(35, 35, width - 70, height - 70, fill=False, stroke=True)

    canvas.restoreState()

def get_themed_styles(theme, prefix):
    """
    Dynamic style generator ensuring unique names per page
    and mapping rich visual colors/fonts to book themes.
    """
    styles = getSampleStyleSheet()
    
    title_name = f"{prefix}_title"
    meta_name = f"{prefix}_meta"
    question_name = f"{prefix}_q"
    answer_name = f"{prefix}_a"

    if theme == 'Y2K Cyber':
        return (
            ParagraphStyle(title_name, parent=styles['Normal'], fontName='Courier-Bold', fontSize=28, leading=34, textColor=colors.HexColor('#ff007f')),
            ParagraphStyle(meta_name, parent=styles['Normal'], fontName='Courier-Oblique', fontSize=10, leading=14, textColor=colors.HexColor('#39ff14')),
            ParagraphStyle(question_name, parent=styles['Normal'], fontName='Courier-Bold', fontSize=11, leading=15, textColor=colors.HexColor('#ff007f'), spaceBefore=10, spaceAfter=2),
            ParagraphStyle(answer_name, parent=styles['Normal'], fontName='Courier', fontSize=11, leading=15, textColor=colors.HexColor('#00ffff'), spaceAfter=14) # Neon Cyan
        )
    elif theme == 'Vintage Diary':
        return (
            ParagraphStyle(title_name, parent=styles['Normal'], fontName='Times-Bold', fontSize=26, leading=30, textColor=colors.HexColor('#8b5a2b')),
            ParagraphStyle(meta_name, parent=styles['Normal'], fontName='Times-Italic', fontSize=10, leading=14, textColor=colors.HexColor('#b38f00')),
            ParagraphStyle(question_name, parent=styles['Normal'], fontName='Times-Bold', fontSize=11, leading=15, textColor=colors.HexColor('#8b5a2b'), spaceBefore=10, spaceAfter=2),
            ParagraphStyle(answer_name, parent=styles['Normal'], fontName='Times-Italic', fontSize=11, leading=15, textColor=colors.HexColor('#5a3d28'), spaceAfter=14)
        )
    elif theme == 'Dark Academia':
        return (
            ParagraphStyle(title_name, parent=styles['Normal'], fontName='Courier-Bold', fontSize=24, leading=28, textColor=colors.HexColor('#3e2723')),
            ParagraphStyle(meta_name, parent=styles['Normal'], fontName='Courier-Oblique', fontSize=10, leading=14, textColor=colors.HexColor('#5d4037')),
            ParagraphStyle(question_name, parent=styles['Normal'], fontName='Courier-Bold', fontSize=11, leading=15, textColor=colors.HexColor('#3e2723'), spaceBefore=10, spaceAfter=2),
            ParagraphStyle(answer_name, parent=styles['Normal'], fontName='Courier', fontSize=11, leading=15, textColor=colors.HexColor('#3e2723'), spaceAfter=14)
        )
    elif theme == 'Polaroid Memory':
        return (
            ParagraphStyle(title_name, parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=26, leading=30, textColor=colors.HexColor('#1e1b4b')),
            ParagraphStyle(meta_name, parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=10, leading=14, textColor=colors.HexColor('#4f46e5')),
            ParagraphStyle(question_name, parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=colors.HexColor('#1e1b4b'), spaceBefore=10, spaceAfter=2),
            ParagraphStyle(answer_name, parent=styles['Normal'], fontName='Helvetica', fontSize=11, leading=15, textColor=colors.HexColor('#0f172a'), spaceAfter=14)
        )
    else: # School Notebook
        return (
            ParagraphStyle(title_name, parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=26, leading=30, textColor=colors.HexColor('#1e293b')),
            ParagraphStyle(meta_name, parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=10, leading=14, textColor=colors.HexColor('#64748b')),
            ParagraphStyle(question_name, parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=colors.HexColor('#0f172a'), spaceBefore=10, spaceAfter=2),
            ParagraphStyle(answer_name, parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=11, leading=15, textColor=colors.HexColor('#1e3a8a'), spaceAfter=14) # Handwritten Blue Ink
        )

@shared_task
def generate_slam_pdf(book_id):
    """
    Celery task to compile a SlamBook's entries into a beautiful, printable PDF.
    Saves the PDF to media/pdfs/{book_id}.pdf
    """
    try:
        slam_book = SlamBook.objects.get(id=book_id)
    except SlamBook.DoesNotExist:
        return f"SlamBook {book_id} not found."

    # Establish paths
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = os.path.join(pdf_dir, f"{book_id}.pdf")

    # Document Setup (utilize wider side margins for scrapbook borders)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=72, leftMargin=92, # Offset left margin to accommodate binders/ruled lines
        topMargin=54, bottomMargin=54
    )
    
    # Store theme directly on the document template so the canvas callback can access it
    doc.theme = slam_book.theme

    story = []

    # --- COVER PAGE ---
    # Retrieve cover styles
    cov_title, cov_meta, cov_q, cov_ans = get_themed_styles(slam_book.theme, "cover")
    cov_title.alignment = TA_CENTER
    cov_meta.alignment = TA_CENTER
    cov_ans.alignment = TA_CENTER
    
    story.append(Spacer(1, 100))
    story.append(Paragraph(slam_book.title, cov_title))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"A Digital Memory Book created by {slam_book.owner.username}", cov_meta))
    
    if slam_book.description:
        story.append(Spacer(1, 20))
        story.append(Paragraph(f'"{slam_book.description}"', cov_ans))
    
    story.append(Spacer(1, 40))

    # Add cover image if it exists
    if slam_book.cover_image and os.path.exists(slam_book.cover_image.path):
        try:
            # Let's scale and center the cover snapshot
            img = Image(slam_book.cover_image.path, width=220, height=220)
            img.hAlign = 'CENTER'
            story.append(img)
        except Exception:
            pass

    story.append(PageBreak())

    # --- ENTRIES PAGES ---
    entries = slam_book.entries.all().order_by('created_at')
    
    if not entries.exists():
        empty_title, empty_meta, empty_q, empty_ans = get_themed_styles(slam_book.theme, "empty")
        empty_title.alignment = TA_CENTER
        empty_meta.alignment = TA_CENTER
        story.append(Spacer(1, 100))
        story.append(Paragraph("This memory book doesn't have any entries yet!", empty_title))
        story.append(Spacer(1, 10))
        story.append(Paragraph("Share the link with friends to gather some.", empty_meta))
    else:
        for index, entry in enumerate(entries):
            # Fetch custom styles matching overall slambook theme
            h1_style, meta_style, question_style, answer_style = get_themed_styles(slam_book.theme, f"entry_{entry.id}")

            writer = entry.author.username if entry.author else (entry.anonymous_name or "Anonymous Guest")
            verified_tag = " (Verified Member)" if entry.author and entry.author.verified else ""
            
            # Offset margins down if notebook layout
            if slam_book.theme == 'School Notebook':
                story.append(Spacer(1, 20))

            story.append(Paragraph(f"{index + 1}. Entry by {writer}{verified_tag}", h1_style))
            story.append(Paragraph(f"Submitted on {entry.created_at.strftime('%Y-%m-%d %H:%M:%S')}", meta_style))
            story.append(Spacer(1, 15))

            # Render answers
            answers_dict = entry.answers or {}
            for q_id, ans in answers_dict.items():
                if not ans or not str(ans).strip():
                    continue
                
                # Check if q_id is UUID and translate to readable text
                q_text = q_id
                try:
                    from uuid import UUID
                    UUID(q_id)
                    from .models import SlamQuestion
                    question_obj = SlamQuestion.objects.filter(id=q_id).first()
                    if question_obj:
                        q_text = question_obj.question
                except ValueError:
                    pass

                story.append(Paragraph(f"Q: {q_text}", question_style))
                story.append(Paragraph(f"A: {ans}", answer_style))
            
            # Append entry image upload if present
            if entry.image_url and os.path.exists(entry.image_url.path):
                story.append(Spacer(1, 15))
                try:
                    # Let's frame the guest image inside a white "Polaroid Frame" mock block
                    img = Image(entry.image_url.path, width=180, height=140)
                    img.hAlign = 'LEFT'
                    
                    # Embed in a neat Table representing a photographic border card
                    photo_table = Table([[img]], colWidths=[200], rowHeights=[160])
                    photo_table.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,-1), colors.white),
                        ('BOX', (0,0), (-1,-1), 1.0, colors.HexColor('#cbd5e1')),
                        ('PADDING', (0,0), (-1,-1), 10),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 20), # thick polaroid bottom border
                        ('ALIGN', (0,0), (-1,-1), 'LEFT')
                    ]))
                    story.append(photo_table)
                except Exception:
                    pass

            # Separate each entry with a new page so they print cleanly
            story.append(PageBreak())

    # Build the document using the canvas callbacks
    try:
        doc.build(story, onFirstPage=draw_page_background, onLaterPages=draw_page_background)
        return f"Successfully generated PDF for SlamBook {book_id} at {pdf_path}"
    except Exception as e:
        return f"Failed to build PDF: {str(e)}"
