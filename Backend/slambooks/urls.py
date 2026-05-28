from django.urls import path
from .views import (
    HealthCheckView,
    SlamBookCreateView, SlamBookDetailView, SlamBookUpdateDeleteView,
    SlamEntryCreateView, SlamEntryListView, SlamEntryDeleteView,
    GeneratePDFView, ReportCreateView
)

urlpatterns = [
    path('health', HealthCheckView.as_view(), name='health_check'),
    path('slambooks/create', SlamBookCreateView.as_view(), name='slambook_create'),
    path('slambooks/slug/<slug:slug>', SlamBookDetailView.as_view(), name='slambook_detail_slug'),
    path('slambooks/<uuid:pk>', SlamBookUpdateDeleteView.as_view(), name='slambook_update_delete'),
    
    path('entries/create', SlamEntryCreateView.as_view(), name='entry_create'),
    path('entries/<uuid:book_id>', SlamEntryListView.as_view(), name='entry_list'),
    path('entries/delete/<uuid:id>', SlamEntryDeleteView.as_view(), name='entry_delete'),
    
    path('pdf/generate/<uuid:book_id>', GeneratePDFView.as_view(), name='pdf_generate'),
    
    path('report', ReportCreateView.as_view(), name='report_create'),
]
