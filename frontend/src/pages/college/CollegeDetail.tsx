import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicCollegeProfile, submitCollegeProfileEnquiry, type CollegeProfileData } from '../../api/ams';
import './CollegeDetail.css';

const tabs = ['Overview', 'Courses', 'Placements', 'Achievements', 'Gallery', 'Contact'];

const CollegeDetail: React.FC = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const [college, setCollege] = useState<CollegeProfileData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    message: '',
    interestedCourse: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!collegeId) return;
      setLoading(true);
      setError('');
      try {
        const response = await getPublicCollegeProfile(collegeId);
        setCollege(response.data.data);
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'College details could not be loaded'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [collegeId]);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId) return;
    await submitCollegeProfileEnquiry(collegeId, formData);
    setFormData({ studentName: '', studentEmail: '', studentPhone: '', message: '', interestedCourse: '' });
    setEnquirySuccess(true);
    setShowEnquiryForm(false);
  };

  if (loading) return <div className="loading">Loading college details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!college) return <div className="no-results">College not found</div>;

  const location = [college.location?.city, college.location?.state].filter(Boolean).join(', ');

  return (
    <div className="college-detail-container">
      <div className="college-header-section">
        <div className="banner-image">
          {college.coverBannerUrl ? <img src={college.coverBannerUrl} alt={college.collegeName} /> : <div className="banner-placeholder" />}
        </div>
        <div className="college-header-content">
          <div className="college-logo-name">
            {college.logoUrl ? <img src={college.logoUrl} alt="" className="college-logo" /> : <div className="college-logo logo-placeholder" />}
            <div>
              <h1>{college.collegeName}</h1>
              <p className="college-meta">
                {location || 'Location pending'} {college.establishmentYear ? `- Founded ${college.establishmentYear}` : ''}
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button className="enquiry-btn" onClick={() => setShowEnquiryForm(true)}>
              Send Enquiry
            </button>
          </div>
        </div>

        <div className="key-stats">
          <div className="stat-card">
            <h3>NAAC Grade</h3>
            <p className="stat-value">{college.naacGrade || '-'}</p>
          </div>
          <div className="stat-card">
            <h3>College Type</h3>
            <p className="stat-value">{college.collegeType || '-'}</p>
          </div>
          <div className="stat-card">
            <h3>Placement</h3>
            <p className="stat-value">{college.placements?.placementPercentage ?? '-'}%</p>
          </div>
          <div className="stat-card">
            <h3>Interested Students</h3>
            <p className="stat-value">{college.dashboard?.totalInterestedStudents ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="tabs-navigation">
        {tabs.map((tab) => {
          const key = tab.toLowerCase();
          return (
            <button key={tab} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              {tab}
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <section>
              <h2>About College</h2>
              <p>{college.about?.summaryDescription || 'This college has not added a summary yet.'}</p>
            </section>
            <section>
              <h3>Vision</h3>
              <p>{college.about?.visionStatement || '-'}</p>
            </section>
            <section>
              <h3>Mission</h3>
              <p>{college.about?.missionStatement || '-'}</p>
            </section>
            {!!college.facilities?.length && (
              <section>
                <h3>Facilities</h3>
                <div className="facilities-grid">
                  {college.facilities.map((facility) => (
                    <div key={facility} className="facility-item">
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="courses-tab">
            <h2>Courses Offered</h2>
            <div className="courses-grid">
              {(college.courses || []).map((course) => {
                const fees = course.fees;
                return (
                  <div key={String(course.id)} className="course-card">
                    <h3>
                      {course.courseName ?? 'Course'}
                      {course.branchName && (
                        <span className="course-branch-title"> - {course.branchName}</span>
                      )}
                    </h3>
                    <p className="degree">{String(course.degreeType ?? '')}</p>
                    <div className="course-details">
                      <span>Duration: {String(course.duration ?? '-')} years</span>
                      <span>Seats: {String(course.totalSeats ?? '-')}</span>
                      <span>Fee: {fees?.annualFee ? `Rs. ${fees.annualFee.toLocaleString('en-IN')}/year` : 'Ask college'}</span>
                    </div>
                    <button className="apply-btn" onClick={() => setShowEnquiryForm(true)}>
                      Enquire
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'placements' && (
          <div className="placements-tab">
            <h2>Placement Statistics</h2>
            <div className="placement-stats">
              <div className="placement-card">
                <h3>Placement Percentage</h3>
                <p className="stat-value">{college.placements?.placementPercentage ?? '-'}%</p>
              </div>
              <div className="placement-card">
                <h3>Highest Package</h3>
                <p className="stat-value">{college.placements?.highestPackage || '-'}</p>
              </div>
              <div className="placement-card">
                <h3>Average Package</h3>
                <p className="stat-value">{college.placements?.averagePackage || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <h2>Achievements</h2>
            <div className="achievements-list">
              {(college.achievements || []).map((achievement) => (
                <div key={String(achievement.id)} className="achievement-item">
                  {Boolean(achievement.achievementImageUrl) && <img src={String(achievement.achievementImageUrl)} alt={String(achievement.achievementTitle)} />}
                  <div>
                    <h3>{String(achievement.achievementTitle ?? '')}</h3>
                    <p>{String(achievement.description ?? '')}</p>
                    <p className="year">{String(achievement.achievementYear ?? '')}</p>
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
              {(college.gallery || []).map((image) => (
                <div key={String(image.id)} className="gallery-item">
                  <img src={String(image.imageUrl)} alt={String(image.imageTitle ?? 'Campus image')} />
                  <p>{String(image.imageTitle ?? '')}</p>
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
                <h3>Email</h3>
                <p><a href={`mailto:${college.contact?.emailAddress}`}>{college.contact?.emailAddress || '-'}</a></p>
              </div>
              <div className="contact-item">
                <h3>Phone</h3>
                <p><a href={`tel:${college.contact?.admissionMobileNumber}`}>{college.contact?.admissionMobileNumber || '-'}</a></p>
              </div>
              <div className="contact-item">
                <h3>Website</h3>
                <p>{college.contact?.websiteUrl ? <a href={college.contact.websiteUrl} target="_blank" rel="noopener noreferrer">{college.contact.websiteUrl}</a> : '-'}</p>
              </div>
              <div className="contact-item">
                <h3>Address</h3>
                <p>{college.location?.fullAddress || '-'}</p>
                <p>{location} {college.location?.pincode || ''}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEnquiryForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowEnquiryForm(false)}>x</button>
            <h2>Send Your Enquiry</h2>
            <form onSubmit={handleEnquirySubmit}>
              <input placeholder="Your Name" value={formData.studentName} onChange={(e) => setFormData({ ...formData, studentName: e.target.value })} required />
              <input type="email" placeholder="Your Email" value={formData.studentEmail} onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })} required />
              <input placeholder="Your Phone" value={formData.studentPhone} onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })} required />
              <input placeholder="Interested Course" value={formData.interestedCourse} onChange={(e) => setFormData({ ...formData, interestedCourse: e.target.value })} />
              <textarea placeholder="Your Message" rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
              <button type="submit" className="submit-btn">Send Enquiry</button>
            </form>
          </div>
        </div>
      )}
      {enquirySuccess && <p className="success-msg">Enquiry sent successfully.</p>}
    </div>
  );
};

export default CollegeDetail;
