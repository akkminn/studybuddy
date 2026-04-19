from rest_framework import serializers
from .models import Document, Quiz, Question, FlashcardDeck, Flashcard, Performance, GenerationUsage


class DocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Document
        fields = ['id', 'user', 'title', 'file_name', 'file', 'content', 'uploaded_at', 'status']
        read_only_fields = ['user', 'status', 'uploaded_at', 'content', 'file_name']

    def create(self, validated_data):
        validated_data.pop('file', None)
        return super().create(validated_data)

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'options', 'correct_option_index', 'type', 'answer']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'document', 'user', 'title', 'created_at', 'questions']
        read_only_fields = ['user', 'created_at']

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ['id', 'front', 'back']

class FlashcardDeckSerializer(serializers.ModelSerializer):
    flashcards = FlashcardSerializer(many=True, read_only=True)

    class Meta:
        model = FlashcardDeck
        fields = ['id', 'document', 'user', 'title', 'created_at', 'flashcards']
        read_only_fields = ['user', 'created_at']

class PerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Performance
        fields = ['id', 'user', 'quiz', 'score', 'totalQuestions', 'completed_at']
        read_only_fields = ['user', 'completed_at']

class GenerationUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenerationUsage
        fields = ['id', 'type', 'date', 'count']
        read_only_fields = ['user', 'date', 'count']
