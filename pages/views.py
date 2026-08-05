from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.http import JsonResponse, FileResponse, Http404, HttpResponseRedirect
from django.conf import settings
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import CloudFile, StorageUsage

# ── Global limits ──
# Change these to set your caps
MAX_USERS = 500                                  # Max accounts that can register
MAX_FILE_SIZE = 100 * 1024 * 1024                # 100 MB max per single file upload
DEFAULT_STORAGE_BYTES = 1 * 1024 * 1024 * 1024   # 1 GB quota per user


def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    # Check if max user limit reached
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

    # File type breakdown
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

    # Handle upload
    if request.method == 'POST' and request.FILES.get('file'):
        uploaded = request.FILES['file']
        name = uploaded.name
        size = uploaded.size

        # ── Check 1: Single file size limit ──
        if size > MAX_FILE_SIZE:
            max_display = f"{MAX_FILE_SIZE / (1024 * 1024):.0f} MB"
            file_display = f"{size / (1024 * 1024):.1f} MB"
            return JsonResponse({
                'success': False,
                'error': f'File too large ({file_display}). Max per file is {max_display}.',
                'error_type': 'file_size',
            }, status=400)

        # ── Check 2: Storage quota limit ──
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

    # Reset storage usage to zero
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
def file_download_view(request, file_id):
    """Download a file — always forces browser to save, never preview."""
    cf = get_object_or_404(CloudFile, id=file_id, owner=request.user)
    if not cf.file:
        raise Http404("File not found")

    # Cloudinary — fetch the file server-side and serve as download
    if getattr(settings, 'USE_CLOUDINARY', False):
        import requests as req
        resp = req.get(cf.file.url, stream=True)
        if resp.status_code != 200:
            raise Http404("File not found on cloud")
        response = FileResponse(
            resp.iter_content(chunk_size=8192),
            as_attachment=True,
            filename=cf.name,
        )
        return response

    # Local filesystem — serve via FileResponse
    try:
        response = FileResponse(open(cf.file.path, 'rb'), as_attachment=True, filename=cf.name)
    except FileNotFoundError:
        raise Http404("File not found on disk")
    return response