# NIMBUS — Full Project Setup Script
# Run this in PowerShell from your project root:
#   D:\da\workspace-019f9caa-4b79-7c17-9e17-e3f0af05b28a
#
# First: Drop and recreate the database in phpMyAdmin:
#   DROP DATABASE IF EXISTS nimbus_db;
#   CREATE DATABASE nimbus_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#
# Then run: python setup_nimbus.py
# Then: python manage.py migrate
# Then: python manage.py createsuperuser
# Then: python manage.py runserver

import os

BASE = r"D:\da\workspace-019f9caa-4b79-7c17-9e17-e3f0af05b28a"

files = {}

# ─────────────────────────────────────────────
# nimbus/settings.py
# ─────────────────────────────────────────────
files["nimbus/settings.py"] = '''"""
Django settings for nimbus project.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-ul_h@v!g0bu%fv9tq96o0t(6hr!*($24lnz393h9_hy-k%)xfd'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'pages',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'nimbus_db',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
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

STATIC_URL = 'static/'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/login/'

DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800
'''

# ─────────────────────────────────────────────
# nimbus/urls.py
# ─────────────────────────────────────────────
files["nimbus/urls.py"] = '''from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('pages.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
'''

# ─────────────────────────────────────────────
# pages/models.py
# ─────────────────────────────────────────────
files["pages/models.py"] = '''from django.db import models
from django.contrib.auth.models import User


class CloudFile(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cloud_files')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploads/')
    size_bytes = models.BigIntegerField(default=0)
    file_type = models.CharField(max_length=50, default='other')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_starred = models.BooleanField(default=False)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.name

    @property
    def size_display(self):
        size = self.size_bytes
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        elif size < 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024):.1f} MB"
        return f"{size / (1024 * 1024 * 1024):.2f} GB"

    @property
    def type_badge(self):
        ext = self.name.rsplit('.', 1)[-1].lower() if '.' in self.name else 'other'
        mapping = {
            'pdf': 'pdf', 'doc': 'doc', 'docx': 'doc', 'xls': 'doc', 'xlsx': 'doc',
            'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image', 'svg': 'image', 'webp': 'image',
            'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive',
            'py': 'code', 'js': 'code', 'html': 'code', 'css': 'code', 'ts': 'code', 'json': 'code', 'md': 'code',
            'mp4': 'video', 'mov': 'video', 'avi': 'video',
            'mp3': 'audio', 'wav': 'audio', 'flac': 'audio',
        }
        return mapping.get(ext, 'other')


class StorageUsage(models.Model):
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='storage_usage')
    total_bytes = models.BigIntegerField(default=5 * 1024 * 1024 * 1024)
    used_bytes = models.BigIntegerField(default=0)

    def __str__(self):
        return f"{self.owner.username} storage"

    @property
    def total_display(self):
        return f"{self.total_bytes / (1024 * 1024 * 1024):.0f} GB"

    @property
    def used_display(self):
        size = self.used_bytes
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        elif size < 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024):.1f} MB"
        return f"{size / (1024 * 1024 * 1024):.2f} GB"

    @property
    def percentage(self):
        if self.total_bytes == 0:
            return 0
        return min((self.used_bytes / self.total_bytes) * 100, 100)
'''

# ─────────────────────────────────────────────
# pages/views.py
# ─────────────────────────────────────────────
files["pages/views.py"] = '''from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.http import JsonResponse, FileResponse, Http404
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import CloudFile, StorageUsage

# ── Global limits ──
MAX_USERS = 500
MAX_FILE_SIZE = 100 * 1024 * 1024
DEFAULT_STORAGE_BYTES = 5 * 1024 * 1024 * 1024


def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    current_users = User.objects.count()
    if current_users >= MAX_USERS:
        return render(request, 'pages/register.html', {
            'form': UserCreationForm(),
            'limit_reached': True,
            'max_users': MAX_USERS,
        })

    if request.method == 'POST':
        if current_users >= MAX_USERS:
            return render(request, 'pages/register.html', {
                'form': UserCreationForm(),
                'limit_reached': True,
                'max_users': MAX_USERS,
            })
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            StorageUsage.objects.create(owner=user, total_bytes=DEFAULT_STORAGE_BYTES)
            login(request, user)
            return redirect('dashboard')
    else:
        form = UserCreationForm()
    return render(request, 'pages/register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    from django.contrib.auth.forms import AuthenticationForm
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('dashboard')
    else:
        form = AuthenticationForm()
    return render(request, 'pages/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def dashboard_view(request):
    storage = StorageUsage.objects.filter(owner=request.user).first()
    if not storage:
        storage = StorageUsage.objects.create(owner=request.user, total_bytes=DEFAULT_STORAGE_BYTES)
    recent_files = CloudFile.objects.filter(owner=request.user)[:8]
    total_files = CloudFile.objects.filter(owner=request.user).count()
    starred_files = CloudFile.objects.filter(owner=request.user, is_starred=True).count()

    from django.db.models import Count
    type_counts = CloudFile.objects.filter(owner=request.user).values('file_type').annotate(count=Count('id'))
    type_map = dict((t['file_type'], t['count']) for t in type_counts)

    context = {
        'storage': storage,
        'recent_files': recent_files,
        'total_files': total_files,
        'starred_files': starred_files,
        'type_counts': type_map,
    }
    return render(request, 'pages/index.html', context)


@login_required
def files_view(request):
    storage = StorageUsage.objects.filter(owner=request.user).first()
    if not storage:
        storage = StorageUsage.objects.create(owner=request.user, total_bytes=DEFAULT_STORAGE_BYTES)
    all_files = CloudFile.objects.filter(owner=request.user)

    if request.method == 'POST' and request.FILES.get('file'):
        uploaded = request.FILES['file']
        name = uploaded.name
        size = uploaded.size

        if size > MAX_FILE_SIZE:
            max_display = f"{MAX_FILE_SIZE / (1024 * 1024):.0f} MB"
            file_display = f"{size / (1024 * 1024):.1f} MB"
            return JsonResponse({
                'success': False,
                'error': f'File too large ({file_display}). Max per file is {max_display}.',
                'error_type': 'file_size',
            }, status=400)

        remaining = storage.total_bytes - storage.used_bytes
        if size > remaining:
            remaining_display = StorageUsage(owner=request.user, used_bytes=remaining, total_bytes=remaining).used_display
            quota_display = storage.total_display
            return JsonResponse({
                'success': False,
                'error': f'Storage full. You have {remaining_display} remaining out of {quota_display}.',
                'error_type': 'quota_full',
            }, status=400)

        ext = name.rsplit('.', 1)[-1].lower() if '.' in name else 'other'
        mapping = {
            'pdf': 'pdf', 'doc': 'doc', 'docx': 'doc', 'xls': 'doc', 'xlsx': 'doc',
            'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image', 'svg': 'image', 'webp': 'image',
            'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive',
            'py': 'code', 'js': 'code', 'html': 'code', 'css': 'code', 'ts': 'code', 'json': 'code', 'md': 'code',
            'mp4': 'video', 'mov': 'video', 'avi': 'video',
            'mp3': 'audio', 'wav': 'audio', 'flac': 'audio',
        }
        file_type = mapping.get(ext, 'other')
        cf = CloudFile(owner=request.user, name=name, file=uploaded, size_bytes=size, file_type=file_type)
        cf.save()
        storage.used_bytes += size
        storage.save()
        return JsonResponse({'success': True, 'file_id': cf.id, 'name': cf.name, 'size': cf.size_display, 'type': cf.type_badge})

    context = {
        'storage': storage,
        'files': all_files,
    }
    return render(request, 'pages/files.html', context)


@login_required
def profile_view(request):
    storage = StorageUsage.objects.filter(owner=request.user).first()
    if not storage:
        storage = StorageUsage.objects.create(owner=request.user, total_bytes=DEFAULT_STORAGE_BYTES)
    total_files = CloudFile.objects.filter(owner=request.user).count()

    from django.db.models import Count, Sum
    type_counts = CloudFile.objects.filter(owner=request.user).values('file_type').annotate(
        count=Count('id'), total_size=Sum('size_bytes')
    )
    type_map = []
    for t in type_counts:
        type_map.append({
            'type': t['file_type'],
            'count': t['count'],
            'size': t['total_size'] or 0,
        })

    context = {
        'storage': storage,
        'total_files': total_files,
        'type_breakdown': type_map,
    }
    return render(request, 'pages/profile.html', context)


@login_required
def delete_file_view(request, file_id):
    cf = get_object_or_404(CloudFile, id=file_id, owner=request.user)
    storage = StorageUsage.objects.filter(owner=request.user).first()
    if storage:
        storage.used_bytes = max(0, storage.used_bytes - cf.size_bytes)
        storage.save()
    cf.delete()
    return JsonResponse({'success': True})


@login_required
def delete_all_files_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST only'}, status=405)

    count = CloudFile.objects.filter(owner=request.user).count()
    CloudFile.objects.filter(owner=request.user).delete()

    storage = StorageUsage.objects.filter(owner=request.user).first()
    if storage:
        storage.used_bytes = 0
        storage.save()

    return JsonResponse({'success': True, 'deleted_count': count})


@login_required
def star_file_view(request, file_id):
    cf = get_object_or_404(CloudFile, id=file_id, owner=request.user)
    cf.is_starred = not cf.is_starred
    cf.save()
    return JsonResponse({'success': True, 'starred': cf.is_starred})


@login_required
def file_detail_view(request, file_id):
    cf = get_object_or_404(CloudFile, id=file_id, owner=request.user)
    data = {
        'id': cf.id,
        'name': cf.name,
        'size': cf.size_display,
        'size_bytes': cf.size_bytes,
        'type': cf.type_badge,
        'file_type': cf.file_type,
        'is_starred': cf.is_starred,
        'uploaded_at': cf.uploaded_at.strftime('%b %d, %Y at %I:%M %p'),
        'url': cf.file.url if cf.file else '',
        'download_url': f'/files/{cf.id}/download/',
        'preview_url': f'/files/{cf.id}/preview/',
    }
    return JsonResponse(data)


@login_required
def file_download_view(request, file_id):
    cf = get_object_or_404(CloudFile, id=file_id, owner=request.user)
    if not cf.file:
        raise Http404("File not found on disk")
    try:
        response = FileResponse(open(cf.file.path, 'rb'), as_attachment=True, filename=cf.name)
    except FileNotFoundError:
        raise Http404("File not found on disk")
    return response


@login_required
def file_preview_view(request, file_id):
    cf = get_object_or_404(CloudFile, id=file_id, owner=request.user)
    if not cf.file:
        raise Http404("File not found on disk")
    try:
        response = FileResponse(open(cf.file.path, 'rb'))
    except FileNotFoundError:
        raise Http404("File not found on disk")
    return response
'''

# ─────────────────────────────────────────────
# pages/urls.py
# ─────────────────────────────────────────────
files["pages/urls.py"] = """from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard_view, name='dashboard'),
    path('files/', views.files_view, name='files'),
    path('profile/', views.profile_view, name='profile'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('files/delete/<int:file_id>/', views.delete_file_view, name='delete_file'),
    path('files/delete-all/', views.delete_all_files_view, name='delete_all_files'),
    path('files/star/<int:file_id>/', views.star_file_view, name='star_file'),
    path('files/<int:file_id>/', views.file_detail_view, name='file_detail'),
    path('files/<int:file_id>/download/', views.file_download_view, name='file_download'),
    path('files/<int:file_id>/preview/', views.file_preview_view, name='file_preview'),
]
"""

# ─────────────────────────────────────────────
# pages/admin.py
# ─────────────────────────────────────────────
files["pages/admin.py"] = '''from django.contrib import admin
from .models import CloudFile, StorageUsage

@admin.register(CloudFile)
class CloudFileAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'file_type', 'size_bytes', 'uploaded_at', 'is_starred']
    list_filter = ['file_type', 'is_starred', 'uploaded_at']
    search_fields = ['name']

@admin.register(StorageUsage)
class StorageUsageAdmin(admin.ModelAdmin):
    list_display = ['owner', 'total_bytes', 'used_bytes']
'''

# ─────────────────────────────────────────────
# pages/apps.py
# ─────────────────────────────────────────────
files["pages/apps.py"] = '''from django.apps import AppConfig


class PagesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pages'
'''

# ─────────────────────────────────────────────
# pages/context_processors/__init__.py
# ─────────────────────────────────────────────
files["pages/context_processors/__init__.py"] = ''

# ─────────────────────────────────────────────
# pages/context_processors/storage.py
# ─────────────────────────────────────────────
files["pages/context_processors/storage.py"] = '''from pages.models import StorageUsage


def storage_context(request):
    """Make storage available in all templates for authenticated users."""
    if request.user.is_authenticated:
        try:
            storage = StorageUsage.objects.filter(owner=request.user).first()
            if not storage:
                storage = StorageUsage.objects.create(
                    owner=request.user,
                    total_bytes=5 * 1024 * 1024 * 1024,
                )
            return {'storage': storage}
        except Exception:
            return {}
    return {}
'''

# ─────────────────────────────────────────────
# pages/templatetags/__init__.py
# ─────────────────────────────────────────────
files["pages/templatetags/__init__.py"] = ''

# ─────────────────────────────────────────────
# pages/templatetags/nimbus_tags.py
# ─────────────────────────────────────────────
files["pages/templatetags/nimbus_tags.py"] = '''from django import template

register = template.Library()

ICON_MAP = {
    'pdf': 'file-text',
    'image': 'image',
    'archive': 'archive',
    'code': 'code-2',
    'doc': 'file-text',
    'video': 'film',
    'audio': 'music',
    'other': 'file',
}


@register.filter
def file_icon(value):
    return ICON_MAP.get(value, 'file')


@register.filter
def make_first_char(value):
    if value:
        return value[0].upper()
    return '?'
'''

# ─────────────────────────────────────────────
# pages/migrations/__init__.py
# ─────────────────────────────────────────────
files["pages/migrations/__init__.py"] = ''


# ─────────────────────────────────────────────
# WRITE ALL FILES
# ─────────────────────────────────────────────
print("Writing Nimbus project files...")
for relpath, content in files.items():
    filepath = os.path.join(BASE, relpath.replace('/', os.sep))
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  OK: {relpath}")

print("\nAll files written!")
print("\nNext steps:")
print("  1. Drop & recreate database in phpMyAdmin:")
print("     DROP DATABASE IF EXISTS nimbus_db;")
print("     CREATE DATABASE nimbus_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
print("  2. python manage.py makemigrations pages")
print("  3. python manage.py migrate")
print("  4. python manage.py createsuperuser")
print("  5. python manage.py runserver")
