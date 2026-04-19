from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, QuizViewSet, FlashcardDeckViewSet, PerformanceViewSet, GenerationUsageViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'flashcard-decks', FlashcardDeckViewSet, basename='flashcarddeck')
router.register(r'performances', PerformanceViewSet, basename='performance')
router.register(r'usage', GenerationUsageViewSet, basename='generationusage')

urlpatterns = [
    path('', include(router.urls)),
]
