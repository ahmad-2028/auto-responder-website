require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection pool. Only used when DATABASE_URL is set
// (e.g. on Render). Without it, the app falls back to JSON files in data/.
// Strip any ?sslmode=... query param — SSL is handled by the `ssl` option
// below, and pg warns that sslmode 'require' is treated as 'verify-full'.
const dbUrl = process.env.DATABASE_URL;
const pool = dbUrl
    ? new Pool({
          connectionString: dbUrl.split('?')[0],
          ssl: /localhost|127\.0\.0\.1/.test(dbUrl)
              ? false
              : { rejectUnauthorized: false }
      })
    : null;

app.use(express.json());

// Never serve the runtime data folder (downloads/emails JSON) over HTTP
app.use('/data', (req, res) => res.status(404).end());

// maxAge: 0 keeps the browser from serving stale JS/CSS/HTML after a deploy
app.use(express.static(__dirname, { maxAge: 0 }));

// In-memory admin session tokens (reset when the server restarts)
const adminTokens = new Set();

function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token && adminTokens.has(token)) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

// Simple brute-force guard for the login endpoint (10 tries per 15 min)
const loginAttempts = new Map();
function isLoginBlocked(ip) {
    const now = Date.now();
    const rec = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    if (now > rec.resetAt) {
        rec.count = 0;
        rec.resetAt = now + 15 * 60 * 1000;
    }
    rec.count++;
    loginAttempts.set(ip, rec);
    return rec.count > 10;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function sendEmailNotification({ name, email, subject, message }) {
    // Bounded timeouts so a slow/broken SMTP server can never hang the request.
    const transporter = nodemailer.createTransport({
        ...EMAIL_CONFIG,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });

    await transporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: YOUR_EMAIL,
        subject: `[Auto Responder Support] ${subject}`,
        html: `
            <h2>New Support Message</h2>
            <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Sent via Auto Responder website</small></p>
        `
    });
    console.log('Email sent successfully');
}

const DATA_DIR = path.join(__dirname, 'data');
const dataFile = (key) => path.join(DATA_DIR, key + '.json');

// Admin credentials come ONLY from environment variables (or .env locally).
// They are never hardcoded so they stay out of the public repo.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: SMTP_PORT,
    // Port 465 uses implicit TLS; 587 uses STARTTLS. Allow an explicit override.
    secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === 'true'
        : SMTP_PORT === 465,
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
    }
};

const YOUR_EMAIL = process.env.YOUR_EMAIL || process.env.EMAIL_USER || '';

// Email notification only runs when a REAL sender account is configured
// (placeholder values from .env.example are treated as not configured).
const emailConfigured = Boolean(
    EMAIL_CONFIG.auth.user &&
    EMAIL_CONFIG.auth.pass &&
    YOUR_EMAIL &&
    EMAIL_CONFIG.auth.user !== 'your-email@gmail.com' &&
    EMAIL_CONFIG.auth.pass !== 'your-app-password'
);

// Storage backend: PostgreSQL (when DATABASE_URL is set) or JSON files.
async function initStorage() {
    if (pool) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS app_data (
                    key   TEXT PRIMARY KEY,
                    value JSONB NOT NULL
                )
            `);
            console.log('Database storage ready (PostgreSQL)');
        } catch (error) {
            console.error('Error initializing database:', error);
        }
        return;
    }

    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        // Only create files if missing — never wipe existing data on restart.
        for (const key of ['downloads', 'emails']) {
            try {
                await fs.access(dataFile(key));
            } catch {
                await fs.writeFile(dataFile(key), JSON.stringify([]));
            }
        }
        console.log('File storage ready (data/ folder)');
    } catch (error) {
        console.error('Error initializing data files:', error);
    }
}

async function readData(key) {
    if (pool) {
        try {
            const { rows } = await pool.query('SELECT value FROM app_data WHERE key = $1', [key]);
            return rows.length ? rows[0].value : [];
        } catch (error) {
            console.error('Error reading from database:', error);
            return [];
        }
    }

    try {
        const data = await fs.readFile(dataFile(key), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
}

async function writeData(key, data) {
    if (pool) {
        try {
            await pool.query(
                `INSERT INTO app_data (key, value) VALUES ($1, $2)
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
                [key, JSON.stringify(data)]
            );
            return;
        } catch (error) {
            console.error('Error writing to database:', error);
            return;
        }
    }

    try {
        await fs.writeFile(dataFile(key), JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data:', error);
    }
}

app.post('/api/download', async (req, res) => {
    try {
        const downloads = await readData('downloads');
        const newDownload = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
        };

        downloads.push(newDownload);
        await writeData('downloads', downloads);

        res.json({ success: true, message: 'Download tracked successfully' });
    } catch (error) {
        console.error('Error tracking download:', error);
        res.status(500).json({ success: false, message: 'Failed to track download' });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const emails = await readData('emails');
        const newEmail = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            name,
            email,
            subject,
            message,
            status: 'pending'
        };

        emails.push(newEmail);
        await writeData('emails', emails);

        // Respond immediately so the form always clears — never wait on SMTP.
        res.json({ success: true, message: 'Message sent successfully' });

        // Email notification fires in the background and never blocks the response.
        if (emailConfigured) {
            sendEmailNotification({ name, email, subject, message })
                .catch(err => console.error('Error sending email:', err));
        } else {
            console.warn('SMTP not configured — skipping email notification. Set EMAIL_USER, EMAIL_PASS and YOUR_EMAIL.');
        }
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (isLoginBlocked(ip)) {
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Try again in 15 minutes.'
        });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        adminTokens.add(token);
        loginAttempts.delete(ip);
        res.json({
            success: true,
            message: 'Login successful',
            token
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

app.post('/api/admin/logout', (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token) adminTokens.delete(token);
    res.json({ success: true });
});

app.get('/api/admin/stats', requireAuth, async (req, res) => {
    try {
        const downloads = await readData('downloads');
        const emails = await readData('emails');

        res.json({
            success: true,
            data: {
                totalDownloads: downloads.length,
                totalEmails: emails.length,
                downloads: downloads.reverse().slice(0, 50),
                emails: emails.reverse().slice(0, 50)
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

// Update a support message status (pending / working / solved)
app.patch('/api/admin/email/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'working', 'solved'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const emails = await readData('emails');
        const email = emails.find(e => e.id === req.params.id);
        if (!email) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        email.status = status;
        await writeData('emails', emails);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// Delete a support message
app.delete('/api/admin/email/:id', requireAuth, async (req, res) => {
    try {
        const emails = await readData('emails');
        const filtered = emails.filter(e => e.id !== req.params.id);
        if (filtered.length === emails.length) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await writeData('emails', filtered);
        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok' });
});

// Diagnostic: reports whether email is configured and where it is sent to.
// Does NOT expose the SMTP password. Used to verify Render env vars.
app.get('/api/admin/email-config', requireAuth, (req, res) => {
    res.json({
        success: true,
        configured: emailConfigured,
        smtpHost: EMAIL_CONFIG.host,
        smtpPort: EMAIL_CONFIG.port,
        sender: EMAIL_CONFIG.auth.user,
        recipient: YOUR_EMAIL
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

initStorage().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin username: ${ADMIN_USERNAME}`);
        console.log(`Admin password: ${ADMIN_PASSWORD}`);
        if (process.env.SELF_URL) {
            console.log(`Keep-alive enabled for ${process.env.SELF_URL}`);
        }
    });
});

// Keep the free Render instance awake: ping our own public URL every 10 min.
// Free-tier services spin down after ~15 min without traffic.
if (process.env.SELF_URL) {
    const pingSelf = () => {
        fetch(process.env.SELF_URL + '/api/health').catch(() => {});
    };
    setInterval(pingSelf, 10 * 60 * 1000);
}
