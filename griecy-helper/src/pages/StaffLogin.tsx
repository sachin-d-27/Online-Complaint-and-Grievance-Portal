import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const UserLogin = () => {
  const [form, setForm] = useState<LoginFormData>({ 
    email: "", 
    password: "",
    remember: false 
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(
        "http://localhost:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        }
      );
      const data = await response.json();
      if (!data.success) {
        alert(data.message || "Login failed");
        return;
      }

      // Check user type and redirect accordingly
      const userType = data.user?.userType;
      if (userType !== 'staff') {
        alert(`Access denied. This login is for staff members only. Your account type is: ${userType}`);
        return;
      }

      // Save token and user info to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("userType", userType);
      localStorage.setItem("userInfo", JSON.stringify(data.user));
      
      // Redirect to staff dashboard
      navigate("/staff-dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full flex overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-screen w-full">
          {/* Welcome Section - Extended */}
          <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-green-700 px-16 py-12 flex flex-col justify-center overflow-hidden">
            {/* Geometric shapes overlay */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-16 left-16 w-24 h-4 bg-gradient-to-r from-green-300 to-green-400 rounded-full opacity-80 transform -rotate-45"></div>
              <div className="absolute top-32 right-24 w-16 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full opacity-80 transform rotate-0"></div>
              <div className="absolute bottom-48 left-20 w-20 h-4 bg-gradient-to-r from-green-300 to-green-400 rounded-full opacity-80 transform -rotate-30"></div>
              <div className="absolute bottom-32 right-16 w-28 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full opacity-80 transform rotate-45"></div>
              <div className="absolute top-1/2 left-1/3 w-32 h-6 bg-gradient-to-r from-green-300 to-green-400 rounded-full opacity-60 transform -rotate-12"></div>
              <div className="absolute top-1/4 right-1/3 w-20 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full opacity-70 transform rotate-30"></div>
            </div>

            <div className="relative z-10 max-w-2xl">
              <h1 className="text-6xl lg:text-7xl font-light text-white mb-8 leading-tight">
                Staff Portal
              </h1>
              <p className="text-white/90 text-xl leading-relaxed font-light max-w-lg">
                A user login portal is a secure entry point that allows registered users to access a system or application by verifying their credentials,
                typically a username and password. It serves as a gateway to personalized services, protecting sensitive data by ensuring only authorized 
                individuals can enter. Modern login portals often integrate features such as multi-factor authentication (MFA), password recovery, and single
                sign-on (SSO) for enhanced security and convenience.
              </p>
            </div>
          </div>

          {/* Login Section - Extended */}
          <div className="bg-gray-50 px-16 py-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h2 className="text-green-600 text-xl font-semibold mb-12 text-center uppercase tracking-wider">
                Staff Login
              </h2>

              <div onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div className="relative">
                  <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-lg text-gray-500">
                    👤
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email or phone number"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full pl-14 pr-6 py-4 border-0 rounded-full bg-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm ${
                      errors.email 
                        ? 'ring-2 ring-red-400 bg-red-50' 
                        : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2 ml-4">{errors.email}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="relative">
                  <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-lg text-gray-500">
                    🔒
                  </div>
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full pl-14 pr-6 py-4 border-0 rounded-full bg-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm ${
                      errors.password 
                        ? 'ring-2 ring-red-400 bg-red-50' 
                        : ''
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-2 ml-4">{errors.password}</p>
                  )}
                </div>

                {/* Remember me and Forgot password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={form.remember}
                      onChange={handleChange}
                      className="w-5 h-5 accent-green-600 rounded"
                    />
                    Remember
                  </label>
                  <a href="#" className="text-gray-400 hover:text-green-600 transition-colors duration-300">
                    Forgot password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={handleLogin}
                  className={`w-full py-4 bg-gradient-to-r from-green-600 to-green-600 text-white font-medium rounded-full uppercase tracking-wider transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${
                    isLoading ? 'animate-pulse' : ''
                  }`}
                >
                  {isLoading ? 'Signing in...' : 'Login'}
                </button>

                {/* Additional Options */}
                <button
                  type="button"
                  className="w-full py-4 border border-gray-300 text-gray-600 font-medium rounded-full transition-all duration-300 hover:bg-gray-50 bg-white"
                >
                  Or sign in with Google
                </button>

                <div className="text-center text-sm text-gray-600 mt-6">
                  Don't have an account?{' '}
                  <a href="/staff-signup" className="text-green-600 hover:underline font-medium">
                    Sign up now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;