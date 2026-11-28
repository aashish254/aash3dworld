export type LandmarkCategory = 'heritage' | 'education' | 'project' | 'research' | 'contact';

export interface LandmarkLink {
  label: string;
  url: string;
}

export interface LandmarkData {
  id: string;
  title: string;
  subtitle: string;
  era: string;
  category: LandmarkCategory;
  zoneName: string;
  position: { x: number; z: number };
  approachOffset?: { x: number; z: number };
  interactRadius: number;
  accentColor: string;
  summary: string;
  highlights: string[];
  stack: string[];
  links: LandmarkLink[];
}

export const PORTFOLIO_OWNER = {
  name: 'Aashish Kumar Mahato',
  role: 'Systems Architect & Full-Stack AI Engineer',
  location: 'Kathmandu, Nepal',
  education: 'B.Tech CSE · VIT Vellore, India',
  email: 'aashishmahato02@gmail.com',
  website: 'https://www.aashishkumarmahato.com.np/',
  github: 'https://github.com/aashish254',
};

export const LANDMARKS: LandmarkData[] = [
  {
    id: 'kathmandu-stupa',
    title: 'Pashupatinath Temple · Sacred Bagmati Complex',
    subtitle: 'UNESCO World Heritage · Kathmandu, Nepal',
    era: 'Kathmandu, Nepal · 5th Century CE',
    category: 'heritage',
    zoneName: 'Pashupatinath Sacred Precinct',
    position: { x: -28, z: 300 },
    approachOffset: { x: -64, z: 0 },
    interactRadius: 68,
    accentColor: '#d97706',
    summary:
      'Authentic 108m × 124m UNESCO World Heritage recreation of Kathmandu’s sacred Pashupatinath complex set along the flowing Bagmati River: enter via the three-bay Paschim Dwar flanked by Guardian Simha Lions and twin Deepstambhas, pause before the monumental Gilded Nandi Bull, ascend the three-tier granite Peti to walk the carved Sal-wood Pradakshina gallery around the four-faced Chaturmukha Shiva Lingam inside its four silver doorways, and cross the stepped Aryaghat and Bagmati Sandhya Aarati terrace over the arched bridge to the fifteen white domes of Pandra Shivalaya and Sleshmantak Forest.',
    highlights: [
      'Monumental 24m × 24m × 26m two-tier gilded copper Pagoda with 88 bronze Kinkini bells & walkable Garbhagriha sanctum',
      'Western Paschim Dwar Torana gate, Golden Nandi Bull, 7.5m Golden Trishul, Vasuki Nath shrine, 8 Shikhara shrines & Ghanta Pavilion',
      'Flowing Bagmati River ghats, interactive Sandhya Aarati terrace, arched Newari bridge & 15 Pandra Shivalaya stone domes',
    ],
    stack: ['Newari Pagoda', 'Chaturmukha Lingam', 'Bagmati Ghats', 'UNESCO Kathmandu'],
    links: [
      { label: 'Portfolio Home', url: 'https://www.aashishkumarmahato.com.np/' },
      { label: 'GitHub Profile', url: 'https://github.com/aashish254' },
    ],
  },
  {
    id: 'boudhanath-stupa',
    title: 'Boudhanath Stupa & Kora Plaza',
    subtitle: 'Three-Tier Mandala Plinth, 108 Prayer Wheels & Tibetan Gompa',
    era: 'Kathmandu, Nepal · UNESCO World Heritage',
    category: 'heritage',
    zoneName: 'Boudha Kora Plaza',
    position: { x: -308, z: 302 },
    approachOffset: { x: 0, z: 64 },
    interactRadius: 68,
    accentColor: '#eab308',
    summary:
      'Monumental 116m × 116m UNESCO World Heritage Mandala plaza of Kathmandu’s Great Stupa: enter beneath the Tibetan-Newari Kora Dwar guarded by Snow Lions, spin the 108 brass Mani prayer wheels lining the Kora circumference, climb the four cardinal stairways across the three-tier indented Medhi plinth with 108 niche Dhyani Buddhas up to the Chhyon saffron-washed dome and Wisdom Eyes Harmika beneath 64 sweeping Lungta cables, and step inside the Northern Tibetan Gompa altar illuminated by 108 butter lamps and a ceremonial bronze singing bowl.',
    highlights: [
      'Monumental 44m climbable three-tier Mandala plinth with 108 carved Dhyani Buddha niches & 4 cardinal stairways',
      '108 cascading-wave brass Kora prayer wheels, Wisdom Eyes Harmika with Nepali "१", 13-step golden spire & 64 radial Lungta flags',
      'Walkable Northern Tibetan Gompa with Shakyamuni & Guru Rinpoche altar, 108 flickering butter lamps, giant wheel & Ajima Pagoda',
    ],
    stack: ['Boudhanath Kora', '108 Prayer Wheels', 'Mandala Plinth', 'UNESCO Kathmandu'],
    links: [{ label: 'Portfolio Home', url: 'https://www.aashishkumarmahato.com.np/' }],
  },
  {
    id: 'pumdikot-shiva',
    title: 'Pumdikot Mahadev & Lake Overlook',
    subtitle: 'Sacred Hilltop Shrine Overlooking Fewa & Annapurna',
    era: 'Pokhara, Nepal · Himalayan Ridge',
    category: 'heritage',
    zoneName: 'Pumdikot Ridge',
    position: { x: -108, z: -74 },
    approachOffset: { x: 0, z: 8.2 },
    interactRadius: 12,
    accentColor: '#38bdf8',
    summary:
      'Perched above the turquoise glacial lake and Fewa Doonga boats facing Machapuchare and Annapurna: a white ribbed stupa-dome terrace crowning Lord Shiva with his golden Trishul and Damaru.',
    highlights: [
      'Panoramic vista overlooking Nepal’s turquoise glacial waters and Annapurna peaks',
      'Warm twilight promenade lanterns framing the circular hillside overlook',
      'Celebrates Pokhara’s serene mountain-and-lake natural balance',
    ],
    stack: ['Pokhara', 'Machapuchare', 'Glacial Lake', 'Nepal Culture'],
    links: [{ label: 'Portfolio Home', url: 'https://www.aashishkumarmahato.com.np/' }],
  },
  {
    id: 'janaki-mandir',
    title: 'Janaki Mandir · Janakpur Palace',
    subtitle: 'Mithila Heritage & Terai Homeland Architecture',
    era: 'Janakpurdham, Nepal · Mithila',
    category: 'heritage',
    zoneName: 'Mithila Courtyard',
    position: { x: -92, z: 92 },
    approachOffset: { x: 0, z: 34 },
    interactRadius: 42,
    accentColor: '#f59e0b',
    summary:
      'The marble-white Nau Lakha palace of Janakpur in Nepal’s Terai plains—built at monumental scale with three-story Mughal-Rajput colonnades, scalloped cusped arches, cantilevered terracotta Jharokha balconies, saffron lattice jali screens, and octagonal onion-domed pavilion towers surrounding a walkable inner sanctuary courtyard.',
    highlights: [
      'Honors Nepal’s Madhesh & Mithila cultural heartland alongside the Himalayas',
      'Symmetrical 3-story palace wings enclosing a walkable marble Prangan courtyard',
      'Connects southern Nepal’s warmth and heritage directly into this open world',
    ],
    stack: ['Janakpur', 'Mithila Culture', 'Architecture', 'Madhesh Nepal'],
    links: [{ label: 'Portfolio Home', url: 'https://www.aashishkumarmahato.com.np/' }],
  },
  {
    id: 'lumbini-buddha',
    title: 'Lumbini · Maya Devi Temple & Sanctuary',
    subtitle: 'Birthplace of Gautama Buddha · Sacred Peace Garden',
    era: 'Lumbini, Nepal · UNESCO World Heritage',
    category: 'heritage',
    zoneName: 'Lumbini Sacred Garden',
    position: { x: -280, z: 96 },
    approachOffset: { x: 0, z: 76.5 },
    interactRadius: 88,
    accentColor: '#10b981',
    summary:
      'True-to-life 88m × 96m recreation of UNESCO Lumbini’s Sacred Garden across a generous green parkland west of Janaki Mandir: the monumental 36m × 24m white-painted brick Maya Devi Temple with 12×8 multi-pane clerestory windows, terracotta-capped parapet piers, central skylight dome and golden Chaitya spire, sloped Dharmachakra ramp, and walkable interior boardwalk overlooking the 21-chamber Mauryan ruins and Marker Stone, fronted by the 26m Pushkarini Sacred Pond, Ashoka Pillar, Baby Buddha monument, Myanmar Golden Pagoda, Royal Thai Marble Pavilion, Bodhi Tree, Eternal Peace Flame, and enclosed Central Reflection Peace Canal.',
    highlights: [
      'Monumental 36m × 24m Maya Devi Temple with walkable interior boardwalk over 21-chamber Mauryan ruins & Marker Stone',
      'Authentic 26m stepped Pushkarini Sacred Pond, 249 BCE Ashoka Pillar & skyward-pointing Golden Baby Buddha',
      'Myanmar Golden Pagoda, Royal Thai Marble Pavilion, Sacred Bodhi Chautara & Eternal Peace Flame',
    ],
    stack: ['Lumbini', 'Maya Devi Temple', 'Peace Sanctuary', 'UNESCO Nepal'],
    links: [{ label: 'Portfolio Home', url: 'https://www.aashishkumarmahato.com.np/' }],
  },
  {
    id: 'vit-vellore-tower',
    title: 'VIT Vellore Clock Tower',
    subtitle: 'Crossing Borders to Study Engineering in India',
    era: 'Vellore, Tamil Nadu · B.Tech CSE',
    category: 'education',
    zoneName: 'Southern Campus Plaza',
    position: { x: 78, z: -28 },
    approachOffset: { x: 0, z: 8.5 },
    interactRadius: 12,
    accentColor: '#e05d44',
    summary:
      'Traveled from Nepal to India to pursue a B.Tech in Computer Science & Engineering at VIT Vellore. Collaborated across late-night labs on distributed systems, AI tooling, and biomedical sensing research.',
    highlights: [
      'B.Tech in Computer Science and Engineering at VIT Vellore, India',
      'Deepened core foundations in OS architecture, compilers, networking, and applied ML',
      'Co-authored research bridging generative AI with hardware sensor arrays',
    ],
    stack: ['Computer Science', 'Distributed Systems', 'Applied AI', 'Research'],
    links: [{ label: 'Explore GitHub Works', url: 'https://github.com/aashish254' }],
  },
  {
    id: 'aniflow-studio',
    title: 'AniFlow AI Studio',
    subtitle: 'Self-Hosted Webtoon-to-Video Narration Pipeline',
    era: 'Open Source · MIT License',
    category: 'project',
    zoneName: 'Creator Foundry',
    position: { x: -54, z: -92 },
    approachOffset: { x: 0, z: 7.0 },
    interactRadius: 11,
    accentColor: '#38bdf8',
    summary:
      'An open-source, 100% offline AI video studio that ingests webtoon and manhwa chapters, detects panels and dialogue bubbles with YOLOv8, extracts text via OCR, scripts recaps through Ollama, and synthesizes voiceover with Edge TTS.',
    highlights: [
      'Unattended batch mode capable of rendering dozens of chapters locally',
      'Zero cloud lock-in: runs local vision, LLM narration, and TTS end-to-end',
      'Modular pipeline engineered for deterministic, reproducible media output',
    ],
    stack: ['Python', 'YOLOv8', 'OCR', 'Ollama', 'Edge TTS', 'FFmpeg'],
    links: [{ label: 'AniFlow Repository', url: 'https://github.com/aashish254/Aniflow' }],
  },
  {
    id: 'agent-infra-monolith',
    title: 'Local-First AI & Upstream OSS',
    subtitle: 'Burn, Laya & Agent Sandboxing Infrastructure',
    era: 'Systems & Tooling',
    category: 'project',
    zoneName: 'Systems Citadel',
    position: { x: 10, z: -108 },
    approachOffset: { x: 0, z: 7.0 },
    interactRadius: 11,
    accentColor: '#10b981',
    summary:
      'Engineering local-first observability, runtime permission boundaries, and cost tracking for autonomous AI agents—alongside upstream SDK, CLI, and decoder fixes across major open-source developer tools.',
    highlights: [
      'Burn: local-first AI token & inference cost observability without cloud telemetry',
      'Laya & agent tooling: batching pipelines, TypeScript SDKs, MCP tools, and CLI ergonomics',
      'Upstream contributions to OpenClaw, OpenWorker, Orca, Headroom, freeCodeCamp & MDN',
    ],
    stack: ['TypeScript', 'Node.js', 'MCP', 'CLI Tooling', 'Sandboxing'],
    links: [{ label: 'View Repositories', url: 'https://github.com/aashish254' }],
  },
  {
    id: 'breath-sensor-lab',
    title: 'Breath Sensor Diagnostic Array',
    subtitle: 'Non-Invasive Disease Screening with Generative AI',
    era: 'Patent IN202641010439 A1',
    category: 'research',
    zoneName: 'Research Observatory',
    position: { x: 94, z: -96 },
    approachOffset: { x: 0, z: 7.0 },
    interactRadius: 11,
    accentColor: '#a78bfa',
    summary:
      'Collaborative biomedical hardware-software architecture combining a secured gas/breath sensor array with generative AI modeling for rapid, non-invasive diagnostic screening—published under Indian Patent Application IN202641010439 A1.',
    highlights: [
      'Secured sensor-to-inference pipeline prioritizing strict data boundaries',
      'Signal normalization across multi-channel volatile compound sensors',
      'Co-inventor on Indian Patent Application IN202641010439 A1',
    ],
    stack: ['Sensor Arrays', 'Embedded Telemetry', 'Generative AI', 'Security'],
    links: [{ label: 'Portfolio Overview', url: 'https://www.aashishkumarmahato.com.np/' }],
  },
  {
    id: 'recruiter-beacon',
    title: 'Himalayan Signal Beacon',
    subtitle: 'Recruiter & Collaboration Postbox',
    era: 'Open to Impactful Roles',
    category: 'contact',
    zoneName: 'Summit Overlook',
    position: { x: -34, z: 48 },
    approachOffset: { x: 0, z: 6.5 },
    interactRadius: 11,
    accentColor: '#f59e0b',
    summary:
      'Looking for a Systems Architect, AI Integration Engineer, or Full-Stack Developer? Send a message directly from the 3D world to trigger an instant recruiter notification.',
    highlights: [
      'Full-stack TypeScript, React, Three.js, Node.js, and Python AI pipelines',
      'Local-first architecture, zero-bloat performance, and strict security boundaries',
      'Direct email dispatch to aashishmahato02@gmail.com',
    ],
    stack: ['Full-Stack', 'AI Systems', 'Three.js', 'Architecture'],
    links: [{ label: 'Open Contact Form', url: '#contact' }],
  },
];
