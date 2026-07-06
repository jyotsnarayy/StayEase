import React from 'react';
import { Hotel, Plus } from 'lucide-react';

export default function Navbar({ onAddHotelClick }) {
  return (
    <header style={{
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '16px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer'
        }} onClick={() => window.location.reload()}>
          <div style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: 8,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Hotel size={22} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--primary)',
              lineHeight: 1
            }}>
              StayFinder
            </h1>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}>
              Hotel Playground API
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button 
            className="btn btn-primary"
            onClick={onAddHotelClick}
          >
            <Plus size={18} />
            <span>Add Hotel</span>
          </button>
        </div>
      </div>
    </header>
  );
}
