import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { eventsApi, ordersApi, vendorsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  PUBLISHED: 'bg-ev-green/20 text-ev-green',
  DRAFT:     'bg-ev-amber/20 text-ev-amber',
  CANCELLED: 'bg-ev-red/20 text-ev-red',
  ONGOING:   'bg-ev-teal/20 text-ev-teal',
  COMPLETED: 'bg-muted text-muted-foreground',
};

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent]             = useState(null);
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [buyLoading, setBuyLoading]   = useState(false);
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const [showConfirm, setShowConfirm] = useState(null); // ticketTypeId
  const [quantity, setQuantity]       = useState(1);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [error, setError]             = useState('');
  const [vendorApplication, setVendorApplication] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => { fetchEvent(); }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const ev = await eventsApi.get(id);
      setEvent(ev);
      const prods = await vendorsApi.eventProducts(id).catch(() => []);
      setProducts(prods);
      // Check if vendor has applied
      if (user?.role === 'VENDOR') {
        const apps = await vendorsApi.myApplications().catch(() => []);
        const app = apps.find(a => a.eventId === parseInt(id));
        setVendorApplication(app);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleBuy = async () => {
    if (!showConfirm) return;
    setError('');
    setBuyLoading(true);
    try {
      const order = await ordersApi.buy({ ticketTypeId: showConfirm, quantity });
      setPurchasedTickets(order.tickets || []);
      setShowConfirm(null);
      // Refresh event to update soldCount
      const ev = await eventsApi.get(id);
      setEvent(ev);
    } catch (err) {
      setError(err.message || 'Purchase failed');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleVendorApply = async () => {
    setApplyLoading(true);
    try {
      await vendorsApi.apply(parseInt(id), { message: applyMessage });
      // Refresh application status
      const apps = await vendorsApi.myApplications();
      const app = apps.find(a => a.eventId === parseInt(id));
      setVendorApplication(app);
      setApplyMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setApplyLoading(false);
    }
  };

  const role = (user?.role || 'CLIENT').toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-muted-foreground">Loading event…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-mono text-2xl font-bold mb-4">Event not found</h1>
          <Link to="/" className="text-ev-purple hover:underline text-sm font-mono">Go Home</Link>
        </div>
      </div>
    );
  }

  const totalSold = event.ticketTypes?.reduce((s, t) => s + (t.soldCount || 0), 0) || 0;
  const totalQty  = event.ticketTypes?.reduce((s, t) => s + t.totalQuantity, 0) || event.capacity || 0;
  const ticketPct = totalQty > 0 ? ((totalSold / totalQty) * 100) : 0;
  const remaining = totalQty - totalSold;
  const barColor  = remaining > totalQty * 0.4 ? '#4ade80' : remaining > totalQty * 0.1 ? '#f59e0b' : '#f87171';

  // Group products by vendor
  const vendorGroups = {};
  products.forEach(p => {
    const key = p.vendorId;
    if (!vendorGroups[key]) vendorGroups[key] = { vendorId: key, businessName: p.vendor?.businessName || `Vendor #${key}`, products: [] };
    vendorGroups[key].products.push(p);
  });

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <Navbar role={role.toLowerCase()} />

        {/* Hero banner */}
        {event.bannerUrl
          ? <img src={event.bannerUrl} alt={event.name} className="h-48 md:h-64 w-full object-cover" />
          : <div className="h-48 md:h-64 w-full" style={{ background: 'linear-gradient(135deg, #7c6af7, #2dd4bf)' }} />
        }

        <div className="max-w-4xl mx-auto px-4 -mt-12 pb-24">
          <div className="rounded-xl border border-border p-6 md:p-8 bg-surface">

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h1 className="font-mono font-bold text-xl md:text-3xl">{event.name}</h1>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${statusColors[event.status] || 'bg-muted'}`}>{event.status}</span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-full bg-ev-purple/20 flex items-center justify-center text-[10px] font-bold font-mono" style={{ color: '#7c6af7' }}>
                {(event.host?.name || 'H').charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-muted-foreground">
                Hosted by <span className="text-foreground font-bold">{event.host?.name || 'Host'}</span> · {event.venue}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
              <span>📅 {new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>📍 {event.venue}</span>
              <span>👥 Capacity: {event.capacity}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-8">{event.description}</p>

            {/* Role-based content */}
            {role === 'CLIENT' && (
              <>
                {/* Ticket Types */}
                <div className="rounded-xl border border-border p-5 mb-8" style={{ backgroundColor: '#0a0a0f' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono font-bold">{remaining} tickets remaining</p>
                    <span className="text-xs text-muted-foreground font-mono">{totalSold}/{totalQty} sold</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface2 mb-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${ticketPct}%`, backgroundColor: barColor }} />
                  </div>

                  {purchasedTickets.length > 0 ? (
                    <div>
                      <p className="text-ev-green font-mono font-bold mb-3 text-center">✅ Tickets Purchased!</p>
                      <div className="space-y-2">
                        {purchasedTickets.map(t => (
                          <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-ev-purple/30 bg-ev-purple/5">
                            <span className="text-2xl">🎫</span>
                            <div>
                              <p className="font-mono text-xs text-ev-purple font-bold">Ticket #{t.id}</p>
                              <p className="font-mono text-[10px] text-muted-foreground break-all">{t.qrCodeData}</p>
                            </div>
                            <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full ${t.status === 'UNUSED' ? 'bg-ev-green/20 text-ev-green' : 'bg-muted'}`}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {event.ticketTypes?.length > 0 ? event.ticketTypes.map(tt => {
                        const avail = tt.totalQuantity - (tt.soldCount || 0);
                        const expired = tt.saleEndsAt && new Date(tt.saleEndsAt) < new Date();
                        return (
                          <div key={tt.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                            <div>
                              <span className="font-mono font-bold text-sm">{tt.label}</span>
                              <p className="text-xs text-muted-foreground">{avail} left</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold">{Number(tt.price) === 0 ? 'FREE' : `₹${Number(tt.price).toFixed(0)}`}</span>
                              <button
                                disabled={avail === 0 || expired}
                                onClick={() => { setShowConfirm(tt.id); setQuantity(1); }}
                                className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-ev-purple text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                {avail === 0 ? 'Sold Out' : expired ? 'Ended' : 'Buy'}
                              </button>
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-sm text-muted-foreground font-mono">No ticket tiers added yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {role === 'VENDOR' && (
              <div className="rounded-xl border border-border p-5 mb-8" style={{ backgroundColor: '#0a0a0f' }}>
                <h3 className="font-mono font-bold mb-4">Vendor Application</h3>
                {vendorApplication ? (
                  <div className="text-center">
                    <span className={`text-sm font-mono px-3 py-1 rounded-full ${vendorApplication.status === 'APPROVED' ? 'bg-ev-green/20 text-ev-green' : vendorApplication.status === 'PENDING' ? 'bg-ev-amber/20 text-ev-amber' : 'bg-red-400/20 text-red-400'}`}>
                      {vendorApplication.status}
                    </span>
                    {vendorApplication.status === 'APPROVED' && (
                      <p className="text-sm text-muted-foreground mt-2">You can now add products for this event.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ev-teal/40"
                      placeholder="Tell the host why you'd like to participate..."
                      value={applyMessage}
                      onChange={e => setApplyMessage(e.target.value)}
                      rows={3}
                    />
                    <button
                      onClick={handleVendorApply}
                      disabled={applyLoading || !applyMessage.trim()}
                      className="w-full py-2 rounded-lg bg-ev-teal text-black font-mono font-bold hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {applyLoading ? 'Applying...' : 'Apply to Participate'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {role === 'HOST' && event.hostId === user.id && (
              <div className="rounded-xl border border-border p-5 mb-8" style={{ backgroundColor: '#0a0a0f' }}>
                <h3 className="font-mono font-bold mb-4">Event Management</h3>
                <p className="text-sm text-muted-foreground">Host management options would go here.</p>
              </div>
            )}

            {/* Vendors / Products */}
            {Object.values(vendorGroups).length > 0 && (
              <div className="mb-8">
                <h3 className="font-mono font-bold mb-4">Vendors at this Event</h3>
                <div className="space-y-3">
                  {Object.values(vendorGroups).map(vg => (
                    <div key={vg.vendorId} className="rounded-xl border border-border p-4" style={{ backgroundColor: '#0a0a0f' }}>
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedVendor(expandedVendor === vg.vendorId ? null : vg.vendorId)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ev-teal/20 flex items-center justify-center text-xs font-bold" style={{ color: '#2dd4bf' }}>
                            {vg.businessName.charAt(0)}
                          </div>
                          <h4 className="font-mono font-bold text-sm">{vg.businessName}</h4>
                        </div>
                        <span className="text-muted-foreground text-xs">{expandedVendor === vg.vendorId ? '▲' : '▼'}</span>
                      </div>
                      {expandedVendor === vg.vendorId && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          {vg.products.filter(p => p.available !== false).map(p => (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-bold">{p.name}</span>
                                {p.description && <span className="text-xs text-muted-foreground ml-2">{p.description}</span>}
                              </div>
                              <span className="font-mono">₹{Number(p.price).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venue */}
            <div>
              <h3 className="font-mono font-bold mb-3">Venue</h3>
              <p className="text-sm text-muted-foreground mb-3">{event.venue}</p>
              <div className="rounded-xl border border-border h-32 flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
                <span className="text-muted-foreground text-sm">📍 Map coming soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buy Confirm Modal */}
        {role === 'CLIENT' && showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(null)}>
            <div className="rounded-xl border border-border p-6 max-w-sm w-full mx-4" style={{ backgroundColor: '#111118' }} onClick={e => e.stopPropagation()}>
              <h3 className="font-mono font-bold text-center mb-2">Confirm Purchase</h3>
              {(() => {
                const tt = event.ticketTypes?.find(t => t.id === showConfirm);
                return (
                  <>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {event.name} — {tt?.label} — {Number(tt?.price) === 0 ? 'FREE' : `₹${Number(tt?.price).toFixed(0)} each`}
                    </p>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full border border-border font-mono font-bold">−</button>
                      <span className="font-mono font-bold text-lg w-8 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(q => Math.min(tt?.totalQuantity - (tt?.soldCount||0), q + 1))} className="w-8 h-8 rounded-full border border-border font-mono font-bold">+</button>
                    </div>
                    <p className="text-center text-sm font-mono font-bold text-ev-purple mb-4">
                      Total: {Number(tt?.price) === 0 ? 'FREE' : `₹${(Number(tt?.price) * quantity).toFixed(0)}`}
                    </p>
                  </>
                );
              })()}
              {error && <p className="text-xs text-red-400 font-mono text-center mb-3">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(null)} className="flex-1 py-2 rounded-lg border border-border text-sm font-mono">Cancel</button>
                <button onClick={handleBuy} disabled={buyLoading}
                  className="flex-1 py-2 rounded-lg font-mono font-bold text-sm bg-ev-purple text-white hover:brightness-110 disabled:opacity-60 transition-all">
                  {buyLoading ? 'Processing…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
