import QRCode from 'react-qr-code';

export default function TicketQRModal({ ticket, eventTitle, onClose }) {
  const baseUrl = import.meta.env.VITE_QR_BASE_URL || window.location.origin;
  const qrData = `${baseUrl}/validate-ticket?ticketId=${ticket.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-xl border border-border p-6 max-w-sm w-full mx-4" style={{ backgroundColor: '#111118' }} onClick={e => e.stopPropagation()}>
        <h3 className="font-mono font-bold text-center mb-4">{eventTitle}</h3>
        <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-ev-purple/60 flex items-center justify-center mb-4 p-2" style={{ backgroundColor: '#0a0a0f' }}>
          {qrData ? (
            <QRCode
              value={qrData}
              size={160}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              fgColor="#7c6af7"
              bgColor="#0a0a0f"
            />
          ) : (
            <div className="text-center px-3">
              <span className="text-3xl block mb-2">🎫</span>
              <p className="font-mono text-xs text-muted-foreground">QR Code Not Available</p>
            </div>
          )}
        </div>
        <div className="text-center space-y-1 mb-4">
          <p className="text-xs text-muted-foreground font-mono">Ticket ID: <span className="text-foreground font-bold">#{ticket.id}</span></p>
          <p className="text-xs text-muted-foreground font-mono">Status: <span className={ticket.status === 'UNUSED' ? 'text-ev-green font-bold' : 'text-muted-foreground font-bold'}>{ticket.status}</span></p>
          {ticket.amountPaid && <p className="text-xs text-muted-foreground font-mono">Paid: <span className="font-bold text-foreground">₹{Number(ticket.amountPaid).toFixed(0)}</span></p>}
        </div>
        <p className="text-center text-[10px] text-muted-foreground font-mono mb-4">Present this QR at the gate for entry</p>
        <button onClick={onClose} className="w-full py-2 rounded-lg border border-border text-sm font-mono hover:bg-surface2 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
