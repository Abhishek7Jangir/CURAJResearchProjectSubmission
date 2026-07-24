import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { getRoleName } from "../../App";

const uniLogo = "/University_logo.png";

const departments = [
  "Department of Architecture",
  "Department of Atmospheric Science",
  "Department of Biochemistry",
  "Department of Biomedical Engineering",
  "Department of Biotechnology",
  "Department of Chemistry",
  "Department of Commerce",
  "Department of Computer Science",
  "Department of Computer Science & Engineering",
  "Department of Culture & Media Studies",
  "Department of Data Science & Analytics",
  "Department of Economics",
  "Department of Education",
  "Department of English",
  "Department of Environmental Science",
  "Department of Health Sciences",
  "Department of Hindi",
  "Department of Hotel and Tourism Management",
  "Department of Linguistics",
  "Department of Management",
  "Department of Mathematics",
  "Department of Microbiology",
  "Department of Pharmacy",
  "Department of Physics",
  "Department of Public Policy, Law and Governance",
  "Department of Social work",
  "Department of Society - Technology Interface",
  "Department of Sports Bio-Sciences",
  "Department of Sports Biomechanics",
  "Department of Sports Psychology",
  "Department of Statistics",
  "Department of Vocational Studies and Skill Development",
  "Department of Yoga",
  "Department of Electronics and Communication Engineering(ECE)"
];

export default function Landing({ onLogin }) {
  const [isSignup, setIsSignup] = useState(true);
  const [activeSection, setActiveSection] = useState("home");
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:via-black dark:to-gray-900 flex flex-col">
      {/* HEADER */}
      <header className="w-full bg-white dark:bg-gray-900 shadow-md fixed top-0 left-0 z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={uniLogo} alt="University Logo" className="w-16 h-16" />
            <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">CURAJ Research</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            <nav className="relative flex gap-8 text-blue-700 dark:text-blue-400 font-semibold">
              {["home", "about", "contact"].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className="relative py-2"
                >
                  {section === "contact" ? "Team" : section.charAt(0).toUpperCase() + section.slice(1)}
                  {activeSection === section && (
                    <motion.div
                      layoutId="underline"
                      className="absolute left-0 right-0 -bottom-0 h-[5px] bg-blue-700 dark:bg-blue-400 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col justify-center items-center px-6 py-24 mt-12">
        <AnimatePresence mode="wait">
          {activeSection === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center"
            >
              {/* LEFT SIDE */}
              <div className="text-center md:text-left space-y-6">
                <h1 className="text-5xl font-bold text-blue-700 dark:text-blue-400">
                  University Research Portal
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Empower professors, HODs, Deans, R&D teams, Finance Officers, and Registrars to collaborate and manage
                  university research efficiently in one unified platform.
                </p>
              </div>

              {/* RIGHT SIDE */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto border border-gray-200 dark:border-gray-700">
                {/* TAB HEADER */}
                <div className="relative flex bg-blue-100 dark:bg-gray-700 rounded-full p-1 mb-8">
                  <motion.div
                    layout
                    className={`absolute top-1 bottom-1 ${
                      isSignup ? "left-1 right-1/2" : "left-1/2 right-1"
                    } bg-blue-600 dark:bg-blue-500 rounded-full`}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  ></motion.div>

                  <button
                    onClick={() => setIsSignup(true)}
                    className={`relative z-10 w-1/2 py-2 font-semibold transition ${
                      isSignup ? "text-gray-900 dark:text-white" : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => setIsSignup(false)}
                    className={`relative z-10 w-1/2 py-2 font-semibold transition ${
                      !isSignup ? "text-gray-900 dark:text-white" : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                {/* FORM AREA */}
                <div className="min-h-[360px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isSignup ? (
                      <motion.div
                        key="signup"
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -80, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full"
                      >
                        <SignupForm onSignupVerified={() => setIsSignup(false)} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signin"
                        initial={{ x: -80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 80, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full"
                      >
                        <SigninForm onLogin={onLogin} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl text-center space-y-6"
            >
              <h2 className="text-4xl font-bold text-blue-700 dark:text-blue-400">About CURAJ Research</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                CURAJ Research is an academic collaboration platform designed to
                streamline university-level research workflows. It empowers
                professors, HODs, deans, R&D teams, finance officers, registrars, and departments to track progress,
                share resources, and publish research outcomes effectively.
              </p>
            </motion.div>
          )}

          {activeSection === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="max-w-5xl w-full"
            >
              <h2 className="text-4xl font-bold text-blue-700 dark:text-blue-400 text-center mb-10">
                Meet the Team
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* LEFT COLUMN — Administration */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Administration
                  </h3>

                  {/* Admin 1 */}
                  <div className="flex items-center gap-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
                    <img
                      src="/admin1.jpg"
                      alt="Admin 1"
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-purple-400"
                    />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Prof. Anand Bhalerao</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Hon’ble Vice Chancellor</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">vc@curaj.ac.in</p>
                    </div>
                  </div>

                  {/* Admin 2 */}
                  <div className="flex items-center gap-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
                    <img
                      src="/admin2.jpg"
                      alt="Admin 2"
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-purple-400"
                    />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dr. Vishvanath Tiwari</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Director Research & Development</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">director.rd@curaj.ac.in</p>
                    </div>
                  </div>

                  {/* Admin 3 */}
                  <div className="flex items-center gap-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
                    <img
                      src="/admin3.jpg"
                      alt="Admin 3"
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-purple-400"
                    />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dr. Muzzammil Hussain</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Assistant Professor</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">mhussain@curaj.ac.in</p>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN — Developers */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Developers
                  </h3>

                  {/* Developer 1 */}
                  <div className="flex items-center gap-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
                    <img
                      src="/aj.jpeg"
                      alt="Developer 1"
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-blue-400"
                    />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Abhishek Jangir</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">abhishekjangir1234aj@gmail.com</p>
                      <a
                        href="https://www.linkedin.com/in/abhishek-jangir-a91a1a263/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-1"
                      >
                        LinkedIn
                      </a>
                    </div>
                  </div>

                  {/* Developer 2 */}
                  <div className="flex items-center gap-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
                    <img
                      src="/as.jpeg"
                      alt="Developer 2"
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-blue-400"
                    />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ajay Soni Verma</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">ajayjisoni197@gmail.com</p>
                      <a
                        href="https://www.linkedin.com/in/ajay-soni-verma-355671258?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-1"
                      >
                        LinkedIn
                      </a>
                    </div>
                  </div>

                  {/* Developer 3 */}
                  <div className="flex items-center gap-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
                    <img
                      src="/tv.png"
                      alt="Developer 3"
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-blue-400"
                    />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tejas Vaidya</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">tejasvaidya123580@gmail.com</p>
                      <a
                        href="https://www.linkedin.com/in/tejas-vaidya-8a2846207/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-1"
                      >
                        LinkedIn
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SignupForm({ onSignupVerified }) {
  const [designation, setDesignation] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("details");
  const [signupData, setSignupData] = useState(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const isDeptOptional = ["vice_chancellor","vc_office","fund","rnd","r&d_helper","rnd_helper","r&d_main","rnd_main","academic_integrity_officer","aio","finance_officer_helper","finance_officer_main","registrar"].includes(designation);

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(e.target);

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      designation,
      department: formData.get('department') || 'N/A'
    };

    if (!payload.email || !payload.email.trim().toLowerCase().endsWith('.curaj.ac.in')) {
      setMessage('Only institutional email addresses ending with .curaj.ac.in are allowed.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setSignupData(payload);
      setStep("otp");
      setMessage('OTP sent to your email. Enter it below to complete registration.');
    } catch (error) {
      setMessage(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!signupData) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      setMessage('Registration successful. Please sign in.');
      setTimeout(() => onSignupVerified?.(), 700);
    } catch (error) {
      setMessage(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!signupData) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch('/api/auth/signup/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      setMessage('OTP resent successfully.');
    } catch (error) {
      setMessage(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 text-center mb-2">
          Verify OTP
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Enter the OTP sent to <span className="font-semibold">{signupData?.email}</span>.
        </p>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          className="input tracking-[0.3em] text-center"
          required
        />
        {message && <p className="text-sm text-center text-blue-600 dark:text-blue-300">{message}</p>}
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="bg-blue-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Verify & Register'}
        </button>
        <button
          type="button"
          onClick={resendOtp}
          disabled={loading}
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline disabled:opacity-50"
        >
          Resend OTP
        </button>
        <button
          type="button"
          onClick={() => { setStep("details"); setOtp(""); setMessage(""); }}
          className="text-gray-600 dark:text-gray-300 text-sm hover:underline"
        >
          Back to signup form
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 text-center mb-2">
        Create an Account
      </h2>

      <select className="input" value={designation} onChange={(e) => setDesignation(e.target.value)} required>
        <option value="">Select Designation</option>
        <option value="pi">PI (Principal Investigator)</option>
        <option value="hod">HOD</option>
        <option value="dean">Dean</option>
        <option value="r&d_helper">R&D Office</option>
        <option value="r&d_main">R&D</option>
        <option value="academic_integrity_officer">Internal Audit Officer (IAO)</option>
        <option value="finance_officer_helper">Finance Office</option>
        <option value="finance_officer_main">Finance Officer</option>
        <option value="registrar">Registrar</option>
        <option value="vc_office">VC Office</option>
        <option value="vice_chancellor">Vice Chancellor</option>
      </select>

      <input type="text" name="name" placeholder="Full Name" className="input" required />
      <input type="email" name="email" placeholder="Email (e.g. name.dept.curaj.ac.in)" className="input" required />

      {!isDeptOptional && (
        <select name="department" className="input" required>
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      )}

      <input type="password" name="password" placeholder="Password" className="input" required />
      {message && <p className="text-sm text-center text-blue-600 dark:text-blue-300">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Sending OTP…' : 'Sign Up'}
      </button>
    </form>
  );
}

function SigninForm({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(e.target);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        })
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem('token', data.token);
        onLogin({ ...data.user, role: getRoleName(data.user.designation) });
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const requestForgotOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setMode("forgotOtp");
      setMessage('OTP sent to your email.');
    } catch (error) {
      setMessage(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyForgotOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      setResetToken(data.resetToken);
      setMode("resetPassword");
      setMessage('OTP verified. Set a new password.');
    } catch (error) {
      setMessage(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (newPassword !== confirmPassword) {
      setLoading(false);
      setMessage('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, resetToken, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setMode("login");
      setForgotOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage('Password changed successfully. Please sign in.');
    } catch (error) {
      setMessage(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (mode === "forgotEmail") {
    return (
      <form onSubmit={requestForgotOtp} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 text-center mb-2">Forgot Password</h2>
        <input
          type="email"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          placeholder="Enter your registered email"
          className="input"
          required
        />
        {message && <p className="text-sm text-center text-blue-600 dark:text-blue-300">{message}</p>}
        <button type="submit" disabled={loading} className="bg-blue-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Sending OTP…' : 'Send OTP'}
        </button>
        <button type="button" onClick={() => { setMode("login"); setMessage(""); }} className="text-gray-600 dark:text-gray-300 text-sm hover:underline">
          Back to sign in
        </button>
      </form>
    );
  }

  if (mode === "forgotOtp") {
    return (
      <form onSubmit={verifyForgotOtp} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 text-center mb-2">Verify OTP</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Enter OTP sent to {forgotEmail}.</p>
        <input
          type="text"
          value={forgotOtp}
          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          className="input tracking-[0.3em] text-center"
          required
        />
        {message && <p className="text-sm text-center text-blue-600 dark:text-blue-300">{message}</p>}
        <button type="submit" disabled={loading || forgotOtp.length !== 6} className="bg-blue-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Verifying…' : 'Verify OTP'}
        </button>
        <button type="button" onClick={() => setMode("forgotEmail")} className="text-gray-600 dark:text-gray-300 text-sm hover:underline">
          Change email
        </button>
      </form>
    );
  }

  if (mode === "resetPassword") {
    return (
      <form onSubmit={resetPassword} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 text-center mb-2">Set New Password</h2>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="input" required />
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="input" required />
        {message && <p className="text-sm text-center text-blue-600 dark:text-blue-300">{message}</p>}
        <button type="submit" disabled={loading} className="bg-blue-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 text-center mb-2">
        Welcome Back
      </h2>
      <input type="email" name="email" placeholder="Email" className="input" required />
      <input type="password" name="password" placeholder="Password" className="input" required />
      {message && <p className="text-sm text-center text-blue-600 dark:text-blue-300">{message}</p>}
      <div className="text-right">
        <button type="button" onClick={() => { setMode("forgotEmail"); setMessage(""); }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Forgot password?
        </button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Signing In…' : 'Sign In'}
      </button>
    </form>
  );
}