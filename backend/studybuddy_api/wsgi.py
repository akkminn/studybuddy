"""
WSGI config for studybuddy_api project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os
import sys
from pathlib import Path

# Add the backend directory to sys.path so Django can find studybuddy_api
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studybuddy_api.settings')

application = get_wsgi_application()

# Vercel Serverless runtime looks for an `app` variable
app = application
