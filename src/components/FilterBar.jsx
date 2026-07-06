import React from 'react';
import { SlidersHorizontal, ArrowUpDown, RotateCcw } from 'lucide-react';

export default function FilterBar({
  minPrice,
  maxPrice,
  minRating,
  orderBy,
  onMinPriceChange,
  onMaxPriceChange,
  onMinRatingChange,
  onOrderByChange,
  onResetFilters
}) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        color: 'var(--text-primary)',
        fontWeight: 700,
        fontSize: '1rem'
      }}>
        <SlidersHorizontal size={18} />
        <span>Filters & Sort</span>
      </div>

      {/* Filter Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        alignItems: 'flex-end'
      }}>
        {/* Price Range */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '8px'
          }}>
            Price Range (₹)
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="number"
              placeholder="Min"
              value={minPrice || ''}
              onChange={(e) => onMinPriceChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'var(--font-family)'
              }}
            />
            <span style={{ color: 'var(--text-muted)' }}>-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice || ''}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'var(--font-family)'
              }}
            />
          </div>
        </div>

        {/* Min Rating */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '8px'
          }}>
            Minimum Rating
          </label>
          <select
            value={minRating || ''}
            onChange={(e) => onMinRatingChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'white',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-family)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Ratings</option>
            <option value="4.5">4.5+ Excellent</option>
            <option value="4.0">4.0+ Very Good</option>
            <option value="3.5">3.5+ Good</option>
            <option value="3.0">3.0+ Average</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '8px'
          }}>
            Sort By
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={orderBy || ''}
              onChange={(e) => onOrderByChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Default (Recommended)</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-rating">Rating: High to Low</option>
              <option value="rating">Rating: Low to High</option>
            </select>
          </div>
        </div>

        {/* Reset Action */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onResetFilters}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={16} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
