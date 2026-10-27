from django.db import models
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

    @property
    def download_url(self):
        """Get the download URL for this file — works with both Cloudinary and local storage."""
        if hasattr(self.file, 'url'):
            return self.file.url
        return ''


class StorageUsage(models.Model):
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='storage_usage')
    total_bytes = models.BigIntegerField(default=1 * 1024 * 1024 * 1024)  # 1 GB default
    used_bytes = models.BigIntegerField(default=0)

    def __str__(self):
        return f"{self.owner.username} storage"

    @property
    def total_display(self):
        size = self.total_bytes
        if size >= 1024 * 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024 * 1024 * 1024):.0f} TB"
        return f"{size / (1024 * 1024 * 1024):.0f} GB"

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
