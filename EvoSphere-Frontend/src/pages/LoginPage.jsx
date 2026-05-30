import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ShinyText from '../components/ShinyText';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const roleMap = { HOST: '/host', CLIENT: '/client', VENDOR: '/vendor' };
      navigate(roleMap[user.role] || '/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-mono font-bold">
            <ShinyText text="EvoSphere" color="#e8e8f0" shineColor="#7c6af7" speed={3} />
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        <div className="rounded-xl border border-border p-6 md:p-8" style={{ backgroundColor: '#111118', borderLeft: '3px solid #7c6af7' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'email',    label: 'Email',    type: 'email',    placeholder: 'you@email.com' },
              { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none transition-shadow"
                  onFocus={e => e.target.style.boxShadow = '0 0 0 2px #7c6af740'}
                  onBlur={e  => e.target.style.boxShadow = 'none'}
                  required
                />
              </div>
            ))}
            {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg font-mono font-bold text-sm bg-ev-purple hover:brightness-110 transition-all disabled:opacity-60"
              style={{ color: '#fff', boxShadow: '0 0 20px rgba(124,106,247,0.3)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/" className="text-ev-purple hover:underline">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
