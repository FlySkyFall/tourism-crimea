const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');

exports.getLogin = (req, res) => {
  res.render('auth/login', { user: req.user || null, message: req.flash('error') });
};

exports.postLogin = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/auth/login',
  failureFlash: true,
});

exports.getRegister = (req, res) => {
  res.render('auth/register', { user: req.user || null, message: req.flash('error') });
};

exports.postRegister = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existingUser) {
      req.flash('error', 'Пользователь с таким email или именем уже существует');
      return res.redirect('/auth/register');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      passwordHash,
      profile: { firstName, lastName },
    });
    await newUser.save();

    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).render('error', { message: 'Ошибка регистрации' });
      }
      res.redirect('/');
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Ошибка регистрации' });
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).render('error', { message: 'Ошибка выхода' });
    }
    res.redirect('/');
  });
};