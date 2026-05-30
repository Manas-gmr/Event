import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function TicketValidation() {
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get('ticketId');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!ticketId) {
      setError('Invalid ticket ID');
      setLoading(false);
      return;
    }

    const fetchTicket = async () => {
      try {
        const data = await api.get(`/api/tickets/public/${ticketId}`, false);
        setTicket(data);
      } catch (err) {
        setError(err.message || 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const handleMarkUsed = async () => {
    if (!ticket || ticket.status === 'USED') return;

    setUpdating(true);
    setMessage('');
    try {
      await api.patch(`/api/tickets/${ticket.id}/status`, { status: 'USED' });
      setTicket({ ...ticket, status: 'USED', usedAt: new Date().toISOString() });
      setMessage('✅ Ticket marked as used!');
    } catch (err) {
      setMessage(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ev-purple mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="rounded-xl border border-border p-6 max-w-sm w-full mx-4" style={{ backgroundColor: '#111118' }}>
          <h3 className="font-mono font-bold text-center mb-4 text-red-400">Error</h3>
          <p className="text-center text-muted-foreground mb-4">{error}</p>
          <button onClick={() => window.history.back()} className="w-full py-2 rounded-lg border border-border text-sm font-mono hover:bg-surface2 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <div className="rounded-xl border border-border p-6 max-w-sm w-full" style={{ backgroundColor: '#111118' }}>
        <h3 className="font-mono font-bold text-center mb-4">Validate Ticket</h3>

        {ticket && (
          <>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground font-mono">
                Event: <span className="text-foreground font-bold">{ticket.order.ticketType.event.name}</span>
              </p>
              <p className="text-sm text-muted-foreground font-mono">
                Ticket ID: <span className="text-foreground font-bold">#{ticket.id}</span>
              </p>
              <p className="text-sm text-muted-foreground font-mono">
                Status: <span className={ticket.status === 'UNUSED' ? 'text-ev-green font-bold' : 'text-red-400 font-bold'}>
                  {ticket.status}
                </span>
              </p>
              {ticket.amountPaid && (
                <p className="text-sm text-muted-foreground font-mono">
                  Paid: <span className="font-bold text-foreground">₹{Number(ticket.amountPaid).toFixed(0)}</span>
                </p>
              )}
              {ticket.usedAt && (
                <p className="text-sm text-muted-foreground font-mono">
                  Used At: <span className="font-bold text-foreground">{new Date(ticket.usedAt).toLocaleString()}</span>
                </p>
              )}
            </div>

            {ticket.status === 'UNUSED' ? (
              <button
                onClick={handleMarkUsed}
                disabled={updating}
                className="w-full py-2 rounded-lg bg-ev-purple text-white font-mono hover:bg-ev-purple/80 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Mark as Used'}
              </button>
            ) : (
              <p className="text-center text-red-400 font-mono">This ticket has already been used</p>
            )}

            {message && (
              <p className={`text-center mt-4 font-mono ${message.includes('✅') ? 'text-ev-green' : 'text-red-400'}`}>
                {message}
              </p>
            )}
          </>
        )}

        <button onClick={() => window.history.back()} className="w-full py-2 mt-4 rounded-lg border border-border text-sm font-mono hover:bg-surface2 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}