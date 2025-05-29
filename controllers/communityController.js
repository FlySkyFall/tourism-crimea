const Post = require('../models/Post');
const Region = require('../models/Region');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Получение списка постов
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const region = req.query.region ? decodeURIComponent(req.query.region).trim() : '';
    const sortBy = req.query.sortBy || 'newest'; // newest, popular

    const query = { isHidden: false };
    if (region) {
      query.region = region;
    }

    const sortOptions = {};
    if (sortBy === 'popular') {
      sortOptions.likes = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    console.log('Community filter params:', { page, region, sortBy });

    const posts = await Post.find(query)
      .populate('author', 'username') // Получаем имя автора
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    const regions = await Region.find({}).select('name').lean();

    res.render('community/index', {
      posts,
      regions,
      currentPage: page,
      totalPages,
      totalPosts,
      currentRegion: region,
      currentSortBy: sortBy,
      error: posts.length ? null : 'Нет постов для выбранных фильтров',
      user: req.user ? req.user : null // Предполагаем, что аутентификация добавляет req.user
    });
  } catch (error) {
    console.error('Ошибка в getPosts:', error.message, error.stack);
    res.render('community/index', {
      posts: [],
      regions: [],
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0,
      error: 'Ошибка загрузки постов',
      currentRegion: '',
      currentSortBy: 'newest',
      user: null
    });
  }
};

// Создание поста
exports.createPost = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { title, content, region } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    if (!title || !content || !region) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const regionExists = await Region.findOne({ name: region }).lean();
    if (!regionExists) {
      return res.status(400).json({ error: `Регион "${region}" не найден` });
    }

    const post = new Post({
      title,
      content,
      author: req.user._id,
      region,
      images
    });

    await post.save();
    res.status(201).json({ message: 'Пост создан', postId: post._id });
  } catch (error) {
    console.error('Ошибка в createPost:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка создания поста' });
  }
};

// Добавление/удаление лайка
exports.toggleLike = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Пост не найден' });
    }

    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes.length });
  } catch (error) {
    console.error('Ошибка в toggleLike:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка обработки лайка' });
  }
};

// Добавление комментария
exports.addComment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const postId = req.params.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Текст комментария обязателен' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Пост не найден' });
    }

    post.comments.push({
      userId: req.user._id,
      text
    });

    await post.save();
    const newComment = post.comments[post.comments.length - 1];
    res.json({
      comment: {
        _id: newComment._id,
        userId: newComment.userId,
        username: req.user.username,
        text: newComment.text,
        createdAt: newComment.createdAt
      }
    });
  } catch (error) {
    console.error('Ошибка в addComment:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка добавления комментария' });
  }
};