# 🔷 OBO – Social Media Platform with Live Streaming (Backend)

Backend API for the OBO social media platform, built with Node.js and Express. It provides secure authentication, real-time communication, and full CRUD functionality for users, posts, comments, and notifications. Integrated with Stripe for premium features and supports Google/Facebook OAuth login.

## 🚀 Features

- Google and Facebook OAuth authentication with callback handling
- CRUD APIs for:
  - Users
  - Posts
  - Comments
  - Likes
  - Friends
  - Notifications
- Real-time chat support with Socket.io
- Stripe payment integration for premium access
- Email notifications via Nodemailer
- Admin-level routes for managing content
- Scalable architecture with modular route structure

## 🌐 Tech Stack

- Node.js
- Express.js
- MongoDB
- Socket.io
- Stripe API
- Nodemailer
- JSON Web Token (JWT)

## 📍 Live Deployment

[🔗 Live Backend API](https://api.obo.adlerpalast.de)

## 📦 Getting Started

```bash
# Clone the repo
git clone https://github.com/stackpearls/creators-app-backend.git

# Navigate into the project directory
cd creators-app-backend

# Install dependencies
npm install

# Run the server
npm start
