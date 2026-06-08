// College Achievement Service
const CollegeAchievement = require('../models/CollegeAchievement.model');
const ApiError = require('../utils/ApiError');

class CollegeAchievementService {
  async createAchievement(achievementData) {
    try {
      const achievement = new CollegeAchievement(achievementData);
      return await achievement.save();
    } catch (error) {
      throw new ApiError(400, `Error creating achievement: ${error.message}`);
    }
  }

  async getAchievementsByCollege(collegeId) {
    try {
      const achievements = await CollegeAchievement.find({ collegeId, isActive: true })
        .sort({ displayOrder: 1 });
      return achievements;
    } catch (error) {
      throw new ApiError(500, `Error fetching achievements: ${error.message}`);
    }
  }

  async updateAchievement(achievementId, updateData) {
    try {
      const achievement = await CollegeAchievement.findByIdAndUpdate(
        achievementId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!achievement) {
        throw new ApiError(404, 'Achievement not found');
      }

      return achievement;
    } catch (error) {
      throw new ApiError(400, `Error updating achievement: ${error.message}`);
    }
  }

  async deleteAchievement(achievementId) {
    try {
      await CollegeAchievement.findByIdAndUpdate(
        achievementId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      throw new ApiError(500, `Error deleting achievement: ${error.message}`);
    }
  }

  async reorderAchievements(collegeId, reorderData) {
    try {
      for (const item of reorderData) {
        await CollegeAchievement.findByIdAndUpdate(
          item.id,
          { displayOrder: item.order }
        );
      }
      return true;
    } catch (error) {
      throw new ApiError(500, `Error reordering achievements: ${error.message}`);
    }
  }
}

module.exports = new CollegeAchievementService();
