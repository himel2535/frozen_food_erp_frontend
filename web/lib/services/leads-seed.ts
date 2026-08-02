/** Lead pipeline stages and seed data for CRM leads module. */

export const LEAD_PIPELINE_STAGES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const;

export const LEAD_STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

type Rep = { id?: string; name?: string } | null | undefined;

function addDays(baseDate: string, days: number, hour = 9, minute = 0): string {
  const d = new Date(`${baseDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysAgo(baseDate: string, days: number): string {
  return addDays(baseDate, -days);
}

function weekAgo(baseDate: string, days: number): string {
  return `${daysAgo(baseDate, days)}T10:00:00.000Z`;
}

/** Build ~30 lead records with varied stages, follow-ups, and assignments. */
export function buildLeadSeed(repA: Rep, repB: Rep, today: string) {
  const aId = repA?.id || 'EMP-001';
  const aName = repA?.name || 'John Doe';
  const bId = repB?.id || aId;
  const bName = repB?.name || aName;

  type SeedRow = {
    id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
    source: string;
    status: string;
    priority: string;
    assignedRepId: string | null;
    assignedRepName: string | null;
    expectedValue: number;
    probability: number;
    nextFollowUpAt: string | null;
    nextActionType?: string;
    location?: string;
    notes: string;
    conversionStatus: string;
    linkedDealId: string | null;
    createdAt: string;
  };

  const rows: SeedRow[] = [
    { id: 'LEAD-0001', name: 'Farhana Akter', company: 'Orbital Textiles', phone: '+8801711002200', email: 'farhana@orbitaltextiles.com', source: 'Trade Show', status: 'proposal', priority: 'hot', assignedRepId: aId, assignedRepName: aName, expectedValue: 18000, probability: 55, nextFollowUpAt: addDays(today, 2, 11, 0), nextActionType: 'Meeting', location: 'Gulshan, Dhaka', notes: 'Interested in monthly yarn supply.', conversionStatus: 'open', linkedDealId: 'DEAL-0001', createdAt: weekAgo(today, 14) },
    { id: 'LEAD-0002', name: 'David Bose', company: 'Blue Fern Retail', phone: '+8801919003311', email: 'david@bluefern.io', source: 'Website', status: 'new', priority: 'warm', assignedRepId: aId, assignedRepName: aName, expectedValue: 9400, probability: 30, nextFollowUpAt: addDays(today, 0, 14, 30), nextActionType: 'Call', location: 'Banani, Dhaka', notes: 'Wants bundled supply and portal access.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 3) },
    { id: 'LEAD-0003', name: 'Rashida Khan', company: 'Happy Kids Mart', phone: '+8801811223344', email: 'rashida@happykidsmart.com', source: 'Referral', status: 'contacted', priority: 'hot', assignedRepId: bId, assignedRepName: bName, expectedValue: 12500, probability: 45, nextFollowUpAt: addDays(today, -2, 10, 0), nextActionType: 'Call', location: 'Mirpur, Dhaka', notes: 'Referred by Orbital Textiles.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 8) },
    { id: 'LEAD-0004', name: 'Tanvir Hossain', company: 'PlayZone Dhaka', phone: '+8801711556677', email: 'tanvir@playzone.bd', source: 'Facebook', status: 'new', priority: 'cold', assignedRepId: null, assignedRepName: null, expectedValue: 6200, probability: 20, nextFollowUpAt: addDays(today, 0, 16, 0), nextActionType: 'WhatsApp', location: 'Uttara, Dhaka', notes: 'Inbound message about educational toy sets.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 1) },
    { id: 'LEAD-0005', name: 'Nusrat Jahan', company: 'Rainbow Stationery', phone: '+8801911889900', email: 'nusrat@rainbowstationery.com', source: 'Facebook', status: 'qualified', priority: 'hot', assignedRepId: bId, assignedRepName: bName, expectedValue: 85000, probability: 65, nextFollowUpAt: addDays(today, 0, 15, 30), nextActionType: 'Call', location: 'Uttara, Dhaka', notes: 'Asked for MOQ on puzzle sets. Hot lead.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 5) },
    { id: 'LEAD-0006', name: 'Imran Chowdhury', company: 'Metro Gift House', phone: '+8801611445566', email: 'imran@metrogift.com', source: 'Trade Show', status: 'qualified', priority: 'hot', assignedRepId: aId, assignedRepName: aName, expectedValue: 22000, probability: 60, nextFollowUpAt: addDays(today, -5, 9, 0), nextActionType: 'Call', location: 'Motijheel, Dhaka', notes: 'Ready for commercial proposal. Overdue follow-up.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 18) },
    { id: 'LEAD-0007', name: 'Sadia Rahman', company: 'Little Learners School', phone: '+8801711998877', email: 'sadia@littlelearners.edu', source: 'Website', status: 'lost', priority: 'cold', assignedRepId: bId, assignedRepName: bName, expectedValue: 4500, probability: 10, nextFollowUpAt: addDays(today, -10, 9, 0), nextActionType: 'Email', location: 'Dhanmondi, Dhaka', notes: 'Budget constraints.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 30) },
    { id: 'LEAD-0008', name: 'Karim Uddin', company: 'Star Bazaar Chain', phone: '+8801811776655', email: 'karim@starbazaar.com', source: 'Referral', status: 'won', priority: 'warm', assignedRepId: aId, assignedRepName: aName, expectedValue: 31000, probability: 100, nextFollowUpAt: null, nextActionType: 'Call', location: 'Chittagong', notes: 'Converted after pricing review.', conversionStatus: 'converted', linkedDealId: null, createdAt: weekAgo(today, 25) },
    { id: 'LEAD-0009', name: 'Ayesha Begum', company: 'Bright Toys Ltd', phone: '+8801711223344', email: 'ayesha@brighttoys.com', source: 'Facebook Ads', status: 'contacted', priority: 'warm', assignedRepId: aId, assignedRepName: aName, expectedValue: 15000, probability: 40, nextFollowUpAt: addDays(today, 0, 11, 0), nextActionType: 'Call', location: 'Mohakhali, Dhaka', notes: 'Interested in plush toy line.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 4) },
    { id: 'LEAD-0010', name: 'Rafiq Islam', company: 'Toy World BD', phone: '+8801911334455', email: 'rafiq@toyworld.bd', source: 'Walk-in', status: 'negotiation', priority: 'hot', assignedRepId: bId, assignedRepName: bName, expectedValue: 45000, probability: 75, nextFollowUpAt: addDays(today, 1, 10, 30), nextActionType: 'Meeting', location: 'Farmgate, Dhaka', notes: 'Price negotiation in progress.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 12) },
    { id: 'LEAD-0011', name: 'Mariam Akter', company: 'Kids Corner', phone: '+8801811445566', email: 'mariam@kidscorner.bd', source: 'Google Ads', status: 'new', priority: 'warm', assignedRepId: null, assignedRepName: null, expectedValue: 7800, probability: 25, nextFollowUpAt: addDays(today, 0, 17, 0), nextActionType: 'Email', location: 'Bashundhara, Dhaka', notes: 'New web inquiry.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 0) },
    { id: 'LEAD-0012', name: 'Hasan Mahmud', company: 'Eastern Distributors', phone: '+8801711556677', email: 'hasan@eastern.bd', source: 'Referral', status: 'proposal', priority: 'hot', assignedRepId: aId, assignedRepName: aName, expectedValue: 52000, probability: 70, nextFollowUpAt: addDays(today, 0, 15, 0), nextActionType: 'Call', location: 'Narayanganj', notes: 'Proposal sent for RC toy range.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 10) },
    { id: 'LEAD-0013', name: 'Tasnim Rahman', company: 'Playtime Stores', phone: '+8801911667788', email: 'tasnim@playtime.bd', source: 'Facebook', status: 'contacted', priority: 'warm', assignedRepId: bId, assignedRepName: bName, expectedValue: 11200, probability: 35, nextFollowUpAt: addDays(today, -1, 14, 0), nextActionType: 'WhatsApp', location: 'Sylhet', notes: 'Follow-up on catalog share.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 7) },
    { id: 'LEAD-0014', name: 'Jamil Ahmed', company: 'Capital Retail Group', phone: '+8801611778899', email: 'jamil@capital.bd', source: 'LinkedIn', status: 'qualified', priority: 'hot', assignedRepId: aId, assignedRepName: aName, expectedValue: 67000, probability: 55, nextFollowUpAt: addDays(today, 2, 11, 30), nextActionType: 'Meeting', location: 'Gulshan, Dhaka', notes: 'Qualified for enterprise pricing.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 15) },
    { id: 'LEAD-0015', name: 'Priya Das', company: 'Fun Factory Outlet', phone: '+8801711889900', email: 'priya@funfactory.bd', source: 'Cold Call', status: 'new', priority: 'cold', assignedRepId: null, assignedRepName: null, expectedValue: 5500, probability: 15, nextFollowUpAt: addDays(today, 3, 10, 0), nextActionType: 'Call', location: 'Khulna', notes: 'Cold outreach response pending.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 2) },
    { id: 'LEAD-0016', name: 'Omar Faruk', company: 'Smart Kids BD', phone: '+8801911990011', email: 'omar@smartkids.bd', source: 'Website', status: 'contacted', priority: 'warm', assignedRepId: aId, assignedRepName: aName, expectedValue: 9800, probability: 38, nextFollowUpAt: addDays(today, 0, 10, 30), nextActionType: 'Call', location: 'Baridhara, Dhaka', notes: 'Demo scheduled.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 6) },
    { id: 'LEAD-0017', name: 'Laboni Saha', company: 'Creative Minds', phone: '+8801811001122', email: 'laboni@creative.bd', source: 'Trade Show', status: 'proposal', priority: 'warm', assignedRepId: bId, assignedRepName: bName, expectedValue: 28500, probability: 50, nextFollowUpAt: addDays(today, -3, 9, 0), nextActionType: 'Email', location: 'Rajshahi', notes: 'Awaiting proposal feedback.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 20) },
    { id: 'LEAD-0018', name: 'Shahid Khan', company: 'Mega Mart Chain', phone: '+8801711112233', email: 'shahid@megamart.bd', source: 'Referral', status: 'negotiation', priority: 'hot', assignedRepId: aId, assignedRepName: aName, expectedValue: 95000, probability: 80, nextFollowUpAt: addDays(today, 0, 16, 30), nextActionType: 'Meeting', location: 'Gazipur', notes: 'Final contract terms discussion.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 22) },
    { id: 'LEAD-0019', name: 'Nadia Islam', company: 'Wonderland Toys', phone: '+8801911223344', email: 'nadia@wonderland.bd', source: 'Facebook Ads', status: 'won', priority: 'hot', assignedRepId: bId, assignedRepName: bName, expectedValue: 38000, probability: 100, nextFollowUpAt: null, nextActionType: 'Call', location: 'Cox\'s Bazar', notes: 'Deal closed successfully.', conversionStatus: 'converted', linkedDealId: null, createdAt: weekAgo(today, 28) },
    { id: 'LEAD-0020', name: 'Arif Hossain', company: 'Budget Bazaar', phone: '+8801611334455', email: 'arif@budget.bd', source: 'Walk-in', status: 'lost', priority: 'cold', assignedRepId: aId, assignedRepName: aName, expectedValue: 3200, probability: 5, nextFollowUpAt: null, nextActionType: 'Email', location: 'Old Dhaka', notes: 'Chose competitor.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 35) },
    { id: 'LEAD-0021', name: 'Sumaiya Akter', company: 'Elite Toys Gallery', phone: '+8801711445566', email: 'sumaiya@elite.bd', source: 'Website', status: 'qualified', priority: 'warm', assignedRepId: bId, assignedRepName: bName, expectedValue: 19500, probability: 48, nextFollowUpAt: addDays(today, 0, 14, 0), nextActionType: 'Call', location: 'Uttara, Dhaka', notes: 'Needs custom OEM quote.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 9) },
    { id: 'LEAD-0022', name: 'Kamal Uddin', company: 'Dhaka Toy Hub', phone: '+8801911556677', email: 'kamal@dtkhub.bd', source: 'Google Ads', status: 'new', priority: 'warm', assignedRepId: null, assignedRepName: null, expectedValue: 8700, probability: 22, nextFollowUpAt: addDays(today, 0, 12, 0), nextActionType: 'WhatsApp', location: 'Tejgaon, Dhaka', notes: 'New ad lead.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 1) },
    { id: 'LEAD-0023', name: 'Fatema Khatun', company: 'Junior World', phone: '+8801811667788', email: 'fatema@junior.bd', source: 'Referral', status: 'contacted', priority: 'hot', assignedRepId: aId, assignedRepName: aName, expectedValue: 14200, probability: 42, nextFollowUpAt: addDays(today, -4, 11, 0), nextActionType: 'Call', location: 'Mirpur, Dhaka', notes: 'Overdue callback.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 11) },
    { id: 'LEAD-0024', name: 'Rubel Mia', company: 'Wholesale Toys Co', phone: '+8801711778899', email: 'rubel@wholesale.bd', source: 'Trade Show', status: 'proposal', priority: 'hot', assignedRepId: bId, assignedRepName: bName, expectedValue: 72000, probability: 68, nextFollowUpAt: addDays(today, 1, 15, 0), nextActionType: 'Meeting', location: 'Chittagong', notes: 'Large wholesale order proposal.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 16) },
    { id: 'LEAD-0025', name: 'Anika Chowdhury', company: 'Gift Gallery BD', phone: '+8801911889900', email: 'anika@giftgallery.bd', source: 'Facebook', status: 'negotiation', priority: 'warm', assignedRepId: aId, assignedRepName: aName, expectedValue: 24000, probability: 62, nextFollowUpAt: addDays(today, 0, 11, 30), nextActionType: 'Call', location: 'Banani, Dhaka', notes: 'Discount negotiation.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 13) },
    { id: 'LEAD-0026', name: 'Mehedi Hasan', company: 'School Supplies Plus', phone: '+8801611990011', email: 'mehedi@ssplus.bd', source: 'Cold Call', status: 'contacted', priority: 'cold', assignedRepId: null, assignedRepName: null, expectedValue: 6800, probability: 18, nextFollowUpAt: addDays(today, 0, 13, 0), nextActionType: 'Call', location: 'Comilla', notes: 'Unassigned inbound call.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 4) },
    { id: 'LEAD-0027', name: 'Sabrina Ahmed', company: 'Premium Playthings', phone: '+8801711002233', email: 'sabrina@premium.bd', source: 'LinkedIn', status: 'qualified', priority: 'hot', assignedRepId: bId, assignedRepName: bName, expectedValue: 41000, probability: 58, nextFollowUpAt: addDays(today, -2, 15, 0), nextActionType: 'Email', location: 'Gulshan, Dhaka', notes: 'Overdue email follow-up.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 17) },
    { id: 'LEAD-0028', name: 'Tariq Mahmud', company: 'Nationwide Retail', phone: '+8801911113344', email: 'tariq@nationwide.bd', source: 'Website', status: 'won', priority: 'warm', assignedRepId: aId, assignedRepName: aName, expectedValue: 55000, probability: 100, nextFollowUpAt: null, nextActionType: 'Call', location: 'Dhaka', notes: 'Won enterprise contract.', conversionStatus: 'converted', linkedDealId: null, createdAt: weekAgo(today, 40) },
    { id: 'LEAD-0029', name: 'Hena Parvin', company: 'Tiny Tots Store', phone: '+8801811224455', email: 'hena@tinytots.bd', source: 'Facebook Ads', status: 'new', priority: 'warm', assignedRepId: bId, assignedRepName: bName, expectedValue: 9200, probability: 28, nextFollowUpAt: addDays(today, 0, 9, 30), nextActionType: 'WhatsApp', location: 'Uttara, Dhaka', notes: 'New Facebook lead this week.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 0) },
    { id: 'LEAD-0030', name: 'Zahid Hasan', company: 'Global Toy Imports', phone: '+8801711335566', email: 'zahid@globaltoy.bd', source: 'Trade Show', status: 'lost', priority: 'cold', assignedRepId: bId, assignedRepName: bName, expectedValue: 8800, probability: 8, nextFollowUpAt: null, nextActionType: 'Email', location: 'Jessore', notes: 'No response after proposal.', conversionStatus: 'open', linkedDealId: null, createdAt: weekAgo(today, 45) },
  ];

  return rows.map((row) => ({
    ...row,
    alternativePhone: '',
    interestedProduct: '',
    customerRequirement: '',
    campaign: '',
    adCreative: '',
    barcode: '',
    status: row.status,
  }));
}

export function buildLeadActivitiesSeed(today: string) {
  const ts = (days: number, hour: number) => addDays(today, -days, hour, 0);
  return [
    { id: 'ACT-L-0001', entityId: 'LEAD-0005', activityType: 'call', summary: 'Call completed', note: 'Discussed puzzle set MOQ and pricing.', actorName: 'Sales Rep', completedAt: ts(1, 10) },
    { id: 'ACT-L-0002', entityId: 'LEAD-0005', activityType: 'whatsapp', summary: 'WhatsApp message sent', note: 'Sent product catalog PDF.', actorName: 'Sales Rep', completedAt: ts(2, 14) },
    { id: 'ACT-L-0003', entityId: 'LEAD-0005', activityType: 'quotation', summary: 'Quotation sent (QTN-00045)', note: 'Quote for puzzle sets.', actorName: 'Sales Rep', completedAt: ts(3, 11) },
    { id: 'ACT-L-0004', entityId: 'LEAD-0005', activityType: 'note', summary: 'Note added', note: 'Customer prefers Uttara delivery.', actorName: 'Sales Rep', completedAt: ts(4, 9) },
    { id: 'ACT-L-0005', entityId: 'LEAD-0001', activityType: 'call', summary: 'Call connected', note: 'Reviewed proposal terms.', actorName: 'Sales Rep', completedAt: ts(2, 15) },
    { id: 'ACT-L-0006', entityId: 'LEAD-0002', activityType: 'email', summary: 'Intro email sent', note: 'Portal access details shared.', actorName: 'Sales Rep', completedAt: ts(1, 9) },
    { id: 'ACT-L-0007', entityId: 'LEAD-0003', activityType: 'call', summary: 'Call — no answer', note: 'Left voicemail.', actorName: 'Sales Rep', completedAt: ts(3, 16) },
    { id: 'ACT-L-0008', entityId: 'LEAD-0006', activityType: 'meeting', summary: 'Meeting held', note: 'Commercial proposal review.', actorName: 'Sales Rep', completedAt: ts(6, 11) },
    { id: 'ACT-L-0009', entityId: 'LEAD-0010', activityType: 'call', summary: 'Price negotiation call', note: 'Discussed volume discount.', actorName: 'Sales Rep', completedAt: ts(1, 14) },
    { id: 'ACT-L-0010', entityId: 'LEAD-0012', activityType: 'quotation', summary: 'Proposal sent', note: 'RC toy range proposal.', actorName: 'Sales Rep', completedAt: ts(2, 10) },
    { id: 'ACT-L-0011', entityId: 'LEAD-0018', activityType: 'meeting', summary: 'Contract review meeting', note: 'Legal terms discussed.', actorName: 'Sales Rep', completedAt: ts(0, 11) },
    { id: 'ACT-L-0012', entityId: 'LEAD-0021', activityType: 'call', summary: 'Call connected', note: 'OEM requirements captured.', actorName: 'Sales Rep', completedAt: ts(1, 13) },
  ].map((a) => ({ ...a, entityType: 'lead' as const, createdAt: a.completedAt }));
}

export function buildLeadTasksSeed(today: string, repA: Rep, repB: Rep) {
  const aId = repA?.id || 'EMP-001';
  const aName = repA?.name || 'John Doe';
  const bId = repB?.id || aId;
  const bName = repB?.name || aName;

  return [
    { id: 'TASK-L-0001', entityId: 'LEAD-0005', title: 'Call customer', ownerId: bId, ownerName: bName, dueDate: today, status: 'open', priority: 'high' },
    { id: 'TASK-L-0002', entityId: 'LEAD-0002', title: 'Call follow-up', ownerId: aId, ownerName: aName, dueDate: today, status: 'open', priority: 'medium' },
    { id: 'TASK-L-0003', entityId: 'LEAD-0006', title: 'Call overdue follow-up', ownerId: aId, ownerName: aName, dueDate: addDays(today, -5).slice(0, 10), status: 'open', priority: 'high' },
    { id: 'TASK-L-0004', entityId: 'LEAD-0012', title: 'Call proposal review', ownerId: aId, ownerName: aName, dueDate: today, status: 'open', priority: 'high' },
    { id: 'TASK-L-0005', entityId: 'LEAD-0018', title: 'Meeting contract signing', ownerId: aId, ownerName: aName, dueDate: today, status: 'open', priority: 'high' },
  ].map((t) => ({
    ...t,
    entityType: 'lead' as const,
    reminderAt: null,
    createdAt: `${today}T08:00:00.000Z`,
  }));
}
