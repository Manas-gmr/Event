import { Link } from 'react-router-dom';

const statusColors = {
  PUBLISHED: 'bg-ev-green/20 text-ev-green',
  DRAFT:     'bg-ev-amber/20 text-ev-amber',
  CANCELLED: 'bg-ev-red/20 text-ev-red',
  ONGOING:   'bg-ev-teal/20 text-ev-teal',
  COMPLETED: 'bg-muted text-muted-foreground',
  // lowercase fallback (mock data)
  published: 'bg-ev-green/20 text-ev-green',
  draft:     'bg-ev-amber/20 text-ev-amber',
};

const gradients = [
  'linear-gradient(135deg, #7c6af7, #2dd4bf)',
  'linear-gradient(135deg, #f59e0b, #f87171)',
  'linear-gradient(135deg, #2dd4bf, #4ade80)',
];

export default function EventCard({ event, index = 0, role = 'CLIENT' }) {
  // Normalize role to uppercase
  const normalizedRole = (role || 'CLIENT').toUpperCase();

  // Support both backend shape (id, name, venue, capacity, ticketTypes)
  // and legacy mock shape (event_id, title, location, total_tickets, tickets_remaining, ticket_price)
  const id       = event.id       ?? event.event_id;
  const title    = event.name     ?? event.title ?? 'Untitled Event';
  const location = event.venue    ?? event.location ?? 'Unknown location';
  const status   = event.status;
  const dateVal  = event.eventDate ?? event.event_date;
  const dateObj  = dateVal ? new Date(dateVal) : null;
  const dateText = dateObj && !Number.isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Date unavailable';

  // Ticket info from ticketTypes array (backend) or mock fields
  const minPrice = event.ticketTypes?.length
    ? Math.min(...event.ticketTypes.map(t => Number(t.price)))
    : (event.ticket_price ?? 0);

  const totalQty = event.ticketTypes?.reduce((s, t) => s + t.totalQuantity, 0)
    ?? event.total_tickets ?? event.capacity ?? 0;

  const soldQty  = event.ticketTypes?.reduce((s, t) => s + (t.soldCount || 0), 0) ?? 0;
  const remaining = event.tickets_remaining ?? (totalQty - soldQty);

  const ticketColor = remaining > 200 ? 'text-ev-green' : remaining >= 50 ? 'text-ev-amber' : 'text-ev-red';

  return (
    <Link to={`/event/${id}`} className="block group min-w-0 h-full">
      <div className="rounded-xl border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-ev-purple/60 hover:shadow-lg hover:shadow-ev-purple/10 h-full flex flex-col bg-surface text-card-foreground">
        {event.bannerUrl || event.banner_url
          ? <img src={event.bannerUrl || event.banner_url} alt={title} className="h-32 w-full object-cover" />
          : <div className="h-32 w-full" style={{ background: gradients[index % gradients.length] }} />
        }
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-mono font-bold text-sm leading-tight min-w-0 truncate">{title}</h3>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
              {status}
            </span>
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground">📅 {dateText}</p>
            <p className="text-xs text-muted-foreground">📍 {location}</p>
          </div>
          <div className="flex items-center justify-between pt-2 gap-2 mt-auto min-w-0">
            <span className={`text-xs font-mono font-bold ${ticketColor} flex-1 truncate`}>
              {remaining}/{totalQty} left
            </span>
            {normalizedRole === 'CLIENT' && (
              <span className="font-mono font-bold text-sm whitespace-nowrap flex-shrink-0">
                {minPrice === 0 ? 'FREE' : `₹${minPrice}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
