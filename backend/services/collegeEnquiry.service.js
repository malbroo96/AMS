// College Enquiry Service
const CollegeEnquiry = require('../models/CollegeEnquiry.model');
const ApiError = require('../utils/ApiError');

class CollegeEnquiryService {
  async createEnquiry(collegeId, enquiryData) {
    try {
      const enquiry = new CollegeEnquiry({
        collegeId,
        ...enquiryData
      });

      const savedEnquiry = await enquiry.save();

      // Increment enquiry count in College model
      const College = require('../models/College.model');
      await College.findByIdAndUpdate(
        collegeId,
        { $inc: { 'analytics.totalEnquiries': 1 } }
      );

      return savedEnquiry;
    } catch (error) {
      throw new ApiError(400, `Error creating enquiry: ${error.message}`);
    }
  }

  async getEnquiries(collegeId, filters = {}) {
    try {
      const query = { collegeId };

      if (filters.status) query.status = filters.status;
      if (filters.isRead !== undefined) query.isRead = filters.isRead;

      const enquiries = await CollegeEnquiry.find(query)
        .populate('studentId', 'firstName lastName email phone')
        .sort({ createdAt: -1 });

      return enquiries;
    } catch (error) {
      throw new ApiError(500, `Error fetching enquiries: ${error.message}`);
    }
  }

  async getEnquiryById(enquiryId) {
    try {
      const enquiry = await CollegeEnquiry.findById(enquiryId)
        .populate('studentId', 'firstName lastName email phone');

      if (!enquiry) {
        throw new ApiError(404, 'Enquiry not found');
      }

      // Mark as read
      if (!enquiry.isRead) {
        enquiry.isRead = true;
        await enquiry.save();
      }

      return enquiry;
    } catch (error) {
      throw new ApiError(500, `Error fetching enquiry: ${error.message}`);
    }
  }

  async updateEnquiryStatus(enquiryId, status) {
    try {
      const enquiry = await CollegeEnquiry.findByIdAndUpdate(
        enquiryId,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!enquiry) {
        throw new ApiError(404, 'Enquiry not found');
      }

      return enquiry;
    } catch (error) {
      throw new ApiError(500, `Error updating enquiry: ${error.message}`);
    }
  }

  async markAsRead(enquiryId) {
    try {
      const enquiry = await CollegeEnquiry.findByIdAndUpdate(
        enquiryId,
        { isRead: true },
        { new: true }
      );

      return enquiry;
    } catch (error) {
      throw new ApiError(500, `Error updating enquiry: ${error.message}`);
    }
  }

  async deleteEnquiry(enquiryId) {
    try {
      await CollegeEnquiry.findByIdAndRemove(enquiryId);
      return true;
    } catch (error) {
      throw new ApiError(500, `Error deleting enquiry: ${error.message}`);
    }
  }

  async getUnreadEnquiriesCount(collegeId) {
    try {
      const count = await CollegeEnquiry.countDocuments({
        collegeId,
        isRead: false
      });

      return count;
    } catch (error) {
      throw new ApiError(500, `Error fetching count: ${error.message}`);
    }
  }

  async getEnquiriesByStatus(collegeId, status) {
    try {
      const enquiries = await CollegeEnquiry.find({ collegeId, status })
        .sort({ createdAt: -1 });

      return enquiries;
    } catch (error) {
      throw new ApiError(500, `Error fetching enquiries: ${error.message}`);
    }
  }
}

module.exports = new CollegeEnquiryService();
