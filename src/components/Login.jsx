// // src/components/Auth/Login.js
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "@/lib/nav";
// import { VITE_BACKEND_URL } from "../../../config";
// export default function Login() {
//   const navigate = useNavigate();

//   // If already logged in → go straight to dashboard
//   useEffect(() => {
//     if (localStorage.getItem("token")) {
//       navigate("/dashboard", { replace: true });
//     }
//   }, [navigate]);

//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//   });

//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm({ ...form, [name]: value });
//     setError(""); // Clear error when typing
//   };

//   const handleSubmit = async (e) => {
//   e.preventDefault();
//   setError("");
//   setIsLoading(true);

//   try {
//     const res = await fetch(`${VITE_BACKEND_URL}/auth/login`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(form),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       setError(data.message || "Login failed");
//       setIsLoading(false);
//       return;
//     }

//     // success
//     localStorage.setItem("token", data.token);
//     localStorage.setItem("userEmail", form.email);

//     setShowSuccess(true);

//     setTimeout(() => {
//       navigate("/dashboard", { replace: true });
//     }, 1000);

//   } catch (err) {
//     setError("Backend server not responding");
//     console.log(err);
//   } finally {
//     setIsLoading(false);
//   }
// };


//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
//       <div className="w-full max-w-md">
//         <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
//           {/* Header */}
//           <div className="text-center mb-8">
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
//             <p className="text-gray-600">TravelBudgetly Control Panel</p>
//           </div>

//           {/* Success Message */}
//           {showSuccess && (
//             <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center animate-pulse">
//               Welcome back, Admin! Redirecting...
//             </div>
//           )}

//           {/* Error Message */}
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-center">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Email */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Email Address
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 placeholder="Enter your email"
//                 value={form.email}
//                 onChange={handleChange}
//                 required
//                 className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 name="password"
//                 placeholder="Enter your password"
//                 value={form.password}
//                 onChange={handleChange}
//                 required
//                 className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
//               />
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-70"
//             >
//               {isLoading ? "Signing In..." : "Sign In"}
//             </button>
//           </form>

//           {/* Demo Credentials Hint (Remove this in production!) 
//           <div className="mt-10 p-5 bg-indigo-50 rounded-lg border border-indigo-200 text-center">
//             <p className="text-sm font-semibold text-indigo-900 mb-2">Admin Login Details</p>
//             <p className="text-xs text-indigo-700">Email: Administrator@TravelBudgetlyxmedia.com</p>
//             <p className="text-xs text-indigo-700">Password: Travelbudgetly@admin</p>
//           </div>*/}

         
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@/lib/nav";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";
; // Optional: Heroicons

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${VITE_BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", form.email);
      setShowSuccess(true);

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);
    } catch (err) {
      setError("Backend server not responding");
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">TravelBudgetly Control Panel</p>
          </div>

          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center animate-pulse">
              Welcome back, Admin! Redirecting...
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"} // Toggle type
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all pr-12"
              />
            
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-70"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}