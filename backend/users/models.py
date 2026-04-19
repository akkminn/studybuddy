from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Extended gamification fields based on the project plan
    role = models.CharField(max_length=20, default='student')
    points = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username
