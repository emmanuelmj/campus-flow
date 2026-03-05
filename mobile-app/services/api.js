const API_URL = 'http://localhost:8000'; // Change to network IP when testing on physical device

export const loginUser = async (email, password) => {
    // Stub implementation
    return { token: 'mock-token', role: 'STUDENT' };
};

export const fetchWallet = async () => {
    try {
        const response = await fetch(`${API_URL}/wallet`);
        return await response.json();
    } catch (e) {
        return { balance: 1250.50 }; // mock fallback
    }
};

export const payVendor = async (vendorId, amount) => {
    return { status: 'SUCCESS' };
};
