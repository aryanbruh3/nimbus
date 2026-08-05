from django import template

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
