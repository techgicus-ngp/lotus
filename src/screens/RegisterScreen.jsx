import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerEmployee } from '../services/authService';
import { useToast } from '../components/Toast';
import { IconBack, IconEmail, IconEye, IconEyeOff, IconLock, IconPerson } from '../icons';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e = {};
    if (!form.name) e.name = 'Enter name';
    if (!form.email) e.email = 'Enter email';
    else if (!form.email.includes('@')) e.email = 'Enter valid email';
    if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await registerEmployee({ email: form.email, name: form.name, password: form.password, groupName: '' });
      toast('✓ Registration successful! Please login.');
      navigate(-1);
    } catch (err) {
      toast(err.message.replace('Exception: ', ''), { error: true });
    } finally {
      setLoading(false);
    }
  }

  // NOTE: a plain render function (not a component) so inputs keep focus while typing.
  const renderField = ({ k, label, icon, type = 'text', suffix }) => (
    <div className="form-row" key={k}>
      <label className={`outlined-field ${errors[k] ? 'has-error' : ''}`}>
        <span className="of-icon">{icon}</span>
        <input type={type} placeholder={label} value={form[k]} onChange={set(k)} />
        {suffix}
      </label>
      {errors[k] && <div className="field-error">{errors[k]}</div>}
    </div>
  );

  return (
    <div className="register-page">
      <div className="register-top">
        <button className="icon-btn-glass" onClick={() => navigate(-1)} aria-label="Back"><IconBack size={20} /></button>
        <h2>Associate Registration</h2>
      </div>

      <form className="register-card" onSubmit={onSubmit} noValidate>
        <h3>Create Account</h3>
        <p className="muted">Your account will be activated once an administrator grants access.</p>

        {renderField({ k: 'name', label: 'Full Name', icon: <IconPerson size={20} /> })}
        {renderField({ k: 'email', label: 'Email Address', type: 'email', icon: <IconEmail size={20} /> })}
        {renderField({
          k: 'password', label: 'Password', icon: <IconLock size={20} />, type: showPass ? 'text' : 'password',
          suffix: (
            <button type="button" className="field-suffix" onClick={() => setShowPass((v) => !v)}>
              {showPass ? <IconEyeOff size={20} /> : <IconEye size={20} />}
            </button>
          ),
        })}
        {renderField({
          k: 'confirm', label: 'Confirm Password', icon: <IconLock size={20} />, type: showConfirm ? 'text' : 'password',
          suffix: (
            <button type="button" className="field-suffix" onClick={() => setShowConfirm((v) => !v)}>
              {showConfirm ? <IconEyeOff size={20} /> : <IconEye size={20} />}
            </button>
          ),
        })}

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? <span className="btn-spinner" /> : 'Register'}
        </button>
      </form>
    </div>
  );
}
