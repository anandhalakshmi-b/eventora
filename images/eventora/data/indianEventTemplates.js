// MODULE 5 - rule-based plan data for Indian events.
// budgetSplit values are percentages and must add up to 100.
const templates = {
  wedding: {
    label: 'Wedding (Hindu / Christian / Muslim / Sikh)',
    timeline: [
      ['12 months before', 'Fix budget, guest estimate, muhurat / date with family priest or elders'],
      ['10 months before', 'Book venue (banquet / lawn / temple hall) and wedding planner'],
      ['8 months before', 'Book photographer, caterer, makeup artist and decorator'],
      ['6 months before', 'Shop for outfits and jewellery; book mehendi artist, DJ and band / baraat arrangements'],
      ['3 months before', 'Print and send invitations; book hotel rooms and travel for outstation guests'],
      ['1 month before', 'Finalise menu tasting, seating, return gifts and pandit / officiant'],
      ['1 week before', 'Haldi, mehendi and sangeet rehearsals; confirm every vendor'],
      ['Wedding week', 'Functions, wedding day, reception and vidaai / send-off']
    ],
    venueTypes: ['Banquet hall', 'Lawn / farmhouse', 'Palace / heritage hotel', 'Temple hall / Kalyana Mandapam', 'Destination resort'],
    vendors: ['Caterer', 'Photographer', 'Decorator', 'DJ', 'Florist', 'Mehendi artist', 'Makeup artist', 'Pandit / Officiant'],
    budgetSplit: { 'Venue': 25, 'Catering': 30, 'Decor & Flowers': 12, 'Photography & Video': 8, 'Outfits & Jewellery': 12, 'Music & Entertainment': 5, 'Invites & Gifts': 4, 'Miscellaneous': 4 },
    decor: ['Marigold and jasmine mandap', 'Rangoli entrance', 'Fairy-light canopy', 'Brass urli with floating flowers', 'Traditional haldi yellow and mehendi green corners']
  },
  engagement: {
    label: 'Engagement / Roka / Sagai',
    timeline: [
      ['2 months before', 'Fix date and guest list; book venue or home arrangement'],
      ['1 month before', 'Book caterer, decorator and photographer; shop for outfits and rings'],
      ['2 weeks before', 'Send invites; plan ring exchange and family introductions'],
      ['1 week before', 'Confirm vendors and finalise seating and menu']
    ],
    venueTypes: ['Banquet hall', 'Home / terrace', 'Restaurant private hall'],
    vendors: ['Caterer', 'Photographer', 'Decorator', 'Florist', 'Makeup artist'],
    budgetSplit: { 'Venue': 25, 'Catering': 35, 'Decor & Flowers': 15, 'Photography & Video': 10, 'Outfits & Rings': 10, 'Miscellaneous': 5 },
    decor: ['Floral ring-exchange stage', 'Pastel drapes and fairy lights', 'Rose petal pathway']
  },
  birthday: {
    label: 'Birthday Party',
    timeline: [
      ['4 weeks before', 'Set date, theme and guest list'],
      ['3 weeks before', 'Book venue, cake and decorator'],
      ['2 weeks before', 'Send invites; plan games, music and return gifts'],
      ['1 week before', 'Confirm vendors; arrange snacks and drinks'],
      ['Event day', 'Set up decor, cake cutting and photos']
    ],
    venueTypes: ['Home / society clubhouse', 'Restaurant / cafe', 'Party hall', 'Play zone'],
    vendors: ['Caterer', 'Decorator', 'Cake baker', 'Photographer', 'DJ / Entertainer'],
    budgetSplit: { 'Venue': 20, 'Food & Cake': 40, 'Decor': 15, 'Entertainment': 12, 'Return Gifts': 8, 'Miscellaneous': 5 },
    decor: ['Balloon arch', 'Theme backdrop with photo corner', 'Colourful buntings and streamers']
  },
  housewarming: {
    label: 'Griha Pravesh / Housewarming',
    timeline: [
      ['1 month before', 'Fix auspicious muhurat with the pandit; make guest list'],
      ['2 weeks before', 'Book pandit, caterer and decorator; send invites'],
      ['1 week before', 'Buy puja items, kalash, coconut, mango leaves and flowers'],
      ['Event day', 'Griha Pravesh puja, havan, lunch for guests']
    ],
    venueTypes: ['New home', 'Society community hall'],
    vendors: ['Pandit', 'Caterer', 'Florist', 'Decorator', 'Photographer'],
    budgetSplit: { 'Puja & Pandit': 15, 'Catering': 45, 'Decor & Flowers': 15, 'Gifts & Prasad': 15, 'Miscellaneous': 10 },
    decor: ['Toran at the main door', 'Rangoli and diyas', 'Marigold garlands', 'Kalash at entrance']
  },
  babyshower: {
    label: 'Baby Shower / Godh Bharai / Seemantham',
    timeline: [
      ['6 weeks before', 'Choose date and decide traditional or modern theme'],
      ['4 weeks before', 'Book venue, caterer and decorator'],
      ['2 weeks before', 'Send invites; plan games and rituals'],
      ['Event day', 'Rituals, games, gifting and photographs']
    ],
    venueTypes: ['Home', 'Banquet / party hall', 'Garden venue'],
    vendors: ['Caterer', 'Decorator', 'Photographer', 'Florist'],
    budgetSplit: { 'Venue': 20, 'Catering': 38, 'Decor & Flowers': 20, 'Photography': 8, 'Return Gifts': 9, 'Miscellaneous': 5 },
    decor: ['Flower swing for photos', 'Pastel balloons', 'Bangles and flower jewellery display']
  },
  naming: {
    label: 'Naming Ceremony / Namkaran',
    timeline: [
      ['3 weeks before', 'Check muhurat with pandit; shortlist names'],
      ['2 weeks before', 'Book venue / arrange home; book caterer'],
      ['1 week before', 'Send invites; arrange cradle, decor and gifts'],
      ['Event day', 'Puja, naming ritual and lunch']
    ],
    venueTypes: ['Home', 'Community hall', 'Temple hall'],
    vendors: ['Pandit', 'Caterer', 'Decorator', 'Photographer'],
    budgetSplit: { 'Venue': 15, 'Catering': 45, 'Decor': 15, 'Puja & Pandit': 10, 'Return Gifts': 10, 'Miscellaneous': 5 },
    decor: ['Decorated cradle (palna)', 'Flower and balloon backdrop', 'Rangoli']
  },
  festival: {
    label: 'Festival Party (Diwali / Ganesh Chaturthi / Navratri / Eid / Christmas)',
    timeline: [
      ['4 weeks before', 'Decide festival theme and guest list'],
      ['3 weeks before', 'Book venue / society hall and caterer'],
      ['2 weeks before', 'Arrange decor, lights, sweets and gifts'],
      ['Event day', 'Puja or celebration, food, music and photos']
    ],
    venueTypes: ['Society clubhouse', 'Banquet hall', 'Terrace / lawn'],
    vendors: ['Caterer', 'Decorator', 'DJ', 'Florist', 'Sweet shop'],
    budgetSplit: { 'Venue': 20, 'Food & Sweets': 40, 'Decor & Lights': 18, 'Music': 10, 'Gifts': 8, 'Miscellaneous': 4 },
    decor: ['Diyas and string lights', 'Rangoli', 'Torans', 'Festival-specific flowers']
  },
  corporate: {
    label: 'Corporate Event / Annual Day / Conference',
    timeline: [
      ['8 weeks before', 'Define objective, agenda and budget approval'],
      ['6 weeks before', 'Book venue, AV and speakers'],
      ['4 weeks before', 'Send invites; open registration'],
      ['2 weeks before', 'Finalise catering, branding and seating'],
      ['Event day', 'Registration desk, sessions, networking and feedback']
    ],
    venueTypes: ['Hotel conference hall', 'Convention centre', 'Co-working event space'],
    vendors: ['Caterer', 'AV / Sound', 'Photographer', 'Emcee', 'Branding / Printing'],
    budgetSplit: { 'Venue': 30, 'Catering': 28, 'AV & Tech': 14, 'Branding & Printing': 10, 'Speakers & Entertainment': 10, 'Miscellaneous': 8 },
    decor: ['Branded backdrop', 'Standees', 'Neutral stage lighting']
  },
  anniversary: {
    label: 'Anniversary',
    timeline: [
      ['4 weeks before', 'Set date, guest list and theme'],
      ['3 weeks before', 'Book venue, caterer and decorator'],
      ['1 week before', 'Send invites; prepare photo slideshow'],
      ['Event day', 'Cake cutting, speeches and dinner']
    ],
    venueTypes: ['Restaurant', 'Banquet hall', 'Home / terrace'],
    vendors: ['Caterer', 'Decorator', 'Photographer', 'Cake baker', 'Florist'],
    budgetSplit: { 'Venue': 25, 'Catering': 38, 'Decor & Flowers': 15, 'Photography': 10, 'Gifts': 7, 'Miscellaneous': 5 },
    decor: ['Rose and candle table', 'Memory photo wall', 'Fairy-light backdrop']
  },
  graduation: {
    label: 'Graduation / Farewell Party',
    timeline: [
      ['3 weeks before', 'Fix date and guest list; set budget'],
      ['2 weeks before', 'Book venue and caterer; plan games'],
      ['1 week before', 'Send invites; prepare slideshow and mementos'],
      ['Event day', 'Celebration, photos and gifting']
    ],
    venueTypes: ['Restaurant / cafe', 'College hall', 'Party hall'],
    vendors: ['Caterer', 'DJ', 'Photographer', 'Decorator'],
    budgetSplit: { 'Venue': 25, 'Food': 40, 'Decor': 10, 'Music': 12, 'Mementos': 8, 'Miscellaneous': 5 },
    decor: ['Graduation cap theme', 'Balloon garlands', 'Photo booth']
  }
};

// Style tweaks added on top of the base decor list
const styleExtras = {
  traditional: ['Silk drapes in red and gold', 'Brass lamps and temple bells', 'Banana leaf and flower torans'],
  modern: ['Minimal white and pastel floral walls', 'Neon sign with event name', 'Acrylic signage'],
  royal: ['Rajasthani jharokha backdrop', 'Velvet seating with gold accents', 'Chandeliers and candle arrangements'],
  boho: ['Pampas grass and dried flowers', 'Macrame hangings', 'Floor seating with cushions'],
  rustic: ['Wooden pallets and jute', 'Mason-jar lights', 'Marigold strings']
};

// City tier gives a rough price guide per guest (rupees) for venue + catering
const cityTier = {
  tier1: { label: 'Metro (Mumbai, Delhi, Bengaluru, Chennai...)', perGuest: 2500 },
  tier2: { label: 'Tier-2 (Coimbatore, Pune, Jaipur, Kochi...)', perGuest: 1600 },
  tier3: { label: 'Tier-3 / smaller towns', perGuest: 1000 }
};

const tier1 = ['mumbai','delhi','new delhi','bengaluru','bangalore','chennai','hyderabad','kolkata','gurgaon','noida'];
const tier3Hint = [];
function tierFor(city = '') {
  const c = city.trim().toLowerCase();
  if (tier1.includes(c)) return 'tier1';
  if (tier3Hint.includes(c)) return 'tier3';
  return 'tier2';
}

module.exports = { templates, styleExtras, cityTier, tierFor };
