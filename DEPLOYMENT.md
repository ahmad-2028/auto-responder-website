# Auto Responder Website - Deployment Guide

## 🚀 Netlify এ Host করার সম্পূর্ণ গাইড

আপনার website টি দুটি অংশে আছে:
1. **Frontend** (HTML, CSS, JS) → Netlify এ host হবে
2. **Backend** (Node.js server) → Render.com এ host হবে (free)

---

## Step 1: Backend Setup (Render.com - Free)

### 1.1 GitHub এ Project Upload করুন

```bash
cd auto-responder-website
git init
git add .
git commit -m "Initial commit"
```

GitHub এ একটা new repository বানান এবং push করুন:
```bash
git remote add origin https://github.com/YOUR-USERNAME/auto-responder-website.git
git push -u origin main
```

### 1.2 Render.com এ Deploy করুন

1. **https://render.com** এ যান
2. **Sign up** করুন GitHub দিয়ে
3. **Dashboard → New → Web Service** ক্লিক করুন
4. আপনার **auto-responder-website** repository select করুন
5. Settings fill করুন:
   - **Name:** `auto-responder-backend` (যেকোনো নাম)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

6. **Environment Variables** add করুন:
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=YourSecurePassword123
   
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   
   YOUR_EMAIL=your-email@gmail.com
   ```

7. **Create Web Service** button এ click করুন

8. Deploy শেষ হলে আপনি একটা URL পাবেন:
   ```
   https://auto-responder-backend.onrender.com
   ```
   **এই URL টা copy করে রাখুন!**

---

## Step 2: Frontend Files Update

এখন frontend files এ backend URL add করতে হবে।

### 2.1 সব JS files এ API_URL update করুন

**আপনার Render URL দিয়ে replace করুন:**

নিচের files এ প্রথম line এ এই code আছে:
```javascript
const API_URL = 'https://your-backend-url.onrender.com';
```

এটা change করে আপনার actual URL দিন:
```javascript
const API_URL = 'https://auto-responder-backend.onrender.com';
```

**যে files গুলো update করতে হবে:**
- `admin-login.js`
- `admin-dashboard.js`
- `script.js`
- `contact.js`

---

## Step 3: Netlify এ Deploy করুন

### Option A: Drag & Drop (সবচেয়ে সহজ)

1. **https://netlify.com** এ যান এবং sign up করুন
2. **Sites** page এ যান
3. এই files গুলো একটা folder এ রাখুন:
   ```
   ✓ index.html
   ✓ contact.html
   ✓ admin-login.html
   ✓ admin-dashboard.html
   ✓ styles.css
   ✓ animations.css
   ✓ animations.js
   ✓ script.js
   ✓ contact.js
   ✓ admin-login.js
   ✓ admin-dashboard.js
   ```
   
   **⚠️ এগুলো রাখবেন না:**
   - ❌ server.js
   - ❌ package.json
   - ❌ node_modules
   - ❌ .env

4. Folder টা drag করে Netlify এর **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"** box এ drop করুন

5. Deploy শেষ হলে আপনার site live হয়ে যাবে!

### Option B: GitHub থেকে Deploy

1. Netlify dashboard এ **Add new site → Import an existing project**
2. GitHub select করুন
3. Repository select করুন
4. Settings:
   - **Build command:** (leave empty)
   - **Publish directory:** `./` 
5. **Deploy site** click করুন

---

## Step 4: Testing

1. আপনার Netlify site open করুন
2. **Admin** link এ click করুন
3. Login credentials দিন:
   - Username: `admin`
   - Password: (যেটা Render এ set করেছেন)

---

## 📧 Gmail Setup (Email পাঠানোর জন্য)

1. **Google Account** এ যান: https://myaccount.google.com
2. **Security** section এ যান
3. **2-Step Verification** enable করুন
4. **App Passwords** এ যান
5. **Select app:** Mail
6. **Select device:** Other (Custom name) → "Auto Responder"
7. **Generate** button click করুন
8. 16-character password copy করুন
9. এটা Render এ `EMAIL_PASS` এ paste করুন

---

## 🎯 Final Checklist

- ✅ Backend deployed on Render.com
- ✅ Backend URL copied
- ✅ All JS files updated with backend URL
- ✅ Frontend deployed on Netlify
- ✅ Gmail app password generated
- ✅ Environment variables set in Render
- ✅ Admin login tested

---

## 🔧 Common Issues

### Backend sleeping (Render free tier)
- Free tier এ 15 minutes inactive থাকলে sleep হয়ে যায়
- First request এ 30-60 seconds লাগতে পারে wake up হতে
- **Solution:** Paid plan ($7/month) নিন অথবা cron-job.org দিয়ে 14 minutes এ একবার ping করুন

### CORS error
- যদি browser console এ CORS error দেখেন, `server.js` এ এটা আছে কিনা check করুন:
  ```javascript
  app.use(cors());
  ```

### Admin login not working
- Check করুন সব JS files এ correct backend URL আছে কিনা
- Browser console check করুন error এর জন্য
- Render logs check করুন: Dashboard → your service → Logs

---

## 📱 Your APK File Add করা

1. APK file Netlify site এ upload করুন (drag & drop)
2. `script.js` file এ download button functionality update করুন:

```javascript
button.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Track download
    await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    // Start download
    window.location.href = '/auto-responder.apk';  // Your APK filename
});
```

---

## 💡 সহজ Steps Summary:

1. **Render.com** এ backend deploy করুন
2. Backend URL copy করুন
3. সব `.js` files এ `API_URL` update করুন
4. শুধু HTML, CSS, JS files **Netlify** এ drag & drop করুন
5. Done! 🎉

---

এখন আপনার website সম্পূর্ণ live এবং কাজ করবে! Admin panel, email, download tracking সব কিছু কাজ করবে।
