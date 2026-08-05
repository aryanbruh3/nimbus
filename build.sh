#!/usr/bin/env bash
set -e

pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# One-time cleanup: delete old broken files and reset storage
python -c "
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nimbus.settings')
django.setup()
from pages.models import CloudFile, StorageUsage
count = CloudFile.objects.count()
if count > 0:
    CloudFile.objects.all().delete()
    StorageUsage.objects.update(used_bytes=0)
    print(f'Deleted {count} old files and reset storage')
else:
    print('No old files to clean')
"

# Create superuser if env vars are set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
    python manage.py createsuperuser --noinput 2>/dev/null || echo "Superuser already exists"
fi