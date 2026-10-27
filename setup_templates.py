# NIMBUS — Templates & Static Files Setup
# Run AFTER setup_nimbus.py:
#   python setup_templates.py

import os

BASE = r"D:\da\workspace-019f9caa-4b79-7c17-9e17-e3f0af05b28a"

files = {}

# ─────────────────────────────────────────────
# pages/templates/pages/base.html
# ─────────────────────────────────────────────
files["pages/templates/pages/base.html"] = r'''{% load static %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nimbus{% block title_extra %}{% endblock %}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">

  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

  <link rel="stylesheet" href="{% static 'pages/style.css' %}">

  {% block extra_css %}{% endblock %}
</head>
<body>

{% if user.is_authenticated %}
<div class="app-shell">

  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon">N</div>
      <span class="sidebar-brand-text">Nimbus</span>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Navigation</div>

      <a href="{% url 'dashboard' %}" class="sidebar-nav-item {% block nav_dashboard %}{% endblock %}">
        <i data-lucide="layout-dashboard" class="nav-icon"></i>
        Dashboard
      </a>

      <a href="{% url 'files' %}" class="sidebar-nav-item {% block nav_files %}{% endblock %}">
        <i data-lucide="folder" class="nav-icon"></i>
        All Files
      </a>

      <a href="{% url 'profile' %}" class="sidebar-nav-item {% block nav_profile %}{% endblock %}">
        <i data-lucide="user" class="nav-icon"></i>
        Profile
      </a>

      <div class="sidebar-section-label">Quick Access</div>

      <a href="{% url 'files' %}#starred" class="sidebar-nav-item {% block nav_starred %}{% endblock %}">
        <i data-lucide="star" class="nav-icon"></i>
        Starred
      </a>
    </nav>

    <div class="sidebar-footer">
      {% if storage %}
      <div class="sidebar-storage-bar">
        <div class="sidebar-storage-track">
          <div class="sidebar-storage-fill" style="width: {{ storage.percentage|floatformat:0 }}%"></div>
        </div>
      </div>
      <div class="sidebar-storage-text">
        <span>{{ storage.used_display }} used</span>
        <span>{{ storage.total_display }}</span>
      </div>
      {% endif %}
    </div>
  </aside>

  <div class="sidebar-overlay"></div>

  <div class="main-area">
    <header class="header">
      <div class="header-left">
        <button class="mobile-menu-btn"><i data-lucide="menu" style="width:18px;height:18px"></i></button>
        <div class="header-breadcrumb">
          <span>Nimbus</span>
          <span>/</span>
          <span class="header-breadcrumb-current">{% block breadcrumb %}Dashboard{% endblock %}</span>
        </div>
      </div>
      <div class="header-right">
        {% block header_search %}
        <div class="header-search">
          <i data-lucide="search" class="header-search-icon"></i>
          <input type="text" class="header-search-input" placeholder="Search files…">
        </div>
        {% endblock %}
        <div class="header-avatar-btn" title="Account menu">
          <i data-lucide="user" style="width:16px;height:16px;color:var(--c-body)"></i>
        </div>
        <div class="avatar-dropdown">
          <a href="{% url 'profile' %}" class="avatar-dropdown-item">
            <i data-lucide="user" style="width:16px;height:16px"></i>
            Profile
          </a>
          <a href="{% url 'dashboard' %}" class="avatar-dropdown-item">
            <i data-lucide="layout-dashboard" style="width:16px;height:16px"></i>
            Dashboard
          </a>
          <div class="avatar-dropdown-divider"></div>
          <a href="{% url 'logout' %}" class="avatar-dropdown-item danger">
            <i data-lucide="log-out" style="width:16px;height:16px"></i>
            Sign Out
          </a>
        </div>
      </div>
    </header>

    <main class="content">
      {% block content %}{% endblock %}
    </main>
  </div>
</div>

{% else %}
{% block auth_content %}{% endblock %}
{% endif %}

<!-- Toast Container -->
<div class="toast-container"></div>

<!-- File Preview Modal -->
<div class="preview-overlay" id="preview-modal">
  <div class="preview-panel">
    <div class="preview-header">
      <span class="preview-file-name" id="preview-name">—</span>
      <button class="preview-close-btn" id="preview-close">
        <i data-lucide="x" style="width:16px;height:16px"></i>
      </button>
    </div>
    <div class="preview-body" id="preview-body">
      <!-- Dynamic content injected via JS -->
    </div>
    <div class="preview-footer">
      <div class="preview-meta">
        <div class="preview-meta-item">
          <i data-lucide="hard-drive" class="nav-icon"></i>
          <span id="preview-size">—</span>
        </div>
        <div class="preview-meta-item">
          <i data-lucide="clock" class="nav-icon"></i>
          <span id="preview-date">—</span>
        </div>
        <div class="preview-meta-item">
          <i data-lucide="tag" class="nav-icon"></i>
          <span id="preview-type">—</span>
        </div>
      </div>
      <div class="preview-actions">
        <a href="#" class="preview-download-btn" id="preview-download" download>
          <i data-lucide="download" style="width:14px;height:14px"></i> Download
        </a>
        <button class="preview-delete-btn" id="preview-delete">
          <i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete
        </button>
      </div>
    </div>
  </div>
</div>

<script src="{% static 'pages/app.js' %}"></script>
{% block extra_js %}{% endblock %}

</body>
</html>
'''

# ─────────────────────────────────────────────
# pages/templates/pages/login.html
# ─────────────────────────────────────────────
files["pages/templates/pages/login.html"] = r'''{% extends 'pages/base.html' %}
{% load static %}

{% block title_extra %} — Sign In{% endblock %}

{% block auth_content %}
<div class="auth-shell">
  <div class="auth-visual">
    <div class="auth-visual-pattern"></div>
    <div class="auth-visual-content">
      <div class="auth-visual-logo">N</div>
      <h1 class="auth-visual-heading">Your cloud,<br>your control.</h1>
      <p class="auth-visual-sub">Secure, fast, and beautifully organized. Nimbus keeps your files where you need them.</p>
    </div>
  </div>

  <div class="auth-form-side">
    <div class="auth-form-wrap">
      <h3 class="auth-form-title">Welcome back</h3>
      <p class="auth-form-desc">Sign in to access your files and storage.</p>

      <form method="post" class="auth-form">
        {% csrf_token %}

        {% if form.errors %}
        <ul class="form-error-list">
          {% for field in form %}
          {% for error in field.errors %}
          <li>{{ error }}</li>
          {% endfor %}
          {% endfor %}
          {% for error in form.non_field_errors %}
          <li>{{ error }}</li>
          {% endfor %}
        </ul>
        {% endif %}

        <div class="form-group">
          <label for="id_username">Username</label>
          <input type="text" name="username" id="id_username" class="form-input {% if form.username.errors %}error{% endif %}" placeholder="Enter your username" autofocus value="{{ form.username.value|default:'' }}">
        </div>

        <div class="form-group">
          <label for="id_password">Password</label>
          <input type="password" name="password" id="id_password" class="form-input {% if form.password.errors %}error{% endif %}" placeholder="Enter your password">
        </div>

        <button type="submit" class="btn btn-primary btn-full">Sign In</button>
      </form>

      <div class="auth-divider">Don't have an account?</div>
      <a href="{% url 'register' %}" class="btn btn-ghost btn-full">Create Account</a>
    </div>
  </div>
</div>
{% endblock %}
'''

# ─────────────────────────────────────────────
# pages/templates/pages/register.html
# ─────────────────────────────────────────────
files["pages/templates/pages/register.html"] = r'''{% extends 'pages/base.html' %}
{% load static %}

{% block title_extra %} — Create Account{% endblock %}

{% block auth_content %}
<div class="auth-shell">
  <div class="auth-visual">
    <div class="auth-visual-pattern"></div>
    <div class="auth-visual-content">
      <div class="auth-visual-logo">N</div>
      <h1 class="auth-visual-heading">Start storing<br>smarter.</h1>
      <p class="auth-visual-sub">Create your Nimbus account and get 5 GB of free, secure cloud storage instantly.</p>
    </div>
  </div>

  <div class="auth-form-side">
    <div class="auth-form-wrap">
      {% if limit_reached %}
      <h3 class="auth-form-title">Registration closed</h3>
      <p class="auth-form-desc">We've reached our capacity of {{ max_users }} accounts. Registration is currently unavailable.</p>
      <div class="card" style="text-align:center; padding:var(--sp-2xl); margin-top:var(--sp-xl);">
        <i data-lucide="users" style="width:32px;height:32px;color:var(--c-muted);margin-bottom:var(--sp-lg);"></i>
        <p style="color:var(--c-heading);font-size:var(--fs-md);font-weight:var(--fw-semibold);">{{ max_users }} accounts limit reached</p>
        <p style="color:var(--c-muted);font-size:var(--fs-sm);">Contact an administrator if you need access.</p>
      </div>
      {% else %}
      <h3 class="auth-form-title">Create account</h3>
      <p class="auth-form-desc">Join Nimbus — your files deserve better.</p>

      <form method="post" class="auth-form">
        {% csrf_token %}

        {% if form.errors %}
        <ul class="form-error-list">
          {% for field in form %}
          {% for error in field.errors %}
          <li>{{ field.label }}: {{ error }}</li>
          {% endfor %}
          {% endfor %}
          {% for error in form.non_field_errors %}
          <li>{{ error }}</li>
          {% endfor %}
        </ul>
        {% endif %}

        <div class="form-group">
          <label for="id_username">Username</label>
          <input type="text" name="username" id="id_username" class="form-input {% if form.username.errors %}error{% endif %}" placeholder="Choose a username" autofocus value="{{ form.username.value|default:'' }}">
        </div>

        <div class="form-group">
          <label for="id_password1">Password</label>
          <input type="password" name="password1" id="id_password1" class="form-input {% if form.password1.errors %}error{% endif %}" placeholder="Create a strong password">
        </div>

        <div class="form-group">
          <label for="id_password2">Confirm Password</label>
          <input type="password" name="password2" id="id_password2" class="form-input {% if form.password2.errors %}error{% endif %}" placeholder="Repeat your password">
        </div>

        <button type="submit" class="btn btn-primary btn-full">Create Account</button>
      </form>
      {% endif %}

      <div class="auth-divider">Already have an account?</div>
      <a href="{% url 'login' %}" class="btn btn-ghost btn-full">Sign In</a>
    </div>
  </div>
</div>
{% endblock %}
'''

# ─────────────────────────────────────────────
# pages/templates/pages/index.html
# ─────────────────────────────────────────────
files["pages/templates/pages/index.html"] = r'''{% extends 'pages/base.html' %}
{% load static nimbus_tags %}

{% block title_extra %} — Dashboard{% endblock %}
{% block nav_dashboard %}active{% endblock %}
{% block breadcrumb %}Dashboard{% endblock %}

{% block content %}
<h2 class="mb-2xl" style="letter-spacing:-0.02em">Dashboard</h2>

<div class="bento-grid mb-2xl">
  <div class="stat-card">
    <div class="stat-icon-wrap">
      <i data-lucide="files" class="nav-icon"></i>
    </div>
    <div>
      <div class="stat-value">{{ total_files }}</div>
      <div class="stat-label">Total Files</div>
    </div>
  </div>

  <div class="stat-card">
    <div class="stat-icon-wrap">
      <i data-lucide="star" class="nav-icon"></i>
    </div>
    <div>
      <div class="stat-value">{{ starred_files }}</div>
      <div class="stat-label">Starred</div>
    </div>
  </div>

  <div class="stat-card">
    <div class="stat-icon-wrap">
      <i data-lucide="hard-drive" class="nav-icon"></i>
    </div>
    <div>
      <div class="stat-value">{{ storage.used_display }}</div>
      <div class="stat-label">Storage Used</div>
    </div>
  </div>

  <div class="stat-card">
    <div class="stat-icon-wrap">
      <i data-lucide="cloud" class="nav-icon"></i>
    </div>
    <div>
      <div class="stat-value">{{ storage.total_display }}</div>
      <div class="stat-label">Total Capacity</div>
    </div>
  </div>
</div>

<div class="bento-grid mb-2xl">
  <div class="storage-meter bento-span-2">
    <div class="storage-meter-header">
      <span class="storage-meter-title">Storage Overview</span>
      <span class="storage-meter-value">{{ storage.percentage|floatformat:0 }}%</span>
    </div>
    <div class="storage-bar-track">
      <div class="storage-bar-fill" style="width: {{ storage.percentage }}%"></div>
    </div>
    <div class="storage-breakdown">
      {% for type, count in type_counts.items %}
      <div class="storage-breakdown-item">
        <div class="storage-breakdown-dot" style="background:var(--badge-{{ type }}-text, var(--c-muted))"></div>
        <div>
          <div class="storage-breakdown-label">{{ type|capfirst }}</div>
          <div class="storage-breakdown-size">{{ count }} files</div>
        </div>
      </div>
      {% endfor %}
    </div>
  </div>

  <div class="card bento-span-2">
    <div class="card-header">
      <span class="card-title">Quick Upload</span>
    </div>
    <div class="dropzone" id="dashboard-dropzone">
      <form method="post" enctype="multipart/form-data" style="display:none">
        {% csrf_token %}
        <input type="file" name="file" id="file-upload-input">
      </form>
      <i data-lucide="upload-cloud" class="dropzone-icon"></i>
      <div class="dropzone-title">Drag files here</div>
      <div class="dropzone-subtitle">or <span class="dropzone-link">browse</span> to choose</div>
    </div>
    <div class="upload-progress-list"></div>
  </div>
</div>

<div class="card mb-xl">
  <div class="card-header">
    <span class="card-title">Recent Files</span>
    <a href="{% url 'files' %}" class="text-accent" style="font-size:var(--fs-sm)">View all →</a>
  </div>

  {% if recent_files %}
  <div class="files-list">
    {% for f in recent_files %}
    <div class="file-row" data-type="{{ f.type_badge }}" data-name="{{ f.name }}" data-id="{{ f.id }}" style="cursor:pointer">
      <div class="file-row-icon icon-bg-{{ f.type_badge }}">
        <i data-lucide="{{ f.type_badge|file_icon }}" class="nav-icon" style="width:18px;height:18px"></i>
      </div>
      <div class="file-row-name">{{ f.name }}</div>
      <div class="badge badge-{{ f.type_badge }}">{{ f.type_badge|capfirst }}</div>
      <div class="file-row-size">{{ f.size_display }}</div>
      <div class="file-row-actions">
        <button class="file-action-btn" data-preview title="Preview"><i data-lucide="eye" style="width:14px;height:14px"></i></button>
        <button class="file-action-btn {% if f.is_starred %}starred{% endif %}" data-star><i data-lucide="star" style="width:14px;height:14px"></i></button>
        <button class="file-action-btn danger" data-delete><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
      </div>
    </div>
    {% endfor %}
  </div>
  {% else %}
  <div class="empty-state">
    <i data-lucide="inbox" class="empty-state-icon"></i>
    <div class="empty-state-title">No files yet</div>
    <div class="empty-state-desc">Upload your first file to get started with Nimbus cloud storage.</div>
  </div>
  {% endif %}
</div>
{% endblock %}
'''

# ─────────────────────────────────────────────
# pages/templates/pages/files.html
# ─────────────────────────────────────────────
files["pages/templates/pages/files.html"] = r'''{% extends 'pages/base.html' %}
{% load static nimbus_tags %}

{% block title_extra %} — All Files{% endblock %}
{% block nav_files %}active{% endblock %}
{% block breadcrumb %}All Files{% endblock %}

{% block content %}
<h2 class="mb-xl" style="letter-spacing:-0.02em">All Files</h2>

<div class="card mb-2xl">
  <div class="card-header">
    <span class="card-title">Upload Files</span>
    <span class="card-subtitle">Drag & drop or click to browse</span>
  </div>
  <form method="post" enctype="multipart/form-data" id="upload-form" style="display:none">
    {% csrf_token %}
    <input type="file" name="file" id="file-upload-input" multiple>
  </form>
  <div class="dropzone" id="main-dropzone">
    <i data-lucide="upload-cloud" class="dropzone-icon"></i>
    <div class="dropzone-title">Drag files here to upload</div>
    <div class="dropzone-subtitle">or <span class="dropzone-link">browse your computer</span></div>
  </div>
  <div class="upload-progress-list"></div>
</div>

<div class="files-toolbar">
  <div class="files-toolbar-left">
    <button class="filter-btn active-filter" data-type="all">
      <i data-lucide="layers" style="width:14px;height:14px"></i> All
    </button>
    <button class="filter-btn" data-type="pdf">
      <i data-lucide="file-text" style="width:14px;height:14px"></i> PDF
    </button>
    <button class="filter-btn" data-type="image">
      <i data-lucide="image" style="width:14px;height:14px"></i> Image
    </button>
    <button class="filter-btn" data-type="archive">
      <i data-lucide="archive" style="width:14px;height:14px"></i> Archive
    </button>
    <button class="filter-btn" data-type="code">
      <i data-lucide="code-2" style="width:14px;height:14px"></i> Code
    </button>
    <button class="filter-btn" data-type="doc">
      <i data-lucide="file-text" style="width:14px;height:14px"></i> Doc
    </button>
  </div>
  <div class="files-toolbar-right">
    {% if files %}
    <button class="btn btn-ghost delete-all-btn" id="delete-all-btn">
      <i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete All
    </button>
    {% endif %}
    <div class="view-toggle">
      <button class="view-toggle-btn" data-view="grid">
        <i data-lucide="layout-grid" style="width:16px;height:16px"></i>
      </button>
      <button class="view-toggle-btn" data-view="list">
        <i data-lucide="list" style="width:16px;height:16px"></i>
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="delete-all-modal">
  <div class="modal-box">
    <div class="modal-icon-wrap">
      <i data-lucide="alert-triangle" class="nav-icon" style="width:24px;height:24px"></i>
    </div>
    <div class="modal-title">Delete all files?</div>
    <div class="modal-desc">This will permanently remove all your uploaded files and free up your entire storage quota. This action cannot be undone.</div>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
      <button class="btn btn-danger" id="modal-confirm-delete">
        <i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete All Files
      </button>
    </div>
  </div>
</div>

<div class="files-grid">
  {% for f in files %}
  <div class="file-card" data-type="{{ f.type_badge }}" data-name="{{ f.name }}" data-id="{{ f.id }}" style="cursor:pointer">
    <div class="file-card-actions">
      <button class="file-action-btn" data-preview title="Preview"><i data-lucide="eye" style="width:14px;height:14px"></i></button>
      <button class="file-action-btn {% if f.is_starred %}starred{% endif %}" data-star><i data-lucide="star" style="width:14px;height:14px"></i></button>
      <button class="file-action-btn danger" data-delete><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
    </div>
    <div class="file-card-icon icon-bg-{{ f.type_badge }}">
      <i data-lucide="{{ f.type_badge|file_icon }}" class="nav-icon" style="width:24px;height:24px"></i>
    </div>
    <div class="file-card-name">{{ f.name }}</div>
    <div class="badge badge-{{ f.type_badge }}">{{ f.type_badge|capfirst }}</div>
    <div class="file-card-meta">{{ f.size_display }}</div>
  </div>
  {% empty %}
  <div class="empty-state bento-span-full">
    <i data-lucide="cloud-upload" class="empty-state-icon"></i>
    <div class="empty-state-title">No files yet</div>
    <div class="empty-state-desc">Upload your first file using the dropzone above.</div>
  </div>
  {% endfor %}
</div>

<div class="files-list hidden">
  {% for f in files %}
  <div class="file-row" data-type="{{ f.type_badge }}" data-name="{{ f.name }}" data-id="{{ f.id }}" style="cursor:pointer">
    <div class="file-row-icon icon-bg-{{ f.type_badge }}">
      <i data-lucide="{{ f.type_badge|file_icon }}" class="nav-icon" style="width:18px;height:18px"></i>
    </div>
    <div class="file-row-name">{{ f.name }}</div>
    <div class="badge badge-{{ f.type_badge }}">{{ f.type_badge|capfirst }}</div>
    <div class="file-row-size">{{ f.size_display }}</div>
    <div class="file-row-actions">
      <button class="file-action-btn" data-preview title="Preview"><i data-lucide="eye" style="width:14px;height:14px"></i></button>
      <button class="file-action-btn {% if f.is_starred %}starred{% endif %}" data-star><i data-lucide="star" style="width:14px;height:14px"></i></button>
      <button class="file-action-btn danger" data-delete><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
    </div>
  </div>
  {% empty %}
  <div class="empty-state">
    <i data-lucide="cloud-upload" class="empty-state-icon"></i>
    <div class="empty-state-title">No files yet</div>
    <div class="empty-state-desc">Upload your first file using the dropzone above.</div>
  </div>
  {% endfor %}
</div>
{% endblock %}
'''

# ─────────────────────────────────────────────
# pages/templates/pages/profile.html
# ─────────────────────────────────────────────
files["pages/templates/pages/profile.html"] = r'''{% extends 'pages/base.html' %}
{% load static nimbus_tags %}

{% block title_extra %} — Profile{% endblock %}
{% block nav_profile %}active{% endblock %}
{% block breadcrumb %}Profile{% endblock %}

{% block header_search %}{% endblock %}

{% block content %}
<div class="profile-header mb-xl">
  <div class="profile-avatar">
    {{ user.username|make_first_char }}
  </div>
  <div>
    <div class="profile-name">{{ user.username }}</div>
    <div class="profile-email">{{ user.email|default:"No email set" }}</div>
  </div>
</div>

<div class="storage-meter mb-2xl">
  <div class="storage-meter-header">
    <span class="storage-meter-title">Storage Usage</span>
    <span class="storage-meter-value">{{ storage.percentage|floatformat:1 }}% — {{ storage.used_display }} / {{ storage.total_display }}</span>
  </div>
  <div class="storage-bar-track">
    <div class="storage-bar-fill" style="width: {{ storage.percentage }}%"></div>
  </div>
  <div class="storage-breakdown">
    {% for item in type_breakdown %}
    <div class="storage-breakdown-item">
      <div class="storage-breakdown-dot" style="background:var(--badge-{{ item.type }}-text, var(--c-muted))"></div>
      <div>
        <div class="storage-breakdown-label">{{ item.type|capfirst }}</div>
        <div class="storage-breakdown-size">{{ item.count }} files</div>
      </div>
    </div>
    {% endfor %}
  </div>
</div>

<div class="bento-grid mb-2xl">
  <div class="stat-card">
    <div class="stat-icon-wrap">
      <i data-lucide="files" class="nav-icon"></i>
    </div>
    <div>
      <div class="stat-value">{{ total_files }}</div>
      <div class="stat-label">Total Files</div>
    </div>
  </div>

  <div class="stat-card">
    <div class="stat-icon-wrap">
      <i data-lucide="hard-drive" class="nav-icon"></i>
    </div>
    <div>
      <div class="stat-value">{{ storage.total_display }}</div>
      <div class="stat-label">Total Capacity</div>
    </div>
  </div>

  <div class="stat-card">
    <div class="stat-icon-wrap">
      <i data-lucide="activity" class="nav-icon"></i>
    </div>
    <div>
      <div class="stat-value">{{ storage.percentage|floatformat:1 }}%</div>
      <div class="stat-label">Usage Percentage</div>
    </div>
  </div>
</div>

<div class="bento-grid">
  <div class="settings-card bento-span-2">
    <div class="settings-card-title">Account Details</div>
    <div class="settings-row">
      <div class="settings-row-label">Username</div>
      <div class="settings-row-value">{{ user.username }}</div>
    </div>
    <div class="settings-row">
      <div class="settings-row-label">Email</div>
      <div class="settings-row-value">{{ user.email|default:"—" }}</div>
    </div>
    <div class="settings-row">
      <div class="settings-row-label">Account Created</div>
      <div class="settings-row-value">{{ user.date_joined|date:"M d, Y" }}</div>
    </div>
    <div class="settings-row">
      <div class="settings-row-label">Last Login</div>
      <div class="settings-row-value">{{ user.last_login|date:"M d, Y"|default:"—" }}</div>
    </div>
  </div>

  <div class="settings-card">
    <div class="settings-card-title">Quick Links</div>
    <a href="{% url 'files' %}" class="avatar-dropdown-item" style="padding:var(--sp-md) var(--sp-lg);margin:2px 0;">
      <i data-lucide="folder" style="width:16px;height:16px"></i>
      All Files
    </a>
    <a href="{% url 'dashboard' %}" class="avatar-dropdown-item" style="padding:var(--sp-md) var(--sp-lg);margin:2px 0;">
      <i data-lucide="layout-dashboard" style="width:16px;height:16px"></i>
      Dashboard
    </a>
    <a href="{% url 'logout' %}" class="avatar-dropdown-item danger" style="padding:var(--sp-md) var(--sp-lg);margin:2px 0;">
      <i data-lucide="log-out" style="width:16px;height:16px"></i>
      Sign Out
    </a>
  </div>
</div>
{% endblock %}
'''

# ─────────────────────────────────────────────
# WRITE ALL FILES
# ─────────────────────────────────────────────
print("Writing Nimbus templates...")
for relpath, content in files.items():
    filepath = os.path.join(BASE, relpath.replace('/', os.sep))
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  OK: {relpath}")

print("\nAll templates written!")
