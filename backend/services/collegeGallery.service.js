// College Gallery Service
const CollegeGallery = require('../models/CollegeGallery.model');
const ApiError = require('../utils/ApiError');

class CollegeGalleryService {
  async uploadGalleryImage(collegeId, imageData) {
    try {
      const gallery = new CollegeGallery({
        collegeId,
        ...imageData
      });
      return await gallery.save();
    } catch (error) {
      throw new ApiError(400, `Error uploading image: ${error.message}`);
    }
  }

  async getGalleryByCollege(collegeId) {
    try {
      const gallery = await CollegeGallery.find({ collegeId, isActive: true })
        .sort({ displayOrder: 1 });
      return gallery;
    } catch (error) {
      throw new ApiError(500, `Error fetching gallery: ${error.message}`);
    }
  }

  async getGalleryByCategory(collegeId, category) {
    try {
      const gallery = await CollegeGallery.find({
        collegeId,
        imageCategory: category,
        isActive: true
      }).sort({ displayOrder: 1 });
      return gallery;
    } catch (error) {
      throw new ApiError(500, `Error fetching gallery: ${error.message}`);
    }
  }

  async updateGalleryImage(imageId, updateData) {
    try {
      const image = await CollegeGallery.findByIdAndUpdate(
        imageId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!image) {
        throw new ApiError(404, 'Image not found');
      }

      return image;
    } catch (error) {
      throw new ApiError(400, `Error updating image: ${error.message}`);
    }
  }

  async deleteGalleryImage(imageId) {
    try {
      await CollegeGallery.findByIdAndUpdate(
        imageId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      throw new ApiError(500, `Error deleting image: ${error.message}`);
    }
  }

  async reorderGallery(collegeId, reorderData) {
    try {
      for (const item of reorderData) {
        await CollegeGallery.findByIdAndUpdate(
          item.id,
          { displayOrder: item.order }
        );
      }
      return true;
    } catch (error) {
      throw new ApiError(500, `Error reordering gallery: ${error.message}`);
    }
  }
}

module.exports = new CollegeGalleryService();
