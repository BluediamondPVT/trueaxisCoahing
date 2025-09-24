// server.js - Main server file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // ✅ ADD THIS LINE
require('dotenv').config();

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Add this for Vercel serverless compatibility
app.use(express.urlencoded({ extended: true }));

// 🚨 REMOVE LOCAL FILE UPLOADS - Use Cloud Storage Instead
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Cloudinary Configuration (Moved after multer import)
const { storage } = require('./config/cloudinary');
const upload = multer({ storage: storage });

// Swagger options (OpenAPI 3)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Classic Blog API',
      version: '1.0.0',
      description: 'Blog posts API with image uploads, pagination, likes, and JWT auth.',
    },
    servers: [
      { 
        url: process.env.NODE_ENV === 'production' 
          ? `https://${process.env.VERCEL_URL}` 
          : process.env.SERVER_URL || 'http://localhost:5000', 
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server' 
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            excerpt: { type: 'string' },
            content: { type: 'string' },
            author: { type: 'string' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            featured: { type: 'boolean' },
            image: { type: 'string', description: 'Image URL path' },
            published: { type: 'boolean' },
            views: { type: 'integer' },
            likes: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          }
        },
        PostListResponse: {
          type: 'object',
          properties: {
            posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
            totalPages: { type: 'integer' },
            currentPage: { type: 'integer' },
            totalPosts: { type: 'integer' }
          }
        },
        MessageResponse: {
          type: 'object',
          properties: { message: { type: 'string' } }
        }
      }
    }
  },
  apis: ['./routes/*.js'],
};

// Build spec and mount UI
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ Improved Database connection for Vercel
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// ✅ Vercel-specific: Handle serverless connections
if (process.env.NODE_ENV === 'production') {
  // For production (Vercel), we need to handle cold starts
  let isConnected = false;
  
  app.use(async (req, res, next) => {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
    next();
  });
} else {
  // For development, connect immediately
  connectDB();
}

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/auth', require('./routes/auth'));

/**
 * @openapi
 * /:
 *   get:
 *     summary: Health check
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'Classic Blog API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
  }
  res.status(500).json({ message: error.message });
});

// ✅ Vercel requires module.exports instead of app.listen()
module.exports = app;

// ✅ Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}