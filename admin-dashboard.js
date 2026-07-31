const API_URL = '';

let adminToken = '';

document.addEventListener('DOMContentLoaded', () => {
    adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
        window.location.href = '/admin-login';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch(`${API_URL}/api/admin/logout`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + adminToken }
            });
        } catch (e) { /* ignore network errors */ }
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login';
    });

    refreshBtn.addEventListener('click', () => {
        loadStats();
    });

    // Full message modal
    const messageModal = document.getElementById('messageModal');
    const modalClose = document.getElementById('modalClose');
    const emailsTableBody = document.getElementById('emailsTableBody');

    modalClose.addEventListener('click', closeMessageModal);
    messageModal.addEventListener('click', (e) => {
        if (e.target === messageModal) closeMessageModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMessageModal();
    });

    emailsTableBody.addEventListener('click', async (e) => {
        const viewBtn = e.target.closest('.view-msg-btn');
        if (viewBtn) {
            const email = emailsById[viewBtn.dataset.id];
            if (email) openMessageModal(email);
            return;
        }

        const deleteBtn = e.target.closest('.delete-msg-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (!confirm('Delete this message permanently?')) return;
            await deleteMessage(id);
        }
    });

    emailsTableBody.addEventListener('change', async (e) => {
        const select = e.target.closest('.status-select');
        if (!select) return;
        updateStatusSelectClass(select, select.value);
        await updateStatus(select.dataset.id, select.value, select);
    });

    loadStats();
});

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': 'Bearer ' + adminToken }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login';
            return;
        }

        const result = await response.json();

        if (result.success) {
            const { totalDownloads, totalEmails, downloads, emails } = result.data;

            const downloadsEl = document.getElementById('totalDownloads');
            const emailsEl = document.getElementById('totalEmails');

            downloadsEl.dataset.target = totalDownloads;
            emailsEl.dataset.target = totalEmails;

            if (typeof window.animateCountUp === 'function') {
                window.animateCountUp(downloadsEl, totalDownloads);
                window.animateCountUp(emailsEl, totalEmails);
            } else {
                downloadsEl.textContent = totalDownloads.toLocaleString();
                emailsEl.textContent = totalEmails.toLocaleString();
            }

            populateEmailsTable(emails);
            populateDownloadsTable(downloads);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

let emailsById = {};

function populateEmailsTable(emails) {
    const tbody = document.getElementById('emailsTableBody');
    emailsById = {};

    if (emails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No messages yet</td></tr>';
        return;
    }

    emails.forEach(email => { emailsById[email.id] = email; });

    tbody.innerHTML = emails.map(email => {
        const date = new Date(email.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const status = email.status || 'pending';

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${escapeHtml(email.name)}</td>
                <td>${escapeHtml(email.email)}</td>
                <td>${escapeHtml(email.subject)}</td>
                <td class="msg-preview">${escapeHtml(email.message.substring(0, 80))}${email.message.length > 80 ? '...' : ''}</td>
                <td>
                    <select class="status-select status-${status}" data-id="${escapeHtml(email.id)}" title="Change status">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="working" ${status === 'working' ? 'selected' : ''}>Working</option>
                        <option value="solved" ${status === 'solved' ? 'selected' : ''}>Solved</option>
                    </select>
                </td>
                <td class="action-cell">
                    <button class="btn btn-secondary btn-small view-msg-btn" data-id="${escapeHtml(email.id)}">View</button>
                    <button class="btn btn-danger btn-small delete-msg-btn" data-id="${escapeHtml(email.id)}">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateStatus(id, status, select) {
    try {
        const response = await fetch(`${API_URL}/api/admin/email/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminToken
            },
            body: JSON.stringify({ status })
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login';
            return;
        }

        const result = await response.json();
        if (!result.success) {
            updateStatusSelectClass(select, emailsById[id] ? (emailsById[id].status || 'pending') : 'pending');
            alert(result.message || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        updateStatusSelectClass(select, emailsById[id] ? (emailsById[id].status || 'pending') : 'pending');
        alert('Failed to update status');
    }
}

async function deleteMessage(id) {
    try {
        const response = await fetch(`${API_URL}/api/admin/email/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + adminToken }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login';
            return;
        }

        const result = await response.json();
        if (result.success) {
            loadStats();
        } else {
            alert(result.message || 'Failed to delete message');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
    }
}

function updateStatusSelectClass(select, status) {
    select.classList.remove('status-pending', 'status-working', 'status-solved');
    select.classList.add('status-' + status);
}

function openMessageModal(email) {
    document.getElementById('modalSubject').textContent = email.subject || '(no subject)';
    document.getElementById('modalName').textContent = email.name;
    document.getElementById('modalEmail').textContent = email.email;
    const date = new Date(email.timestamp);
    document.getElementById('modalDate').textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    document.getElementById('modalStatus').textContent = (email.status || 'pending');
    document.getElementById('modalMessage').textContent = email.message;
    messageModal.style.display = 'flex';
}

function closeMessageModal() {
    messageModal.style.display = 'none';
}

function populateDownloadsTable(downloads) {
    const tbody = document.getElementById('downloadsTableBody');

    if (downloads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-data">No downloads yet</td></tr>';
        return;
    }

    tbody.innerHTML = downloads.map(download => {
        const date = new Date(download.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${escapeHtml(download.userAgent.substring(0, 60))}${download.userAgent.length > 60 ? '...' : ''}</td>
                <td>${escapeHtml(download.ipAddress)}</td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
