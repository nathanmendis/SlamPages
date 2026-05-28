import os
from pathlib import Path
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from django.utils import timezone
from .models import SlamBook, SlamEntry

User = get_user_model()

def draw_page_background(canvas, doc):
    """Legacy function - no longer used with Playwright"""
    pass

def get_themed_styles(theme, prefix):
    """Legacy function - no longer used with Playwright"""
    pass

@shared_task
def generate_slam_pdf(book_id):
    """
    Celery task to compile a SlamBook's entries into a beautiful, themed, printable PDF.
    Uses Playwright to render HTML/CSS to PDF for high-quality, styled output.
    Saves the PDF to media/pdfs/{book_id}.pdf
    """
    try:
        slam_book = SlamBook.objects.get(id=book_id)
    except SlamBook.DoesNotExist:
        return f"SlamBook {book_id} not found."

    try:
        from playwright.sync_api import sync_playwright
        
        # Get entries and prepare data
        entries = slam_book.entries.all().order_by('created_at')
        
        # Build question map to resolve UUID keys to real questions
        question_map = {str(q.id): q.question for q in slam_book.questions.all()}
        
        processed_entries = []
        for entry in entries:
            qa_list = []
            for q_id, ans in entry.answers.items():
                real_question = question_map.get(str(q_id), q_id)
                qa_list.append({
                    'question': real_question,
                    'answer': ans
                })
            
            processed_entries.append({
                'anonymous_name': entry.anonymous_name,
                'author': entry.author,
                'created_at': entry.created_at,
                'image_url': entry.image_url,
                'qa_list': qa_list
            })

        # Map theme to CSS class
        theme_map = {
            'School Notebook': 'notebook',
            'Y2K Cyber': 'y2k',
            'Vintage Diary': 'diary',
            'Polaroid Memory': 'polaroid',
            'Dark Academia': 'academia'
        }
        theme_class = theme_map.get(slam_book.theme, 'notebook')

        # Prepare context for template
        context = {
            'book': slam_book,
            'entries': processed_entries,
            'theme_class': theme_class,
            'owner_username': slam_book.owner.username,
            'created_date': timezone.now().strftime('%B %d, %Y')
        }


        # Render HTML from template
        html_content = render_to_string('slambooks/pdf_template.html', context)

        # Create output directory
        pdf_dir = Path(settings.MEDIA_ROOT) / 'pdfs'
        pdf_dir.mkdir(parents=True, exist_ok=True)
        pdf_path = pdf_dir / f"{book_id}.pdf"
        
        # If a PDF was already generated, delete the old one
        if pdf_path.exists():
            try:
                pdf_path.unlink()
            except Exception as e:
                print(f"Failed to delete old PDF: {str(e)}")

        # Use synchronous Playwright to convert HTML to PDF
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            
            # Set HTML content
            page.set_content(html_content)
            
            # Generate PDF with print-friendly settings
            page.pdf(
                path=str(pdf_path),
                format='letter',
                margin={
                    'top': '0.5in',
                    'bottom': '0.5in',
                    'left': '0.5in',
                    'right': '0.5in'
                },
                print_background=True
            )
            
            browser.close()

        return f"Successfully generated PDF for SlamBook {book_id} at {pdf_path}"

    except Exception as e:
        import traceback
        error_msg = f"Failed to generate PDF: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)  # Log to celery worker output
        return error_msg
