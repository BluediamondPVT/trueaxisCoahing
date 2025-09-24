// // routes/posts.js
// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const Post = require('../models/Post');
// const auth = require('../middleware/auth');

// // Multer config for image upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/')
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|gif/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'));
//     }
//   }
// });

// /**
//  * @openapi
//  * /api/posts:
//  *   get:
//  *     summary: Get all posts with filtering and pagination
//  *     tags:
//  *       - Posts
//  *     parameters:
//  *       - in: query
//  *         name: category
//  *         schema:
//  *           type: string
//  *         description: Filter by category; use 'All' or omit for all
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *         description: Page number
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 10
//  *         description: Items per page
//  *       - in: query
//  *         name: search
//  *         schema:
//  *           type: string
//  *         description: Case-insensitive search in title, excerpt, content
//  *       - in: query
//  *         name: featured
//  *         schema:
//  *           type: boolean
//  *         description: Filter by featured posts
//  *       - in: query
//  *         name: sort
//  *         schema:
//  *           type: string
//  *           default: -createdAt
//  *         description: Mongoose sort string, e.g., -createdAt or title
//  *     responses:
//  *       200:
//  *         description: Paginated list of posts
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/PostListResponse'
//  *       500:
//  *         description: Server error
//  */
// router.get('/', async (req, res) => {
//   try {
//     const { 
//       category, 
//       page = 1, 
//       limit = 10, 
//       search, 
//       featured,
//       sort = '-createdAt' 
//     } = req.query;

//     let filter = { published: true };
    
//     if (category && category !== 'All') {
//       filter.category = category;
//     }
    
//     if (search) {
//       filter.$or = [
//         { title: { $regex: search, $options: 'i' } },
//         { excerpt: { $regex: search, $options: 'i' } },
//         { content: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     if (featured) {
//       filter.featured = featured === 'true';
//     }

//     const posts = await Post.find(filter)
//       .sort(sort)
//       .limit(Number(limit))
//       .skip((Number(page) - 1) * Number(limit))
//       .select('-content');

//     const totalPosts = await Post.countDocuments(filter);
    
//     res.json({
//       posts,
//       totalPages: Math.ceil(totalPosts / Number(limit)),
//       currentPage: Number(page),
//       totalPosts
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /**
//  * @openapi
//  * /api/posts/{id}:
//  *   get:
//  *     summary: Get a single post by ID and increment views
//  *     tags:
//  *       - Posts
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: MongoDB ObjectId of the post
//  *     responses:
//  *       200:
//  *         description: Post object
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Post'
//  *       404:
//  *         description: Post not found
//  *       500:
//  *         description: Server error
//  */
// router.get('/:id', async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
    
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     post.views += 1;
//     await post.save();

//     res.json(post);
//   } catch (error) {
//     if (error.kind === 'ObjectId') {
//       return res.status(404).json({ message: 'Post not found' });
//     }
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /**
//  * @openapi
//  * /api/posts:
//  *   post:
//  *     summary: Create a new post
//  *     description: Protected route requiring Bearer JWT. Supports image upload via multipart/form-data.
//  *     tags:
//  *       - Posts
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               title:
//  *                 type: string
//  *               excerpt:
//  *                 type: string
//  *               content:
//  *                 type: string
//  *               category:
//  *                 type: string
//  *               tags:
//  *                 type: string
//  *                 description: JSON stringified array of tags, e.g. ["a","b"]
//  *               featured:
//  *                 type: string
//  *                 description: "true or false"
//  *               author:
//  *                 type: string
//  *               image:
//  *                 type: string
//  *                 format: binary
//  *           encoding:
//  *             image:
//  *               style: form
//  *     responses:
//  *       201:
//  *         description: Post created
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                 post:
//  *                   $ref: '#/components/schemas/Post'
//  *       400:
//  *         description: Validation or upload error
//  *       401:
//  *         description: Unauthorized
//  */
// router.post('/', auth, upload.single('image'), async (req, res) => {
//   try {
//     const { title, excerpt, content, category, tags, featured, author } = req.body;

//     // Fix tags parsing - handle both array and string formats
//     let parsedTags = [];
//     if (tags) {
//       if (typeof tags === 'string') {
//         try {
//           // Try to parse as JSON array
//           parsedTags = JSON.parse(tags);
//         } catch (error) {
//           // If it's a comma-separated string, split it
//           parsedTags = tags.split(',').map(tag => tag.trim());
//         }
//       } else if (Array.isArray(tags)) {
//         // If it's already an array, use it directly
//         parsedTags = tags;
//       }
//     }

//     const postData = {
//       title,
//       excerpt,
//       content,
//       author: author || 'Admin',
//       category,
//       featured: featured === 'true' || featured === true,
//       tags: parsedTags
//     }; 

//     if (req.file) {
//       postData.image = `/uploads/${req.file.filename}`;
//     }

//     const post = new Post(postData);
//     await post.save();

//     res.status(201).json({
//       message: 'Post created successfully',
//       post
//     });
//   } catch (error) {
//     console.error('Error creating post:', error);
//     res.status(400).json({ 
//       message: 'Error creating post',
//       error: error.message 
//     });
//   }
// });
// /**
//  * @openapi
//  * /api/posts:
//  *   post:
//  *     summary: Create a new post
//  *     description: Protected route requiring Bearer JWT. Supports image upload via multipart/form-data.
//  *     tags:
//  *       - Posts
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               title:
//  *                 type: string
//  *               excerpt:
//  *                 type: string
//  *               content:
//  *                 type: string
//  *               category:
//  *                 type: string
//  *               tags:
//  *                 type: string
//  *                 description: Can be JSON array ["tag1","tag2"] or comma-separated "tag1,tag2"
//  *               featured:
//  *                 type: string
//  *                 description: "true or false"
//  *               author:
//  *                 type: string
//  *               image:
//  *                 type: string
//  *                 format: binary
//  *     responses:
//  *       201:
//  *         description: Post created successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                 post:
//  *                   $ref: '#/components/schemas/Post'
//  *       400:
//  *         description: Validation error
//  *       401:
//  *         description: Unauthorized
//  */
// router.put('/:id', auth, upload.single('image'), async (req, res) => {
//   try {
//     const { title, excerpt, content, category, tags, featured } = req.body;

//     const updateData = {
//       title,
//       excerpt,
//       content,
//       category,
//       featured: featured === 'true',
//       tags: tags ? JSON.parse(tags) : []
//     };

//     if (req.file) {
//       updateData.image = `/uploads/${req.file.filename}`;
//     }

//     const post = await Post.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     res.json({
//       message: 'Post updated successfully',
//       post
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ message: error.message });
//   }
// });

// /**
//  * @openapi
//  * /api/posts/{id}:
//  *   delete:
//  *     summary: Delete a post
//  *     tags:
//  *       - Posts
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: MongoDB ObjectId of the post
//  *     responses:
//  *       200:
//  *         description: Post deleted
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/MessageResponse'
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: Post not found
//  *       500:
//  *         description: Server error
//  */
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const post = await Post.findByIdAndDelete(req.params.id);
    
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     res.json({ message: 'Post deleted successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /**
//  * @openapi
//  * /api/posts/{id}/like:
//  *   post:
//  *     summary: Like a post (increments like count)
//  *     tags:
//  *       - Posts
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: MongoDB ObjectId of the post
//  *     responses:
//  *       200:
//  *         description: Post liked
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                 likes:
//  *                   type: integer
//  *       404:
//  *         description: Post not found
//  *       500:
//  *         description: Server error
//  */
// router.post('/:id/like', async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
    
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     post.likes += 1;
//     await post.save();

//     res.json({ message: 'Post liked', likes: post.likes });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;
// // 



const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// ✅ Import Cloudinary configuration instead of local multer
const { storage } = require('../config/cloudinary');
const multer = require('multer');

// ✅ Initialize multer with Cloudinary storage
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * @openapi
 * /api/posts:
 *   get:
 *     summary: Get all posts with filtering and pagination
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category; use 'All' or omit for all
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search in title, excerpt, content
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured posts
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Mongoose sort string, e.g., -createdAt or title
 *     responses:
 *       200:
 *         description: Paginated list of posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostListResponse'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      page = 1, 
      limit = 10, 
      search, 
      featured,
      sort = '-createdAt' 
    } = req.query;

    let filter = { published: true };
    
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (featured) {
      filter.featured = featured === 'true';
    }

    const posts = await Post.find(filter)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-content');

    const totalPosts = await Post.countDocuments(filter);
    
    res.json({
      posts,
      totalPages: Math.ceil(totalPosts / Number(limit)),
      currentPage: Number(page),
      totalPosts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post by ID and increment views
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post
 *     responses:
 *       200:
 *         description: Post object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.views += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Protected route requiring Bearer JWT. Supports image upload via multipart/form-data.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Can be JSON array ["tag1","tag2"] or comma-separated "tag1,tag2"
 *               featured:
 *                 type: string
 *                 description: "true or false"
 *               author:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, featured, author } = req.body;

    // Fix tags parsing - handle both array and string formats
    let parsedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          // Try to parse as JSON array
          parsedTags = JSON.parse(tags);
        } catch (error) {
          // If it's a comma-separated string, split it
          parsedTags = tags.split(',').map(tag => tag.trim());
        }
      } else if (Array.isArray(tags)) {
        // If it's already an array, use it directly
        parsedTags = tags;
      }
    }

    const postData = {
      title,
      excerpt,
      content,
      author: author || 'Admin',
      category,
      featured: featured === 'true' || featured === true,
      tags: parsedTags
    }; 

    // ✅ Use Cloudinary URL instead of local path
    if (req.file) {
      postData.image = req.file.path; // Cloudinary URL
    }

    const post = new Post(postData);
    await post.save();

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({ 
      message: 'Error creating post',
      error: error.message 
    });
  }
});

/**
 * @openapi
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     description: Protected route requiring Bearer JWT. Supports image upload via multipart/form-data.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Can be JSON array ["tag1","tag2"] or comma-separated "tag1,tag2"
 *               featured:
 *                 type: string
 *                 description: "true or false"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, featured } = req.body;

    // Fix tags parsing - same as POST route
    let parsedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch (error) {
          parsedTags = tags.split(',').map(tag => tag.trim());
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const updateData = {
      title,
      excerpt,
      content,
      category,
      featured: featured === 'true',
      tags: parsedTags
    };

    // ✅ Use Cloudinary URL instead of local path
    if (req.file) {
      updateData.image = req.file.path; // Cloudinary URL
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post
 *     responses:
 *       200:
 *         description: Post deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // ✅ Optional: Delete image from Cloudinary when post is deleted
    // You can implement this later if needed

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like a post (increments like count)
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post
 *     responses:
 *       200:
 *         description: Post liked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 likes:
 *                   type: integer
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.likes += 1;
    await post.save();

    res.json({ message: 'Post liked', likes: post.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
