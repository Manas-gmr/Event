import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { eventsApi, vendorsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  PENDING:  'bg-ev-amber/20 text-ev-amber',
  APPROVED: 'bg-ev-green/20 text-ev-green',
  REJECTED: 'bg-red-900/20 text-red-400',
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile]           = useState(null);
  const [events, setEvents]             = useState([]);
  const [applications, setApplications] = useState([]);
  const [products, setProducts]         = useState([]);
  const [activeTab, setActiveTab]       = useState('browse');
  const [loading, setLoading]           = useState(true);
  const [applyModal, setApplyModal]     = useState(null); // eventId
  const [applyMsg, setApplyMsg]         = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [productForm, setProductForm]   = useState({ eventId: '', name: '', description: '', price: '', imageUrl: '' });
  const [prodLoading, setProdLoading]   = useState(false);
  const [prodError, setProdError]       = useState('');
  const [editProfile, setEditProfile]   = useState(false);
  const [profileForm, setProfileForm]   = useState({ logoUrl: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prof, evData, apps] = await Promise.all([
        vendorsApi.getProfile().catch(() => null),
        eventsApi.list({ limit: 20 }),
        vendorsApi.myApplications().catch(() => []),
      ]);
      setProfile(prof);
      setProfileForm({
        businessName: prof?.businessName || '',
        category: prof?.category || '',
        bio: prof?.bio || '',
        logoUrl: prof?.logoUrl || '',
      });
      setEvents(evData.events || []);
      setApplications(apps);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    try {
      await vendorsApi.apply(applyModal, { message: applyMsg });
      const apps = await vendorsApi.myApplications();
      setApplications(apps);
      setApplyModal(null);
      setApplyMsg('');
    } catch (err) { alert(err.message); }
    finally { setApplyLoading(false); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setProdError('');
    setProdLoading(true);
    try {
      await vendorsApi.addProduct({
        eventId:     parseInt(productForm.eventId),
        name:        productForm.name,
        description: productForm.description,
        price:       parseFloat(productForm.price),
        imageUrl:    productForm.imageUrl || undefined,
      });
      // reload products for all approved events
      const approvedEventIds = applications.filter(a => a.status === 'APPROVED').map(a => a.eventId);
      const prods = await Promise.all(approvedEventIds.map(id => vendorsApi.eventProducts(id).catch(() => [])));
      setProducts(prods.flat());
      setProductForm({ eventId: '', name: '', description: '', price: '', imageUrl: '' });
    } catch (err) { setProdError(err.message); }
    finally { setProdLoading(false); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await vendorsApi.updateProfile({
        businessName: profileForm.businessName,
        category:     profileForm.category,
        bio:          profileForm.bio,
        logoUrl:      profileForm.logoUrl || undefined,
      });
      setProfile(response.profile || response);
      setEditProfile(false);
    } catch (err) { alert(err.message); }
  };

  const approvedApps = applications.filter(a => a.status === 'APPROVED');
  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ev-teal/40 transition-shadow';

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <Navbar role="vendor" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-6">

            {/* Profile Sidebar */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border p-5 sticky top-24 bg-surface">
                <div className="w-14 h-14 rounded-full bg-ev-teal/20 flex items-center justify-center text-xl font-bold font-mono mb-3" style={{ color: '#2dd4bf' }}>
                  {(profile?.businessName || user?.name || 'V').charAt(0)}
                </div>
                {!editProfile ? (
                  <>
                    {profile?.logoUrl ? (
                      <img
                        src={profile.logoUrl}
                        alt={`${profile.businessName || user?.name} logo`}
                        className="w-20 h-20 rounded-full object-cover mb-3"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-ev-teal/20 flex items-center justify-center text-xl font-bold font-mono mb-3" style={{ color: '#2dd4bf' }}>
                        {(profile?.businessName || user?.name || 'V').charAt(0)}
                      </div>
                    )}
                    <h3 className="font-mono font-bold">{profile?.businessName || user?.name}</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-ev-amber/20 text-ev-amber mt-1 inline-block">{profile?.category || 'Vendor'}</span>
                    <p className="text-xs text-muted-foreground mt-3">{profile?.bio || 'No bio yet.'}</p>
                    <button onClick={() => setEditProfile(true)} className="w-full mt-4 py-2 rounded-lg border border-border text-xs font-mono hover:bg-surface2 transition-colors">Edit Profile</button>
                  </>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <input className={inputCls} placeholder="Business Name" value={profileForm.businessName} onChange={e => setProfileForm({ ...profileForm, businessName: e.target.value })} />
                    <input className={inputCls} placeholder="Category" value={profileForm.category} onChange={e => setProfileForm({ ...profileForm, category: e.target.value })} />
                    <input className={inputCls} placeholder="Logo URL (optional)" type="url" value={profileForm.logoUrl} onChange={e => setProfileForm({ ...profileForm, logoUrl: e.target.value })} />
                    <textarea className={`${inputCls} h-16 resize-none`} placeholder="Bio" value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditProfile(false)} className="flex-1 py-1.5 rounded-lg border border-border text-xs font-mono">Cancel</button>
                      <button type="submit" className="flex-1 py-1.5 rounded-lg bg-ev-teal text-black text-xs font-mono font-bold">Save</button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Main */}
            <div className="lg:col-span-3 space-y-6">
              {/* Tab bar */}
              <div className="flex gap-2 border-b border-border pb-3 flex-wrap">
                {[['browse', '🎉 Browse Events'], ['applications', '📋 My Applications'], ['products', '🛍 My Products']].map(([t, label]) => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`text-xs font-mono font-bold px-4 py-1.5 rounded-lg transition-colors ${activeTab === t ? 'bg-ev-teal text-black' : 'text-muted-foreground hover:text-foreground'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Browse Events */}
              {activeTab === 'browse' && (
                <>
                  {loading
                    ? <p className="text-sm text-muted-foreground font-mono">Loading events…</p>
                    : (
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {events.map((ev, i) => (
                          <div key={ev.id} className="relative">
                            <EventCard event={ev} index={i} role={user?.role} />
                            <button
                              onClick={() => setApplyModal(ev.id)}
                              className="absolute bottom-4 right-4 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-ev-teal/20 text-ev-teal hover:bg-ev-teal/30 transition-colors">
                              Apply
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </>
              )}

              {/* Applications */}
              {activeTab === 'applications' && (
                <div className="space-y-3">
                  {applications.length === 0
                    ? <p className="text-sm text-muted-foreground font-mono">No applications yet. Browse events and apply!</p>
                    : applications.map(app => (
                      <div key={app.id} className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: '#111118' }}>
                        <div>
                          <h4 className="font-mono font-bold text-sm">Event #{app.eventId}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{app.message}</p>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${statusColors[app.status] || 'bg-muted'}`}>{app.status}</span>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* Products */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {approvedApps.length > 0 && (
                    <form onSubmit={handleAddProduct} className="rounded-xl border border-border p-5 space-y-3" style={{ backgroundColor: '#111118' }}>
                      <h3 className="font-mono font-bold text-sm mb-1">Add Product</h3>
                      <select className={inputCls} value={productForm.eventId} onChange={e => setProductForm({ ...productForm, eventId: e.target.value })} required>
                        <option value="">Select event…</option>
                        {approvedApps.map(a => <option key={a.eventId} value={a.eventId}>Event #{a.eventId}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                        <input className={inputCls} placeholder="Product name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                        <input type="number" className={inputCls} placeholder="Price (₹)" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                      </div>
                      <input className={inputCls} placeholder="Description (optional)" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                      {prodError && <p className="text-xs text-red-400 font-mono">{prodError}</p>}
                      <button type="submit" disabled={prodLoading}
                        className="w-full py-2 rounded-lg bg-ev-teal text-black font-mono font-bold text-sm hover:brightness-110 transition-all disabled:opacity-60">
                        {prodLoading ? 'Adding…' : '+ Add Product'}
                      </button>
                    </form>
                  )}
                  {products.length === 0
                    ? <p className="text-sm text-muted-foreground font-mono">No products yet. Get approved for an event first.</p>
                    : products.map(p => (
                      <div key={p.id} className="rounded-xl border border-border p-4 flex items-center justify-between" style={{ backgroundColor: '#111118' }}>
                        <div>
                          <h4 className="font-mono font-bold text-sm">{p.name}</h4>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                        <span className="font-mono font-bold text-sm">₹{Number(p.price).toFixed(0)}</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setApplyModal(null)}>
          <div className="rounded-xl border border-border p-6 max-w-sm w-full mx-4" style={{ backgroundColor: '#111118' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-mono font-bold mb-4">Apply to Event #{applyModal}</h3>
            <form onSubmit={handleApply} className="space-y-3">
              <textarea
                value={applyMsg}
                onChange={e => setApplyMsg(e.target.value)}
                placeholder="Tell the host about your business and why you'd be a great fit…"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none h-24 resize-none"
                required
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setApplyModal(null)} className="flex-1 py-2 rounded-lg border border-border text-sm font-mono">Cancel</button>
                <button type="submit" disabled={applyLoading}
                  className="flex-1 py-2 rounded-lg bg-ev-teal text-black font-mono font-bold text-sm disabled:opacity-60">
                  {applyLoading ? 'Applying…' : 'Send Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
