from django.contrib import admin
from .models import CloudFile, StorageUsage

@admin.register(CloudFile)
class CloudFileAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'file_type', 'size_bytes', 'uploaded_at', 'is_starred']
    list_filter = ['file_type', 'is_starred', 'uploaded_at']
    search_fields = ['name']

@admin.register(StorageUsage)
class StorageUsageAdmin(admin.ModelAdmin):
    list_display = ['owner', 'total_bytes', 'used_bytes']
