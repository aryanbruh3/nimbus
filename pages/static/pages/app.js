/* ═══════════════════════════════════════════════════════════════
   NIMBUS — Client-side Interactions
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Lucide Icon Init ── */
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  /* ── Avatar Dropdown ── */
  const avatarBtn = document.querySelector('.header-avatar-btn');
  const dropdown = document.querySelector('.avatar-dropdown');
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  /* ── Mobile Sidebar ── */
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('open');
    });
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('open');
      });
    }
  }

  /* ── View Toggle (Grid / List) ── */
  const gridBtn = document.querySelector('.view-toggle-btn[data-view="grid"]');
  const listBtn = document.querySelector('.view-toggle-btn[data-view="list"]');
  const gridView = document.querySelector('.files-grid');
  const listView = document.querySelector('.files-list');

  if (gridBtn && listBtn) {
    function setView(view) {
      if (view === 'grid') {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        if (gridView) gridView.classList.remove('hidden');
        if (listView) listView.classList.add('hidden');
      } else {
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        if (listView) listView.classList.remove('hidden');
        if (gridView) gridView.classList.add('hidden');
      }
      localStorage.setItem('nimbus-view', view);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    gridBtn.addEventListener('click', () => setView('grid'));
    listBtn.addEventListener('click', () => setView('list'));

    const saved = localStorage.getItem('nimbus-view') || 'grid';
    setView(saved);
  }

  /* ── File Type Filter ── */
  const filterBtns = document.querySelectorAll('.filter-btn[data-type]');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const fileCards = document.querySelectorAll('.file-card, .file-row');
      filterBtns.forEach(b => b.classList.remove('active-filter'));
      if (type === 'all') {
        fileCards.forEach(fc => fc.classList.remove('hidden'));
      } else {
        btn.classList.add('active-filter');
        fileCards.forEach(fc => {
          fc.classList.toggle('hidden', fc.dataset.type !== type);
        });
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  });

  /* ── Search ── */
  const searchInput = document.querySelector('.header-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.file-card, .file-row').forEach(fc => {
        const name = (fc.dataset.name || '').toLowerCase();
        fc.classList.toggle('hidden', q && !name.includes(q));
      });
    });
  }

  /* ── Drag-and-Drop Upload ── */
  const dropzone = document.querySelector('.dropzone');
  const fileInput = document.querySelector('#file-upload-input');
  const progressList = document.querySelector('.upload-progress-list');
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('.dropzone-link') || e.target === dropzone || e.target.closest('.dropzone-icon') || e.target.closest('.dropzone-title')) {
        fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(ev => {
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(ev => {
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      uploadFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      uploadFiles(e.target.files);
      fileInput.value = '';
    });
  }

  function uploadFiles(files) {
    const url = window.location.pathname;

    Array.from(files).forEach(file => {
      const item = document.createElement('div');
      item.className = 'upload-item';
      item.innerHTML = `
        <i data-lucide="file" class="nav-icon" style="width:16px;height:16px"></i>
        <span class="upload-item-name">${file.name}</span>
        <div class="upload-progress-track">
          <div class="upload-progress-fill"></div>
        </div>
        <span class="upload-item-percent">0%</span>
      `;
      if (progressList) progressList.appendChild(item);
      if (typeof lucide !== 'undefined') lucide.createIcons();

      const fill = item.querySelector('.upload-progress-fill');
      const percent = item.querySelector('.upload-item-percent');

      const formData = new FormData();
      formData.append('file', file);
      if (csrfToken) formData.append('csrfmiddlewaretoken', csrfToken.value);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round(e.loaded / e.total * 100);
          fill.style.width = pct + '%';
          percent.textContent = pct + '%';
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const resp = JSON.parse(xhr.responseText);
            if (resp.success) {
              item.classList.add('done');
              percent.textContent = '✓';
              showToast('success', `${resp.name} uploaded successfully`);
              addFileToView(resp);
            }
          } catch (_) {
            item.classList.add('done');
            percent.textContent = '✓';
            showToast('success', `${file.name} uploaded`);
          }
        } else if (xhr.status === 400) {
          try {
            const resp = JSON.parse(xhr.responseText);
            fill.style.width = '100%';
            fill.style.background = 'var(--c-red)';
            percent.textContent = '✗';
            item.classList.add('done');
            showToast('error', resp.error || `Upload rejected for ${file.name}`);
          } catch (_) {
            fill.style.background = 'var(--c-red)';
            showToast('error', `Upload rejected for ${file.name}`);
          }
          setTimeout(() => item.remove(), 3000);
        } else {
          fill.style.background = 'var(--c-red)';
          showToast('error', `Upload failed for ${file.name}`);
          item.remove();
        }
      });

      xhr.addEventListener('error', () => {
        showToast('error', `Upload failed for ${file.name}`);
        item.remove();
      });

      xhr.open('POST', url);
      xhr.send(formData);
    });
  }

  function addFileToView(data) {
    const typeClass = `badge-${data.type}`;
    const iconBg = `icon-bg-${data.type}`;

    if (gridView) {
      const card = document.createElement('div');
      card.className = 'file-card';
      card.dataset.type = data.type;
      card.dataset.name = data.name;
      card.dataset.id = data.file_id;
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="file-card-actions">
          <input type="checkbox" class="file-select-checkbox" data-id="${data.file_id}">
          <a href="/files/${data.file_id}/download/" class="file-action-btn" title="Download" download><i data-lucide="download" style="width:14px;height:14px"></i></a>
          <button class="file-action-btn" data-star><i data-lucide="star" style="width:14px;height:14px"></i></button>
          <button class="file-action-btn danger" data-delete><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </div>
        <div class="file-card-icon ${iconBg}">
          <i data-lucide="${getFileIcon(data.type)}" class="nav-icon" style="width:24px;height:24px"></i>
        </div>
        <div class="file-card-name">${data.name}</div>
        <div class="badge ${typeClass}">${data.type}</div>
        <div class="file-card-meta">${data.size}</div>
      `;
      gridView.prepend(card);
    }

    if (listView) {
      const row = document.createElement('div');
      row.className = 'file-row';
      row.dataset.type = data.type;
      row.dataset.name = data.name;
      row.dataset.id = data.file_id;
      row.style.cursor = 'pointer';
      row.innerHTML = `
        <input type="checkbox" class="file-select-checkbox" data-id="${data.file_id}">
        <div class="file-row-icon ${iconBg}">
          <i data-lucide="${getFileIcon(data.type)}" class="nav-icon" style="width:18px;height:18px"></i>
        </div>
        <div class="file-row-name">${data.name}</div>
        <div class="badge ${typeClass}">${data.type}</div>
        <div class="file-row-size">${data.size}</div>
        <div class="file-row-actions">
          <a href="/files/${data.file_id}/download/" class="file-action-btn" title="Download" download><i data-lucide="download" style="width:14px;height:14px"></i></a>
          <button class="file-action-btn" data-star><i data-lucide="star" style="width:14px;height:14px"></i></button>
          <button class="file-action-btn danger" data-delete><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </div>
      `;
      listView.prepend(row);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindFileActions();
    bindCheckboxes();
  }

  function getFileIcon(type) {
    const map = {
      'pdf': 'file-text', 'image': 'image', 'archive': 'archive',
      'code': 'code-2', 'doc': 'file-text', 'video': 'film',
      'audio': 'music', 'other': 'file'
    };
    return map[type] || 'file';
  }

  /* ── Star / Delete Single File Actions ── */
  bindFileActions();

  function bindFileActions() {
    // Star
    document.querySelectorAll('[data-star]').forEach(btn => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.file-card, .file-row');
        const fileId = card ? card.dataset.id : null;
        if (!fileId) return;

        fetch(`/files/star/${fileId}/`, {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrfToken ? csrfToken.value : '',
            'Content-Type': 'application/json',
          },
        })
        .then(r => r.json())
        .then(data => {
          if (data.starred) {
            btn.classList.add('starred');
            showToast('success', 'File starred');
          } else {
            btn.classList.remove('starred');
            showToast('success', 'Star removed');
          }
        });
      });
    });

    // Delete single — show confirmation modal
    document.querySelectorAll('[data-delete]').forEach(btn => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.file-card, .file-row');
        const fileId = card ? card.dataset.id : null;
        const fileName = card ? card.dataset.name : 'this file';
        if (!fileId) return;

        // Show single delete modal
        const modal = document.querySelector('#delete-single-modal');
        const nameEl = document.querySelector('#delete-single-name');
        const confirmBtn = document.querySelector('#delete-single-confirm');
        const cancelBtn = document.querySelector('#delete-single-cancel');

        if (nameEl) nameEl.textContent = `"${fileName}" will be permanently deleted. This action cannot be undone.`;
        if (modal) modal.classList.add('open');

        // One-time confirm handler
        const handleConfirm = () => {
          fetch(`/files/delete/${fileId}/`, {
            method: 'POST',
            headers: {
              'X-CSRFToken': csrfToken ? csrfToken.value : '',
              'Content-Type': 'application/json',
            },
          })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              if (card) card.remove();
              showToast('success', `"${fileName}" deleted`);
            }
          });
          if (modal) modal.classList.remove('open');
          confirmBtn.removeEventListener('click', handleConfirm);
        };

        const handleCancel = () => {
          if (modal) modal.classList.remove('open');
          cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
      });
    });
  }


  /* ═══════════════════════════════════════════════════════════════
     CHECKBOX SELECTION & BULK DELETE
     ═══════════════════════════════════════════════════════════════ */

  const selectAllCheckbox = document.querySelector('#select-all-checkbox');
  const bulkDeleteBtn = document.querySelector('#bulk-delete-btn');
  const selectedCountEl = document.querySelector('#selected-count');

  function getSelectedIds() {
    const checked = document.querySelectorAll('.file-select-checkbox:checked');
    return Array.from(checked).map(cb => cb.dataset.id);
  }

  function updateBulkDeleteUI() {
    const ids = getSelectedIds();
    if (bulkDeleteBtn) {
      bulkDeleteBtn.style.display = ids.length > 0 ? 'inline-flex' : 'none';
    }
    if (selectedCountEl) {
      selectedCountEl.textContent = ids.length;
    }
    // Update select-all checkbox state
    if (selectAllCheckbox) {
      const allCheckboxes = document.querySelectorAll('.file-select-checkbox');
      selectAllCheckbox.checked = allCheckboxes.length > 0 && ids.length === allCheckboxes.length;
      selectAllCheckbox.indeterminate = ids.length > 0 && ids.length < allCheckboxes.length;
    }
  }

  function bindCheckboxes() {
    document.querySelectorAll('.file-select-checkbox').forEach(cb => {
      if (cb._bound) return;
      cb._bound = true;
      cb.addEventListener('change', () => {
        updateBulkDeleteUI();
      });
    });
  }

  // Select All checkbox
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => {
      const isChecked = selectAllCheckbox.checked;
      document.querySelectorAll('.file-select-checkbox').forEach(cb => {
        cb.checked = isChecked;
      });
      updateBulkDeleteUI();
    });
  }

  // Bulk Delete button — show modal
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', () => {
      const ids = getSelectedIds();
      const modal = document.querySelector('#delete-selected-modal');
      const desc = document.querySelector('#delete-selected-desc');
      if (desc) desc.textContent = `${ids.length} file(s) will be permanently deleted. This action cannot be undone.`;
      if (modal) modal.classList.add('open');
    });
  }

  // Bulk Delete — confirm
  const deleteSelectedConfirm = document.querySelector('#delete-selected-confirm');
  const deleteSelectedCancel = document.querySelector('#delete-selected-cancel');
  const deleteSelectedModal = document.querySelector('#delete-selected-modal');

  if (deleteSelectedConfirm) {
    deleteSelectedConfirm.addEventListener('click', () => {
      const ids = getSelectedIds();
      if (ids.length === 0) return;

      deleteSelectedConfirm.innerHTML = '<span style="opacity:0.6">Deleting...</span>';
      deleteSelectedConfirm.disabled = true;

      // Delete each selected file
      const promises = ids.map(fileId => {
        return fetch(`/files/delete/${fileId}/`, {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrfToken ? csrfToken.value : '',
            'Content-Type': 'application/json',
          },
        }).then(r => r.json());
      });

      Promise.all(promises)
        .then(() => {
          // Remove cards from DOM
          ids.forEach(fileId => {
            const card = document.querySelector(`.file-card[data-id="${fileId}"], .file-row[data-id="${fileId}"]`);
            if (card) card.remove();
          });

          if (deleteSelectedModal) deleteSelectedModal.classList.remove('open');
          deleteSelectedConfirm.innerHTML = '<i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete Selected';
          deleteSelectedConfirm.disabled = false;
          if (selectAllCheckbox) selectAllCheckbox.checked = false;
          updateBulkDeleteUI();
          showToast('success', `${ids.length} file(s) deleted`);
        });
    });
  }

  if (deleteSelectedCancel) {
    deleteSelectedCancel.addEventListener('click', () => {
      if (deleteSelectedModal) deleteSelectedModal.classList.remove('open');
    });
  }

  if (deleteSelectedModal) {
    deleteSelectedModal.addEventListener('click', (e) => {
      if (e.target === deleteSelectedModal) deleteSelectedModal.classList.remove('open');
    });
  }

  // Initial bind
  bindCheckboxes();


  /* ═══════════════════════════════════════════════════════════════
     DELETE ALL MODAL
     ═══════════════════════════════════════════════════════════════ */

  const deleteAllBtn = document.querySelector('#delete-all-btn');
  const deleteAllModal = document.querySelector('#delete-all-modal');
  const modalCancel = document.querySelector('#modal-cancel');
  const modalConfirmDelete = document.querySelector('#modal-confirm-delete');

  if (deleteAllBtn && deleteAllModal) {
    deleteAllBtn.addEventListener('click', () => {
      deleteAllModal.classList.add('open');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    if (modalCancel) {
      modalCancel.addEventListener('click', () => {
        deleteAllModal.classList.remove('open');
      });
    }

    deleteAllModal.addEventListener('click', (e) => {
      if (e.target === deleteAllModal) deleteAllModal.classList.remove('open');
    });

    if (modalConfirmDelete) {
      modalConfirmDelete.addEventListener('click', () => {
        modalConfirmDelete.innerHTML = '<span style="opacity:0.6">Deleting...</span>';
        modalConfirmDelete.disabled = true;

        fetch('/files/delete-all/', {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrfToken ? csrfToken.value : '',
            'Content-Type': 'application/json',
          },
        })
        .then(r => r.json())
        .then(data => {
          deleteAllModal.classList.remove('open');
          modalConfirmDelete.innerHTML = '<i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete All Files';
          modalConfirmDelete.disabled = false;

          if (data.success) {
            if (gridView) {
              gridView.querySelectorAll('.file-card').forEach(c => c.remove());
              if (gridView.querySelectorAll('.file-card').length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-state bento-span-full';
                empty.innerHTML = `
                  <i data-lucide="cloud-upload" class="empty-state-icon"></i>
                  <div class="empty-state-title">No files yet</div>
                  <div class="empty-state-desc">Upload your first file using the dropzone above.</div>
                `;
                gridView.appendChild(empty);
                if (typeof lucide !== 'undefined') lucide.createIcons();
              }
            }
            if (listView) {
              listView.querySelectorAll('.file-row').forEach(r => r.remove());
              if (listView.querySelectorAll('.file-row').length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.innerHTML = `
                  <i data-lucide="cloud-upload" class="empty-state-icon"></i>
                  <div class="empty-state-title">No files yet</div>
                  <div class="empty-state-desc">Upload your first file using the dropzone above.</div>
                `;
                listView.appendChild(empty);
                if (typeof lucide !== 'undefined') lucide.createIcons();
              }
            }

            if (deleteAllBtn) deleteAllBtn.remove();
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
            updateBulkDeleteUI();
            showToast('success', `All ${data.deleted_count} files deleted. Storage freed.`);
          } else {
            showToast('error', data.error || 'Delete failed');
          }
        })
        .catch(() => {
          deleteAllModal.classList.remove('open');
          showToast('error', 'Something went wrong');
        });
      });
    }
  }


  /* ═══════════════════════════════════════════════════════════════
     TOAST SYSTEM
     ═══════════════════════════════════════════════════════════════ */

  window.showToast = function(type, message) {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconName = type === 'success' ? 'check-circle' : 'x-circle';
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="toast-icon" style="width:16px;height:16px"></i>
      <span class="toast-message">${message}</span>
      <span class="toast-dismiss"><i data-lucide="x" style="width:14px;height:14px"></i></span>
    `;
    container.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const dismissBtn = toast.querySelector('.toast-dismiss');
    dismissBtn.addEventListener('click', () => removeToast(toast));

    setTimeout(() => removeToast(toast), 4000);
  };

  function removeToast(toast) {
    toast.style.animation = `toastOut 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards`;
    setTimeout(() => toast.remove(), 300);
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });
});
