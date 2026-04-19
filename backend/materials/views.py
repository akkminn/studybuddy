from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Document, FlashcardDeck, GenerationUsage, Performance, Quiz
from .serializers import (
    DocumentSerializer, FlashcardDeckSerializer, GenerationUsageSerializer,
    PerformanceSerializer, QuizSerializer
)

DAILY_GENERATION_LIMIT = 5


def _check_and_increment_usage(user, generation_type):
    """
    Atomically checks the daily usage limit and increments if allowed.
    Returns (allowed: bool, current_count: int).
    """
    today = timezone.now().date()
    with transaction.atomic():
        usage, _ = GenerationUsage.objects.select_for_update().get_or_create(
            user=user,
            type=generation_type,
            date=today,
            defaults={'count': 0}
        )
        if usage.count >= DAILY_GENERATION_LIMIT:
            return False, usage.count
        usage.count += 1
        usage.save()
        return True, usage.count


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Document.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        ordering = self.request.query_params.get('ordering', '-uploaded_at')
        queryset = queryset.order_by(ordering)

        limit = self.request.query_params.get('limit')
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        """
        Decoupled: upload extracts text locally in-memory ensuring the
        extracted content saves directly allowing for serverless compat.
        """
        file_obj = self.request.data.get('file')
        file_name = file_obj.name if file_obj else "unknown"
        
        extracted_text = ""
        if file_obj:
            from .utils import extract_text_from_in_memory_file
            try:
                extracted_text = extract_text_from_in_memory_file(file_obj, file_name)
            except Exception as e:
                print(f"Error extracting text: {e}")
                serializer.validated_data.pop('file', None)
                serializer.save(user=self.request.user, file_name=file_name, status='error', content="")
                return
        
        # 'file' is write-only and not a model field; remove it before save() hits Document.objects.create()
        serializer.validated_data.pop('file', None)
        
        serializer.save(
            user=self.request.user, 
            file_name=file_name, 
            content=extracted_text, 
            status='completed'
        )


class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Quiz.objects.filter(user=self.request.user).order_by('-created_at')
        document_id = self.request.query_params.get('document')
        if document_id:
            queryset = queryset.filter(document_id=document_id)

        limit = self.request.query_params.get('limit')
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """
        POST /api/materials/quizzes/generate/
        Body: { document_id, question_count, quiz_type, difficulty }

        Checks the daily rate limit (5/day) then triggers async quiz generation.
        Returns quiz_id directly when running in synchronous (ALWAYS_EAGER) mode.
        """
        document_id = request.data.get('document_id')
        if not document_id:
            return Response({'error': 'document_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate document belongs to user and is completed
        try:
            document = Document.objects.get(id=document_id, user=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        if document.status != 'completed':
            return Response(
                {'error': f'Document is not ready (status: {document.status}). Please wait for processing to complete.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check + increment usage
        allowed, count = _check_and_increment_usage(request.user, 'quiz')
        if not allowed:
            return Response(
                {
                    'error': f'Daily quiz generation limit reached ({DAILY_GENERATION_LIMIT}/day). Try again tomorrow.',
                    'limit': DAILY_GENERATION_LIMIT,
                    'used': count,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        question_count = int(request.data.get('question_count', 10))
        quiz_type = request.data.get('quiz_type', 'Multiple Choice')
        difficulty = request.data.get('difficulty', 'Medium')

        from .tasks import generate_quiz_for_document
        task_result = generate_quiz_for_document.delay(
            document_id=document.id,
            user_id=request.user.id,
            question_count=question_count,
            quiz_type=quiz_type,
            difficulty=difficulty,
        )

        # When CELERY_TASK_ALWAYS_EAGER=True, the task ran synchronously.
        # Extract the quiz_id directly so the frontend doesn't need to poll.
        response_data = {
            'message': 'Quiz generation started.',
            'document_id': document.id,
            'used': count,
            'limit': DAILY_GENERATION_LIMIT,
        }
        try:
            result = task_result.get()
            if result and 'quiz_id' in result:
                response_data['quiz_id'] = result['quiz_id']
        except Exception:
            pass  # Will fall back to polling on the frontend

        return Response(response_data, status=status.HTTP_202_ACCEPTED)


class FlashcardDeckViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardDeckSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = FlashcardDeck.objects.filter(user=self.request.user).order_by('-created_at')
        # Allow filtering by document so the frontend polling can find decks by document
        document_id = self.request.query_params.get('document')
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """
        POST /api/materials/flashcard-decks/generate/
        Body: { document_id, card_count }

        Checks the daily rate limit (5/day) then triggers async flashcard generation.
        """
        document_id = request.data.get('document_id')
        if not document_id:
            return Response({'error': 'document_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            document = Document.objects.get(id=document_id, user=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        if document.status != 'completed':
            return Response(
                {'error': f'Document is not ready (status: {document.status}). Please wait for processing to complete.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed, count = _check_and_increment_usage(request.user, 'flashcard')
        if not allowed:
            return Response(
                {
                    'error': f'Daily flashcard generation limit reached ({DAILY_GENERATION_LIMIT}/day). Try again tomorrow.',
                    'limit': DAILY_GENERATION_LIMIT,
                    'used': count,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        card_count = int(request.data.get('card_count', 10))

        from .tasks import generate_flashcards_for_document
        task_result = generate_flashcards_for_document.delay(
            document_id=document.id,
            user_id=request.user.id,
            card_count=card_count,
        )

        # When CELERY_TASK_ALWAYS_EAGER=True, the task ran synchronously.
        # Extract the deck_id directly so the frontend doesn't need to poll.
        response_data = {
            'message': 'Flashcard generation started.',
            'document_id': document.id,
            'used': count,
            'limit': DAILY_GENERATION_LIMIT,
        }
        try:
            result = task_result.get()
            if result and 'deck_id' in result:
                response_data['deck_id'] = result['deck_id']
        except Exception:
            pass  # Will fall back to polling on the frontend

        return Response(response_data, status=status.HTTP_202_ACCEPTED)


class PerformanceViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Performance.objects.filter(user=self.request.user).order_by('-completed_at')
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass
        return queryset

    def perform_create(self, serializer):
        performance = serializer.save(user=self.request.user)
        user = self.request.user

        # 1. Update points (10 points per correct answer)
        points_earned = performance.score * 10
        user.points += points_earned

        # 2. Update streak
        now = timezone.now().date()
        last_activity = user.last_activity.date() if user.last_activity else None

        if last_activity:
            if last_activity == now:
                pass  # Already active today
            elif last_activity == now - timedelta(days=1):
                user.streak += 1
            else:
                user.streak = 1
        else:
            user.streak = 1

        user.save()


class GenerationUsageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/materials/usage/
    Returns today's quiz and flashcard generation counts for the authenticated user.
    """
    serializer_class = GenerationUsageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        today = timezone.now().date()
        return GenerationUsage.objects.filter(user=self.request.user, date=today)

    def list(self, request, *args, **kwargs):
        today = timezone.now().date()
        quiz_usage = GenerationUsage.objects.filter(user=request.user, type='quiz', date=today).first()
        flashcard_usage = GenerationUsage.objects.filter(user=request.user, type='flashcard', date=today).first()

        return Response({
            'quiz': {
                'used': quiz_usage.count if quiz_usage else 0,
                'limit': DAILY_GENERATION_LIMIT,
            },
            'flashcard': {
                'used': flashcard_usage.count if flashcard_usage else 0,
                'limit': DAILY_GENERATION_LIMIT,
            },
        })
