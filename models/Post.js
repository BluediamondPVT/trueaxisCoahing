// models/Post.js - Post Schema
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Design', 'Technology', 'Business', 'Lifestyle', 'Arts']
  },
  image: {
    type: String,
    default: ''
  },
  readTime: {
    type: String,
    default: '5 min read'
  },
  featured: {
    type: Boolean,
    default: false
  },
  published: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Calculate read time based on content
PostSchema.pre('save', function(next) {
  if (this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(' ').length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    this.readTime = `${readTime} min read`;
  }
  next();
});

module.exports = mongoose.model('Post', PostSchema)