import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUpCard({ role, accentColor, title }) {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    businessName: '', category: '', bio: '', logoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = {
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     role.toUpperCase(),
        ...(role === 'vendor' && {
          businessName: form.businessName,
          category:     form.category,
          bio:          form.bio,
          logoUrl:      form.logoUrl || undefined,
        }),
      };
      await register(body);
      navigate(`/${role}`);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const borderStyle = { borderLeft: `3px solid ${accentColor}` };
  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none transition-shadow';

  const fields = [
    { name: 'name',     label: 'Full Name', type: 'text',     placeholder: 'John Doe' },
    { name: 'email',    label: 'Email',     type: 'email',    placeholder: 'you@email.com' },
    { name: 'password', label: 'Password',  type: 'password', placeholder: '••••••••' },
    ...(role === 'vendor' ? [
      { name: 'businessName', label: 'Business Name',  type: 'text', placeholder: 'My Brand' },
      { name: 'category',     label: 'Category',       type: 'text', placeholder: 'Food / Handicrafts / Tech…' },
      { name: 'bio',          label: 'Bio (optional)',  type: 'text', placeholder: 'Tell hosts about your business' },
      { name: 'logoUrl',      label: 'Logo URL (optional)', type: 'url', placeholder: 'https://example.com/logo.png' },
    ] : []),
  ];

  return (
    <div className="rounded-xl border border-border p-6 md:p-8" style={{ backgroundColor: '#111118', ...borderStyle }}>
      <h3 className="font-mono text-lg font-bold mb-6">{title}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5">{field.label}</label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={form[field.name]}
              onChange={e => setForm({ ...form, [field.name]: e.target.value })}
              className={inputCls}
              onFocus={e  => e.target.style.boxShadow = `0 0 0 2px ${accentColor}40`}
              onBlur={e   => e.target.style.boxShadow = 'none'}
              required={field.name !== 'bio'}
            />
          </div>
        ))}

        {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-mono font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: accentColor, color: '#fff', boxShadow: `0 0 20px ${accentColor}40` }}
        >
          {loading ? 'Creating Account…' : 'Create Account'}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <span className="cursor-pointer hover:underline" style={{ color: accentColor }}
            onClick={() => navigate('/login')}>
            Log in
          </span>
        </p>
      </form>
    </div>
  );
}
