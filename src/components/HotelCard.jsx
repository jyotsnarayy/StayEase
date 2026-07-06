import React from 'react';
import { Star, MapPin, Edit3, Trash2, ArrowRight } from 'lucide-react';

export default function HotelCard({ hotel, onViewDetails, onEditClick, onDeleteClick }) {
  // Format price with local currency symbol
  const formattedPrice = Number(hotel.price).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });

  return (
    <div className="card">
      {/* Thumbnail */}
      <div className="card-img-wrapper">
        <img 
          src={hotel.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600'} 
          alt={hotel.name} 
          className="card-img"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';
          }}
        />
        <div className="card-price-badge">
          ₹{formattedPrice} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/ night</span>
        </div>
      </div>

      {/* Content */}
      <div className="card-content">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <h4 className="card-title">{hotel.name}</h4>
          
          {/* Rating */}
          <div className="rating-container">
            <Star size={16} fill="#eab308" color="#eab308" />
            <span>{Number(hotel.rating).toFixed(1)}</span>
          </div>
        </div>

        {/* Location */}
        <div className="card-location">
          <MapPin size={14} className="text-secondary" />
          <span>{hotel.location}</span>
        </div>

        {/* Description */}
        <p className="card-description">
          {hotel.description}
        </p>

        {/* Footer Actions */}
        <div className="card-meta">
          {/* CRUD edit/delete buttons */}
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => onEditClick(hotel)}
              className="btn btn-secondary btn-icon"
              title="Edit Hotel"
              style={{ padding: '6px' }}
            >
              <Edit3 size={15} color="var(--text-secondary)" />
            </button>
            <button
              onClick={() => onDeleteClick(hotel.id)}
              className="btn btn-secondary btn-icon"
              title="Delete Hotel"
              style={{ padding: '6px' }}
            >
              <Trash2 size={15} color="var(--danger)" />
            </button>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => onViewDetails(hotel)}
            className="btn btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              borderRadius: '8px'
            }}
          >
            <span>Details</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
