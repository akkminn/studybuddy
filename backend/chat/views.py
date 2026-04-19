from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer

class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'])
    def update_documents(self, request, pk=None):
        """Add or remove documents from an existing chat session."""
        session = self.get_object()
        document_ids = request.data.get('document_ids', [])
        
        if not isinstance(document_ids, list):
            return Response({'error': 'document_ids must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        
        from materials.models import Document
        # Only allow user's own completed documents
        valid_docs = Document.objects.filter(
            id__in=document_ids,
            user=request.user,
            status='completed'
        )
        session.documents.set(valid_docs)
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        session = self.get_object()
        user_message_content = request.data.get('content')
        
        if not user_message_content:
            return Response({'error': 'content is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message
        ChatMessage.objects.create(session=session, role='user', content=user_message_content)

        # 1. Gather Chat History
        messages = session.messages.order_by('timestamp')
        history_text = "Conversation History:\n"
        for msg in messages:
            history_text += f"{msg.role.capitalize()}: {msg.content}\n"

        # 2. Text-Based RAG (In-Memory Processing)
        from google import genai
        try:
            client = genai.Client()
            
            document_texts = []
            document_titles = []
            
            for doc in session.documents.filter(status='completed'):
                if not doc.content:
                    continue
                
                document_titles.append(doc.title)
                document_texts.append(f"--- DOCUMENT: {doc.title} ---\n{doc.content[:40000]}\n--- END DOCUMENT ---\n")

            # 3. Prompt Gemini
            doc_count = len(document_texts)
            if doc_count > 0:
                doc_list = ", ".join(f'"{t}"' for t in document_titles)
                system_instruction = f"""
You are StudyBuddy, an expert AI tutor. 
You have access to text extractions from {doc_count} attached document(s): {doc_list}.
These extractions are provided directly below the conversation history.
Your goal is to help the student understand this material.
When answering, reference which document your information comes from if there are multiple documents.
Use the conversation history provided to maintain context.
Be concise, educational, and accurate.
"""
            else:
                system_instruction = """
You are StudyBuddy, an expert AI tutor. 
No study documents are currently loaded.
Help the student with general study questions.
Use the conversation history provided to maintain context.
Be concise, educational, and accurate.
"""

            prompt = f"{history_text}\n\n"
            if document_texts:
                prompt += "Here are the document contents:\n\n" + "\n".join(document_texts) + "\n\n"

            prompt += f"User: {user_message_content}"

            contents = [prompt]

            response = client.models.generate_content(
                model='gemini-3.1-flash-lite-preview',
                contents=contents,
                config={'system_instruction': system_instruction}
            )
            assistant_reply = response.text.strip()
        except Exception as e:
            error_str = str(e)
            print(f"Gemini Error in Chat: {error_str}")
            
            if "503" in error_str or "high demand" in error_str.lower():
                assistant_reply = "[SERVICE_ERROR] Our AI core is currently experiencing high demand. Please try again in a few moments."
            else:
                assistant_reply = f"[SERVICE_ERROR] I'm having trouble connecting to my AI core. Error: {error_str}"

        # Save assistant message
        assistant_message = ChatMessage.objects.create(
            session=session,
            role='assistant',
            content=assistant_reply
        )

        return Response({
            'status': 'message sent',
            'assistant_reply': assistant_message.content
        })
