import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
import { eventsApi, vendorsApi, ticketsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { exportToCSV } from '../lib/csvExport';

export default function HostDashboard() {
  const { user } = useAuth();
  const [events, setEvents]         = useState([]);
  const [analytics, setAnalytics]   = useState({});
  const [applications, setApplications] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [currentEventForParticipants, setCurrentEventForParticipants] = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [activeTab, setActiveTab]   = useState('events'); // 'events' | 'vendors' | 'participants'
  const [reviewLoading, setReviewLoading] = useState({});

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsApi.myEvents();
      setEvents(data);
      // fetch analytics for first event if any
      if (data.length > 0) {
        const stats = await eventsApi.analytics(data[0].id);
        setAnalytics(stats);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchVendorApplications = async () => {
    if (events.length === 0) return;
    try {
      // Load vendor applications for all host events
      const all = await Promise.all(
        events.map(ev => vendorsApi.eventApplications(ev.id).catch(() => []))
      );
      setApplications(all.flat());
    } catch (e) { console.error(e); }
  };

  const fetchParticipants = async (eventId) => {
    setParticipantsLoading(true);
    setCurrentEventForParticipants(eventId);
    try {
      // Fetch all tickets for this event
      const data = await ticketsApi.eventTickets(eventId);
      setParticipants(data || []);
    } catch (e) {
      console.error('Failed to fetch participants:', e);
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleExportParticipants = () => {
    if (participants.length === 0) {
      alert('No participants to export');
      return;
    }

    const currentEvent = events.find(e => e.id === currentEventForParticipants);
    const eventName = currentEvent?.name || 'participants';
    const timestamp = new Date().toISOString().split('T')[0];

    // Format data for export - handle various possible data structures
    const exportData = participants.map((ticket, idx) => {
      // Handle flexible data structure
      const buyerName = ticket.order?.user?.name || ticket.buyer?.name || ticket.userName || 'N/A';
      const buyerEmail = ticket.order?.user?.email || ticket.buyer?.email || ticket.userEmail || 'N/A';
      const ticketTypeLabel = ticket.ticketType?.label || ticket.type || 'N/A';
      const ticketPrice = ticket.ticketType?.price || ticket.price || 0;
      const status = ticket.status || 'UNKNOWN';
      const usedAt = ticket.usedAt ? new Date(ticket.usedAt).toLocaleString() : 'Not used';
      const createdAt = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A';

      return {
        '#': idx + 1,
        'Participant Name': buyerName,
        'Email': buyerEmail,
        'Ticket Category': ticketTypeLabel,
        'Amount (₹)': ticketPrice,
        'Status': status,
        'Entry Time': usedAt,
        'Purchased Date': createdAt,
      };
    });

    exportToCSV(exportData, `${eventName}_participants_${timestamp}.csv`);
  };

  useEffect(() => {
    if (activeTab === 'vendors' && events.length > 0) fetchVendorApplications();
  }, [activeTab, events]);

  const handlePublish = (newEvent) => {
    setEvents([newEvent, ...events]);
    setShowForm(false);
  };

  const handleReview = async (appId, status) => {
    setReviewLoading(r => ({ ...r, [appId]: true }));
    try {
      await vendorsApi.reviewApplication(appId, { status });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status } : a));
    } catch (e) { console.error(e); }
    finally { setReviewLoading(r => ({ ...r, [appId]: false })); }
  };

  const [deleting, setDeleting] = useState({});

  const totalTickets   = events.reduce((s, e) => s + (e.ticketTypes?.reduce((a, t) => a + t.totalQuantity, 0) || e.capacity || 0), 0);
  const published      = events.filter(e => e.status === 'PUBLISHED').length;
  const initials       = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  const tabs = ['events', 'vendors', 'participants'];

  const handleDeleteEvent = async (eventId) => {
    const confirmed = window.confirm('Delete this event? This action cannot be undone.');
    if (!confirmed) return;

    setDeleting(prev => ({ ...prev, [eventId]: true }));
    try {
      const remaining = events.filter(e => e.id !== eventId);
      await eventsApi.delete(eventId);
      setEvents(remaining);
      if (remaining.length > 0) {
        const stats = await eventsApi.analytics(remaining[0].id);
        setAnalytics(stats);
      } else {
        setAnalytics({});
      }
    } catch (e) {
      console.error('Failed to delete event', e);
      alert(e.message || 'Could not delete event.');
    } finally {
      setDeleting(prev => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <Navbar role="host" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-6">

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl border border-border p-5 bg-surface">
                <div className="w-14 h-14 rounded-full bg-ev-purple/20 flex items-center justify-center text-xl font-bold font-mono mb-3" style={{ color: '#7c6af7' }}>{initials}</div>
                <h3 className="font-mono font-bold">{user?.name}</h3>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              {[
                ['Total Events',   events.length,  '#7c6af7'],
                ['Published',      published,      '#2dd4bf'],
                ['Total Capacity', totalTickets,   '#f59e0b'],
                ...(analytics.revenue !== undefined ? [['Revenue (₹)', `${Number(analytics.revenue).toFixed(0)}`, '#4ade80']] : []),
              ].map(([label, val, color]) => (
                <div key={label} className="rounded-xl border border-border p-4 bg-surface" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
                  <p className="text-xs text-muted-foreground font-mono">{label}</p>
                  <p className="text-2xl font-mono font-bold mt-1" style={{ color }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Main */}
            <div className="lg:col-span-3 space-y-6">
              {/* Tab bar */}
              <div className="flex gap-2 border-b border-border pb-3">
                {tabs.map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`text-xs font-mono font-bold px-4 py-1.5 rounded-lg transition-colors capitalize ${activeTab === t ? 'bg-ev-purple text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                    {t === 'vendors' ? '🏪 Vendors' : '🎟 Events'}
                  </button>
                ))}
              </div>

              {/* Events Tab */}
              {activeTab === 'events' && (
                <>
                  <button onClick={() => setShowForm(!showForm)}
                    className="px-6 py-2.5 rounded-lg font-mono font-bold text-sm bg-ev-purple hover:brightness-110 transition-all"
                    style={{ color: '#fff', boxShadow: '0 0 20px rgba(124,106,247,0.3)' }}>
                    {showForm ? '✕ Cancel' : '+ Create Event'}
                  </button>
                  {showForm && <div className="animate-in slide-in-from-top-2 duration-300"><EventForm onPublish={handlePublish} /></div>}
                  {loading ? (
                    <p className="text-sm text-muted-foreground font-mono">Loading events…</p>
                  ) : events.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-mono">No events yet. Create your first one!</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {events.map((ev, i) => (
                        <div key={ev.id} className="relative">
                          <EventCard event={ev} index={i} role={user?.role} />
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            disabled={deleting[ev.id]}
                            className="absolute bottom-4 right-4 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          >
                            {deleting[ev.id] ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Vendors Tab */}
              {activeTab === 'vendors' && (
                <div className="space-y-3">
                  {applications.length === 0
                    ? <p className="text-sm text-muted-foreground font-mono">No vendor applications yet.</p>
                    : applications.map(app => (
                      <div key={app.id} className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: '#111118' }}>
                        <div>
                          <h4 className="font-mono font-bold text-sm">{app.vendor?.businessName || 'Vendor'}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{app.message}</p>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                            app.status === 'APPROVED' ? 'bg-ev-green/20 text-ev-green' :
                            app.status === 'REJECTED' ? 'bg-red-900/30 text-red-400' :
                            'bg-ev-amber/20 text-ev-amber'}`}>{app.status}</span>
                        </div>
                        {app.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button disabled={reviewLoading[app.id]} onClick={() => handleReview(app.id, 'APPROVED')}
                              className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-ev-green/20 text-ev-green hover:bg-ev-green/30 transition-colors disabled:opacity-50">
                              ✓ Approve
                            </button>
                            <button disabled={reviewLoading[app.id]} onClick={() => handleReview(app.id, 'REJECTED')}
                              className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50">
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}

              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-mono">No events yet.</p>
                  ) : (
                    <>
                      <div className="flex gap-2 flex-wrap">
                        {events.map(event => (
                          <button
                            key={event.id}
                            onClick={() => fetchParticipants(event.id)}
                            className={`text-xs font-mono font-bold px-4 py-2 rounded-lg transition-colors ${
                              currentEventForParticipants === event.id
                                ? 'bg-ev-purple text-white'
                                : 'bg-surface border border-border hover:bg-surface2'
                            }`}
                          >
                            {event.name}
                          </button>
                        ))}
                      </div>

                      {currentEventForParticipants && (
                        <>
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-mono font-bold">
                              Participants ({participants.length})
                            </h3>
                            <button
                              onClick={handleExportParticipants}
                              disabled={participants.length === 0 || participantsLoading}
                              className="text-xs font-mono font-bold px-4 py-2 rounded-lg bg-ev-green/20 text-ev-green hover:bg-ev-green/30 transition-colors disabled:opacity-50"
                            >
                              📥 Export CSV
                            </button>
                          </div>

                          {participantsLoading ? (
                            <p className="text-sm text-muted-foreground font-mono">Loading participants…</p>
                          ) : participants.length === 0 ? (
                            <p className="text-sm text-muted-foreground font-mono">No participants yet.</p>
                          ) : (
                            <div className="rounded-xl border border-border overflow-hidden bg-surface">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm font-mono">
                                  <thead className="bg-surface2 border-b border-border">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-bold">#</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold">Name</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold">Email</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold">Category</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold">Status</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold">Purchased</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {participants.map((ticket, idx) => (
                                      <tr key={ticket.id} className="hover:bg-surface2 transition-colors">
                                        <td className="px-4 py-3 text-xs">{idx + 1}</td>
                                        <td className="px-4 py-3">{ticket.order?.user?.name || ticket.buyer?.name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-xs">{ticket.order?.user?.email || ticket.buyer?.email || 'N/A'}</td>
                                        <td className="px-4 py-3">{ticket.ticketType?.label || 'N/A'}</td>
                                        <td className="px-4 py-3">
                                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                            ticket.status === 'USED' ? 'bg-ev-green/20 text-ev-green' : 'bg-ev-amber/20 text-ev-amber'
                                          }`}>
                                            {ticket.status}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
