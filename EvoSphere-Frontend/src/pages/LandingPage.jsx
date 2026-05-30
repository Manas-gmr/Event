import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShinyText from '../components/ShinyText';
import SignUpCard from '../components/SignUpCard';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const handleDashboard = () => {
    const roleMap = { HOST: '/host', CLIENT: '/client', VENDOR: '/vendor' };
    navigate(roleMap[user?.role] || '/');
  };

  return (
    <div className="relative min-h-screen">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b"
        style={{
          backgroundColor: scrolled ? 'rgba(17,17,24,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderColor: scrolled ? '#2a2a38' : 'transparent',
        }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-mono font-bold">
            <ShinyText text="EvoSphere" color="#e8e8f0" shineColor="#7c6af7" speed={3} />
          </span>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('host')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Host</button>
            <button onClick={() => scrollTo('client')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Attend</button>
            <button onClick={() => scrollTo('vendor')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vendor</button>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button onClick={handleDashboard}
                className="text-sm font-mono font-bold px-4 py-1.5 rounded-lg bg-ev-purple hover:brightness-110 transition-all"
                style={{ color: '#fff' }}>
                Dashboard →
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Log In</Link>
                <button onClick={() => scrollTo('host')}
                  className="text-sm font-mono font-bold px-4 py-1.5 rounded-lg bg-ev-purple hover:brightness-110 transition-all"
                  style={{ color: '#fff' }}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="font-mono font-bold text-4xl md:text-6xl lg:text-7xl mb-4 leading-tight" style={{ color: '#e8e8f0' }}>
            Where Events Come Alive
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8">
            Plan. Discover. Sell. — All in one platform.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <button onClick={() => scrollTo('client')} className="px-6 py-2.5 rounded-lg font-mono font-bold text-sm border border-ev-purple text-ev-purple hover:bg-ev-purple/10 transition-colors">
              Explore Events
            </button>
            <button onClick={() => scrollTo('host')} className="px-6 py-2.5 rounded-lg font-mono font-bold text-sm bg-ev-purple hover:brightness-110 transition-all" style={{ color: '#fff', boxShadow: '0 0 30px rgba(124,106,247,0.3)' }}>
              Host an Event
            </button>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            {[['500+', 'Events Hosted'], ['12K+', 'Tickets Sold'], ['200+', 'Verified Vendors']].map(([num, label]) => (
              <div key={label} className="px-5 py-2.5 rounded-full border border-ev-purple/30 bg-surface/50" style={{ backdropFilter: 'blur(8px)' }}>
                <span className="font-mono font-bold text-ev-purple">{num}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{label}</span>
              </div>
            ))}
          </div>
          <div className="animate-bounce text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Host */}
        <section id="host" className="min-h-screen py-24 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#7c6af7' }} />
              <span className="text-xs font-mono font-bold tracking-widest text-ev-teal mb-3 block">FOR HOSTS</span>
              <h2 className="font-mono font-bold text-2xl md:text-4xl mb-6 leading-tight">Plan Events That People Remember</h2>
              <div className="space-y-3">
                {[['🎟', 'Create & publish events in minutes'], ['📊', 'Track ticket sales in real time'], ['🏪', 'Manage vendor applications effortlessly']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <SignUpCard role="host" accentColor="#7c6af7" title="Create Host Account" />
          </div>
        </section>

        {/* Client */}
        <section id="client" className="min-h-screen py-24 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <SignUpCard role="client" accentColor="#f59e0b" title="Join as Attendee" />
            </div>
            <div className="relative order-1 md:order-2">
              <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-xs font-mono font-bold tracking-widest text-ev-amber mb-3 block">FOR ATTENDEES</span>
              <h2 className="font-mono font-bold text-2xl md:text-4xl mb-6 leading-tight">Discover Events You'll Love</h2>
              <div className="space-y-3">
                {[['🎉', 'Browse hundreds of local events'], ['📱', 'Get QR tickets instantly'], ['🔔', 'Never miss an update']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Vendor */}
        <section id="vendor" className="min-h-screen py-24 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#2dd4bf' }} />
              <span className="text-xs font-mono font-bold tracking-widest text-ev-teal mb-3 block">FOR VENDORS</span>
              <h2 className="font-mono font-bold text-2xl md:text-4xl mb-6 leading-tight">Grow Your Brand at Every Event</h2>
              <div className="space-y-3">
                {[['🏪', 'Get discovered by event hosts'], ['💰', 'Apply to events & list products'], ['📋', 'Manage your catalog per event']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <SignUpCard role="vendor" accentColor="#2dd4bf" title="Join as Vendor" />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <ShinyText text="EvoSphere" color="#e8e8f0" shineColor="#7c6af7" speed={4} className="font-mono font-bold text-lg mb-4 block" />
                <p className="text-xs text-muted-foreground">The all-in-one event management platform.</p>
              </div>
              {[
                ['Product', ['Features', 'Pricing', 'API']],
                ['Company', ['About', 'Blog', 'Careers']],
                ['Connect', ['Twitter', 'Discord', 'GitHub']],
              ].map(([heading, links]) => (
                <div key={heading}>
                  <h4 className="font-mono text-xs font-bold mb-3 text-muted-foreground">{heading}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {links.map(l => <p key={l} className="hover:text-foreground cursor-pointer transition-colors">{l}</p>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
              © 2026 EvoSphere. Built for the events of tomorrow.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
