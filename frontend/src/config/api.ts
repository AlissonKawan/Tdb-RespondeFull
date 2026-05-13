const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8080';

export { API_BASE_URL };
export default API_BASE_URL;
