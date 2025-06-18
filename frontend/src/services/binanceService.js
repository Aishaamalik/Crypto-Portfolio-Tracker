import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const binanceService = {
    // Get current price and 24h change for a coin
    async getCoinPrice(coinId) {
        try {
            const response = await axios.get(`${API_URL}/price/${coinId}`);
            console.log(`Price data for ${coinId}:`, response.data); // Debug log
            return response.data;
        } catch (error) {
            console.error(`Error fetching coin price for ${coinId}:`, error);
            throw error;
        }
    },

    // Get 7-day price forecast for a coin
    async getCoinForecast(coinId) {
        try {
            const response = await axios.get(`${API_URL}/forecast/${coinId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching forecast for ${coinId}:`, error);
            throw error;
        }
    },

    // Add a coin manually to portfolio
    async addCoinManually(coinData) {
        try {
            console.log('Calling addCoinManually with data:', coinData); // Debug log
            const response = await axios.post(`${API_URL}/portfolio/manual`, coinData);
            console.log('addCoinManually response:', response.data); // Debug log
            return response.data;
        } catch (error) {
            console.error('Error adding coin:', error);
            console.error('Error response data:', error.response?.data); // Debug log
            console.error('Error response status:', error.response?.status); // Debug log
            throw error;
        }
    },

    // Compare portfolio with market
    async comparePortfolio(userId) {
        try {
            const response = await axios.get(`${API_URL}/compare/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error comparing portfolio:', error);
            throw error;
        }
    },

    // Initialize WebSocket connection for real-time prices
    initWebSocket(onMessage) {
        const ws = new WebSocket('ws://localhost:8000/ws/prices');
        
        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data); // Debug log
                onMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        return ws;
    }
}; 