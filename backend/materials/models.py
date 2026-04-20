from django.conf import settings
from django.db import models
from django.utils import timezone


class Document(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='processing')  # processing, completed, error
class Quiz(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class Question(models.Model):
    QUESTION_TYPES = (
        ('multiple_choice', 'Multiple Choice'),
        ('fill_in_the_blank', 'Fill in the Blank'),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='multiple_choice')
    text = models.TextField()
    options = models.JSONField(help_text="List of string options", null=True, blank=True)
    correct_option_index = models.IntegerField(null=True, blank=True)
    answer = models.TextField(null=True, blank=True)


class FlashcardDeck(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class Flashcard(models.Model):
    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE, related_name='flashcards')
    front = models.TextField()
    back = models.TextField()

class Performance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='performances')
    quiz = models.ForeignKey(Quiz, on_delete=models.SET_NULL, null=True, blank=True)
    score = models.IntegerField()
    totalQuestions = models.IntegerField()
    completed_at = models.DateTimeField(auto_now_add=True)


class GenerationUsage(models.Model):
    """
    Tracks how many times a user has triggered AI generation per day.
    Used to enforce the free-tier limit (default: 5/day per type).
    """
    GENERATION_TYPES = [
        ('quiz', 'Quiz'),
        ('flashcard', 'Flashcard'),
        ('mindmap', 'Mind Map'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='generation_usage')
    type = models.CharField(max_length=20, choices=GENERATION_TYPES)
    date = models.DateField(default=timezone.now)
    count = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'type', 'date')

    def __str__(self):
        return f"{self.user} — {self.type} — {self.date} ({self.count})"


class MindMap(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    data = models.JSONField()  # {"root": {"label": str, "children": [...]}}
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user})"

