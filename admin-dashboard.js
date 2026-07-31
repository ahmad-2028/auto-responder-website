const API_URL = '';

let adminToken = '';

document.addEventListener('DOMContentLoaded', () => {
    adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
        window.location.href = 'admin-login.html';
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
        window.location.href = 'admin-login.html';
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

    emailsTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-msg-btn');
        if (!btn) return;
        const email = emailsById[btn.dataset.id];
        if (email) openMessageModal(email);
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
            window.location.href = 'admin-login.html';
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
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No messages yet</td></tr>';
        return;
    }

    emails.forEach(email => { emailsById[email.id] = email; });

    tbody.innerHTML = emails.map(email => {
        const date = new Date(email.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${escapeHtml(email.name)}</td>
                <td>${escapeHtml(email.email)}</td>
                <td>${escapeHtml(email.subject)}</td>
                <td class="msg-preview">${escapeHtml(email.message.substring(0, 80))}${email.message.length > 80 ? '...' : ''}</td>
                <td><button class="btn btn-secondary btn-small view-msg-btn" data-id="${escapeHtml(email.id)}">View</button></td>
            </tr>
        `;
    }).join('');
}

function openMessageModal(email) {
    document.getElementById('modalSubject').textContent = email.subject || '(no subject)';
    document.getElementById('modalName').textContent = email.name;
    document.getElementById('modalEmail').textContent = email.email;
    const date = new Date(email.timestamp);
    document.getElementById('modalDate').textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
