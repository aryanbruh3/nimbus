from pages.models import StorageUsage


def storage_context(request):
    """Make storage available in all templates for authenticated users."""
    if request.user.is_authenticated:
        try:
            storage = StorageUsage.objects.filter(owner=request.user).first()
            if not storage:
                storage = StorageUsage.objects.create(
                    owner=request.user,
                    total_bytes=10 * 1024 * 1024 * 1024,
                )
            return {'storage': storage}
        except Exception:
            return {}
    return {}
