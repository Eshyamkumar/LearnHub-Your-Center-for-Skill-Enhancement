# LearnHub: Your Center for Skill Enhancement  
**Project Documentation**

---

## Table of Contents

1. Introduction  
2. Features  
3. Technology Stack  
4. Project Structure  
5. Installation & Setup  
6. Environment Variables  
7. Running the Project  
8. Scripts Reference  
9. Deployment  
10. Contact

---

## 1. Introduction

**LearnHub** is an online learning platform designed to help users enhance their skills through a variety of courses. It features user authentication, course management, enrollments, payments, and more, with a modern React frontend and a Node.js/Express backend.

---

## 2. Features

- User registration and authentication (JWT)
- Browse, enroll, and manage courses
- Payment processing via Stripe
- Email notifications (Nodemailer)
- Role-based access (students, instructors)
- Responsive UI

---

## 3. Technology Stack

- **Frontend:** React, Context API, CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT, bcryptjs
- **Payments:** Stripe
- **Email:** Nodemailer
- **Validation:** express-validator
- **File Uploads:** multer
- **Dev Tools:** nodemon, concurrently

---

## 4. Project Structure

```
LearnHub Your Center for Skill Enhancement/
│
├── client/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── server/                # Node.js backend
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── index.js
│
├── package.json           # Root scripts and dependencies
├── README.md
└── setup.js
```

---

## 5. Installation & Setup

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- MongoDB (local or cloud)

### Steps

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd "LearnHub Your Center for Skill Enhancement"
   ```

2. **Install root dependencies:**
   ```bash
   npm install
   ```

3. **Install client dependencies:**
   ```bash
   npm run install-client
   ```

4. **Set up environment variables:**  
   Create a `.env` file in the root or `server/` directory with the following:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_password
   ```

---

## 6. Environment Variables

| Variable            | Description                        |
|---------------------|------------------------------------|
| MONGO_URI           | MongoDB connection string          |
| JWT_SECRET          | Secret for JWT authentication      |
| STRIPE_SECRET_KEY   | Stripe API secret key              |
| EMAIL_USER          | Email address for notifications    |
| EMAIL_PASS          | Email password or app password     |

---

## 7. Running the Project

### Development (hot reload for both client and server):

```bash
npm run dev
```

### Production:

```bash
npm run build
npm start
```

---

## 8. Scripts Reference

| Script             | Description                                 |
|--------------------|---------------------------------------------|
| npm start          | Start backend server (production)           |
| npm run server     | Start backend with nodemon (development)    |
| npm run client     | Start React frontend                        |
| npm run dev        | Start both backend and frontend concurrently|
| npm run install-client | Install frontend dependencies           |
| npm run build      | Build React frontend for production         |

---

## 9. Deployment

- The project is ready for deployment on platforms like Heroku, Vercel, or Netlify.
- The `heroku-postbuild` script ensures client dependencies are installed and the React app is built after deployment.

---

## 10. Contact

**Author:** LearnHub Team  
**License:** MIT

---

**End of Documentation** 