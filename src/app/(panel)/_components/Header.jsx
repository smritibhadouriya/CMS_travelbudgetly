'use client';
import { useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Header({ config }) {
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
   const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
   const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupReport, setCleanupReport] = useState(null);

  const [userEmail, setUserEmail] = useState("admin@zentrix.media");
  const userName = "Admin User";

  // userEmail lives in localStorage (set at login). Read it AFTER mount so the
  // header can server-render without touching browser-only APIs. Initial state
  // matches the SSR fallback, so there is no hydration mismatch.
  useEffect(() => {
    const stored = localStorage.getItem("userEmail");
    if (stored) setUserEmail(stored);
  }, []);


 // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
  try {
    // Ask the server to delete the httpOnly token cookie.
    await axios.post(`${VITE_BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
  } catch (err) {
    console.error("Logout request failed:", err);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  router.replace("/login");
};

  const handleCleanupImages = async () => {
    setCleanupLoading(true);
    try {
      const res = await axios.post(`${VITE_BACKEND_URL}/admin/cleanup-images`);
      setCleanupReport(res.data);
      toast.success(`Deleted ${res.data.deletedCount} unused images.`); // can replace with modal later
    } catch (err) {
      console.error(err);
      toast.error("Error cleaning images.");
    } finally {
      setCleanupLoading(false);
      setCleanupConfirmOpen(false);
    }
  };
  return (
    <header className="px-8 py-3 flex justify-between items-center"
      style={{ backgroundColor: config.surface_color }}
    >
      <div className='ml-10 lg:ml-0'>
      
      
      </div>
<div className="flex ">
  
            {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
          >
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: config.primary_action_color }}
            >
              {userName.charAt(0)}
            </div>

            {/* Name + Email */}
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-slate-800">
                {userName}
              </div>
              <div className="text-xs text-slate-500">
                {userEmail}
              </div>
            </div>

            <FiChevronDown className="text-slate-500" />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg overflow-hidden z-50">
                 {/* Delete Unused Images */}
              <button
                onClick={() => { setCleanupConfirmOpen(true); setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FiTrash2 />
              Clear Server
              </button>
             <button
  onClick={() => {
    setOpen(false);
    setLogoutOpen(true);
  }}
  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
>
  <FiLogOut />
  Logout
</button>

            </div>
          )}
        </div>
</div>
{logoutOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-md p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-2">Logout</h2>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to logout from your account?
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setLogoutOpen(false)}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
)}
{/* Cleanup Confirmation Modal */}
      {cleanupConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-md p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-2">Delete Unused Images</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete all unused images from the server?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCleanupConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCleanupImages}
                disabled={cleanupLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {cleanupLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
  )}


    </header>
  );
}