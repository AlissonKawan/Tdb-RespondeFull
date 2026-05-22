const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8080' : 'https://tdb-respondefull.onrender.com');
const IA_API_BASE_URL = import.meta.env.VITE_IA_API_URL || 'http://localhost:5000';

export { API_BASE_URL, IA_API_BASE_URL };
export default API_BASE_URL;
