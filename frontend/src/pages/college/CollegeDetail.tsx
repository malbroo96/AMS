import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchCollegeDetails } from '../../redux/slices/collegeSlice';
import { markCollegeInterest, submitCollegeEnquiry } from '../../redux/slices/studentInterestSlice';
import './CollegeDetail.css';

const CollegeDetail: React.FC = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const dispatch = useDispatch();
  const { currentCollege, loading, error } = useSelector((state: any) => state.colleges);
  const { interestedColleges, enquirySuccess } = useSelector((state: any) => state.studentInterests);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    interestedCourse: ''
  });

  useEffect(() => {
    if (collegeId) {
      dispatch(fetchCollegeDetails(collegeId) as any);
    }
  }, [collegeId, dispatch]);

  if (loading) return <div className="loading">Loading college details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!currentCollege) return <div>College not found</div>;

  const college = currentCollege.college || currentCollege;
  const isInterested = interestedColleges.some((c: any) => c.collegeId === collegeId);

  const handleInterestClick = () => {
    dispatch(markCollegeInterest({ collegeId, courseId: null }) as any);
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(submitCollegeEnquiry({ collegeId, enquiryData: formData }) as any);
    setFormData({ name: '', email: '', phone: '', message: '', interestedCourse: '' });
    setShowEnquiryForm(false);
  };

  const tabs = ['Overview', 'Courses & Fees', 'Facilities', 'Placements', 'Achievements', 'Gallery', 'Reviews', 'Contact'];

  return (
    <div className="college-detail-container">
      {/* Header Section */}
      <div className="college-header-section">
        <div className="banner-image">
          <img src={college.coverBannerUrl} alt={college.collegeName} />
        </div>
        <div className="college-header-content">
          <div className="college-logo-name">
            <img src={college.logoUrl} alt="Logo" className="college-logo" />
            <div>
              <h1>{college.collegeName}</h1>
              <p className="college-meta">
                {college.location.city}, {college.location.state} • Founded {college.establishmentYear}
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className={`interest-btn ${isInterested ? 'interested' : ''}`}
              onClick={handleInterestClick}
            >
              {isInterested ? '❤️ Interested' : '🤍 Mark Interest'}
            </button>
            <button className="enquiry-btn" onClick={() => setShowEnquiryForm(true)}>
              Send Enquiry
            </button>
          </div>
        </div>

        {/* Key Stats */}
        <div className="key-stats">
          <div className="stat-card">
            <h3>Rating</h3>
            <p className="stat-value">4.5/5</p>
            <p className="stat-sub">(1,234 reviews)</p>
          </div>
          <div className="stat-card">
            <h3>NAAC Grade</h3>
            <p className="stat-value">{college.naacGrade}</p>
          </div>
          <div className="stat-card">
            <h3>College Type</h3>
            <p className="stat-value">{college.collegeType}</p>
          </div>
          <div className="stat-card">
            <h3>Placement %</h3>
            <p className="stat-value">{college.placements.placementPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-navigation">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab.toLowerCase().replace(' ', '-') ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <section>
              <h2>About College</h2>
              <p>{college.about?.summaryDescription}</p>
            </section>

            <section>
              <h3>Vision Statement</h3>
              <p>{college.about?.visionStatement}</p>
            </section>

            <section>
              <h3>Mission Statement</h3>
              <p>{college.about?.missionStatement}</p>
            </section>

            <section>
              <h3>Principal's Message</h3>
              <p>{college.about?.principalMessage}</p>
            </section>
          </div>
        )}

        {activeTab === 'courses-fees' && (
          <div className="courses-tab">
            <h2>Courses Offered</h2>
            <div className="courses-grid">
              {currentCollege?.courses?.map((course: any) => (
                <div key={course._id} className="course-card">
                  <h3>{course.courseName}</h3>
                  <p className="degree">{course.degreeType}</p>
                  <div className="course-details">
                    <span>Duration: {course.duration} years</span>
                    <span>Seats: {course.totalSeats}</span>
                    <span>Fee: ₹{course.fees?.annualFee}/year</span>
                  </div>
                  <button className="apply-btn">Apply Now</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'facilities' && (
          <div className="facilities-tab">
            <h2>Facilities Available</h2>
            <div className="facilities-grid">
              {college.facilities?.map((facility: string) => (
                <div key={facility} className="facility-item">
                  <span className="facility-icon">✓</span>
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'placements' && (
          <div className="placements-tab">
            <h2>Placement Statistics</h2>
            <div className="placement-stats">
              <div className="placement-card">
                <h3>Placement Percentage</h3>
                <p className="stat-value">{college.placements.placementPercentage}%</p>
              </div>
              <div className="placement-card">
                <h3>Highest Package</h3>
                <p className="stat-value">{college.placements.highestPackage}</p>
              </div>
              <div className="placement-card">
                <h3>Average Package</h3>
                <p className="stat-value">{college.placements.averagePackage}</p>
              </div>
            </div>

            <h3>Top Recruiters</h3>
            <div className="recruiters-grid">
              {college.placements?.topRecruiters?.map((recruiter: any) => (
                <div key={recruiter.recruiterName} className="recruiter-item">
                  {recruiter.recruiterLogoUrl && (
                    <img src={recruiter.recruiterLogoUrl} alt={recruiter.recruiterName} />
                  )}
                  <p>{recruiter.recruiterName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <h2>Achievements</h2>
            <div className="achievements-list">
              {currentCollege?.achievements?.map((achievement: any) => (
                <div key={achievement._id} className="achievement-item">
                  {achievement.achievementImageUrl && (
                    <img src={achievement.achievementImageUrl} alt={achievement.achievementTitle} />
                  )}
                  <div>
                    <h3>{achievement.achievementTitle}</h3>
                    <p>{achievement.description}</p>
                    <p className="year">{achievement.achievementYear}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="gallery-tab">
            <h2>Campus Gallery</h2>
            <div className="gallery-grid">
              {currentCollege?.gallery?.map((image: any) => (
                <div key={image._id} className="gallery-item">
                  <img src={image.imageUrl} alt={image.imageTitle} />
                  <p>{image.imageTitle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-tab">
            <h2>Student Reviews</h2>
            <div className="reviews-list">
              {currentCollege?.ratings?.map((rating: any) => (
                <div key={rating._id} className="review-card">
                  <div className="review-header">
                    <h3>{rating.studentId?.firstName} {rating.studentId?.lastName}</h3>
                    <span className="rating-badge">⭐ {rating.ratings.overall}/5</span>
                  </div>
                  <p>{rating.reviewText}</p>
                  <div className="review-ratings">
                    <span>Infrastructure: {rating.ratings.infrastructure}/5</span>
                    <span>Faculty: {rating.ratings.faculty}/5</span>
                    <span>Placements: {rating.ratings.placement}/5</span>
                    <span>Campus Life: {rating.ratings.campusLife}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="contact-tab">
            <h2>Contact Information</h2>
            <div className="contact-details">
              <div className="contact-item">
                <h3>📧 Email</h3>
                <p><a href={`mailto:${college.contact.emailAddress}`}>{college.contact.emailAddress}</a></p>
              </div>
              <div className="contact-item">
                <h3>📱 Phone</h3>
                <p><a href={`tel:${college.contact.admissionMobileNumber}`}>{college.contact.admissionMobileNumber}</a></p>
              </div>
              <div className="contact-item">
                <h3>🌐 Website</h3>
                <p><a href={college.contact.websiteUrl} target="_blank" rel="noopener noreferrer">{college.contact.websiteUrl}</a></p>
              </div>
              <div className="contact-item">
                <h3>📍 Address</h3>
                <p>{college.location.fullAddress}</p>
                <p>{college.location.city}, {college.location.state} {college.location.pincode}</p>
              </div>
            </div>

            {college.location.latitude && college.location.longitude && (
              <div className="map-section">
                <h3>Location on Map</h3>
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3800!2d${college.location.longitude}!3d${college.location.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${college.location.latitude}%2C${college.location.longitude}!5e0!3m2!1sen!2sin!4v1234567890`}
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enquiry Form Modal */}
      {showEnquiryForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowEnquiryForm(false)}>×</button>
            <h2>Send Your Enquiry</h2>
            <form onSubmit={handleEnquirySubmit}>
              <input
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Your Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Interested Course"
                value={formData.interestedCourse}
                onChange={(e) => setFormData({ ...formData, interestedCourse: e.target.value })}
              />
              <textarea
                placeholder="Your Message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              <button type="submit" className="submit-btn">Send Enquiry</button>
            </form>
            {enquirySuccess && <p className="success-msg">Enquiry sent successfully!</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDetail;
