# My Inventory - Inventory Management System

A complete inventory management system built with Next.js, TypeScript, and Supabase.

## Features

- **Product Management**: Create, read, update, and delete products
- **Inventory Tracking**: Track stock levels across multiple warehouses
- **Purchase Orders**: Manage purchase orders and their status
- **Stock Alerts**: Get notified when stock levels are low
- **Reporting**: Generate inventory summaries and turnover reports
- **Authentication**: Secure API routes with Supabase Auth

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project

### Setup

1. **Clone and install dependencies**:
   ```bash
   cd my-inventory
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and execute the SQL from `database-schema.sql`

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Login

### Option 1: Create a New Account
1. Go to [http://localhost:3000](http://localhost:3000)
2. Click **"Sign up"** or **"Create Account"**
3. Enter your email and password (minimum 6 characters)
4. Check your email for a confirmation link
5. Click the confirmation link to activate your account
6. Return to the app and sign in with your credentials

**Note**: If you get an "Email not confirmed" error, you have two options:
- **For Development**: Disable email confirmation in Supabase (see Troubleshooting section)
- **For Production**: Check your email and click the confirmation link

### Option 2: Sign In with Existing Account
1. Go to [http://localhost:3000](http://localhost:3000)
2. Click **"Sign in"** or **"Sign In"**
3. Enter your email and password
4. Click **"Sign in"**

### After Login
Once logged in, you'll see:
- A welcome message with your email
- API endpoint documentation
- A "Test API" button to verify your authentication
- A "Sign out" button in the header

### Testing the API
After logging in, click the **"Test API"** button to verify that:
- Authentication is working correctly
- Your Bearer token is valid
- The API endpoints are accessible

### API Authentication
When making API calls programmatically, include your Bearer token:
```bash
# Get your token from the browser's developer tools or the test API response
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/products
```

## API Endpoints

### Authentication

All API endpoints require authentication. Include the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

### Products

- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `PUT /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product

### Inventory

- `GET /api/inventory` - Get inventory levels
- `PUT /api/inventory/[id]` - Update inventory levels
- `POST /api/inventory/movement` - Record stock movement (IN/OUT)

### Warehouses

- `GET /api/warehouses` - Get all warehouses
- `POST /api/warehouses` - Create a new warehouse

### Purchase Orders

- `GET /api/purchase-orders` - Get all purchase orders
- `POST /api/purchase-orders` - Create a new purchase order
- `PATCH /api/purchase-orders/[id]/status` - Update purchase order status

### Alerts

- `GET /api/alerts` - Get active stock alerts
- `PATCH /api/alerts/[id]/acknowledge` - Acknowledge an alert

### Reports

- `GET /api/reports/inventory-summary` - Get inventory summary
- `GET /api/reports/turnover` - Get stock turnover report
- `GET /api/reports/low-stock` - Get low stock report

### Authentication

- `GET /api/auth/user` - Get current user information

## API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

For errors:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

## Example API Usage

### Create a Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Wireless Mouse",
    "sku": "WM-001",
    "category": "Electronics",
    "price": 29.99,
    "description": "Ergonomic wireless mouse",
    "specifications": {
      "color": "Black",
      "battery_life": "12 months",
      "dpi": "1600"
    }
  }'
```

### Record Stock Movement

```bash
curl -X POST http://localhost:3000/api/inventory/movement \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": "uuid",
    "warehouse_id": "uuid",
    "type": "IN",
    "quantity": 50,
    "reference": "PO-001",
    "notes": "Received from supplier"
  }'
```

## Database Schema

The application uses the following main tables:

- **products**: Product catalog information
- **warehouses**: Warehouse locations
- **inventory**: Stock levels per product per warehouse
- **purchase_orders**: Purchase order headers
- **purchase_order_items**: Purchase order line items

See `database-schema.sql` for the complete schema definition.

## Development

### Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── products/     # Product management
│   │   ├── inventory/    # Inventory management
│   │   ├── warehouses/   # Warehouse management
│   │   ├── purchase-orders/ # Purchase order management
│   │   ├── alerts/       # Stock alerts
│   │   ├── reports/      # Reporting endpoints
│   │   └── auth/         # Authentication
│   └── page.tsx          # Home page
├── utils/
│   └── supabase/         # Supabase client configuration
└── middleware.ts         # Authentication middleware
```

### Adding New Features

1. Create new API routes in the appropriate directory under `src/app/api/`
2. Follow the existing error handling patterns
3. Ensure proper TypeScript types
4. Add authentication middleware if needed

## Deployment

This is a Next.js application and can be deployed to:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Any platform supporting Node.js**

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Email Not Confirmed Error

If you encounter `{"code":"email_not_confirmed","message":"Email not confirmed"}`:

#### Quick Fix for Development:
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll down to **User Signups**
4. **Uncheck** "Enable email confirmations"
5. Click **Save**
6. Try signing up again

#### Production Solution:
1. Check your email inbox (including spam folder)
2. Click the confirmation link from Supabase
3. If no email received, try signing up again
4. Ensure your email service is working properly

### Database Connection Issues:
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Check that you've executed the SQL schema in your Supabase project
- Ensure your Supabase project is active and not paused

### API Authentication Issues:
- Make sure you're logged in before testing API endpoints
- Check that the Bearer token is included in your requests
- Verify the middleware is properly configured

## License

This project is licensed under the MIT License.