// Every way the atlas can be read. A "lens" regroups the same flat list of
// pastas into group → subgroup → pasta.

export const FAMILIES = [
  { id: 'strands', label: 'Strands', color: '#c4472f', blurb: 'Long and round. The spaghetti line, from angel-hair threads to hand-rolled ropes and hollow bucatini.' },
  { id: 'ribbons', label: 'Ribbons', color: '#d98a1f', blurb: 'Long and flat. Rolled sheets cut into bands: tagliolini at the narrow end, pappardelle at the wide, with ruffles and buckwheat along the way.' },
  { id: 'sheets', label: 'Sheets', color: '#8a8f3a', blurb: 'Pasta before the knife gets to it. Layered lasagne, silk handkerchiefs, and the "badly cut" scraps that became shapes of their own.' },
  { id: 'tubes', label: 'Tubes', color: '#2f8f83', blurb: 'Short and hollow. Sauce goes inside as well as outside, which is why ridges, diagonal cuts and sheer size all matter here.' },
  { id: 'twists', label: 'Twists', color: '#3f6fb5', blurb: 'Spirals, corkscrews and rolled strips. Every turn is a ledge for pesto or ragù.' },
  { id: 'shells', label: 'Shells & scoops', color: '#7a5ba8', blurb: 'Cupped shapes made to hold things: factory conchiglie, and the thumb-dragged ears and curls of the Italian south.' },
  { id: 'fancy', label: 'Fancy shapes', color: '#b8488a', blurb: 'Pasta showing off. Bows, wheels, lilies, stamped coins and braids that take years to learn.' },
  { id: 'soup', label: 'Soup pasta', color: '#4e9a51', blurb: 'Pastina: the miniature shapes that live in broth. Grains, beads, stars and tiny tubes, in Italy and far beyond.' },
  { id: 'stuffed', label: 'Stuffed', color: '#8e2f45', blurb: 'Dough wrapped around a filling. Nearly every Italian town has its own fold, and nearly every cuisine on Earth has a cousin.' },
  { id: 'gnocchi', label: 'Gnocchi & dumplings', color: '#8b6b4a', blurb: 'Little lumps rather than rolled dough: potato, ricotta, bread, or batter pushed through a press.' },
]

export const SUBS = {
  'strands-fine': 'Fine threads',
  'strands-classic': 'Classic strands',
  'strands-thick': 'Thick strands',
  'strands-hollow': 'Hollow strands',
  'strands-handrolled': 'Hand-rolled ropes',
  'ribbons-narrow': 'Narrow ribbons',
  'ribbons-medium': 'Medium ribbons',
  'ribbons-wide': 'Wide ribbons',
  'ribbons-ruffled': 'Ruffled ribbons',
  'ribbons-rustic': 'Rustic ribbons',
  'sheets-layered': 'Layered sheets',
  'sheets-scraps': 'Scraps & squares',
  'tubes-smooth': 'Smooth tubes',
  'tubes-ridged': 'Ridged tubes',
  'tubes-diagonal': 'Quill cut',
  'tubes-curved': 'Elbows & curves',
  'tubes-giant': 'Giant tubes',
  'tubes-rings': 'Rings',
  'twists-corkscrew': 'Corkscrews',
  'twists-rolled': 'Rolled & twisted',
  'twists-helix': 'Hollow spirals',
  'shells-conch': 'Shells & snails',
  'shells-dragged': 'Dragged curls',
  'shells-ears': 'Ears & cups',
  'fancy-bows': 'Bows',
  'fancy-wheels-flowers': 'Wheels & flowers',
  'fancy-ruffles': 'Ruffles & frills',
  'fancy-stamped': 'Stamped & pressed',
  'fancy-braided': 'Braided & woven',
  'soup-grains': 'Grains & seeds',
  'soup-dots': 'Beads & crumbs',
  'soup-stars-rings': 'Stars & rings',
  'soup-tubes': 'Tiny tubes',
  'soup-shapes': 'Tiny shapes',
  'stuffed-squares': 'Squares',
  'stuffed-moons': 'Rounds & half-moons',
  'stuffed-rings': 'Rings & hats',
  'stuffed-parcels': 'Parcels & pleats',
  'stuffed-rolls': 'Rolls & filled tubes',
  'stuffed-world': 'Dumplings of the world',
  'gnocchi-potato': 'Potato gnocchi',
  'gnocchi-flour': 'Ricotta, bread & semolina',
  'gnocchi-pressed': 'Pressed & pinched',
}

export const REGIONS = {
  piedmont: 'Piedmont',
  'aosta-valley': 'Aosta Valley',
  liguria: 'Liguria',
  lombardy: 'Lombardy',
  'trentino-alto-adige': 'Trentino-Alto Adige',
  veneto: 'Veneto',
  'friuli-venezia-giulia': 'Friuli Venezia Giulia',
  'emilia-romagna': 'Emilia-Romagna',
  tuscany: 'Tuscany',
  umbria: 'Umbria',
  marche: 'Marche',
  lazio: 'Lazio',
  abruzzo: 'Abruzzo',
  molise: 'Molise',
  campania: 'Campania',
  puglia: 'Puglia',
  basilicata: 'Basilicata',
  calabria: 'Calabria',
  sicily: 'Sicily',
  sardinia: 'Sardinia',
  italy: 'Across Italy',
}

export const AREAS = [
  { id: 'north', label: 'Northern Italy', color: '#3f6fb5', blurb: 'Egg, butter and soft wheat. The Po valley is the home of rolled sfoglia, tortellini and agnolotti; the Alps add buckwheat and bread dumplings.', regions: ['piedmont', 'aosta-valley', 'liguria', 'lombardy', 'trentino-alto-adige', 'veneto', 'friuli-venezia-giulia', 'emilia-romagna'] },
  { id: 'centre', label: 'Central Italy', color: '#8a8f3a', blurb: 'Where the egg pasta of the north meets the water-and-flour pasta of the south: pici, strangozzi, and the Roman canon of tonnarelli and rigatoni.', regions: ['tuscany', 'umbria', 'marche', 'lazio'] },
  { id: 'south', label: 'Southern Italy', color: '#c4472f', blurb: 'Durum wheat country. Dried pasta was industrialised around Naples, while Puglia, Basilicata and Calabria still shape semolina by hand.', regions: ['abruzzo', 'molise', 'campania', 'puglia', 'basilicata', 'calabria'] },
  { id: 'islands', label: 'The islands', color: '#d98a1f', blurb: 'Sicily and Sardinia: some of the oldest pasta records in Europe, and shapes found nowhere else, from busiate to the threads of su filindeu.', regions: ['sicily', 'sardinia'] },
  { id: 'italy', label: 'All over Italy', color: '#8b6b4a', blurb: 'Shapes with no single hometown: factory classics sold in every supermarket, and old forms claimed by several regions at once.', regions: ['italy'] },
  { id: 'europe', label: 'Rest of Europe', color: '#7a5ba8', blurb: 'Egg noodles, pasta squares and tiny pellets from Poland, Hungary and the Alps, plus the fideos and macarrones of Spain.' },
  { id: 'mideast', label: 'Eastern Mediterranean', color: '#2f8f83', blurb: 'From Greek kritharaki to Turkish erişte and Levantine moghrabieh: the pasta of the lands around the eastern Mediterranean.' },
  { id: 'americas', label: 'Americas', color: '#5b6770', blurb: 'What emigrants built: Italian-American inventions and the noodles that took root in the New World.' },
  { id: 'elsewhere', label: 'Elsewhere', color: '#5b6770', blurb: 'Everything that does not fit a single place.' },
]

const COUNTRY_AREA = {
  europe: ['Germany', 'Austria', 'Switzerland', 'Poland', 'Hungary', 'Slovakia', 'Czechia', 'Czech Republic', 'Slovenia', 'Croatia', 'Ukraine', 'Russia', 'Lithuania', 'Belarus', 'Spain', 'France', 'Portugal', 'Romania', 'Serbia', 'Bulgaria', 'Malta', 'Netherlands', 'Sweden', 'Finland', 'Latvia', 'Estonia', 'Bosnia and Herzegovina', 'Ashkenazi Jewish', 'Central Europe', 'Eastern Europe'],
  mideast: ['Greece', 'Turkey', 'Cyprus', 'Lebanon', 'Syria', 'Israel', 'Palestine', 'Jordan', 'Egypt', 'Iran', 'Iraq', 'Tunisia', 'Morocco', 'Algeria', 'Libya', 'Levant'],
  americas: ['United States', 'USA', 'Argentina', 'Mexico', 'Brazil', 'Peru', 'Canada', 'Chile', 'Uruguay'],
}

const countryToArea = {}
for (const [area, list] of Object.entries(COUNTRY_AREA)) for (const c of list) countryToArea[c.toLowerCase()] = area
const regionToArea = {}
for (const a of AREAS) for (const r of a.regions || []) regionToArea[r] = a.id

export function areaOf(p) {
  if (p.region !== 'world') return regionToArea[p.region] || 'italy'
  return countryToArea[(p.country || '').toLowerCase()] || 'elsewhere'
}

export function placeLabel(p) {
  if (p.region === 'world') return p.country || 'Elsewhere'
  return REGIONS[p.region] || 'Across Italy'
}

export const MAKES = [
  { id: 'dried', label: 'Dried durum', short: 'Dried durum semolina', fill: '#edc55f', color: '#d98a1f', blurb: 'Semolina and water, forced through a die and dried. It keeps for years, which is how pasta conquered the world.' },
  { id: 'egg', label: 'Fresh egg dough', short: 'Fresh egg dough', fill: '#f3b029', color: '#c4472f', blurb: 'Soft wheat flour and eggs, rolled thin. The sfoglia of Emilia and the base of most stuffed pasta.' },
  { id: 'semola-fresh', label: 'Fresh semolina', short: 'Fresh semolina & water', fill: '#ecd98f', color: '#8a8f3a', blurb: 'Durum semolina and water, shaped by hand and cooked fresh. The everyday pasta of the Italian south.' },
  { id: 'flour-water', label: 'Flour & water', short: 'Flour & water dough', fill: '#f0e3b6', color: '#2f8f83', blurb: 'Plain wheat flour and water, no egg. The frugal dough behind pici, strozzapreti and trofie.' },
  { id: 'potato', label: 'Potato', short: 'Potato dough', fill: '#f5e8bf', color: '#8b6b4a', blurb: 'Mashed potato bound with a little flour. A New World ingredient that redefined the dumpling.' },
  { id: 'bread-cheese', label: 'Bread, ricotta & greens', short: 'Bread, ricotta or greens', fill: '#dfd39a', color: '#4e9a51', blurb: 'Doughs built from stale bread, fresh cheese or vegetables. Thrift turned into a category.' },
  { id: 'alt-grain', label: 'Other grains', short: 'Buckwheat, chestnut & other grains', fill: '#b08c63', color: '#7a5ba8', blurb: 'Buckwheat, chestnut, farro, rye and corn: what mountain kitchens used when wheat would not grow.' },
  { id: 'wheat-noodle', label: 'Egg noodles', short: 'Egg noodle dough', fill: '#f0d894', color: '#8e2f45', blurb: 'The egg noodles of Central and Eastern Europe: rolled, cut into ribbons or squares, and often dried.' },
]

const by = (list) => Object.fromEntries(list.map((x) => [x.id, x]))
export const FAMILY = by(FAMILIES)
export const AREA = by(AREAS)
export const MAKE = by(MAKES)

const familyOrder = Object.fromEntries(FAMILIES.map((f, i) => [f.id, i]))
const subOrder = Object.fromEntries(Object.keys(SUBS).map((s, i) => [s, i]))
const regionOrder = Object.fromEntries(Object.keys(REGIONS).map((s, i) => [s, i]))

export const LENSES = [
  {
    id: 'shape',
    label: 'Shape',
    title: 'by shape',
    root: 'Pasta',
    groups: FAMILIES,
    group: (p) => p.family,
    sub: (p) => ({ id: p.sub, label: SUBS[p.sub] || p.sub, order: subOrder[p.sub] ?? 99 }),
  },
  {
    id: 'origin',
    label: 'Origin',
    title: 'by origin',
    root: 'Pasta',
    groups: AREAS,
    group: areaOf,
    sub: (p) =>
      p.region === 'italy'
        ? { id: 'i:' + p.family, label: FAMILY[p.family].label, order: familyOrder[p.family] }
        : p.region === 'world'
        ? { id: 'c:' + (p.country || 'Elsewhere'), label: p.country || 'Elsewhere', order: 0 }
        : { id: 'r:' + p.region, label: REGIONS[p.region], order: regionOrder[p.region] ?? 99 },
  },
  {
    id: 'dough',
    label: 'Dough',
    title: 'by dough',
    root: 'Pasta',
    groups: MAKES,
    group: (p) => p.make,
    sub: (p) => ({ id: p.make + ':' + p.family, label: FAMILY[p.family]?.label || p.family, order: familyOrder[p.family] ?? 99 }),
  },
]
export const LENS = by(LENSES)
