from celery import shared_task
from google import genai
import json
from .models import Document, Quiz, Question, FlashcardDeck, Flashcard, MindMap

# Initialize Gemini Client
try:
    client = genai.Client()
except Exception as e:
    print(f"Warning: Could not initialize Gemini client: {e}")
    client = None

@shared_task
def generate_quiz_for_document(document_id, user_id, question_count=10, quiz_type='Multiple Choice',
                               difficulty='Medium'):
    """
    Step 2a (independent): Generate a quiz from an already-processed document.
    Called by the /quizzes/generate/ action after rate-limit check.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        document = Document.objects.get(id=document_id)
        user = User.objects.get(id=user_id)

        full_text = document.content if document.content else ""
        document_text = full_text[:40000]

        if not document_text.strip():
            raise ValueError("No extractable text found in the document.")

        if client is None:
            raise ValueError("Google GenAI SDK is not configured. Missing API Key?")

        prompt = f"""
You are an expert AI educator. Generate a quiz based ONLY on the following text.

Difficulty Level: {difficulty}

Return your response strictly as a single, valid, parsable JSON object with this schema:
{{
  "quiz": {{
    "title": "A relevant title for this quiz",
    "questions": [
      {{
        "text": "The question text",
        "type": "multiple_choice",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_option_index": 0,
        "answer": null
      }}
    ]
  }}
}}

Instructions:
1. Generate exactly {question_count} questions.
2. Quiz type MUST be {quiz_type}.
   - If "Multiple Choice": set type to "multiple_choice", provide 4 options, set answer to null.
   - If "True/False": set type to "multiple_choice", options ["True", "False"], answer null.
   - If "Fill in the Blank": set type to "fill_in_the_blank", options [], set "answer" to the specific term. For the "text", provide a complete sentence where the term is replaced by "______" (exactly 6 underscores). For example: "The capital of France is ______."
   - If "Mixed": use variety within {question_count} questions.
3. Do NOT wrap JSON in markdown code blocks. Output raw JSON only.

Text:
{document_text}
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        data = json.loads(response_text.strip())
        quiz_data = data.get('quiz', {})

        quiz = Quiz.objects.create(
            document=document,
            user=user,
            title=quiz_data.get('title', f"Quiz for {document.title}")
        )

        for q_data in quiz_data.get('questions', []):
            Question.objects.create(
                quiz=quiz,
                text=q_data.get('text', 'Missing Question?'),
                type=q_data.get('type', 'multiple_choice'),
                options=q_data.get('options', []),
                correct_option_index=q_data.get('correct_option_index', 0),
                answer=q_data.get('answer', '')
            )

        print(f"Quiz {quiz.id} generated for document {document_id}.")
        return {'quiz_id': quiz.id}

    except Exception as e:
        print(f"Error generating quiz for document {document_id}: {e}")
        raise


@shared_task
def generate_flashcards_for_document(document_id, user_id, card_count=10):
    """
    Step 2b (independent): Generate a flashcard deck from an already-processed document.
    Called by the /flashcard-decks/generate/ action after rate-limit check.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        document = Document.objects.get(id=document_id)
        user = User.objects.get(id=user_id)

        full_text = document.content if document.content else ""
        document_text = full_text[:40000]

        if not document_text.strip():
            raise ValueError("No extractable text found in the document.")

        if client is None:
            raise ValueError("Google GenAI SDK is not configured. Missing API Key?")

        prompt = f"""
You are an expert AI educator. Generate study flashcards based ONLY on the following text.

Return your response strictly as a single, valid, parsable JSON object with this schema:
{{
  "flashcards": {{
    "title": "A relevant title for these flashcards",
    "cards": [
      {{
        "front": "A concept, term, or question",
        "back": "The definition, explanation, or answer"
      }}
    ]
  }}
}}

Instructions:
1. Generate exactly {card_count} flashcards.
2. Each front should be a concise concept or question; each back should be a clear, well-explained answer.
3. Do NOT wrap JSON in markdown code blocks. Output raw JSON only.

Text:
{document_text}
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        data = json.loads(response_text.strip())
        flashcards_data = data.get('flashcards', {})

        deck = FlashcardDeck.objects.create(
            document=document,
            user=user,
            title=flashcards_data.get('title', f"Flashcards for {document.title}")
        )

        for fc_data in flashcards_data.get('cards', []):
            Flashcard.objects.create(
                deck=deck,
                front=fc_data.get('front', 'Missing Front'),
                back=fc_data.get('back', 'Missing Back')
            )

        print(f"Flashcard deck {deck.id} generated for document {document_id}.")
        return {'deck_id': deck.id}

    except Exception as e:
        print(f"Error generating flashcards for document {document_id}: {e}")
        raise


@shared_task
def generate_mindmap_for_document(document_id, user_id):
    """
    Generate a hierarchical mind map from an already-processed document.
    Called by the /mindmaps/generate/ action after rate-limit check.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        document = Document.objects.get(id=document_id)
        user = User.objects.get(id=user_id)

        full_text = document.content if document.content else ""
        document_text = full_text[:40000]

        if not document_text.strip():
            raise ValueError("No extractable text found in the document.")

        if client is None:
            raise ValueError("Google GenAI SDK is not configured. Missing API Key?")

        prompt = f"""
You are an expert AI educator. Create a concise, well-structured mind map from the text below.

Return your response strictly as a single, valid, parsable JSON object matching this schema:
{{
  "mindmap": {{
    "title": "A short, relevant title for this mind map",
    "root": {{
      "label": "Central topic (1-4 words)",
      "children": [
        {{
          "label": "Main branch (1-5 words)",
          "children": [
            {{
              "label": "Sub-topic (1-5 words)",
              "children": []
            }}
          ]
        }}
      ]
    }}
  }}
}}

Instructions:
1. The root node should be the central concept of the entire text.
2. Create 4-7 main branches from the root, each representing a key theme.
3. Each branch may have 2-5 sub-topics (children). Sub-topics may also have children (max 3 levels deep from root).
4. Keep every label very short (5 words or fewer). Do not use full sentences.
5. Do NOT wrap JSON in markdown code blocks. Output raw JSON only.

Text:
{document_text}
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        data = json.loads(response_text.strip())
        mindmap_data = data.get('mindmap', {})

        mindmap = MindMap.objects.create(
            document=document,
            user=user,
            title=mindmap_data.get('title', f"Mind Map for {document.title}"),
            data=mindmap_data.get('root', {}),
        )

        print(f"Mind map {mindmap.id} generated for document {document_id}.")
        return {'mindmap_id': mindmap.id}

    except Exception as e:
        print(f"Error generating mind map for document {document_id}: {e}")
        raise
