const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Region = require('../models/Region');
const multer = require('multer');
const path = require('path');
const { checkAchievements } = require('../services/achievementService');

// Настройка Multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  console.log('Handling GET /community with query:', req.query);
  try {
    const { region, sort } = req.query;
    let query = { isHidden: false };
    if (region && region !== 'all') {
      query.region = region;
    }
    console.log('Fetching posts with query:', query);
    const posts = await Post.find(query)
      .populate('author', 'username')
      .populate('comments.user', 'username')
      .sort(sort === 'popular' ? { likes: -1 } : { createdAt: -1 })
      .lean();
    console.log('Posts fetched:', posts.length);
    const regions = await Region.find().lean();
    console.log('Regions fetched:', regions.length);
    console.log('User:', req.user ? req.user.username : 'No user');
    res.render('community/index', {
      posts,
      regions,
      user: req.user,
      selectedRegion: region || 'all',
      selectedSort: sort || 'newest'
    });
  } catch (error) {
    console.error('Error in getPosts:', error.message, error.stack);
    res.status(500).render('error', { message: 'Ошибка загрузки сообщества: ' + error.message });
  }
});

router.post('/posts', upload.single('image'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Войдите, чтобы создать пост' });
    }
    const { title, content, region } = req.body;
    const post = new Post({
      title,
      content,
      region,
      author: req.user._id,
      image: req.file ? req.file.filename : null
    });
    await post.save();
    await checkAchievements(req.user._id);
    res.status(200).json({ message: 'Пост создан' });
  } catch (error) {
    console.error('Error in createPost:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка создания поста' });
  }
});

router.post('/posts/:id/like', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Войдите, чтобы поставить лайк' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Пост не найден' });
    }
    const userId = req.user._id.toString();
    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    await checkAchievements(post.author);
    res.status(200).json({ likes: post.likes.length, liked: !liked });
  } catch (error) {
    console.error('Error in likePost:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка при установке лайка' });
  }
});

router.post('/posts/:id/comment', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Войдите, чтобы оставить комментарий' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Пост не найден' });
    }
    const comment = {
      user: req.user._id,
      content: req.body.content,
      createdAt: new Date()
    };
    post.comments.push(comment);
    await post.save();
    await checkAchievements(req.user._id);
    const populatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'username')
      .lean();
    const newComment = populatedPost.comments[populatedPost.comments.length - 1];
    res.status(200).json({ comment: newComment });
  } catch (error) {
    console.error('Error in commentPost:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка добавления комментария' });
  }
});

module.exports = router;