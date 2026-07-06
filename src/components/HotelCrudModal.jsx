import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

const CITIES = [
  'Ahmedabad', 'Bengaluru', 'Chennai', 'Delhi', 'Goa', 
  'Gurgaon', 'Hyderabad', 'Jaipur', 'Kolkata', 'Mumbai', 
  'Noida', 'Pune'
];

export default function HotelCrudModal({ hotel, onClose, onSave }) {
  const isEdit = !!hotel;
  
  const [formData, setFormData] = useState({
    name: '',
    location: 'Delhi',
    price: '',
    rating: '4.0',
    description: '',
    thumbnail: '',
    photos: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        location: hotel.location || 'Delhi',
        price: hotel.price || '',
        rating: hotel.rating || '4.0',
        description: hotel.description || '',
        thumbnail: hotel.thumbnail || '',
        photos: hotel.photos ? hotel.photos.join(', ') : ''
      });
    }
  }, [hotel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) return setError('Hotel name is required.');
    if (!formData.price || Number(formData.price) <= 0) return setError('Please enter a valid price greater than 0.');
    
    const ratingNum = Number(formData.rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return setError('Rating must be a number between 1.0 and 5.0.');
    }

    if (!formData.description.trim()) return setError('Description is required.');

    // Process photo URLs
    let photoArray = [];
    if (formData.photos.trim()) {
      photoArray = formData.photos
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    }

    const payload = {
      name: formData.name.trim(),
      location: formData.location,
      price: String(Number(formData.price).toFixed(2)),
      rating: Number(Number(formData.rating).toFixed(1)),
      description: formData.description.trim(),
      thumbnail: formData.thumbnail.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      photos: photoArray
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        
        {/* Modal Close */}
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Hotel Details' : 'Add New Hotel'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {isEdit ? 'Modify the details of your listing.' : 'Create a brand new hotel listing on the platform.'}
          </p>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fee2e2',
              color: 'var(--danger)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.88rem',
              fontWeight: 600
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Hotel Name */}
          <div className="form-group">
            <label htmlFor="name">Hotel Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. The Grand Palace"
              className="form-input"
              required
            />
          </div>

          {/* Location & Rating row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-input"
                style={{ backgroundColor: 'white', cursor: 'pointer' }}
              >
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rating">Rating (1.0 - 5.0) *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                placeholder="e.g. 4.5"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Price per night */}
          <div className="form-group">
            <label htmlFor="price">Price per Night (INR ₹) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 6500"
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe amenities, surroundings, spa, pool access, near beach etc."
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              required
            />
          </div>

          {/* Thumbnail Image URL */}
          <div className="form-group">
            <label htmlFor="thumbnail">Thumbnail Image URL (Optional)</label>
            <input
              type="url"
              id="thumbnail"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              placeholder="https://example.com/hotel-thumbnail.jpg"
              className="form-input"
            />
          </div>

          {/* Photo Gallery URLs */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="photos">Gallery Images (Optional, comma-separated URLs)</label>
            <textarea
              id="photos"
              name="photos"
              value={formData.photos}
              onChange={handleChange}
              placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
              className="form-input"
              style={{ minHeight: '60px', resize: 'vertical' }}
            />
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '20px'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {isEdit ? 'Save Changes' : 'Create Hotel'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
