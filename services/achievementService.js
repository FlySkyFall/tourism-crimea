const Post = require('../models/Post');
const UserAchievement = require('../models/UserAchievement');
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');

const checkAchievements = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('Пользователь не найден');

    const achievements = await Achievement.find().lean();
    const userAchievements = await UserAchievement.find({ user: userId }).lean();
    const achievedConditions = userAchievements.map(ua => ua.achievement.toString());

    for (const achievement of achievements) {
      if (achievedConditions.includes(achievement._id.toString())) continue;

      let shouldAward = false;

      switch (achievement.condition) {
        case 'create_post_1': {
          const postCount = await Post.countDocuments({ author: userId });
          if (postCount >= 1) shouldAward = true;
          break;
        }
        case 'create_posts_5': {
          const postCount = await Post.countDocuments({ author: userId });
          if (postCount >= 5) shouldAward = true;
          break;
        }
        case 'likes_on_post_10': {
          const postWithLikes = await Post.findOne({ author: userId, likes: { $size: 10 } });
          if (postWithLikes) shouldAward = true;
          break;
        }
        case 'comments_10': {
          const commentCount = await Post.aggregate([
            { $match: { 'comments.user': user._id } },
            { $unwind: '$comments' },
            { $match: { 'comments.user': user._id } },
            { $count: 'total' }
          ]);
          if (commentCount.length && commentCount[0].total >= 10) shouldAward = true;
          break;
        }
        case 'book_tour_1': {
          if (user.bookings.length >= 1) shouldAward = true;
          break;
        }
        case 'reviews_3': {
          const tourReviewCount = await Tour.aggregate([
            { $match: { 'reviews.user': user._id } },
            { $unwind: '$reviews' },
            { $match: { 'reviews.user': user._id } },
            { $count: 'total' }
          ]);
          const hotelReviewCount = await Hotel.aggregate([
            { $match: { 'reviews.user': user._id } },
            { $unwind: '$reviews' },
            { $match: { 'reviews.user': user._id } },
            { $count: 'total' }
          ]);
          const totalReviews = (tourReviewCount.length ? tourReviewCount[0].total : 0) + 
                              (hotelReviewCount.length ? hotelReviewCount[0].total : 0);
          if (totalReviews >= 3) shouldAward = true;
          break;
        }
      }

      if (shouldAward) {
        const userAchievement = await UserAchievement.create({
          user: userId,
          achievement: achievement._id
        });
        await User.findByIdAndUpdate(userId, {
          $push: { achievements: userAchievement._id }
        });
        console.log(`Achievement awarded: ${achievement.name} to user ${user.username}`);
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error.message);
  }
};

module.exports = { checkAchievements };