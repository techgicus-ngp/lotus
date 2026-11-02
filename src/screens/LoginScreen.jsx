import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { signIn } from '../services/authService';
import { useToast } from '../components/Toast';
import { IconEmail, IconEye, IconEyeOff, IconLock, IconPersonAdd } from '../icons';

export default function LoginScreen() {
  const { setUser } = useSession();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!email) errs.email = 'Enter email';
    if (!password) errs.password = 'Enter password';
    setErrors(errs);
    if (Object.keys(errs).length) return triggerShake();

    setLoading(true);
    try {
      setUser(await signIn(email, password));
    } catch (err) {
      triggerShake();
      toast(err.message.replace('Exception: ', ''), { error: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-orb o1" /><div className="login-orb o2" />
      <div className="login-orb o3" /><div className="login-orb o4" />
// logo changes 
      <div className={`login-content ${shake ? 'shake' : ''}`}>
        <div className="logo-badge pop-in">
          <img src="logo.jpg" alt="Lotus logo" />
        </div>

        <div className="login-brand fade-down">
          <div className="brand-name">lotusvencon</div>
          <div className="brand-pill">Real Estate Management</div>
        </div>

        <form className="login-card fade-up" onSubmit={onSubmit} noValidate>
          <div className="login-card-head">
            <div className="login-card-icon"><IconLock size={22} /></div>
            <div>
              <div className="login-card-title">Sign In</div>
              <div className="login-card-sub">Welcome back! Please login.</div>
            </div>
          </div>

          <label className={`login-field ${errors.email ? 'has-error' : ''}`}>
            <IconEmail size={20} />
            <input
              type="email" autoComplete="username" placeholder="Email Address"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {errors.email && <div className="field-error">{errors.email}</div>}

          <label className={`login-field ${errors.password ? 'has-error' : ''}`}>
            <IconLock size={20} />
            <input
              type={showPass ? 'text' : 'password'} autoComplete="current-password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="field-suffix" onClick={() => setShowPass((v) => !v)} aria-label="Toggle password">
              {showPass ? <IconEyeOff size={20} /> : <IconEye size={20} />}
            </button>
          </label>
          {errors.password && <div className="field-error">{errors.password}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <Link to="/register" className="register-link fade-in">
          <IconPersonAdd size={15} /> New employee? Register here
        </Link>
      </div>
    </div>
  );
}
