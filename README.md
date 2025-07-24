# OYO Hotel Booking App

A full-stack hotel booking application inspired by OYO, built with React, TypeScript, Node.js, Express, MongoDB, and Socket.io for real-time features. Includes Stripe payment integration for secure transactions.

## 🚀 Features

### Frontend Features
- **Modern React UI** with TypeScript and Tailwind CSS
- **Real-time updates** using Socket.io
- **Responsive design** for mobile and desktop
- **Hotel search and filtering** with advanced options
- **Interactive booking flow** with date selection
- **Secure payment integration** with Stripe
- **User authentication** and profile management
- **Booking management** with cancellation support

### Backend Features
- **RESTful API** with Express.js
- **Real-time communication** with Socket.io
- **MongoDB database** with Mongoose ODM
- **JWT authentication** with secure middleware
- **Payment processing** with Stripe integration
- **File upload** support with Cloudinary
- **Input validation** and error handling
- **Rate limiting** and security headers

### Key Functionalities
- 🏨 **Hotel Management**: Search, filter, and view hotel details
- 📅 **Real-time Booking**: Live availability updates
- 💳 **Payment Integration**: Secure Stripe payments
- 🔐 **User Authentication**: JWT-based auth system
- 📱 **Responsive Design**: Works on all devices
- ⚡ **Real-time Updates**: Socket.io for live data
- 🛡️ **Security**: Rate limiting, validation, CORS
- 📧 **Notifications**: Toast notifications for user feedback

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Socket.io Client** for real-time features
- **Axios** for API calls
- **React Hot Toast** for notifications
- **React DatePicker** for date selection
- **Lucide React** for icons
- **Stripe.js** for payments

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Stripe** for payment processing
- **Bcrypt** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate Limiting** for API protection

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **Stripe Account** (for payment processing)
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd oyo-booking-app
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm run install-all

# Or install manually
npm install
cd client && npm install
cd ../server && npm install
```

### 3. Environment Setup

#### Server Environment (.env)
Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/oyo-booking

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Client URL
CLIENT_URL=http://localhost:3000

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Client Environment (.env)
Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 4. Database Setup

Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in server/.env with your Atlas connection string
```

### 5. Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Add the keys to your environment files
4. Set up webhooks for payment confirmations (optional)

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Run both client and server concurrently
npm run dev

# Or run separately
npm run server  # Runs server on http://localhost:5000
npm run client  # Runs client on http://localhost:3000
```

### Production Build

```bash
# Build the client
npm run build

# Start the server
cd server && npm start
```

## 📁 Project Structure

```
oyo-booking-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── index.js            # Server entry point
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Hotels
- `GET /api/hotels/search` - Search hotels
- `GET /api/hotels/:id` - Get hotel details
- `POST /api/hotels` - Create hotel (owner only)
- `PUT /api/hotels/:id` - Update hotel (owner only)
- `POST /api/hotels/:id/reviews` - Add review

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Payments
- `POST /api/payments/create-payment-intent` - Create payment
- `POST /api/payments/confirm-payment` - Confirm payment
- `POST /api/payments/refund` - Process refund
- `GET /api/payments/history` - Payment history

## 🔄 Real-time Features

The app uses Socket.io for real-time updates:

- **Room Availability**: Live updates when rooms are booked
- **Booking Confirmations**: Real-time booking status changes
- **Payment Status**: Live payment confirmation updates

## 🧪 Testing

### Demo Credentials

For testing purposes, you can use these demo credentials:

```
Email: demo@oyo.com
Password: demo123
```

### Test Cards (Stripe)

Use Stripe's test card numbers:

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

## 🚀 Deployment

### Client Deployment (Vercel/Netlify)

1. Build the client: `cd client && npm run build`
2. Deploy the `build` folder to your hosting service
3. Update environment variables on the hosting platform

### Server Deployment (Heroku/Railway)

1. Set up environment variables on your hosting platform
2. Deploy the `server` directory
3. Ensure MongoDB connection is configured for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) section
2. Review the setup instructions
3. Ensure all environment variables are set correctly
4. Verify MongoDB and Stripe configurations

## 🔮 Future Enhancements

- [ ] Mobile app with React Native
- [ ] Admin dashboard for hotel management
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Loyalty program integration
- [ ] Social media authentication
- [ ] Review and rating system enhancements

---

**Built with ❤️ by Sanwar**