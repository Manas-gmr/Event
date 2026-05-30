export default function VendorCard({ vendor, showContact = false }) {
  const categoryColors = { food: 'bg-ev-amber/20 text-ev-amber', decor: 'bg-ev-teal/20 text-ev-teal', tech: 'bg-ev-purple/20 text-ev-purple' };

  return (
    <div className="rounded-xl border border-border p-5 transition-all hover:-translate-y-0.5 hover:border-ev-teal/40" style={{ backgroundColor: '#111118' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-ev-teal/20 flex items-center justify-center text-sm font-bold font-mono" style={{ color: '#2dd4bf' }}>
          {vendor.brand_name.charAt(0)}
        </div>
        <div>
          <h4 className="font-mono font-bold text-sm">{vendor.brand_name}</h4>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${categoryColors[vendor.category] || 'bg-surface2 text-muted-foreground'}`}>
            {vendor.category}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{vendor.bio}</p>
      {showContact && (
        <a href={`https://wa.me/${vendor.contact.replace(/\s/g, '').replace('+', '')}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-ev-green/20 text-ev-green hover:bg-ev-green/30 transition-colors">
          💬 WhatsApp
        </a>
      )}
    </div>
  );
}
