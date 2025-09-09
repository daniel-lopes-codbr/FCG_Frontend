# FCG User Frontend

A modern Angular application for user authentication and management, designed for the FCG Games marketplace platform.

## 🎮 Features

### Authentication
- **User Registration**: Secure account creation with strong password validation
- **User Login**: JWT-based authentication with token management
- **Session Management**: Automatic token expiration handling and logout functionality

### User Experience
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Mobile-first approach, works on all screen sizes
- **Modern UI**: Gaming-themed design with smooth animations
- **Form Validation**: Real-time validation with helpful error messages

### Security
- **Strong Password Policy**: Enforces complex password requirements
- **JWT Token Management**: Secure token storage and automatic refresh
- **Route Protection**: Guards for authenticated routes
- **Input Sanitization**: Protection against common security vulnerabilities

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fcg-user-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

### Backend API Setup

Make sure the .NET backend API is running on `http://localhost:5002` before testing the frontend.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── login/           # Login component
│   │   ├── register/        # Registration component
│   │   └── dashboard/       # User dashboard
│   ├── services/
│   │   ├── auth.service.ts  # Authentication service
│   │   └── theme.service.ts # Theme management
│   ├── models/
│   │   └── user.model.ts    # TypeScript interfaces
│   ├── guards/
│   │   └── auth.guard.ts    # Route protection
│   └── app.module.ts        # Main module
├── styles.css               # Global styles with Tailwind CSS
└── index.html              # Main HTML file
```

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (`#0ea5e9` to `#0284c7`)
- **Dark Theme**: Slate grays (`#0f172a` to `#475569`)
- **Success**: Green (`#10b981`)
- **Error**: Red (`#ef4444`)
- **Warning**: Amber (`#f59e0b`)

### Typography
- **Primary Font**: Inter (system font fallback)
- **Gaming Font**: Orbitron (for branding)

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Inputs**: Clean design with focus states
- **Badges**: Color-coded permission indicators

## 🔧 Configuration

### API Endpoints
The application is configured to connect to the following API endpoints:

- `POST /api/user/register` - User registration
- `POST /api/userauthorization/token` - User authentication
- `GET /api/user/id` - Get current user details
- `PUT /api/user` - Update user profile

### Environment Variables
Update the API base URL in `src/app/services/auth.service.ts` if needed:

```typescript
private readonly API_BASE_URL = 'http://localhost:5002/api';
```

## 🧪 Testing

### Unit Tests
```bash
ng test
```

### E2E Tests
```bash
ng e2e
```

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Management
- JWT tokens stored in localStorage
- Automatic token expiration checking
- Secure logout with token cleanup

## 🚀 Deployment

### Build for Production
```bash
ng build --configuration production
```

### Docker Support
```bash
# Build Docker image
docker build -t fcg-user-frontend .

# Run container
docker run -p 80:80 fcg-user-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for the FCG Games community**
