# Auto Responder Website

A modern, professional website for the Auto Responder Android app with download tracking, contact form, and admin dashboard.

## Features

- **Landing Page**: Beautiful hero section showcasing the app with call-to-action buttons
- **Download Tracking**: Tracks every download button click with timestamp, user agent, and IP address
- **Contact Form**: Users can send support messages directly via email without login
- **Admin Dashboard**: View total downloads, total emails, and detailed analytics
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Blue Theme**: Professional blue color scheme matching your app

## Project Structure

```
auto-responder-website/
├── index.html              # Landing page
├── contact.html            # Contact support page
├── admin-login.html        # Admin login page
├── admin-dashboard.html    # Admin dashboard
├── styles.css              # All styling
├── script.js               # Landing page scripts
├── contact.js              # Contact form functionality
├── admin-login.js          # Admin login logic
├── admin-dashboard.js      # Dashboard functionality
├── animations.css          # All animation styles
├── animations.js           # Animation scripts
├── server.js               # Node.js backend server
├── package.json            # Node dependencies
├── .env.example            # Environment variables template
├── data/                   # Auto-generated data storage
│   ├── downloads.json      # Download tracking data
│   └── emails.json         # Contact form submissions
└── README.md               # This file
```

## Setup Instructions

### 1. Install Node.js

Make sure you have Node.js installed on your system. Download it from [nodejs.org](https://nodejs.org/)

### 2. Install Dependencies

Open terminal in the project folder and run:

```bash
cd auto-responder-website
npm install
```

### 3. Configure Email (Optional)

To enable email notifications when users submit the contact form:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your email settings:
   ```
   PORT=3000
   
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password-here
   
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   
   YOUR_EMAIL=your-email@gmail.com
   ```

**For Gmail:**
- Enable 2-factor authentication on your Google account
- Generate an App Password: Google Account → Security → 2-Step Verification → App Passwords
- Use the 16-character app password as `EMAIL_PASS`

### 4. Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Usage

### Accessing the Website

- **Landing Page**: http://localhost:3000/index.html
- **Contact Support**: http://localhost:3000/contact.html
- **Admin Login**: http://localhost:3000/admin-login.html

### Admin Login

Default credentials (change these in `.env`):
- Username: `admin`
- Password: `admin123`

### Admin Dashboard Features

- **Total Downloads**: Shows total number of download button clicks
- **Total Emails**: Shows total number of support messages received
- **Recent Support Messages**: Table showing all contact form submissions
- **Download History**: Table showing all download clicks with details

## Adding Your Android APK

To make the download buttons actually download your APK:

1. Place your APK file in the project folder (e.g., `auto-responder.apk`)
2. Edit `script.js` and update the download button functionality:

```javascript
button.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Track the download
    await fetch('http://localhost:3000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    // Start the download
    window.location.href = '/auto-responder.apk';
});
```

3. Update `server.js` to serve the APK file:

```javascript
app.get('/auto-responder.apk', (req, res) => {
    res.download(path.join(__dirname, 'auto-responder.apk'));
});
```

## Deployment

### Deploy to a VPS or Cloud Server

1. Upload all files to your server
2. Install Node.js on the server
3. Run `npm install` on the server
4. Configure `.env` with production settings
5. Use PM2 to keep the server running:

```bash
npm install -g pm2
pm2 start server.js --name auto-responder
pm2 save
pm2 startup
```

6. Set up Nginx as a reverse proxy (optional but recommended)

### Deploy to Vercel/Netlify (Static + Serverless)

For serverless deployment, you'll need to convert the Express routes to serverless functions. This requires additional configuration specific to your platform.

## Customization

### Change Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-blue: #2563eb;        /* Main blue color */
    --primary-blue-dark: #1d4ed8;   /* Darker blue */
    --primary-blue-light: #3b82f6;  /* Lighter blue */
}
```

### Update App Name

Search and replace "Auto Responder" with your preferred name across all HTML files.

### Add More Features

Edit the features section in `index.html` to highlight your app's unique capabilities.

## Security Recommendations

1. **Change admin password** in `.env` before deploying
2. **Use HTTPS** in production (get free SSL from Let's Encrypt)
3. **Add rate limiting** to prevent spam (use `express-rate-limit`)
4. **Implement proper authentication** with JWT tokens for production
5. **Validate all inputs** on both client and server side
6. **Keep dependencies updated**: run `npm update` regularly

## Troubleshooting

### Email not sending

- Check your SMTP credentials in `.env`
- For Gmail, make sure you're using an App Password, not your regular password
- Check if your hosting provider blocks SMTP ports

### Admin dashboard not loading data

- Make sure the server is running
- Check browser console for errors
- Verify the API URLs match your server address

### Downloads not tracking

- Check if the `data` folder is created
- Ensure the server has write permissions
- Check browser console for API errors

## Support

For issues or questions, please contact the developer.

## License

This project is for personal/commercial use for the Auto Responder app.

---

**Built with:** HTML, CSS, JavaScript, Node.js, Express, Nodemailer
