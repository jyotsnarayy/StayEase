import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LocationBadges from './components/LocationBadges';
import FilterBar from './components/FilterBar';
import HotelCard from './components/HotelCard';
import HotelDetailModal from './components/HotelDetailModal';
import HotelCrudModal from './components/HotelCrudModal';
import Toast from './components/Toast';
import { api } from './services/api';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [orderBy, setOrderBy] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [apiHotels, setApiHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createdHotels, setCreatedHotels] = useState(() => {
    const saved = localStorage.getItem('stayfinder_created_hotels');
    return saved ? JSON.parse(saved) : [];
  });
  const [updatedHotels, setUpdatedHotels] = useState(() => {
    const saved = localStorage.getItem('stayfinder_updated_hotels');
    return saved ? JSON.parse(saved) : {};
  });
  const [deletedHotelIds, setDeletedHotelIds] = useState(() => {
    const saved = localStorage.getItem('stayfinder_deleted_hotel_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeHotel, setActiveHotel] = useState(null);
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem('stayfinder_created_hotels', JSON.stringify(createdHotels));
  }, [createdHotels]);

  useEffect(() => {
    localStorage.setItem('stayfinder_updated_hotels', JSON.stringify(updatedHotels));
  }, [updatedHotels]);

  useEffect(() => {
    localStorage.setItem('stayfinder_deleted_hotel_ids', JSON.stringify(deletedHotelIds));
  }, [deletedHotelIds]);

  useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, minPrice, maxPrice, minRating, orderBy]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const response = await api.getHotels({
        search: debouncedSearch,
        location: selectedLocation,
        minPrice,
        maxPrice,
        minRating,
        orderBy,
        limit: ITEMS_PER_PAGE,
        skip
      });

      if (response && response.data) {
        setApiHotels(response.data);
        setTotalCount(response.count || response.returned || 0);
      } else {
        throw new Error('Invalid response structure received from hotel API');
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch hotels from server.');
      showToast(error.message || 'API connection failed. Operating in local mode.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedLocation, minPrice, maxPrice, minRating, orderBy, showToast]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const getProcessedHotels = () => {
    let list = [...apiHotels];

    list = list
      .filter((h) => !deletedHotelIds.includes(h.id))
      .map((h) => {
        if (updatedHotels[h.id]) {
          return { ...h, ...updatedHotels[h.id] };
        }
        return h;
      });

    const matchingCreated = createdHotels.filter((h) => {
      if (selectedLocation && h.location.toLowerCase() !== selectedLocation.toLowerCase()) {
        return false;
      }
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(query);
        const matchesLoc = h.location.toLowerCase().includes(query);
        if (!matchesName && !matchesLoc) return false;
      }
      if (minRating && Number(h.rating) < Number(minRating)) {
        return false;
      }
      if (minPrice && Number(h.price) < Number(minPrice)) {
        return false;
      }
      if (maxPrice && Number(h.price) > Number(maxPrice)) {
        return false;
      }
      return true;
    });

    let combined = [...matchingCreated, ...list];

    if (orderBy === 'price') {
      combined.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (orderBy === '-price') {
      combined.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (orderBy === '-rating') {
      combined.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (orderBy === 'rating') {
      combined.sort((a, b) => Number(a.rating) - Number(b.rating));
    }

    return combined;
  };

  const processedHotels = getProcessedHotels();


  const handleCreateHotel = async (hotelData) => {
    try {
      showToast('Creating hotel on server...', 'info');
      const response = await api.createHotel(hotelData);
      
      const serverHotel = response.data || { ...hotelData, id: response.id || Date.now() };
      setCreatedHotels((prev) => [serverHotel, ...prev]);
      showToast(`Successfully created ${hotelData.name}!`);
    } catch {
      const localNewHotel = {
        ...hotelData,
        id: -Date.now()
      };
      setCreatedHotels((prev) => [localNewHotel, ...prev]);
      showToast(`Saved ${hotelData.name} locally (API write locked).`);
    }
    setIsCrudModalOpen(false);
  };

  const handleUpdateHotel = async (id, hotelData) => {
    try {
      showToast('Updating hotel details...', 'info');
      if (id > 0) {
        await api.updateHotel(id, hotelData);
      }
      
      if (id < 0) {
        setCreatedHotels((prev) =>
          prev.map((h) => (h.id === id ? { ...h, ...hotelData } : h))
        );
      } else {
        setUpdatedHotels((prev) => ({
          ...prev,
          [id]: { id, ...hotelData }
        }));
      }
      showToast(`Updated details for ${hotelData.name}!`);
    } catch {
      if (id > 0) {
        setUpdatedHotels((prev) => ({
          ...prev,
          [id]: { id, ...hotelData }
        }));
      }
      showToast(`Updated ${hotelData.name} in session storage.`);
    }
    setEditingHotel(null);
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hotel listing?')) return;

    try {
      showToast('Deleting hotel listing...', 'info');
      if (id > 0) {
        await api.deleteHotel(id);
      }

      if (id < 0) {
        setCreatedHotels((prev) => prev.filter((h) => h.id !== id));
      } else {
        setDeletedHotelIds((prev) => [...prev, id]);
      }
      showToast('Hotel listing deleted successfully.');
    } catch {
      if (id > 0) {
        setDeletedHotelIds((prev) => [...prev, id]);
      }
      showToast('Hotel deleted from local workspace view.');
    }
  };

  const handleSaveHotel = (payload) => {
    if (editingHotel) {
      handleUpdateHotel(editingHotel.id, payload);
    } else {
      handleCreateHotel(payload);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setOrderBy('');
    showToast('Filters cleared', 'success');
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <Navbar onAddHotelClick={() => {
        setEditingHotel(null);
        setIsCrudModalOpen(true);
      }} />

      <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container" style={{ flexGrow: 1, padding: '40px 20px' }}>
        
        <LocationBadges
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
        />

        <FilterBar
          minPrice={minPrice}
          maxPrice={maxPrice}
          minRating={minRating}
          orderBy={orderBy}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onMinRatingChange={setMinRating}
          onOrderByChange={setOrderBy}
          onResetFilters={handleResetFilters}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '32px',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedLocation ? `Hotels in ${selectedLocation}` : 'Available Properties'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Showing {processedHotels.length} results
            </p>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={loadHotels}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            title="Refresh from API"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 0',
            gap: '12px',
            color: 'var(--text-secondary)'
          }}>
            <Loader2 size={36} className="spin" color="var(--primary)" />
            <p style={{ fontWeight: 600 }}>Loading listings from server...</p>
          </div>
        ) : error && processedHotels.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 0',
            textAlign: 'center',
            backgroundColor: '#fee2e2',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed #fca5a5',
            color: 'var(--danger)'
          }}>
            <AlertCircle size={32} style={{ marginBottom: '12px' }} />
            <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Server Connectivity Error</h4>
            <p style={{ fontSize: '0.9rem', maxWidth: '380px' }}>{error}</p>
            <button className="btn btn-primary" onClick={loadHotels} style={{ marginTop: '16px' }}>
              Retry Connection
            </button>
          </div>
        ) : processedHotels.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 0',
            textAlign: 'center',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
              No properties matched your criteria
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Try adjusting your search queries or clearing filters.
            </p>
            <button className="btn btn-primary" onClick={handleResetFilters} style={{ marginTop: '16px', padding: '8px 16px', fontSize: '0.88rem' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="hotels-grid">
              {processedHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onViewDetails={setActiveHotel}
                  onEditClick={(h) => {
                    setEditingHotel(h);
                    setIsCrudModalOpen(true);
                  }}
                  onDeleteClick={handleDeleteHotel}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '48px'
              }}>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  style={{
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{
                    opacity: currentPage >= totalPages ? 0.5 : 1,
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

      </main>

      <footer style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '24px 0',
        textAlign: 'center',
        marginTop: '60px'
      }}>
        <div className="container">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            &copy; {new Date().getFullYear()} StayFinder. Premium Hotel Search Engine API Demo.
          </p>
        </div>
      </footer>

      {activeHotel && (
        <HotelDetailModal
          hotel={activeHotel}
          onClose={() => setActiveHotel(null)}
          onMockBook={(hotelName) => {
            showToast(`Payment successful! Stay booked at ${hotelName}.`);
          }}
          onBookingError={(message) => {
            showToast(message, 'error');
          }}
        />
      )}

      {isCrudModalOpen && (
        <HotelCrudModal
          hotel={editingHotel}
          onClose={() => {
            setIsCrudModalOpen(false);
            setEditingHotel(null);
          }}
          onSave={handleSaveHotel}
        />
      )}

      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
