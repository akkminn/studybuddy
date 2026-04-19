from rest_framework import serializers
from .models import ChatSession, ChatMessage
from materials.models import Document

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'timestamp']

class DocumentBriefSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document references inside chat sessions."""
    class Meta:
        model = Document
        fields = ['id', 'title', 'status', 'uploaded_at']

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    documents = DocumentBriefSerializer(many=True, read_only=True)
    # Write-only field: accepts list of document IDs when creating/updating
    document_ids = serializers.PrimaryKeyRelatedField(
        queryset=Document.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='documents'
    )

    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'documents', 'document_ids', 'title', 'created_at', 'messages']
        read_only_fields = ['user', 'created_at']

    def create(self, validated_data):
        documents = validated_data.pop('documents', [])
        session = ChatSession.objects.create(**validated_data)
        if documents:
            session.documents.set(documents)
        return session
