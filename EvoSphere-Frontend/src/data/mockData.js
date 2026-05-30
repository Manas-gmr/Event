export const mockUser = {
  host: { user_id: "u1", name: "Rahul Sharma", email: "rahul@host.com",
          phone: "+91 98765 43210", role: "host", profile_pic_url: null },
  client: { user_id: "u2", name: "Priya Mehta", email: "priya@client.com",
            phone: "+91 91234 56789", role: "client", profile_pic_url: null },
  vendor: { user_id: "u3", name: "Arjun Verma", email: "arjun@vendor.com",
            phone: "+91 99887 76655", role: "vendor", profile_pic_url: null }
};

export const mockEvents = [
  { event_id: "e1", host_id: "u1", title: "TechFest 2026",
    description: "Annual technology festival with workshops, keynotes, and hackathons.",
    event_date: "2026-03-15T10:00:00", location: "Auditorium Block A",
    venue_address: "IIT Delhi, Hauz Khas, New Delhi 110016",
    total_tickets: 500, tickets_remaining: 120, ticket_price: 299,
    banner_url: null, status: "published" },
  { event_id: "e2", host_id: "u1", title: "Startup Pitch Night",
    description: "Pitch your startup idea to top investors in Delhi.",
    event_date: "2026-04-02T18:00:00", location: "Nehru Place Innovation Hub",
    venue_address: "Nehru Place, New Delhi 110019",
    total_tickets: 200, tickets_remaining: 45, ticket_price: 199,
    banner_url: null, status: "published" },
  { event_id: "e3", host_id: "u1", title: "Cultural Fiesta",
    description: "A celebration of art, music and dance across cultures.",
    event_date: "2026-04-20T17:00:00", location: "Siri Fort Auditorium",
    venue_address: "August Kranti Marg, New Delhi 110049",
    total_tickets: 800, tickets_remaining: 300, ticket_price: 0,
    banner_url: null, status: "published" }
];

export const mockVendorProfile = {
  vendor_id: "v1", user_id: "u3", brand_name: "SpiceBite Co.",
  contact: "+91 99887 76655", bio: "Premium catering for college fests.",
  category: "food", logo_url: null
};

export const mockEventVendors = [
  { ev_id: "ev1", event_id: "e1", vendor_id: "v1",
    status: "active", stall_fee_paid: 500, stall_number: "B-12" }
];

export const mockMenuItems = [
  { item_id: "m1", ev_id: "ev1", name: "Masala Chai", description: "Hot spiced tea",
    price: 20, is_available: true },
  { item_id: "m2", ev_id: "ev1", name: "Veg Biryani", description: "Fragrant basmati rice",
    price: 80, is_available: true },
  { item_id: "m3", ev_id: "ev1", name: "Cold Coffee", description: "Chilled brew",
    price: 50, is_available: false }
];

export const mockTickets = [
  { ticket_id: "t1", cust_id: "u2", event_id: "e1",
    qr_token: "QR-EVOSPHERE-2026-T1", status: "active",
    amount_paid: 299, purchased_at: "2026-02-10T14:30:00" }
];

export const mockNotifications = [
  { notif_id: "n1", user_id: "u2", title: "Ticket Confirmed",
    message: "Your ticket for TechFest 2026 is active.", type: "ticket", is_read: false },
  { notif_id: "n2", user_id: "u1", title: "New Vendor Request",
    message: "SpiceBite Co. wants to join TechFest 2026.", type: "vendor", is_read: false }
];
