import React, { useState } from 'react';
import { X, Star, MapPin, ChevronLeft, ChevronRight, Calendar, Sparkles, ShieldCheck, ReceiptText } from 'lucide-react';
import { openRazorpayCheckout } from '../services/razorpay';

export default function HotelDetailModal({ hotel, onClose, onMockBook, onBookingError }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [booking, setBooking] = useState(null);

  const photos = hotel.photos && hotel.photos.length > 0 
    ? hotel.photos 
    : [hotel.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800'];

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleBookNow = () => {
    setIsBooking(true);

    openRazorpayCheckout({
      amount: Number(hotel.price),
      hotelId: hotel.id,
      hotelName: hotel.name,
      onSuccess: (response) => {
        setIsBooking(false);
        setBookingConfirmed(true);
        setPaymentId(response.razorpay_payment_id);
        setBooking(response.verification?.booking || null);
        onMockBook(hotel.name);
      },
      onFailure: (error) => {
        setIsBooking(false);
        onBookingError?.(error?.description || error?.message || 'Payment failed. Please try again.');
      },
      onDismiss: () => {
        setIsBooking(false);
      }
    });
  };

  const formattedPrice = Number(hotel.price).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {isBooking && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            gap: '16px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid var(--border-color)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <h3 style={{ fontWeight: 700, color: 'var(--primary)' }}>Opening secure Razorpay checkout...</h3>
          </div>
        )}

        {bookingConfirmed && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '20px',
              borderRadius: '50%',
              marginBottom: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={48} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
              Stay Confirmed!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', maxWidth: '340px' }}>
              Your reservation at <strong>{hotel.name}</strong> was verified by the backend and booked successfully.
            </p>
            {booking?.id && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                margin: '12px 0',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                <ReceiptText size={16} color="var(--primary)" />
                <span>Booking Ref: {booking.id}</span>
              </div>
            )}
            {paymentId && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '28px' }}>
                Payment ID: {paymentId}
              </p>
            )}
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: paymentId ? 0 : '28px' }}>
              Dismiss
            </button>
          </div>
        )}

        <div style={{
          position: 'relative',
          height: '350px',
          backgroundColor: '#0f172a'
        }}>
          <img
            src={photos[activePhotoIndex]}
            alt={`${hotel.name} Gallery ${activePhotoIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';
            }}
          />

          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrevPhoto}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNextPhoto}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <ChevronRight size={18} />
              </button>

              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backdropFilter: 'blur(4px)'
              }}>
                {activePhotoIndex + 1} / {photos.length}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {hotel.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="card-location" style={{ marginBottom: 0 }}>
                  <MapPin size={14} />
                  <span>{hotel.location}</span>
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}>
                  <Star size={15} fill="#eab308" color="#eab308" />
                  <span>{Number(hotel.rating).toFixed(1)} / 5.0 Rating</span>
                </span>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{formattedPrice}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>per night</div>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              About the Hotel
            </h4>
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}>
              {hotel.description}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: 'var(--bg-primary)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Calendar size={16} />
                <span>Instant Confirmation & Free Cancellation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <ShieldCheck size={13} />
                <span>Backend-created Razorpay orders with signature verification</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleBookNow}>
              Pay ₹{formattedPrice} & Book
            </button>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
