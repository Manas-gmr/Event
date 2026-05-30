import { useState } from 'react';
import { eventsApi } from '../lib/api';

export default function EventForm({ onPublish }) {
  const [form, setForm] = useState({
    name: '', description: '', eventDate: '', venue: '', capacity: '', bannerUrl: '',
  });
  const [ticketForm, setTicketForm] = useState({
    label: 'General', price: '', totalQuantity: '', saleEndsAt: '',
  });
  const [step, setStep]       = useState('event'); // 'event' | 'ticket'
  const [createdEvent, setCreatedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ev-purple/40 transition-shadow';

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { event } = await eventsApi.create({
        name:        form.name,
        description: form.description,
        venue:       form.venue,
        eventDate:   new Date(form.eventDate).toISOString(),
        capacity:    parseInt(form.capacity),
        bannerUrl:   form.bannerUrl || undefined,
      });
      setCreatedEvent(event);
      setStep('ticket');
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await eventsApi.addTicketType(createdEvent.id, {
        label:         ticketForm.label,
        price:         parseFloat(ticketForm.price) || 0,
        totalQuantity: parseInt(ticketForm.totalQuantity),
        saleEndsAt:    ticketForm.saleEndsAt ? new Date(ticketForm.saleEndsAt).toISOString() : undefined,
      });
      // Publish the event
      const { event: published } = await eventsApi.update(createdEvent.id, { status: 'PUBLISHED' });
      onPublish(published);
    } catch (err) {
      setError(err.message || 'Failed to add ticket type');
    } finally {
      setLoading(false);
    }
  };

  const skipTicket = () => onPublish(createdEvent);

  if (step === 'ticket') {
    return (
      <form onSubmit={handleTicketSubmit} className="rounded-xl border border-border p-6 space-y-4" style={{ backgroundColor: '#111118' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono font-bold">Add Ticket Tier</h3>
          <span className="text-xs text-ev-green font-mono">✓ Event created</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5">Label</label>
            <input className={inputCls} placeholder="General / VIP / Student" value={ticketForm.label}
              onChange={e => setTicketForm({ ...ticketForm, label: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5">Price (₹) — 0 for free</label>
            <input type="number" className={inputCls} placeholder="299" value={ticketForm.price}
              onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5">Total Quantity</label>
            <input type="number" className={inputCls} placeholder="300" value={ticketForm.totalQuantity}
              onChange={e => setTicketForm({ ...ticketForm, totalQuantity: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5">Sale Ends At (optional)</label>
            <input type="datetime-local" className={inputCls} value={ticketForm.saleEndsAt}
              onChange={e => setTicketForm({ ...ticketForm, saleEndsAt: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={skipTicket} className="px-4 py-2 rounded-lg border border-border text-sm font-mono hover:bg-surface2 transition-colors">
            Skip for now
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 rounded-lg font-mono font-bold text-sm bg-ev-purple hover:brightness-110 transition-all disabled:opacity-60"
            style={{ color: '#fff', boxShadow: '0 0 20px rgba(124,106,247,0.3)' }}>
            {loading ? 'Publishing…' : 'Add Ticket & Publish'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleEventSubmit} className="rounded-xl border border-border p-6 space-y-4" style={{ backgroundColor: '#111118' }}>
      <h3 className="font-mono font-bold mb-2">Create New Event</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1.5">Event Name</label>
          <input className={inputCls} placeholder="TechFest 2026" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1.5">Date & Time</label>
          <input type="datetime-local" className={inputCls} value={form.eventDate}
            onChange={e => setForm({ ...form, eventDate: e.target.value })} required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-mono text-muted-foreground mb-1.5">Description</label>
          <textarea className={`${inputCls} h-20 resize-none`} placeholder="Describe your event"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1.5">Venue</label>
          <input className={inputCls} placeholder="Auditorium Block A, Delhi" value={form.venue}
            onChange={e => setForm({ ...form, venue: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1.5">Capacity</label>
          <input type="number" className={inputCls} placeholder="500" value={form.capacity}
            onChange={e => setForm({ ...form, capacity: e.target.value })} required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-mono text-muted-foreground mb-1.5">Banner URL (optional)</label>
          <input className={inputCls} placeholder="https://…" value={form.bannerUrl}
            onChange={e => setForm({ ...form, bannerUrl: e.target.value })} />
        </div>
      </div>
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg font-mono font-bold text-sm bg-ev-purple hover:brightness-110 transition-all disabled:opacity-60"
        style={{ color: '#fff', boxShadow: '0 0 20px rgba(124,106,247,0.3)' }}>
        {loading ? 'Creating…' : 'Next: Add Ticket Tier →'}
      </button>
    </form>
  );
}
