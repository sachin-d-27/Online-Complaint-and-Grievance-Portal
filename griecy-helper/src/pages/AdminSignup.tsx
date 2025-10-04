import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SignupFormData {
  username: string;
  email: string;
  password: string;
  role: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

const AdminSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupFormData>({ 
    username: "", 
    email: "",
    password: "",
    role: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: "", label: "Select a role" },
    { value: "super-admin", label: "Super Administrator" },
    { value: "admin", label: "Administrator" },
    { value: "system-admin", label: "System Administrator" },
    { value: "content-admin", label: "Content Administrator" },
    { value: "user-admin", label: "User Administrator" }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    } else if (form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = "Password must contain at least one lowercase letter, one uppercase letter, and one number";
    }
    
    if (!form.role) {
      newErrors.role = "Role selection is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(
        "http://localhost:5000/api/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Admin account created successfully! You can now login.");
        navigate("/admin-login");
      } else {
        // Show specific validation errors if available
        if (data.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map((error: any) => error.msg).join('\n');
          alert("Validation failed:\n" + errorMessages);
        } else {
          alert("Signup failed! " + (data.message || "Please try again."));
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleSignup();
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full flex overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-screen w-full">
          {/* Welcome Section - Extended */}
          <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 px-16 py-12 flex flex-col justify-center overflow-hidden">
            {/* Geometric shapes overlay */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-16 left-16 w-24 h-4 bg-gradient-to-r from-purple-300 to-purple-400 rounded-full opacity-80 transform -rotate-45"></div>
              <div className="absolute top-32 right-24 w-16 h-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full opacity-80 transform rotate-0"></div>
              <div className="absolute bottom-48 left-20 w-20 h-4 bg-gradient-to-r from-purple-300 to-purple-400 rounded-full opacity-80 transform -rotate-30"></div>
              <div className="absolute bottom-32 right-16 w-28 h-5 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full opacity-80 transform rotate-45"></div>
              <div className="absolute top-1/2 left-1/3 w-32 h-6 bg-gradient-to-r from-purple-300 to-purple-400 rounded-full opacity-60 transform -rotate-12"></div>
              <div className="absolute top-1/4 right-1/3 w-20 h-4 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full opacity-70 transform rotate-30"></div>
            </div>

            <div className="relative z-10 max-w-2xl">
              <h1 className="text-6xl lg:text-7xl font-light text-white mb-8 leading-tight">
                Join Our Team
              </h1>
              <p className="text-white/90 text-xl leading-relaxed font-light max-w-lg">
                Create your administrative account to access the full control panel. Manage users, 
                content, and system settings with comprehensive administrative privileges.
              </p>
            </div>
          </div>

          {/* Signup Section - Extended */}
          <div className="bg-gray-50 px-16 py-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h2 className="text-purple-600 text-xl font-semibold mb-12 text-center uppercase tracking-wider">
                Admin Registration
              </h2>

              <div onSubmit={handleSubmit} className="space-y-6">
                {/* Username Input */}
                <div className="relative">
                  <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-lg text-gray-500">
                    👤
                  </div>
                  <input
                    name="username"
                    type="text"
                    placeholder="Admin Username"
                    value={form.username}
                    onChange={handleChange}
                    className={`w-full pl-14 pr-6 py-4 border-0 rounded-full bg-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm ${
                      errors.username 
                        ? 'ring-2 ring-red-400 bg-red-50' 
                        : ''
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-2 ml-4">{errors.username}</p>
                  )}
                </div>

                {/* Email Input */}
                <div className="relative">
                  <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-lg text-gray-500">
                    ✉️
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Admin Email Address"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full pl-14 pr-6 py-4 border-0 rounded-full bg-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm ${
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
                    placeholder="Secure Password (6+ characters, mixed case + number)"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full pl-14 pr-6 py-4 border-0 rounded-full bg-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm ${
                      errors.password 
                        ? 'ring-2 ring-red-400 bg-red-50' 
                        : ''
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-2 ml-4">{errors.password}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="relative">
                  <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-lg text-gray-500 z-10">
                    🛡️
                  </div>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={`w-full pl-14 pr-6 py-4 border-0 rounded-full bg-white appearance-none cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm ${
                      errors.role 
                        ? 'ring-2 ring-red-400 bg-red-50' 
                        : ''
                    } ${form.role === '' ? 'text-gray-400' : 'text-gray-900'}`}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value} disabled={role.value === ''}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    ▼
                  </div>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-2 ml-4">{errors.role}</p>
                  )}
                </div>



                {/* Terms and Conditions */}
                <div className="text-sm text-gray-600">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-purple-600 hover:underline font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-purple-600 hover:underline font-medium">
                    Privacy Policy
                  </a>
                </div>

                {/* Signup Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={handleSignup}
                  className={`w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-full uppercase tracking-wider transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${
                    isLoading ? 'animate-pulse' : ''
                  }`}
                >
                  {isLoading ? 'Creating Admin Account...' : 'Create Admin Account'}
                </button>

                <div className="text-center text-sm text-gray-600 mt-6">
                  Already have an admin account?{' '}
                  <a href="/admin-login" className="text-purple-600 hover:underline font-medium">
                    Sign in here
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

export default AdminSignup;