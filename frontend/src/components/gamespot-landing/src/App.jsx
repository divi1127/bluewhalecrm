import { useState, useEffect } from 'react'
import {
  Baby,
  BadgeCheck,
  Briefcase,
  Cake,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Fingerprint,
  Gamepad2,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  Menu,
  MessageSquareText,
  Moon,
  PartyPopper,
  Phone,
  PhoneCall,
  School,
  Send,
  Sparkles,
  Sun,
  Tent,
  Ticket,
  Trophy,
  User,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { gallery, memberships, packages, pricing, venue } from './data'
import tagImg from './images/tag.png'
import couponImg from './images/coupon.png'

// CRM login screen — override with VITE_CRM_URL if the CRM is hosted elsewhere
const CRM_LOGIN_URL = import.meta.env.VITE_CRM_URL || '/login'

// Backend API — landing forms (contact enquiry + party booking) post here
const API_URL = import.meta.env.VITE_API_URL || 'https://bluewhalecrm.onrender.com/api'

const navLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#booking', label: 'Booking' },
  { href: '#contact', label: 'Contact' },
]

function SectionHeading({ eyebrow, title, desc }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="l-section-label"><Sparkles size={12} /> {eyebrow}</span>
      <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-slate-500">{desc}</p>}
    </div>
  )
}

function Navbar({ theme, setTheme }) {
  const [open, setOpen] = useState(false)
  return (
    <header className={`sticky top-0 z-30 transition-colors ${theme === 'light' ? 'bg-white shadow-sm' : 'border-b border-white/5 bg-night-900/80 backdrop-blur-md'}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow">
            <Gamepad2 size={18} className="text-white" />
          </div>
          <span className={`font-display text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>bluewhale</span>
        </a>
        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className={`text-xs font-bold uppercase tracking-wider transition ${theme === 'light' ? 'text-slate-800 hover:text-brand-500' : 'text-slate-300 hover:text-white'}`}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a
            href={CRM_LOGIN_URL}
            className={`hidden lg:inline-flex border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition items-center gap-1.5 ${theme === 'light' ? 'border-slate-300 text-slate-700 hover:border-brand-500 hover:text-brand-500' : 'border-white/15 text-slate-200 hover:border-brand-500 hover:text-white'}`}
          >
            <LogIn size={14} /> Login
          </a>
          <a href="#booking" className={`hidden lg:inline-flex border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${theme === 'light' ? 'border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white' : 'l-btn-primary'}`}>Book Now</a>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            className={`rounded-lg p-2 transition flex items-center ${theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setOpen((o) => !o)} className={`lg:hidden rounded-lg p-2 ${theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className={`border-t px-4 py-3 lg:hidden ${theme === 'light' ? 'border-slate-100 bg-white' : 'border-white/5 bg-night-900'}`}>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              {l.label}
            </a>
          ))}
          <a href={CRM_LOGIN_URL} onClick={() => setOpen(false)} className={`mt-1 block rounded-lg px-3 py-2.5 text-sm font-bold ${theme === 'light' ? 'text-brand-500' : 'text-brand-400'}`}>
            <LogIn size={14} className="mr-1 inline" /> Login
          </a>
        </nav>
      )}
    </header>
  )
}

function Hero({ theme }) {
  const roundedHexMask = `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 115' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M95,30 L55,7 C51.9,5.2 48.1,5.2 45,7 L5,30 C1.9,31.8 0,35.1 0,38.7 L0,84.9 C0,88.5 1.9,91.8 5,93.6 L45,116.6 C48.1,118.4 51.9,118.4 55,116.6 L95,93.6 C98.1,91.8 100,88.5 100,84.9 L100,38.7 C100,35.1 98.1,31.8 95,30 Z' fill='black'/%3E%3C/svg%3E")`

  return (
    <section id="top" className="relative w-full bg-[#1b2631] border-b-[6px] border-green-700 overflow-hidden font-display flex flex-col items-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Caveat+Brush&display=swap');
        .vintage-title { font-family: 'Luckiest Guy', cursive; }
        .vintage-script { font-family: 'Caveat Brush', cursive; }
      `}</style>

      {theme === 'light' ? (
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/1200x/73/72/4c/73724cf25ef665f61f74753875419fea.jpg')] opacity-30 object-cover w-full h-full bg-center bg-no-repeat" style={{ backgroundSize: 'cover' }} />
      ) : (
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/1200x/73/72/4c/73724cf25ef665f61f74753875419fea.jpg')] opacity-40 mix-blend-overlay object-cover w-full h-full bg-center bg-no-repeat" style={{ backgroundSize: 'cover' }} />
      )}

      <div className="relative min-h-[550px] w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 py-20 gap-8 xl:gap-24">

        {/* Left text section */}
        <div className="relative z-10 w-full lg:w-1/2 text-center lg:text-left mb-16 lg:mb-0 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold uppercase text-brand-400 mb-2 drop-shadow-md tracking-wider">
            {venue.tagline}
          </h2>
          <h1 className="vintage-title text-[2.75rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[7rem] xl:text-[8rem] uppercase mb-2 leading-[0.9] drop-shadow-2xl flex flex-col text-white">
            <span>{venue.heroTitle.split(' ').slice(0, 2).join(' ')}</span>
            <span className="text-brand-500 mt-2 rotate-[-2deg] pr-4">{venue.heroTitle.split(' ').slice(2).join(' ')}</span>
          </h1>
          <p className="vintage-script text-xl lg:text-3xl mt-4 drop-shadow-md rotate-[1deg] pl-2 font-bold text-slate-100">
            {venue.heroSubtitle}
          </p>
          <div className="mt-8 flex justify-center lg:justify-start">
            <a href="#overview" className="bg-accent-500 px-8 py-4 text-lg font-black uppercase text-white hover:bg-accent-400 transition shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none rounded-xl">
              Explore Now
            </a>
          </div>
        </div>

        {/* Right hexagon section */}
        <div className="relative z-10 flex items-center justify-center lg:justify-end">

          {/* Left Hex */}
          <div className="relative w-24 h-28 -mr-3 z-10 md:w-44 md:h-52 md:-mr-6 lg:w-52 lg:h-60 scale-95 transition hover:scale-105 hover:z-40 mt-4 md:mt-0">
            <div className="w-full h-full bg-white flex items-center justify-center" style={{ maskImage: roundedHexMask, maskSize: '100% 100%', WebkitMaskImage: roundedHexMask, WebkitMaskSize: '100% 100%' }}>
              <div className="w-[92%] h-[92%] bg-slate-200 relative" style={{ maskImage: roundedHexMask, maskSize: '100% 100%', WebkitMaskImage: roundedHexMask, WebkitMaskSize: '100% 100%' }}>
                <img src="https://i.pinimg.com/1200x/ff/e1/20/ffe120e06de1c2254a24ad0495d3fef1.jpg" alt="Activity" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Ribbon */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 md:w-48">
              <svg viewBox="0 0 200 60" className="w-full drop-shadow-xl filter">
                <path d="M10,20 Q100,-5 190,20 L195,45 Q100,20 5,45 Z" fill="#22c55e" />
                <path d="M10,20 L5,45 L0,25 Z" fill="#166534" />
                <path d="M190,20 L195,45 L200,25 Z" fill="#166534" />
                <text x="100" y="32" fill="white" fontSize="16" className="vintage-title" textAnchor="middle">ACTIVITY</text>
              </svg>
            </div>
          </div>

          {/* Center Hex (Larger) */}
          <div className="relative w-36 h-40 z-30 md:w-56 md:h-64 lg:w-72 lg:h-80 shadow-2xl drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] transition hover:scale-105">
            <div className="w-full h-full bg-white flex items-center justify-center" style={{ maskImage: roundedHexMask, maskSize: '100% 100%', WebkitMaskImage: roundedHexMask, WebkitMaskSize: '100% 100%' }}>
              <div className="w-[94%] h-[94%] bg-slate-200 relative" style={{ maskImage: roundedHexMask, maskSize: '100% 100%', WebkitMaskImage: roundedHexMask, WebkitMaskSize: '100% 100%' }}>
                <img src="https://i.pinimg.com/736x/4b/14/28/4b14286c0d76b27ee45298dc56e09926.jpg" alt="Adventure" className="w-full h-full object-cover scale-110" />
              </div>
            </div>
            {/* Connecting Nodes */}
            <div className="absolute top-1/2 -left-3 md:-left-6 w-6 h-6 md:w-10 md:h-10 bg-accent-500 rounded-full border-[2px] md:border-4 border-white z-40 flex items-center justify-center -translate-y-1/2 shadow-md">
              <Sparkles size={14} className="text-white hidden md:block" />
            </div>
            <div className="absolute top-1/2 -right-3 md:-right-6 w-6 h-6 md:w-10 md:h-10 bg-accent-500 rounded-full border-[2px] md:border-4 border-white z-40 flex items-center justify-center -translate-y-1/2 shadow-md">
              <BadgeCheck size={16} className="text-white hidden md:block" />
            </div>
            {/* Ribbon */}
            <div className="absolute -bottom-4 md:-bottom-6 left-1/2 -translate-x-1/2 w-44 md:w-64 z-40 relative">
              <svg viewBox="0 0 250 80" className="w-full drop-shadow-2xl filter relative z-50">
                <path d="M15,30 Q125,-10 235,30 L245,65 Q125,25 5,65 Z" fill="white" />
                <text x="125" y="44" fill="#15803d" fontSize="22" className="vintage-title" textAnchor="middle">ADVENTURE</text>
              </svg>
            </div>
          </div>

          {/* Right Hex */}
          <div className="relative w-24 h-28 -ml-3 z-20 md:w-44 md:h-52 md:-ml-6 lg:w-52 lg:h-60 scale-95 transition hover:scale-105 hover:z-40 mt-4 md:mt-0">
            <div className="w-full h-full bg-white flex items-center justify-center" style={{ maskImage: roundedHexMask, maskSize: '100% 100%', WebkitMaskImage: roundedHexMask, WebkitMaskSize: '100% 100%' }}>
              <div className="w-[92%] h-[92%] bg-slate-200 relative" style={{ maskImage: roundedHexMask, maskSize: '100% 100%', WebkitMaskImage: roundedHexMask, WebkitMaskSize: '100% 100%' }}>
                <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=400&q=80" alt="Trekking" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Ribbon */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 md:w-48">
              <svg viewBox="0 0 200 60" className="w-full drop-shadow-xl filter">
                <path d="M10,20 Q100,-5 190,20 L195,45 Q100,20 5,45 Z" fill="#22c55e" />
                <path d="M10,20 L5,45 L0,25 Z" fill="#166534" />
                <path d="M190,20 L195,45 L200,25 Z" fill="#166534" />
                <text x="100" y="32" fill="white" fontSize="16" className="vintage-title" textAnchor="middle">JOYFULLY</text>
              </svg>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

function Overview() {
  const features = [
    { icon: Gamepad2, title: 'Game Zones', desc: 'Indoor, arcade, outdoor adventure and kids activities with 30+ experiences.', image: 'https://i.pinimg.com/1200x/aa/1d/ef/aa1def172582b58230c81be9dd4b83ab.jpg', shape: 'rounded-[3rem] rounded-tr-lg' },
    { icon: Trophy, title: 'More Activity', desc: 'Discover even more fun activities around the venue including outdoor challenges.', image: 'https://i.pinimg.com/1200x/13/62/d9/1362d98522e52bbfca0716216d3f9998.jpg', shape: 'rounded-[50%] rounded-br-lg' },
    { icon: Fingerprint, title: 'Hand Tag System', desc: 'Collect a waterproof RFID hand tag at entry, tap to play, pay at the counter.', image: tagImg, shape: 'rounded-tl-[40px] rounded-br-[60px] rounded-tr-xl rounded-bl-xl' },
    { icon: Ticket, title: 'Easy Booking', desc: 'Pick your game and slot, add snacks, pay online — confirmation in seconds.', image: 'https://i.pinimg.com/736x/2b/13/c4/2b13c48f60ea6056a56a378f18dfd910.jpg', shape: 'rounded-full' },
    { icon: Ticket, title: 'Coupon Offer', desc: 'Unlock exclusive discounts on group bookings, special events, and seasonal games.', image: couponImg, shape: 'rounded-[4rem] rounded-bl-sm' },
    { icon: BadgeCheck, title: 'Memberships & Packages', desc: 'Save up to 20% with memberships, or bundle sessions into value packages.', image: 'https://i.pinimg.com/1200x/c7/8c/b8/c78cb812367cfde9d5254b67c9a81773.jpg', shape: 'rounded-r-full rounded-tl-[3rem] rounded-bl-[1rem]' },
  ]
  const steps = [
    { icon: Gamepad2, title: 'Pick your game', desc: 'Choose from indoor, outdoor and kids activities.' },
    { icon: CalendarCheck, title: 'Book a slot', desc: 'Pick date & time, add snacks, pay online.' },
    { icon: Fingerprint, title: 'Get a hand tag', desc: 'Collect your tag at the venue and start playing.' },
    { icon: Trophy, title: 'Play & score', desc: 'Track scores, earn loyalty points and rewards.' },
  ]
  return (
    <section id="overview" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Project Overview" title="Everything for a great day out" desc={venue.description} />
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="group relative transition hover:-translate-y-2">
            <div className={`overflow-hidden h-64 mb-6 shadow-xl ${f.shape} bg-brand-500/10 border-4 border-white/10 relative`}>
              <img src={f.image} alt={f.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg mb-3">
                  <f.icon size={18} />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2 px-2">{f.title}</h3>
            <p className="text-sm text-slate-400 px-2">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={i} className="l-card relative p-5">
            <span className="absolute right-4 top-4 font-mono text-3xl font-bold text-white/5">0{i + 1}</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400"><s.icon size={20} /></div>
            <p className="mt-3 font-display font-semibold text-white">{s.title}</p>
            <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Gallery() {
  const [active, setActive] = useState('indoor')
  const current = gallery.find((g) => g.id === active)
  return (
    <section id="gallery" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Amenities Gallery" title="Explore our game zones" desc="Tap through the zones to browse the amenities, equipment and experiences on offer." />
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {gallery.map((g) => {
          const Icon = g.id === 'indoor' ? Gamepad2 : g.id === 'outdoor' ? Tent : Baby
          return (
            <button
              key={g.id}
              onClick={() => setActive(g.id)}
              className={`l-btn ${active === g.id ? 'l-btn-primary' : 'l-btn-outline'}`}
            >
              <Icon size={18} className="mr-1" /> {g.label}
            </button>
          )
        })}
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {current.items.map((item, index) => (
          <div key={item.name} className="l-card group overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl bg-night-850" style={{ borderRadius: index % 2 === 0 ? '2rem 0.5rem 2rem 0.5rem' : '0.5rem 2rem 0.5rem 2rem' }}>
            <div className="relative h-56 overflow-hidden" style={{ clipPath: index % 2 === 0 ? 'polygon(0 0, 100% 0, 100% 90%, 0% 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 0% 90%)' }}>
              <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-1" />
              <div className={`absolute inset-0 bg-gradient-to-t ${current.tone} opacity-0 transition group-hover:opacity-40`} />
              <span className="absolute left-4 top-4 rounded-[1rem] rounded-bl-sm bg-night-950/80 px-3 py-1 font-mono text-sm font-black text-white backdrop-blur shadow-lg border border-white/10 z-10">₹{item.price}</span>
            </div>
            <div className="p-5 flex flex-col items-center text-center">
              <h3 className="font-display text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors uppercase">{item.name}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Pricing Details" title="Simple, transparent pricing" desc="Pay per game, bundle sessions into a package, or unlock savings with a membership." />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {memberships.map((m) => (
          <div key={m.name} className={`l-card relative flex flex-col p-6 ${m.popular ? 'border-brand-500/40 shadow-glow' : ''}`}>
            {m.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Most popular
              </span>
            )}
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.color} text-white`}>
              <BadgeCheck size={20} />
            </div>
            <p className="mt-3 font-display font-semibold text-white">{m.name}</p>
            <p className="mt-1"><span className="font-display text-2xl font-bold text-brand-400">₹{m.price}</span><span className="text-xs text-slate-500"> / year</span></p>
            <p className="mt-1 text-xs font-medium text-emerald-400">{m.discount}% off on games & food</p>
            <ul className="mt-4 space-y-2">
              {m.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckIcon /> {b}
                </li>
              ))}
            </ul>
            <a href="#contact" className={`l-btn mt-6 ${m.popular ? 'l-btn-primary' : 'l-btn-outline'}`}>Choose {m.name}</a>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-3xl mx-auto space-y-4">
        <div className="space-y-4">
          {packages.map((p) => (
            <div key={p.name} className="l-card p-5">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-white">{p.name}</p>
                <p className="font-display text-lg font-bold text-brand-400">₹{p.price}</p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{p.meta}</p>
              <p className="mt-3 text-xs text-slate-400">{p.included.join(' · ')}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CheckIcon() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" /></svg>
}

function Booking() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customerName: '',
    customerMobile: '',
    email: '',
    eventType: 'birthday',
    eventDate: '',
    eventTime: '11:00 AM - 2:00 PM',
    guestCount: '',
    packageDetails: '',
    foodRequirements: '',
  })

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/bookings/online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, guestCount: Number(form.guestCount) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Could not submit booking')
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not submit your booking right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const eventTypes = [
    { value: 'birthday', label: 'Birthday', icon: Cake, hint: 'Cake & balloons' },
    { value: 'family', label: 'Family', icon: Users, hint: 'All ages welcome' },
    { value: 'corporate', label: 'Corporate', icon: Briefcase, hint: 'Team offsites' },
    { value: 'school', label: 'School', icon: School, hint: 'Trips & groups' },
    { value: 'other', label: 'Other', icon: PartyPopper, hint: 'Any celebration' },
  ]

  const slots = [
    '10:00 AM - 1:00 PM',
    '11:00 AM - 2:00 PM',
    '2:00 PM - 5:00 PM',
    '4:00 PM - 7:00 PM',
    '6:00 PM - 9:00 PM',
  ]

  const activeEvent = eventTypes.find((t) => t.value === form.eventType)
  const formattedDate = form.eventDate
    ? new Date(form.eventDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : ''

  const summary = [
    { icon: activeEvent.icon, label: 'Event', value: activeEvent.label, active: true },
    { icon: CalendarDays, label: 'Date', value: formattedDate || 'Pick a date', active: !!form.eventDate },
    { icon: Clock, label: 'Time slot', value: form.eventTime, active: true },
    { icon: Users, label: 'Guests', value: form.guestCount ? `${form.guestCount} people` : 'Add guest count', active: !!form.guestCount },
  ]

  return (
    <section id="booking" className="relative mx-auto max-w-7xl overflow-x-clip px-4 py-16 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute -left-40 top-1/4 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />

      <SectionHeading eyebrow="Party Bookings" title="Book your party with us" desc="Birthdays, family get-togethers, school trips and corporate events — reserve your date and our team will call you to finalise the details." />

      <div className="relative mt-10 grid gap-6 lg:grid-cols-5">
        {/* Live preview */}
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
          <div className="l-card sticky top-24 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/5 bg-gradient-to-r from-brand-600/20 to-accent-500/10 px-5 py-4">
              <Sparkles size={15} className="text-brand-400" />
              <div>
                <p className="font-display text-sm font-semibold text-white">Your party preview</p>
                <p className="text-[11px] text-slate-500">Updates as you fill the form</p>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {summary.map((s) => (
                <div key={s.label} className="flex items-center gap-3 px-5 py-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.active ? 'bg-brand-600/15 text-brand-400' : 'bg-white/5 text-slate-600'}`}>
                    <s.icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{s.label}</p>
                    <p className="truncate text-sm font-semibold text-white">{s.value}</p>
                  </div>
                  {s.active && <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>

          {[
            { icon: Tent, title: 'Themed setups', text: 'Balloon arches, themed décor and activity zones for every event type.' },
            { icon: UtensilsCrossed, title: 'Food packages', text: 'Veg & non-veg buffets, snacks and birthday cakes — choose as you like.' },
            { icon: Trophy, title: 'Games included', text: 'Full access to our outdoor, indoor and kids game zones during your slot.' },
          ].map((f) => (
            <div key={f.title} className="l-card group flex items-start gap-4 p-5 transition hover:-translate-y-1 hover:border-brand-500/30">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400 transition group-hover:bg-brand-600 group-hover:text-white"><f.icon size={20} /></div>
              <div>
                <p className="font-display text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{f.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Booking form */}
        <div className="l-card relative overflow-hidden p-6 lg:col-span-3">
          {sent ? (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-8 ring-emerald-500/10">
                <CalendarCheck size={28} />
              </div>
              <p className="mt-5 font-display text-xl font-semibold text-white">Booking request received!</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Our events team will call you on <span className="font-semibold text-slate-300">{form.customerMobile}</span> shortly to confirm your party.</p>
              <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                <button onClick={() => setSent(false)} className="l-btn-outline flex-1">Make another booking</button>
                <a href={`tel:${venue.phone.replace(/\s/g, '')}`} className="l-btn-outline flex-1"><Phone size={14} /> Need help?</a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-brand-400" />
                <p className="font-display text-sm font-semibold text-white">What are you celebrating?</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {eventTypes.map((t) => {
                  const selected = form.eventType === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, eventType: t.value })}
                      className={`group flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${selected ? 'border-brand-500 bg-brand-600/15 shadow-glow' : 'border-white/10 bg-night-900 hover:border-brand-500/40 hover:bg-white/5'}`}
                    >
                      <t.icon size={18} className={selected ? 'text-brand-400' : 'text-slate-500 group-hover:text-brand-400'} />
                      <span className={`text-xs font-semibold ${selected ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{t.label}</span>
                      <span className="hidden text-[10px] text-slate-500 sm:block">{t.hint}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-500">Full name</label>
                  <div className="relative mt-1">
                    <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input required className="l-input !pl-9" placeholder="Arun Kumar" value={form.customerName} onChange={set('customerName')} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Phone</label>
                  <div className="relative mt-1">
                    <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input required className="l-input !pl-9" placeholder="98450 12345" value={form.customerMobile} onChange={set('customerMobile')} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Email (optional)</label>
                  <div className="relative mt-1">
                    <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="email" className="l-input !pl-9" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Preferred date</label>
                  <div className="relative mt-1">
                    <CalendarDays size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input required type="date" className="l-input !pl-9" value={form.eventDate} onChange={set('eventDate')} />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-500">Time slot</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, eventTime: s })}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${form.eventTime === s ? 'border-brand-500 bg-brand-600 text-white' : 'border-white/10 bg-night-900 text-slate-400 hover:border-brand-500/40 hover:text-white'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">Approx. guests</label>
                  <div className="relative mt-1">
                    <Users size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input required type="number" min="1" className="l-input !pl-9" placeholder="25" value={form.guestCount} onChange={set('guestCount')} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Package preference (optional)</label>
                  <div className="relative mt-1">
                    <Ticket size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input className="l-input !pl-9" placeholder="e.g. Standard party package" value={form.packageDetails} onChange={set('packageDetails')} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-500">Food / setup notes (optional)</label>
                  <div className="relative mt-1">
                    <UtensilsCrossed size={14} className="pointer-events-none absolute left-3 top-3 text-slate-500" />
                    <textarea rows={3} className="l-input !pl-9 resize-none" placeholder="Veg only, cake cutting, balloon arch..." value={form.foodRequirements} onChange={set('foodRequirements')} />
                  </div>
                </div>

                {error && <p className="text-sm text-coral-400 sm:col-span-2">{error}</p>}

                <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                  <button type="submit" disabled={submitting} className="l-btn l-btn-primary">
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <CalendarCheck size={15} />}
                    {submitting ? 'Sending...' : 'Request Booking'}
                  </button>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={13} /> We call to confirm — no advance needed now</p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', mobile: '', email: '', message: '' })
  const info = [
    { icon: MapPin, title: 'Visit us', lines: [venue.address] },
    { icon: Phone, title: 'Call us', lines: [venue.phone] },
    { icon: Mail, title: 'Email us', lines: [venue.email] },
    { icon: Clock, title: 'Open hours', lines: venue.hours.map((h) => `${h.days} · ${h.time}`) },
  ]

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/enquiries/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Could not send message')
      setSent(true)
    } catch (err) {
      setError('Could not send your message right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="contact" className="relative mx-auto max-w-7xl overflow-x-clip px-4 py-16 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute -right-40 top-10 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />

      <SectionHeading eyebrow="Contact Details" title="Get in touch with us" desc="Questions about bookings, group events or memberships? Drop us a message." />

      <div className="relative mt-10 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${venue.phone.replace(/\s/g, '')}`} className="l-card group flex flex-col items-start gap-3 p-4 transition hover:-translate-y-1 hover:border-emerald-500/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition group-hover:bg-emerald-500 group-hover:text-white">
                <PhoneCall size={18} />
              </div>
              <div>
                <p className="font-display text-xs font-semibold text-white">Call us now</p>
                <p className="mt-0.5 text-xs text-slate-500">{venue.phone}</p>
              </div>
            </a>
            <a href={`mailto:${venue.email}`} className="l-card group flex flex-col items-start gap-3 p-4 transition hover:-translate-y-1 hover:border-brand-500/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400 transition group-hover:bg-brand-600 group-hover:text-white">
                <Mail size={18} />
              </div>
              <div>
                <p className="font-display text-xs font-semibold text-white">Email us now</p>
                <p className="mt-0.5 text-xs text-slate-500">{venue.email}</p>
              </div>
            </a>
          </div>

          {info.map((c) => (
            <div key={c.title} className="l-card group flex items-start gap-4 p-5 transition hover:-translate-y-1 hover:border-brand-500/30">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400 transition group-hover:bg-brand-600 group-hover:text-white"><c.icon size={20} /></div>
              <div>
                <p className="font-display text-sm font-semibold text-white">{c.title}</p>
                {c.lines.map((l) => (
                  <p key={l} className="mt-0.5 text-sm text-slate-500">{l}</p>
                ))}
              </div>
            </div>
          ))}
          <div className="l-card overflow-hidden transition hover:border-brand-500/30">
            <iframe
              title="bluewhale location"
              className="h-44 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=MG%20Road%2C%20Indiranagar%2C%20Bengaluru&output=embed"
            />
          </div>
        </div>

        <div className="l-card relative overflow-hidden p-6 lg:col-span-2">
          {sent ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-8 ring-emerald-500/10">
                <Send size={26} />
              </div>
              <p className="mt-5 font-display text-xl font-semibold text-white">Message sent!</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Thanks for reaching out — we'll get back to you within 2 working hours.</p>
              <button onClick={() => setSent(false)} className="l-btn-outline mt-6">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Full name</label>
                <div className="relative mt-1">
                  <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input required className="l-input !pl-9" placeholder="Arun Kumar" value={form.name} onChange={set('name')} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Phone</label>
                <div className="relative mt-1">
                  <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input required className="l-input !pl-9" placeholder="98450 12345" value={form.mobile} onChange={set('mobile')} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">Email</label>
                <div className="relative mt-1">
                  <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" required className="l-input !pl-9" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">Message</label>
                <div className="relative mt-1">
                  <MessageSquareText size={14} className="pointer-events-none absolute left-3 top-3 text-slate-500" />
                  <textarea required rows={5} className="l-input !pl-9 resize-none" placeholder="Tell us about your visit, event or group booking..." value={form.message} onChange={set('message')} />
                </div>
              </div>
              {error && <p className="text-sm text-coral-400 sm:col-span-2">{error}</p>}
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <button type="submit" disabled={submitting} className="l-btn l-btn-primary">
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><MessageSquareText size={13} /> Average response time: under 2 hours</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const quickLinks = [
    { href: '#overview', label: 'Overview' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#booking', label: 'Party Booking' },
    { href: '#contact', label: 'Contact Us' },
  ]
  return (
    <footer className="border-t border-white/5 bg-night-900/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500"><Gamepad2 size={16} className="text-white" /></div>
              <span className="font-display font-bold text-white">bluewhale</span>
            </div>
            <p className="text-sm text-slate-500">{venue.description}</p>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-slate-500 transition hover:text-brand-400">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">Contact</h4>
            <ul className="mt-4 space-y-2.5">
              <li className="flex items-start justify-center gap-2 text-sm text-slate-500 sm:justify-start">
                <MapPin size={14} className="mt-0.5 shrink-0" /> {venue.address}
              </li>
              <li>
                <a href={`tel:${venue.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-2 text-sm text-slate-500 transition hover:text-brand-400 sm:justify-start">
                  <Phone size={14} className="shrink-0" /> {venue.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${venue.email}`} className="flex items-center justify-center gap-2 text-sm text-slate-500 transition hover:text-brand-400 sm:justify-start">
                  <Mail size={14} className="shrink-0" /> {venue.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">Opening Hours</h4>
            <ul className="mt-4 space-y-2.5">
              {venue.hours.map((h) => (
                <li key={h.days} className="flex items-start justify-center gap-2 text-sm text-slate-500 sm:justify-start">
                  <Clock size={14} className="mt-0.5 shrink-0" />
                  <span><span className="text-slate-400">{h.days}:</span> {h.time}</span>
                </li>
              ))}
            </ul>
            <a href="#booking" className="l-btn-outline mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"><CalendarDays size={13} /> Book a Slot</a>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-slate-600">© 2026 bluewhale. Contact enquiries and party bookings are saved to the park CRM.</p>
      </div>
    </footer>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark'))

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className={`landing-root ${theme === 'light' ? 'theme-light' : ''} flex min-h-screen flex-col bg-night-950`}>
      <Navbar theme={theme} setTheme={setTheme} />
      <main className="flex-1">
        <Hero theme={theme} />
        <Overview />
        <Gallery />
        <Pricing />
        <Booking />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
