require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, 'data');
const DOWNLOADS_FILE = path.join(DATA_DIR, 'downloads.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');

// Admin credentials come ONLY from environment variables (or .env locally).
// They are never hardcoded so they stay out of the public repo.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
};

const YOUR_EMAIL = process.env.YOUR_EMAIL || 'your-email@gmail.com';

async function initDataFiles() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });

        try {
            await fs.access(DOWNLOADS_FILE);
        } catch {
            await fs.writeFile(DOWNLOADS_FILE, JSON.stringify([]));
        }

        try {
            await fs.access(EMAILS_FILE);
        } catch {
            await fs.writeFile(EMAILS_FILE, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Error initializing data files:', error);
    }
}

async function readData(file) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
}

async function writeData(file, data) {
    try {
        await fs.writeFile(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data:', error);
    }
}

app.post('/api/download', async (req, res) => {
    try {
        const downloads = await readData(DOWNLOADS_FILE);
        const newDownload = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
        };

        downloads.push(newDownload);
        await writeData(DOWNLOADS_FILE, downloads);

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

        const emails = await readData(EMAILS_FILE);
        const newEmail = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            name,
            email,
            subject,
            message
        };

        emails.push(newEmail);
        await writeData(EMAILS_FILE, emails);

        try {
            const transporter = nodemailer.createTransport(EMAIL_CONFIG);

            await transporter.sendMail({
                from: EMAIL_CONFIG.auth.user,
                to: YOUR_EMAIL,
                subject: `[Auto Responder Support] ${subject}`,
                html: `
                    <h2>New Support Message</h2>
                    <p><strong>From:</strong> ${name} (${email})</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                    <hr>
                    <p><small>Sent via Auto Responder website</small></p>
                `
            });

            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Error sending email:', emailError);
        }

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({
            success: true,
            message: 'Login successful',
            token: 'admin-token-' + Date.now()
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const downloads = await readData(DOWNLOADS_FILE);
        const emails = await readData(EMAILS_FILE);

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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

initDataFiles().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin username: ${ADMIN_USERNAME}`);
        console.log(`Admin password: ${ADMIN_PASSWORD}`);
    });
});
