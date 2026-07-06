const BASE_URL = 'https://demohotelsapi.pythonanywhere.com';

/**
 * Helper to handle fetch responses and handle JSON/error scenarios.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status}`;
    try {
      const errData = await response.json();
      if (errData && errData.message) errorMessage = errData.message;
    } catch (e) {
      // Ignore parsing errors on empty or non-JSON responses
    }
    throw new Error(errorMessage);
  }
  
  // DELETE requests might return no content (204 No Content)
  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}

export const api = {
  /**
   * Fetches the list of hotels based on the provided query filters.
   */
  async getHotels(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.location) params.append('location', filters.location);
    if (filters.minPrice) params.append('min_price', filters.minPrice);
    if (filters.maxPrice) params.append('max_price', filters.maxPrice);
    if (filters.minRating) params.append('min_rating', filters.minRating);
    if (filters.maxRating) params.append('max_rating', filters.maxRating);
    if (filters.orderBy) params.append('order_by', filters.orderBy);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const url = `${BASE_URL}/hotels/?${params.toString()}`;
    return handleResponse(await fetch(url));
  },

  /**
   * Fetches detail for a single hotel by ID.
   */
  async getHotelById(id) {
    const url = `${BASE_URL}/hotels/${id}/`;
    return handleResponse(await fetch(url));
  },

  /**
   * Creates a new hotel.
   */
  async createHotel(hotelData) {
    const url = `${BASE_URL}/hotels/`;
    return handleResponse(await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hotelData),
    }));
  },

  /**
   * Updates an existing hotel's information.
   */
  async updateHotel(id, hotelData) {
    const url = `${BASE_URL}/hotels/${id}/`;
    return handleResponse(await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hotelData),
    }));
  },

  /**
   * Deletes a hotel.
   */
  async deleteHotel(id) {
    const url = `${BASE_URL}/hotels/${id}/`;
    return handleResponse(await fetch(url, {
      method: 'DELETE',
    }));
  }
};
