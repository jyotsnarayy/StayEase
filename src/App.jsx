import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LocationBadges from './components/LocationBadges';
import FilterBar from './components/FilterBar';
import HotelCard from './components/HotelCard';
import HotelDetailModal from './components/HotelDetailModal';
import HotelCrudModal from './components/HotelCrudModal';
import Toast from './components/Toast';
import { api } from './services/api';
import { Loader2, Plus, RefreshCw, AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export default function App() {
  // --- Search & Filters State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [orderBy, setOrderBy] = useState('');

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // --- Core Hotels Data State ---
  const [apiHotels, setApiHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Local Fallback CRUD State ---
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

  // --- Modals & Toasts State ---
  const [activeHotel, setActiveHotel] = useState(null);
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null); // null means create new, otherwise holds hotel object
  const [toasts, setToasts] = useState([]);

  // --- Save local fallback state to localStorage ---
  useEffect(() => {
    localStorage.setItem('stayfinder_created_hotels', JSON.stringify(createdHotels));
  }, [createdHotels]);

  useEffect(() => {
    localStorage.setItem('stayfinder_updated_hotels', JSON.stringify(updatedHotels));
  }, [updatedHotels]);

  useEffect(() => {
    localStorage.setItem('stayfinder_deleted_hotel_ids', JSON.stringify(deletedHotelIds));
  }, [deletedHotelIds]);

  // --- Debounce Search Query ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // reset to first page on search
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, minPrice, maxPrice, minRating, orderBy]);

  // --- Toast Manager Helpers ---
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Fetch API Hotels ---
  const loadHotels = async () => {
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
        // Note: Use returned/count from API or size of list.
        setTotalCount(response.count || response.returned || 0);
      } else {
        throw new Error('Invalid response structure received from hotel API');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch hotels from server.');
      showToast(err.message || 'API connection failed. Operating in local mode.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, [currentPage, debouncedSearch, selectedLocation, minPrice, maxPrice, minRating, orderBy]);

  // --- Unified Hotels List (API + Local CRUD Merging) ---
  // We merge API results with locally created, updated, and deleted ones.
  const getProcessedHotels = () => {
    // 1. Start with the API fetched hotels
    let list = [...apiHotels];

    // 2. Apply updates and filter out deleted items for API hotels
    list = list
      .filter((h) => !deletedHotelIds.includes(h.id))
      .map((h) => {
        if (updatedHotels[h.id]) {
          return { ...h, ...updatedHotels[h.id] };
        }
        return h;
      });

    // 3. Inject locally created hotels that match current search/filter conditions
    const matchingCreated = createdHotels.filter((h) => {
      // Filter by location
      if (selectedLocation && h.location.toLowerCase() !== selectedLocation.toLowerCase()) {
        return false;
      }
      // Filter by search query
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(query);
        const matchesLoc = h.location.toLowerCase().includes(query);
        if (!matchesName && !matchesLoc) return false;
      }
      // Filter by rating
      if (minRating && Number(h.rating) < Number(minRating)) {
        return false;
      }
      // Filter by price range
      if (minPrice && Number(h.price) < Number(minPrice)) {
        return false;
      }
      if (maxPrice && Number(h.price) > Number(maxPrice)) {
        return false;
      }
      return true;
    });

    // Merge created hotels. Prepend them so they are immediately visible.
    let combined = [...matchingCreated, ...list];

    // Apply client-side sorting to created hotels + API list so everything remains sorted correctly
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

  // --- CRUD Functions ---

  const handleCreateHotel = async (hotelData) => {
    try {
      // 1. Try server-side create
      showToast('Creating hotel on server...', 'info');
      const response = await api.createHotel(hotelData);
      
      // If server succeeds, it returns the created hotel.
      // We will save it in createdHotels locally too to ensure persistence in local storage fallback
      const serverHotel = response.data || { ...hotelData, id: response.id || Date.now() };
      setCreatedHotels((prev) => [serverHotel, ...prev]);
      showToast(`Successfully created ${hotelData.name}!`);
    } catch (err) {
      // 2. Local Fallback in case of server failure/restrictions
      const localNewHotel = {
        ...hotelData,
        id: -Date.now() // Negative ID indicates locally-only created item
      };
      setCreatedHotels((prev) => [localNewHotel, ...prev]);
      showToast(`Saved ${hotelData.name} locally (API write locked).`);
    }
    setIsCrudModalOpen(false);
  };

  const handleUpdateHotel = async (id, hotelData) => {
    try {
      showToast('Updating hotel details...', 'info');
      // 1. Try server-side update (only if it is a server-created hotel)
      if (id > 0) {
        await api.updateHotel(id, hotelData);
      }
      
      // 2. Update local state representation
      if (id < 0) {
        // Edit locally created hotel
        setCreatedHotels((prev) =>
          prev.map((h) => (h.id === id ? { ...h, ...hotelData } : h))
        );
      } else {
        // Store edit mapping for server hotel
        setUpdatedHotels((prev) => ({
          ...prev,
          [id]: { id, ...hotelData }
        }));
      }
      showToast(`Updated details for ${hotelData.name}!`);
    } catch (err) {
      // If server write is blocked, still keep updates locally
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
      // 1. Try server-side delete if it is a server hotel
      if (id > 0) {
        await api.deleteHotel(id);
      }

      // 2. Update local state
      if (id < 0) {
        setCreatedHotels((prev) => prev.filter((h) => h.id !== id));
      } else {
        setDeletedHotelIds((prev) => [...prev, id]);
      }
      showToast('Hotel listing deleted successfully.');
    } catch (err) {
      // Fallback
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
      
      {/* Navbar */}
      <Navbar onAddHotelClick={() => {
        setEditingHotel(null);
        setIsCrudModalOpen(true);
      }} />

      {/* Hero Banner & Search */}
      <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Main Content Area */}
      <main className="container" style={{ flexGrow: 1, padding: '40px 20px' }}>
        
        {/* City Badges */}
        <LocationBadges
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
        />

        {/* Filters */}
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

        {/* Section Title / Header */}
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

        {/* Hotels Grid */}
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

            {/* Pagination Controls */}
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

      {/* Footer */}
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

      {/* Modal: View Details */}
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

      {/* Modal: Add/Edit CRUD */}
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

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Spinner animation rules */}
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
