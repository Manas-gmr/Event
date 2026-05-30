import { Link, useNavigate } from 'react-router-dom';
import ShinyText from './ShinyText';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ role = 'host' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Normalize role to lowercase
  const normalizedRole = (role || 'host').toLowerCase();

  const rolePills = {
    host:   { label: 'HOST',   cls: 'bg-ev-purple/20 text-ev-purple border-ev-purple/40' },
    client: { label: 'CLIENT', cls: 'bg-ev-amber/20 text-ev-amber border-ev-amber/40' },
    vendor: { label: 'VENDOR', cls: 'bg-ev-teal/20 text-ev-teal border-ev-teal/40' },
  };
  const pill = rolePills[normalizedRole] || rolePills.host;

  const navLinks = {
    host:   [{ to: '/host', label: 'Dashboard' }],
    client: [{ to: '/client', label: 'Dashboard' }],
    vendor: [{ to: '/vendor', label: 'Dashboard' }],
  };

  const avatarUrl = user?.profilePicUrl || user?.vendorProfile?.logoUrl;
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-mono font-bold">
          <ShinyText text="EvoSphere" color="#e8e8f0" shineColor="#7c6af7" speed={3} />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {(navLinks[normalizedRole] || navLinks.host)?.map(l => (
            <Link key={l.label} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="text-lg hover:opacity-70 transition-opacity"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <NotificationBell />
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${pill.cls}`}>
            {pill.label}
          </span>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex items-center justify-center bg-surface2 cursor-pointer hover:opacity-80"
            title={`Logged in as ${user?.name || ''}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name || 'Avatar'} className="object-cover w-full h-full" />
            ) : (
              <span className="text-xs font-bold font-mono">{initials}</span>
            )}
          </div>
          <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
