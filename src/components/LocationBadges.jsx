import React from 'react';

const CITIES = [
  'Ahmedabad', 'Bengaluru', 'Chennai', 'Delhi', 'Goa', 
  'Gurgaon', 'Hyderabad', 'Jaipur', 'Kolkata', 'Mumbai', 
  'Noida', 'Pune'
];

export default function LocationBadges({ selectedLocation, onLocationSelect }) {
  return (
    <div style={{
      margin: '24px 0 12px 0'
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '12px'
      }}>
        🏙️ Filter by Location
      </h3>
      
      {/* Scrollable Badges Wrapper */}
      <div style={{
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '8px',
        scrollbarWidth: 'thin',
        msOverflowStyle: 'none'
      }}>
        {/* "All Cities" badge */}
        <button
          onClick={() => onLocationSelect('')}
          style={{
            flexShrink: 0,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.88rem',
            fontWeight: 600,
            border: '1px solid',
            borderColor: selectedLocation === '' ? 'var(--primary)' : 'var(--border-color)',
            backgroundColor: selectedLocation === '' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: selectedLocation === '' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          All Locations
        </button>

        {/* City badges */}
        {CITIES.map((city) => {
          const isSelected = selectedLocation.toLowerCase() === city.toLowerCase();
          return (
            <button
              key={city}
              onClick={() => onLocationSelect(isSelected ? '' : city)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-secondary)',
                color: isSelected ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {city}
            </button>
          );
        })}
      </div>
    </div>
  );
}
