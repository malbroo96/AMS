import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchCollegeDetails, updateCollegeProfile, fetchCollegeDashboard } from '../../redux/slices/collegeSlice';
import { fetchCollegeCourses, addCourse, updateCourse, deleteCourse } from '../../redux/slices/collegeCourseSlice';
import './CollegeProfileAdmin.css';

const CollegeProfileAdmin: React.FC = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const dispatch = useDispatch();
  const { currentCollege, collegeDashboard, loading } = useSelector((state: any) => state.colleges);
  const { courses } = useSelector((state: any) => state.collegeCourses);
  const [activeTab, setActiveTab] = useState('basic-info');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState<any>({});

  useEffect(() => {
    if (collegeId) {
      dispatch(fetchCollegeDetails(collegeId) as any);
      dispatch(fetchCollegeDashboard(collegeId) as any);
      dispatch(fetchCollegeCourses(collegeId) as any);
    }
  }, [collegeId, dispatch]);

  useEffect(() => {
    if (currentCollege) {
      setFormData(currentCollege);
    }
  }, [currentCollege]);

  const handleSaveProfile = async () => {
    dispatch(updateCollegeProfile({ collegeId, data: formData }) as any);
    setEditMode(false);
  };

  const handleAddCourse = () => {
    dispatch(addCourse({ collegeId, courseData: newCourse }) as any);
    setNewCourse({});
    setShowCourseForm(false);
  };

  const college = currentCollege || {};

  return (
    <div className="college-profile-admin">
      <div className="admin-header">
        <h1>College Profile Management</h1>
        <button 
          className="edit-btn"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Student Views</h3>
          <p className="stat-number">{collegeDashboard?.totalStudentViews || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Enquiries</h3>
          <p className="stat-number">{collegeDashboard?.totalEnquiries || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Interested Students</h3>
          <p className="stat-number">{collegeDashboard?.totalInterestedStudents || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Profile Completion</h3>
          <p className="stat-number">{collegeDashboard?.profileCompletionPercentage || 0}%</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'basic-info' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic-info')}
        >
          Basic Information
        </button>
        <button
          className={`tab ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          Branding
        </button>
        <button
          className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses
        </button>
        <button
          className={`tab ${activeTab === 'placements' ? 'active' : ''}`}
          onClick={() => setActiveTab('placements')}
        >
          Placements
        </button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About College
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'basic-info' && (
          <div className="form-section">
            <h2>Basic Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>College Name</label>
                <input
                  type="text"
                  value={formData.collegeName || ''}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Short Name</label>
                <input
                  type="text"
                  value={formData.shortName || ''}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Establishment Year</label>
                <input
                  type="number"
                  value={formData.establishmentYear || ''}
                  onChange={(e) => setFormData({ ...formData, establishmentYear: parseInt(e.target.value) })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>College Type</label>
                <select
                  value={formData.collegeType || ''}
                  onChange={(e) => setFormData({ ...formData, collegeType: e.target.value })}
                  disabled={!editMode}
                >
                  <option>Select Type</option>
                  <option>Government</option>
                  <option>Private</option>
                  <option>Autonomous</option>
                </select>
              </div>
              <div className="form-group">
                <label>University Affiliation</label>
                <input
                  type="text"
                  value={formData.universityAffiliation || ''}
                  onChange={(e) => setFormData({ ...formData, universityAffiliation: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>NAAC Grade</label>
                <select
                  value={formData.naacGrade || ''}
                  onChange={(e) => setFormData({ ...formData, naacGrade: e.target.value })}
                  disabled={!editMode}
                >
                  <option>Select Grade</option>
                  <option>A++</option>
                  <option>A+</option>
                  <option>A</option>
                  <option>B++</option>
                  <option>B+</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.aicteApproval || false}
                    onChange={(e) => setFormData({ ...formData, aicteApproval: e.target.checked })}
                    disabled={!editMode}
                  />
                  AICTE Approval
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.ugcRecognition || false}
                    onChange={(e) => setFormData({ ...formData, ugcRecognition: e.target.checked })}
                    disabled={!editMode}
                  />
                  UGC Recognition
                </label>
              </div>
            </div>

            {/* Location */}
            <h3>Location Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  value={formData.location?.country || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, country: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.location?.state || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.location?.city || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={formData.location?.pincode || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, pincode: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group full-width">
                <label>Full Address</label>
                <textarea
                  value={formData.location?.fullAddress || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, fullAddress: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
            </div>

            {/* Contact */}
            <h3>Contact Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.contact?.emailAddress || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, emailAddress: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Admission Phone</label>
                <input
                  type="tel"
                  value={formData.contact?.admissionMobileNumber || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, admissionMobileNumber: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Office Phone</label>
                <input
                  type="tel"
                  value={formData.contact?.officeMobileNumber || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, officeMobileNumber: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={formData.contact?.websiteUrl || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, websiteUrl: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
            </div>

            {editMode && (
              <div className="form-actions">
                <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="form-section">
            <h2>Branding</h2>
            <div className="branding-upload">
              <div className="upload-group">
                <label>College Logo</label>
                <div className="image-preview">
                  {formData.logoUrl && <img src={formData.logoUrl} alt="Logo" />}
                </div>
                {editMode && (
                  <input type="file" accept="image/*" onChange={(e) => {
                    // Handle logo upload
                  }} />
                )}
              </div>

              <div className="upload-group">
                <label>Cover Banner</label>
                <div className="image-preview">
                  {formData.coverBannerUrl && <img src={formData.coverBannerUrl} alt="Banner" />}
                </div>
                {editMode && (
                  <input type="file" accept="image/*" onChange={(e) => {
                    // Handle banner upload
                  }} />
                )}
              </div>

              <div className="upload-group">
                <label>Prospectus PDF</label>
                {formData.prospectusUrl && (
                  <a href={formData.prospectusUrl} target="_blank" rel="noopener noreferrer">
                    Download Prospectus
                  </a>
                )}
                {editMode && (
                  <input type="file" accept="application/pdf" onChange={(e) => {
                    // Handle PDF upload
                  }} />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="form-section">
            <div className="section-header">
              <h2>Courses Offered</h2>
              {editMode && (
                <button className="add-btn" onClick={() => setShowCourseForm(true)}>
                  + Add Course
                </button>
              )}
            </div>

            {showCourseForm && editMode && (
              <div className="course-form">
                <input
                  type="text"
                  placeholder="Course Name"
                  value={newCourse.courseName || ''}
                  onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                />
                <select
                  value={newCourse.degreeType || ''}
                  onChange={(e) => setNewCourse({ ...newCourse, degreeType: e.target.value })}
                >
                  <option>Select Degree</option>
                  <option>B.Tech</option>
                  <option>B.Com</option>
                  <option>MBA</option>
                  <option>MCA</option>
                  <option>BCA</option>
                </select>
                <input
                  type="number"
                  placeholder="Duration (years)"
                  value={newCourse.duration || ''}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: parseInt(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Total Seats"
                  value={newCourse.totalSeats || ''}
                  onChange={(e) => setNewCourse({ ...newCourse, totalSeats: parseInt(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Annual Fee"
                  value={newCourse.fees?.annualFee || ''}
                  onChange={(e) => setNewCourse({
                    ...newCourse,
                    fees: { ...newCourse.fees, annualFee: parseFloat(e.target.value) }
                  })}
                />
                <button className="save-btn" onClick={handleAddCourse}>Add Course</button>
                <button className="cancel-btn" onClick={() => setShowCourseForm(false)}>Cancel</button>
              </div>
            )}

            <div className="courses-list">
              {courses.map((course: any) => (
                <div key={course._id} className="course-item">
                  <h3>{course.courseName}</h3>
                  <p>{course.degreeType} • {course.duration} years • {course.totalSeats} seats</p>
                  <p className="fee">Fee: ₹{course.fees?.annualFee}</p>
                  {editMode && (
                    <div className="course-actions">
                      <button>Edit</button>
                      <button onClick={() => dispatch(deleteCourse({ collegeId, courseId: course._id }) as any)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'placements' && (
          <div className="form-section">
            <h2>Placement Statistics</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Placement Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.placements?.placementPercentage || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    placements: { ...formData.placements, placementPercentage: parseFloat(e.target.value) }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Highest Package (LPA)</label>
                <input
                  type="text"
                  value={formData.placements?.highestPackage || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    placements: { ...formData.placements, highestPackage: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Average Package (LPA)</label>
                <input
                  type="text"
                  value={formData.placements?.averagePackage || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    placements: { ...formData.placements, averagePackage: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="form-section">
            <h2>About College</h2>
            <div className="form-group full-width">
              <label>Summary Description</label>
              <textarea
                rows={5}
                value={formData.about?.summaryDescription || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  about: { ...formData.about, summaryDescription: e.target.value }
                })}
                disabled={!editMode}
              />
            </div>
            <div className="form-group full-width">
              <label>Vision Statement</label>
              <textarea
                rows={4}
                value={formData.about?.visionStatement || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  about: { ...formData.about, visionStatement: e.target.value }
                })}
                disabled={!editMode}
              />
            </div>
            <div className="form-group full-width">
              <label>Mission Statement</label>
              <textarea
                rows={4}
                value={formData.about?.missionStatement || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  about: { ...formData.about, missionStatement: e.target.value }
                })}
                disabled={!editMode}
              />
            </div>
            <div className="form-group full-width">
              <label>Principal's Message</label>
              <textarea
                rows={4}
                value={formData.about?.principalMessage || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  about: { ...formData.about, principalMessage: e.target.value }
                })}
                disabled={!editMode}
              />
            </div>
            {editMode && (
              <div className="form-actions">
                <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeProfileAdmin;
