'use client';
// // components/IconPicker.jsx
// import React from "react";
// import * as FaIcons from "react-icons/fa";

// const ICON_MAP = {
//   FaRocket: FaIcons.FaRocket,
//   FaChartLine: FaIcons.FaChartLine,
//   FaArrowUp: FaIcons.FaArrowUp,
//   FaTachometerAlt: FaIcons.FaTachometerAlt,
//   FaBolt: FaIcons.FaBolt,
//   FaSignal: FaIcons.FaSignal,
//   FaChartBar: FaIcons.FaChartBar,
//   FaChartPie: FaIcons.FaChartPie,
//   FaBullseye: FaIcons.FaBullseye,
//   FaUsers: FaIcons.FaUsers,
//   FaUserCheck: FaIcons.FaUserCheck,
//   FaShieldAlt: FaIcons.FaShieldAlt,
//   FaLock: FaIcons.FaLock,
//   FaThumbsUp: FaIcons.FaThumbsUp,
//   FaLightbulb: FaIcons.FaLightbulb,
//   FaCode: FaIcons.FaCode,
//   FaLaptopCode: FaIcons.FaLaptopCode,
//   FaMobileAlt: FaIcons.FaMobileAlt,
//   FaCloud: FaIcons.FaCloud,
//   FaServer: FaIcons.FaServer,
//   FaGlobe: FaIcons.FaGlobe,
//   FaHeadset: FaIcons.FaHeadset,
//   FaSearch: FaIcons.FaSearch,
//   FaEnvelopeOpenText: FaIcons.FaEnvelopeOpenText,
//   FaPaperPlane: FaIcons.FaPaperPlane,
//   FaComments: FaIcons.FaComments,
//   FaDatabase: FaIcons.FaDatabase,
//   FaSitemap: FaIcons.FaSitemap,
//   FaInstagram: FaIcons.FaInstagram,
//   FaTwitter: FaIcons.FaTwitter,
//   FaLinkedinIn: FaIcons.FaLinkedinIn,
//   FaFacebook: FaIcons.FaFacebook,
//   FaEnvelope: FaIcons.FaEnvelope,
//   FaMapMarkerAlt: FaIcons.FaMapMarkerAlt,
// };

// const ICON_OPTIONS = Object.keys(ICON_MAP).map((name) => ({
//   value: name,
//   label: name.replace("Fa", "").replace(/([A-Z])/g, " $1").trim(),
// }));

// const IconPicker = ({ value, onChange }) => {
//   const SelectedIcon = value ? ICON_MAP[value] : null;

//   return (
//     <div>
    

//       <select
//         value={value || ""}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
//           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//       >
//         <option value="">Select an icon</option>
//         {ICON_OPTIONS.map((icon) => (
//           <option key={icon.value} value={icon.value}>
//             {icon.label}
//           </option>
//         ))}
//       </select>

//       {/* Preview */}
//       {SelectedIcon && (
//         <div className="mt-2 flex items-center gap-2 text-gray-700">
//           <SelectedIcon size={18} />
//           <span className="text-xs">{value}</span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default IconPicker;


// src/components/ui/IconPicker.jsx
// Features:
//   - Type karo icon name → suggestions dropdown
//   - Ya paste karo → instantly set
//   - Dropdown se select bhi karo
//   - Selected icon ka actual preview dikhe (name nahi)
//   - TravelBudgetly project ke sare relevant icons

import { useState, useRef, useEffect } from 'react';
import {
  FaSearch, FaShieldAlt, FaChartLine, FaUsers, FaLock,
  FaGlobe, FaHeadset, FaComments, FaEnvelope, FaMapMarkerAlt,
  FaInstagram, FaTwitter, FaLinkedinIn, FaFacebook, FaYoutube,
  FaThumbsUp, FaLightbulb, FaCode, FaServer, FaDatabase,
  FaSitemap, FaPaperPlane, FaEnvelopeOpenText, FaBolt,
  FaChartBar, FaChartPie, FaBullseye, FaUserCheck, FaRocket,
  FaArrowUp, FaTachometerAlt, FaSignal, FaMobileAlt, FaCloud,
  FaLaptopCode,
  // Finance / Money specific
  FaMoneyBillWave, FaCreditCard, FaPiggyBank, FaUniversity,
  FaHandHoldingUsd, FaPercentage, FaWallet, FaCoins,
  FaCalculator, FaFileInvoiceDollar, FaChartArea,
  // Insurance / Protection
  FaHospital, FaCar, FaHome, FaUmbrella, FaHeart,
  FaStethoscope, FaAmbulance, FaClipboardList,
  // Trust / Security
   FaFingerprint, FaEye, FaKey, FaCheckCircle,
  FaStar, FaMedal, FaTrophy, FaCertificate, FaHandshake,
  // India specific
  FaRupeeSign, FaLandmark,
  // Travel
  FaPlane, FaPassport, FaHotel, FaRoute,
  // General useful
  FaArrowRight, FaCheck, FaInfo, FaQuestion,
  FaLeaf, FaSeedling, FaCrown,
} from 'react-icons/fa';

// ── All icons available in IconPicker ──
export const ICON_MAP = {
  // Finance
  FaCreditCard,
  FaMoneyBillWave,
  FaPiggyBank,
  FaUniversity,
  FaHandHoldingUsd,
  FaPercentage,
  FaWallet,
  FaCoins,
  FaCalculator,
  FaFileInvoiceDollar,
  FaRupeeSign,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaChartArea,
  FaArrowUp,
  FaTachometerAlt,
  FaBolt,
  FaSignal,
  // Insurance & Protection
  FaShieldAlt,
  FaLock,
  FaUmbrella,
  FaHospital,
  FaCar,
  FaHome,
  FaHeart,
  FaStethoscope,
  FaAmbulance,
  FaClipboardList,
  // Trust & Credibility
  FaThumbsUp,
  FaCheckCircle,
  FaBullseye,
  FaStar,
  FaMedal,
  FaTrophy,
  FaCertificate,
  FaHandshake,
  FaFingerprint,
  FaEye,
  FaKey,
  // People & Service
  FaUsers,
  FaUserCheck,
  FaHeadset,
  FaComments,
  // Technology
  FaSearch,
  FaGlobe,
  FaCode,
  FaLaptopCode,
  FaMobileAlt,
  FaCloud,
  FaServer,
  FaDatabase,
  FaSitemap,
  FaRocket,
  // Communication
  FaEnvelope,
  FaEnvelopeOpenText,
  FaPaperPlane,
  FaMapMarkerAlt,
  // Social
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaFacebook,
  FaYoutube,
  // India
  FaLandmark,
  // Travel
  FaPlane,
  FaPassport,
  FaHotel,
  FaRoute,
  // General
  FaLightbulb,
  FaLeaf,
  FaSeedling,
  FaCrown,
  FaArrowRight,
  FaCheck,
  FaInfo,
  FaQuestion,
};

const ICON_OPTIONS = Object.keys(ICON_MAP).map(name => ({
  value: name,
  label: name.replace(/^Fa/, '').replace(/([A-Z])/g, ' $1').trim(),
})).sort((a, b) => a.label.localeCompare(b.label));

// ── Exported helper: render icon by name string ──
export const renderIconByName = (name, props = {}) => {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon {...props} />;
};

// ── IconPicker Component ──
const IconPicker = ({ value, onChange, label }) => {
  const [query,     setQuery]     = useState('');
  const [open,      setOpen]      = useState(false);
  const [focused,   setFocused]   = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = ICON_OPTIONS.filter(opt =>
    !query || opt.label.toLowerCase().includes(query.toLowerCase()) || opt.value.toLowerCase().includes(query.toLowerCase())
  );

  const SelectedIcon = value ? ICON_MAP[value] : null;

  const handleSelect = (iconName) => {
    onChange(iconName);
    setQuery('');
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    // If they paste/type exact icon name, auto-select
    if (ICON_MAP[v]) {
      onChange(v);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</label>}

      {/* Input + selected icon preview + dropdown toggle */}
      <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${focused ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-300'} bg-white`}>
        {/* Selected icon preview */}
        {SelectedIcon && (
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-indigo-600">
            <SelectedIcon size={18} />
          </div>
        )}

        {/* Text input */}
        <input
          type="text"
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
          placeholder={value ? value : 'Type icon name or search...'}
          value={query}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); setOpen(true); }}
        />

        {/* Clear button */}
        {value && (
          <button type="button"
            onClick={() => { onChange(''); setQuery(''); }}
            className="text-gray-400 hover:text-red-500 transition-colors text-xs px-1">
            ✕
          </button>
        )}

        {/* Dropdown arrow */}
        <button type="button"
          onClick={() => setOpen(o => !o)}
          className="flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors">
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Current selection label */}
      {value && !query && (
        <p className="mt-1 text-xs text-indigo-600 font-semibold">{value}</p>
      )}

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No icons found</p>
            ) : (
              filtered.map(opt => {
                const Icon = ICON_MAP[opt.value];
                const isSelected = opt.value === value;
                return (
                  <button key={opt.value} type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}>
                    <span className={`flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                      <Icon size={16} />
                    </span>
                    <span className={`text-sm ${isSelected ? 'font-bold text-indigo-700' : 'font-semibold text-gray-700'}`}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span className="ml-auto text-indigo-500">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;