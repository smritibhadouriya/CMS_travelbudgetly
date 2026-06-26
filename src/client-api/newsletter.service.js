import axios from 'axios'
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const BASE = `${VITE_BACKEND_URL}/newsletter`

// Admin
export const getNewsletterSubscribers = (params) => axios.get(`${BASE}`, { params })
export const getNewsletterStats       = ()        => axios.get(`${BASE}/stats`)
export const deleteNewsletterSubscriber = (id)   => axios.delete(`${BASE}/${id}`)