import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import TicketQRModal from '../components/TicketQRModal';
import { eventsApi, ordersApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [events, setEvents]   = useState([]);
  const [orders, setOrders]   = useState([]);
  const [qrTicket, setQrTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evData, orData] = await Promise.all([
        eventsApi.list({ limit: 20 }),
        ordersApi.myOrders().catch(() => []),
      ]);
      setEvents(evData.events || []);
      setOrders(orData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await eventsApi.list({ search, limit: 20 });
      setEvents(data.events || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Flatten all tickets from all orders for "My Tickets" section
  const allTickets = orders.flatMap(order =>
    (order.tickets || []).map(ticket => ({
      ...ticket,
      order,
      eventName: order.ticketType?.event?.name || `Order #${order.id}`,
      amountPaid: order.totalAmount,
    }))
  );

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <Navbar role="client" />

        <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
          <h1 className="font-mono font-bold text-2xl md:text-3xl">Welcome back, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Discover upcoming events near you</p>
        </div>

        {/* Search */}
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events…"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ev-purple/40"
            />
            <button type="submit" className="px-4 py-2 rounded-lg font-mono font-bold text-sm bg-ev-purple text-white hover:brightness-110 transition-all">
              Search
            </button>
          </form>
        </div>

        {/* Events */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <h2 className="font-mono font-bold text-lg mb-4">Upcoming Events</h2>
          {loading
            ? <p className="text-sm text-muted-foreground font-mono">Loading events…</p>
            : events.length === 0
              ? <p className="text-sm text-muted-foreground font-mono">No events found.</p>
              : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((ev, i) => <EventCard key={ev.id} event={ev} index={i} />)}
                </div>
              )
          }
        </div>

        {/* My Tickets */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <h2 className="font-mono font-bold text-lg mb-4">My Tickets</h2>
          {allTickets.length === 0
            ? <p className="text-sm text-muted-foreground font-mono">No tickets yet. Browse events to get started!</p>
            : (
              <div className="space-y-3">
                {allTickets.map(ticket => (
                  <div key={ticket.id} className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: '#111118' }}>
                    <div>
                      <h4 className="font-mono font-bold text-sm">{ticket.eventName}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Ticket #{ticket.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        ticket.status === 'UNUSED' ? 'bg-ev-green/20 text-ev-green' :
                        ticket.status === 'USED'   ? 'bg-muted text-muted-foreground' :
                        'bg-ev-red/20 text-ev-red'}`}>{ticket.status}</span>
                      <button
                        onClick={() => setQrTicket(ticket)}
                        className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-ev-purple/40 text-ev-purple hover:bg-ev-purple/10 transition-colors">
                        View QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {qrTicket && (
          <TicketQRModal
            ticket={qrTicket}
            eventTitle={qrTicket.eventName}
            onClose={() => setQrTicket(null)}
          />
        )}
      </div>
    </div>
  );
}
