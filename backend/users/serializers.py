from rest_framework import serializers
from .models import User

class CustomUserDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'points', 'streak', 'last_activity')
        read_only_fields = ('email', 'username', 'role', 'points', 'streak', 'last_activity')
