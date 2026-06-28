# ✨ Full-Stack Chat App with Auth & Emails ✨

> **Made by Rudraksh Patel** ‍💻

A modern, real-time family chat application with secure authentication, instant messaging, and beautiful UI.

 **Live Demo:** [https://family-chat-eqff.vercel.app](https://family-chat-eqff.vercel.app)

---

## ✨ Highlights

- 🔐 Custom JWT Authentication (no 3rd-party auth)
- ⚡ Real-time Messaging via Socket.io
- 🟢 Online/Offline Presence Indicators
- 🔔 Notification & Typing Sounds (with toggle)
- 📨 Welcome Emails on Signup (Resend)
- 🗂️ Image Uploads (Cloudinary)
- 🧰 REST API with Node.js & Express
- 🧱 MongoDB for Data Persistence
- 🚦 API Rate-Limiting powered by Arcjet
- 🎨 Beautiful UI with React, Tailwind CSS & DaisyUI
- 🧠 Zustand for State Management
- 🧑‍💻 Git & GitHub Workflow (branches, PRs, merges)
- 🚀 Easy Deployment (free-tier friendly)

---

## 🧪 .env Setup

### Backend (`/backend`)

```bash
PORT=3000
MONGO_URI=your_mongo_uri_here

NODE_ENV=development

JWT_SECRET=your_jwt_secret

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email_from_address
EMAIL_FROM_NAME=your_email_from_name

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development
```

---

## 🔧 Run the Backend

```bash
cd backend
npm install
npm run dev
```

## 💻 Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Deployment

This app is deployed on free-tier hosting platforms:

- **Frontend:** Vercel - [https://family-chat-eqff.vercel.app](https://family-chat-eqff.vercel.app)
- **Backend:** Render
- **Database:** MongoDB Atlas (Cloud)

### Deployment Architecture

```
Frontend (Vercel) → Backend API (Render) → Database (MongoDB Atlas)
       ↓
WebSocket (Socket.io) → Render Backend
```

---

## 👨‍💻 Developer

**Rudraksh Patel**

-  GitHub: [progammer24052025-png](https://github.com/progammer24052025-png)
- 📧 Email: progammer.24052025@gmail.com

---

## 📜 License

This project is open-source and available under the ISC License.

---

**Built with ❤️ by Rudraksh Patel**
