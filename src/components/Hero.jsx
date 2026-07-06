import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, SlidersHorizontal, CreditCard } from 'lucide-react';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600"
];

export default function Hero({ searchQuery, onSearchChange }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      position: 'relative',
      height: '340px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textAlign: 'center'
    }}>
      {HERO_IMAGES.map((src, index) => (
        <div
          key={src}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: index === currentImageIndex ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            zIndex: 1
          }}
        />
      ))}

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        zIndex: 2
      }} />

      <div className="container" style={{
        position: 'relative',
        zIndex: 3,
        maxWidth: '700px',
        padding: '0 20px'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          marginBottom: '12px',
          letterSpacing: '-0.02em',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Find Your Perfect Stay
        </h2>
        <p style={{
          fontSize: '1.05rem',
          marginBottom: '18px',
          opacity: 0.95,
          fontWeight: 500,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          Search and book hotels across India's top cities with a single click.
        </p>

        <div className="hero-trust-row">
          <span><ShieldCheck size={15} /> Verified checkout</span>
          <span><SlidersHorizontal size={15} /> Live filters</span>
          <span><CreditCard size={15} /> Razorpay test mode</span>
        </div>

        <div style={{
          position: 'relative',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '4px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            paddingLeft: '16px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search by hotel name or location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              padding: '14px 16px',
              fontSize: '1rem',
              outline: 'none',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-family)',
              color: 'var(--text-primary)',
              backgroundColor: 'transparent'
            }}
          />
        </div>
      </div>
    </div>
  );
}
