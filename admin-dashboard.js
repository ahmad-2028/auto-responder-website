const API_URL = '';

document.addEventListener('DOMContentLoaded', () => {
    const adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
        window.location.href = 'admin-login.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = 'admin-login.html';
    });

    refreshBtn.addEventListener('click', () => {
        loadStats();
    });

    loadStats();
});

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/api/admin/stats`);
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

function populateEmailsTable(emails) {
    const tbody = document.getElementById('emailsTableBody');

    if (emails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No messages yet</td></tr>';
        return;
    }

    tbody.innerHTML = emails.map(email => {
        const date = new Date(email.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${escapeHtml(email.name)}</td>
                <td>${escapeHtml(email.email)}</td>
                <td>${escapeHtml(email.subject)}</td>
                <td>${escapeHtml(email.message.substring(0, 100))}${email.message.length > 100 ? '...' : ''}</td>
            </tr>
        `;
    }).join('');
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
