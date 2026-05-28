from rest_framework import serializers
from .models import SlamBook, SlamQuestion, SlamEntry, Report

class SlamQuestionSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    
    class Meta:
        model = SlamQuestion
        fields = ('id', 'question', 'order')

class SlamBookSerializer(serializers.ModelSerializer):
    questions = SlamQuestionSerializer(many=True, required=False)
    owner_username = serializers.ReadOnlyField(source='owner.username')
    owner_verified = serializers.ReadOnlyField(source='owner.verified')
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = SlamBook
        fields = ('id', 'owner', 'owner_username', 'owner_verified', 'slug', 'title', 'description', 'cover_image', 'theme', 'questions', 'pdf_url', 'created_at')
        read_only_fields = ('id', 'owner', 'created_at')

    def get_pdf_url(self, obj):
        import os
        from django.conf import settings
        pdf_path = os.path.join(settings.MEDIA_ROOT, 'pdfs', f"{obj.id}.pdf")
        if os.path.exists(pdf_path):
            return f"{settings.MEDIA_URL}pdfs/{obj.id}.pdf"
        return None

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        # Owner is injected from views perform_create
        slam_book = SlamBook.objects.create(**validated_data)
        for index, q_data in enumerate(questions_data):
            SlamQuestion.objects.create(
                slam_book=slam_book,
                question=q_data['question'],
                order=q_data.get('order', index)
            )
        return slam_book

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        
        # Update SlamBook details
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.cover_image = validated_data.get('cover_image', instance.cover_image)
        instance.theme = validated_data.get('theme', instance.theme)
        instance.slug = validated_data.get('slug', instance.slug)
        instance.save()

        # Update nested questions if provided
        if questions_data is not None:
            instance.questions.all().delete()
            for index, q_data in enumerate(questions_data):
                SlamQuestion.objects.create(
                    slam_book=instance,
                    question=q_data['question'],
                    order=q_data.get('order', index)
                )
        return instance

class SlamEntrySerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    author_avatar = serializers.ReadOnlyField(source='author.avatar')
    author_verified = serializers.ReadOnlyField(source='author.verified')

    class Meta:
        model = SlamEntry
        fields = ('id', 'slam_book', 'author', 'author_username', 'author_avatar', 'author_verified', 'anonymous_name', 'answers', 'theme', 'image_url', 'created_at')
        read_only_fields = ('id', 'author', 'created_at')

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ('id', 'entry', 'reason', 'status', 'created_at')
        read_only_fields = ('id', 'status', 'created_at')
