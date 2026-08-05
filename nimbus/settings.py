"""
Django settings for nimbus project.

Local dev:  SQLite + local media files
Production: PostgreSQL + Cloudinary (free 25GB cloud storage)
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ──
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-ul_h@v!g0bu%fv9tq96o0t(6hr!*($24lnz393h9_hy-k%)xfd'
)

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '*').split(',')

# ── Cloudinary config (set in env for production) ──
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
    'API_KEY':    os.environ.get('CLOUDINARY_API_KEY', ''),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET', ''),
}

# If Cloudinary credentials are set, use it for media; otherwise local files
USE_CLOUDINARY = bool(CLOUDINARY_STORAGE['CLOUD_NAME'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Cloudinary — must be BEFORE pages app
    'cloudinary_storage',
    'cloudinary',
    'pages',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nimbus.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'pages.context_processors.storage.storage_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'nimbus.wsgi.application'

# ── Database ──
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ── Static Files (CSS/JS — always served via WhiteNoise) ──
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ── Media Files (user uploads) ──
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ── Storage backends (Django 4.2+ unified STORAGES setting) ──
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
    'default': {
        'BACKEND': (
            'cloudinary_storage.storage.MediaCloudinaryStorage'
            if USE_CLOUDINARY
            else 'django.core.files.storage.FileSystemStorage'
        ),
    },
}

# ── Auth ──
LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/login/'

# ── File Upload Limits ──
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000      # 500 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800       # 50 MB before writing to disk

# ── Production security (auto-enabled when DEBUG=False) ──
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
