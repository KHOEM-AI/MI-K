import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowDownRight,
  ArrowRight,
  BellRing,
  BookOpen,
  Boxes,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Compass,
  ExternalLink,
  GraduationCap,
  KeyRound,
  Menu,
  Network,
  Orbit,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  X,
  Zap,
} from 'lucide-react';

const CERTIFICATES = [
  'https://api2.sololearn.com/v2/certificates/CC-4WMNT8MZ/image/png?t=639211314186882960',
  'https://api2.sololearn.com/v2/certificates/CC-FQXPSLUW/image/png?t=639114126319491590',
  'https://api2.sololearn.com/v2/certificates/CC-T1WYSOHU/image/png?t=639218531599541850',
  'https://api2.sololearn.com/v2/certificates/CC-I6OFSBAU/image/png?t=639221583443257000',
  'https://api2.sololearn.com/v2/certificates/CC-IXX7OEVL/image/png?t=639129089670279240',
  'https://api2.sololearn.com/v2/certificates/CC-AYYCWFZD/image/png?t=639213017982820410',
  'https://api2.sololearn.com/v2/certificates/CC-3LIHOX01/image/png?t=639149755075790680',
  'https://api2.sololearn.com/v2/certificates/CC-HAW7ZIH5/image/png?t=639127071272290510',
  'https://api2.sololearn.com/v2/certificates/CC-U8DL49ZZ/image/png?t=639128642579113120',
  'https://api2.sololearn.com/v2/certificates/CC-SI2WZX43/image/png?t=639128879870325970',
  'https://api2.sololearn.com/v2/certificates/CC-SUOWGF8T/image/png?t=639129397891636970',
  'https://api2.sololearn.com/v2/certificates/CC-I4TIACOI/image/png?t=639129633525792890',
  'https://api2.sololearn.com/v2/certificates/CC-GT2PAJTL/image/png?t=639130145139061920',
  'https://api2.sololearn.com/v2/certificates/CC-CCYNOT2R/image/png?t=639130171535224370',
  'https://api2.sololearn.com/v2/certificates/CC-ZYSDAZM8/image/png?t=639130228680226390',
  'https://api2.sololearn.com/v2/certificates/CC-7ABADG4R/image/png?t=639130271146365570',
  'https://api2.sololearn.com/v2/certificates/CC-DBRL4YLD/image/png?t=639131460155620180',
  'https://api2.sololearn.com/v2/certificates/CC-033EXHKA/image/png?t=639132345227292480',
  'https://api2.sololearn.com/v2/certificates/CC-UYFGANZQ/image/png?t=639132373592160560',
  'https://api2.sololearn.com/v2/certificates/CC-2M47YBCR/image/png?t=639132404731128520',
  'https://api2.sololearn.com/v2/certificates/CC-WKCFVLYI/image/png?t=639132438814129950',
  'https://api2.sololearn.com/v2/certificates/CC-CRBRNFSO/image/png?t=639132486370977210',
  'https://api2.sololearn.com/v2/certificates/CC-SUEHSLUF/image/png?t=639132518202129160',
  'https://api2.sololearn.com/v2/certificates/CC-SI4N5SIB/image/png?t=639132552000527100',
  'https://api2.sololearn.com/v2/certificates/CC-ZTIH8SKI/image/png?t=639132624414342210',
  'https://api2.sololearn.com/v2/certificates/CC-OFASKCAF/image/png?t=639136631237077950',
  'https://api2.sololearn.com/v2/certificates/CC-SCJHQBG0/image/png?t=639133282834683540',
  'https://api2.sololearn.com/v2/certificates/CC-JAJVCQCJ/image/png?t=639133319713608600',
  'https://api2.sololearn.com/v2/certificates/CC-DJ9YJOG5/image/png?t=639133354278903030',
  'https://api2.sololearn.com/v2/certificates/CC-FYISPG0F/image/png?t=639139227658362860',
  'https://api2.sololearn.com/v2/certificates/CC-AXMQ8X3Q/image/png?t=639138317832565410',
  'https://api2.sololearn.com/v2/certificates/CC-OU33MLMF/image/png?t=639142032442792440',
  'https://api2.sololearn.com/v2/certificates/CC-K47BIVEI/image/png?t=639147137885562720',
  'https://api2.sololearn.com/v2/certificates/CC-AREK9EJE/image/png?t=639154446519468340',
  'https://api2.sololearn.com/v2/certificates/CC-6ZXHTBFA/image/png?t=639158173295795190',
  'https://api2.sololearn.com/v2/certificates/CC-ZDBUNAIR/image/png?t=639156230587386000',
  'https://api2.sololearn.com/v2/certificates/CC-2SCXNBZ6/image/png?t=639220875861304820',
  'https://api2.sololearn.com/v2/certificates/CC-CAZPORAO/image/png?t=639214762709896540',
  'https://api2.sololearn.com/v2/certificates/CC-S072WEWW/image/png?t=639220816092789140',
  'https://api2.sololearn.com/v2/certificates/CC-OP1HINXS/image/png?t=639222163892448310',
  'https://api2.sololearn.com/v2/certificates/CC-GPX6LLCC/image/png?t=639222232281084110',
  'https://api2.sololearn.com/v2/certificates/CC-8VRSVYY8/image/png?t=639223768700061080',
  'https://api2.sololearn.com/v2/certificates/CC-IGJZ5ICG/image/png?t=639224674159806284',
  'https://api2.sololearn.com/v2/certificates/CC-NIHNI6RW/image/png?t=639224739175951367',
  'https://api2.sololearn.com/v2/certificates/CC-PKZFLGAF/image/png?t=639224766824092049',
  'https://api2.sololearn.com/v2/certificates/CC-ILCAQPVL/image/png?t=639224873573920252',
];

type IconType = typeof BrainCircuit;

const NAV_ITEMS: { href: string; label: string; khmer: string; icon: IconType; accent: string }[] = [
  { href: '/', label: 'Home hub', khmer: 'ផ្ទះនៃដំណើរ', icon: Compass, accent: 'text-[hsl(var(--sidebar-primary))]' },
  { href: '/ai', label: 'AI studio', khmer: 'រៀន និងបង្កើត', icon: Sparkles, accent: 'text-[hsl(var(--accent))]' },
  { href: '/ki', label: 'KI library', khmer: 'ចំណេះដឹង និងសញ្ញា', icon: BrainCircuit, accent: 'text-[#7cc7b8]' },
  { href: '/mi-k', label: 'MI-K mesh', khmer: 'ស្រទាប់តភ្ជាប់', icon: Network, accent: 'text-[#d9b768]' },
];

function SectionLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-[10px] font-mono-ui uppercase tracking-[.22em] ${light ? 'text-[#b7c9c5]' : 'text-[hsl(var(--muted-foreground))]'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
      {children}
    </div>
  );
}

function ArrowLink({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <Link href={href} data-testid={`link-${href.replace('/', '') || 'home'}-arrow`} className={`group inline-flex items-center gap-2 text-sm font-semibold transition-colors ${dark ? 'text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--primary))]'}`}>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function KhoemMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-khoem-ai">
      <div className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} relative grid place-items-center rounded-[13px] bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar))]`}>ក</div>
      {!compact && <div><p className="font-display text-sm font-extrabold tracking-[.2em] text-[hsl(var(--sidebar-foreground))]">KHOEM-AI</p><p className="font-khmer text-[10px] text-[#a9c0bc]">ដៃគូសកល សម្រាប់អ្នកសាងសង់</p></div>}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = NAV_ITEMS.find((item) => item.href === location) ?? NAV_ITEMS[0];

  return (
    <div className="khoem-noise min-h-[100dvh] bg-[hsl(var(--background))]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[276px] flex-col border-r border-[#31474b] bg-[hsl(var(--sidebar))] px-7 py-7 text-[hsl(var(--sidebar-foreground))] lg:flex">
        <Link href="/" className="mb-12 block" data-testid="link-brand-home"><KhoemMark /></Link>
        <div className="mb-4 flex items-center justify-between"><SectionLabel light>spaces / 04</SectionLabel><span className="font-mono-ui text-[10px] text-[#86a29b]">2026.08</span></div>
        <nav className="space-y-2" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link href={item.href} key={item.href} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-300 ${active ? 'bg-[#2c4c50] text-[hsl(var(--sidebar-foreground))] shadow-[inset_3px_0_0_hsl(var(--sidebar-primary))]' : 'text-[#98b0ac] hover:bg-[#253f43] hover:text-[hsl(var(--sidebar-foreground))]'}`}>
                <Icon className={`h-[18px] w-[18px] ${active ? item.accent : 'text-[#78938f]'}`} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="font-khmer block truncate text-[11px] opacity-70">{item.khmer}</span></span>
                {active && <ChevronRight className="h-4 w-4 text-[hsl(var(--sidebar-primary))]" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-[#37565a] bg-[#233f43] p-4">
          <div className="mb-3 flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#a8c2bd]">Builder mode</span><span className="h-2 w-2 rounded-full bg-[#9dd28f]" /></div>
          <p className="font-khmer text-sm leading-7 text-[#d6e2df]">រៀនតិចៗ សាងសង់រាល់ថ្ងៃ។</p>
          <p className="mt-2 text-xs leading-5 text-[#9ab3ae]">A quiet command center for a Cambodian builder shipping in public.</p>
        </div>
      </aside>

      <div className="lg:pl-[276px]">
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.88)] px-5 backdrop-blur-xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="rounded-xl p-2 text-[hsl(var(--foreground))] lg:hidden" aria-label="Toggle navigation" data-testid="button-toggle-navigation">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="lg:hidden"><KhoemMark compact /></div>
            <div className="hidden items-center gap-2 text-sm sm:flex"><span className="text-[hsl(var(--muted-foreground))]">KHOEM-AI</span><span className="text-[hsl(var(--border))]">/</span><span className="font-semibold">{current.label}</span></div>
          </div>
          <div className="flex items-center gap-4"><span className="hidden items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] sm:flex"><span className="h-2 w-2 rounded-full bg-[#8abf79]" /> local workspace</span><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))] font-khmer text-sm text-[hsl(var(--secondary-foreground))]">ក</div></div>
        </header>
        {mobileOpen && <div className="absolute left-0 right-0 top-[74px] z-20 border-b border-[#31474b] bg-[hsl(var(--sidebar))] p-4 lg:hidden"><nav className="space-y-1">{NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#d6e2df]" data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon className="h-4 w-4 text-[hsl(var(--sidebar-primary))]" /><span className="text-sm">{item.label}</span><span className="ml-auto font-khmer text-xs text-[#88a39f]">{item.khmer}</span></Link>)}</nav></div>}
        <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 sm:py-12 lg:px-12">{children}</main>
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, khmer, description, tone = 'light' }: { eyebrow: string; title: string; khmer: string; description: string; tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  return (
    <div className={`page-reveal mb-10 max-w-4xl ${dark ? 'text-[hsl(var(--sidebar-foreground))]' : ''}`}>
      <SectionLabel light={dark}>{eyebrow}</SectionLabel>
      <h1 className={`mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-.045em] sm:text-6xl ${dark ? 'text-[#f4efe5]' : 'text-[hsl(var(--foreground))]'}`}>{title}</h1>
      <p className={`mt-4 font-khmer text-lg ${dark ? 'text-[#bcd0ca]' : 'text-[hsl(var(--primary))]'}`}>{khmer}</p>
      <p className={`mt-4 max-w-2xl text-base leading-7 ${dark ? 'text-[#b3c4c0]' : 'text-[hsl(var(--muted-foreground))]'}`}>{description}</p>
    </div>
  );
}

function SpaceCard({ href, code, title, khmer, description, icon: Icon, color, number }: { href: string; code: string; title: string; khmer: string; description: string; icon: IconType; color: string; number: string }) {
  return (
    <Link href={href} data-testid={`card-space-${code.toLowerCase()}`} className="group relative flex min-h-[275px] flex-col overflow-hidden rounded-[1.7rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-1 hover:border-[hsl(var(--accent)/.55)] hover:shadow-[0_24px_55px_rgba(36,63,69,.14)] sm:p-7">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-[hsl(var(--border))] transition-transform duration-500 group-hover:scale-125" />
      <div className="flex items-start justify-between"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}><Icon className="h-5 w-5" /></div><span className="font-mono-ui text-xs text-[hsl(var(--muted-foreground))]">{number}</span></div>
      <div className="mt-auto"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">{code}</p><h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-.03em]">{title}</h2><p className="font-khmer mt-1 text-sm text-[hsl(var(--primary))]">{khmer}</p><p className="mt-3 max-w-[30ch] text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p><div className="mt-5 flex items-center gap-2 text-sm font-bold text-[hsl(var(--foreground))] transition-colors group-hover:text-[hsl(var(--primary))]">Open space <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" /></div></div>
    </Link>
  );
}

function HomePage() {
  return (
    <div className="space-y-24">
      <section className="page-reveal relative overflow-hidden rounded-[2rem] bg-[hsl(var(--secondary))] px-6 py-12 text-[hsl(var(--secondary-foreground))] sm:px-12 sm:py-16 lg:px-16 lg:py-20">
        <div className="absolute right-[-8%] top-[-34%] h-[500px] w-[500px] rounded-full border border-[#55726e]/50 sm:h-[700px] sm:w-[700px]"><div className="absolute inset-[13%] rounded-full border border-[#55726e]/45"><div className="absolute inset-[26%] rounded-full border border-[#55726e]/35" /></div></div>
        <div className="relative max-w-3xl"><SectionLabel light>personal command center / phnom penh</SectionLabel><p className="font-khmer mt-6 text-lg text-[#c6d7d2]">សូមស្វាគមន៍មកកាន់កន្លែងធ្វើការ</p><h1 className="mt-3 max-w-3xl font-display text-5xl font-extrabold leading-[.98] tracking-[-.06em] text-[#f4efe5] sm:text-7xl">Build from where you are. <span className="text-[hsl(var(--sidebar-primary))]">Ship beyond.</span></h1><p className="mt-7 max-w-xl text-base leading-7 text-[#b9cbc7] sm:text-lg">KHOEM-AI is one builder’s working home for learning with AI, keeping useful knowledge close, and connecting the systems that make ideas real.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/ai" className="group inline-flex items-center gap-3 rounded-full bg-[hsl(var(--sidebar-primary))] px-5 py-3 text-sm font-extrabold text-[hsl(var(--sidebar-primary-foreground))] transition-transform hover:-translate-y-0.5" data-testid="link-home-start-building">Start in AI studio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link><Link href="/ki" className="inline-flex items-center gap-3 rounded-full border border-[#66847e] px-5 py-3 text-sm font-semibold text-[#dce8e3] transition-colors hover:bg-[#35565a]" data-testid="link-home-open-library">Open the library</Link></div></div>
        <div className="relative mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-[#4c6865] pt-5 sm:mt-20"><div><p className="font-mono-ui text-2xl text-[#f4efe5]">03</p><p className="mt-1 text-xs text-[#a8bdb8]">companion spaces</p></div><div><p className="font-mono-ui text-2xl text-[#f4efe5]">46</p><p className="mt-1 text-xs text-[#a8bdb8]">learning proofs linked</p></div><div><p className="font-mono-ui text-2xl text-[#f4efe5]">01</p><p className="mt-1 text-xs text-[#a8bdb8]">builder, in motion</p></div></div>
      </section>

      <section className="page-reveal stagger-1"><div className="mb-7 flex items-end justify-between gap-5"><div><SectionLabel>the ecosystem / ប្រព័ន្ធ</SectionLabel><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Three spaces. One direction.</h2></div><p className="hidden max-w-xs text-right text-sm leading-6 text-[hsl(var(--muted-foreground))] md:block">Every room has a job. Together they turn curiosity into a practice.</p></div><div className="grid gap-4 md:grid-cols-3"><SpaceCard href="/ai" code="AI" number="01" title="Make with AI" khmer="បង្កើតជាមួយ AI" description="A build log for prompts, prototypes, and the skills behind useful software." icon={Sparkles} color="bg-[#f1d7b1] text-[#9b542b]" /><SpaceCard href="/ki" code="KI" number="02" title="Keep the signal" khmer="រក្សាទុកចំណេះដឹង" description="A clear shelf for ideas, references, and the questions worth returning to." icon={BrainCircuit} color="bg-[#bcded5] text-[#176b61]" /><SpaceCard href="/mi-k" code="MI-K" number="03" title="Connect the work" khmer="ភ្ជាប់ប្រព័ន្ធ" description="The connection layer: protected routes, readable logs, and event paths." icon={Network} color="bg-[#ded0a4] text-[#725b25]" /></div></section>

      <section className="page-reveal stagger-2 grid gap-8 lg:grid-cols-[1.15fr_.85fr]"><div className="rounded-[1.7rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-7 sm:p-9"><div className="flex items-center justify-between"><SectionLabel>field notes / កំណត់ត្រា</SectionLabel><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">AUG 2026</span></div><h2 className="mt-7 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-[-.04em]">The internet is wide. The work can still feel close.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-[hsl(var(--muted-foreground))]">KHOEM-AI holds the small rituals that compound: one focused lesson, one honest prototype, one useful note passed forward.</p><div className="mt-8 flex items-center gap-4"><div className="flex -space-x-2"><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(var(--card))] bg-[#d7ad71] font-khmer text-sm text-[#354247]">ក</span><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(var(--card))] bg-[#86bcb2] text-xs font-bold text-[#21444a]">AI</span><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(var(--card))] bg-[#e48e6d] text-xs font-bold text-[#5a302a]">KI</span></div><span className="text-xs text-[hsl(var(--muted-foreground))]">your local constellation</span></div></div><div className="flex flex-col justify-between rounded-[1.7rem] bg-[#e5c28c] p-7 text-[#3b3630] sm:p-9"><div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f6ead2]/70"><GraduationCap className="h-5 w-5" /></span><h2 className="mt-8 font-display text-3xl font-extrabold leading-tight tracking-[-.04em]">Proof of practice</h2><p className="font-khmer mt-2 text-sm">វិញ្ញាបនបត្រ ជាស្នាមជើងនៃការរៀន</p><p className="mt-4 text-sm leading-6 text-[#66594b]">A respectful shelf for the courses completed along the way, not a scoreboard.</p></div><ArrowLink href="/ai">See the learning archive</ArrowLink></div></section>
    </div>
  );
}

function AiPage() {
  const [prompt, setPrompt] = useState('');
  const [built, setBuilt] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const visibleCerts = showAll ? CERTIFICATES : CERTIFICATES.slice(0, 8);
  return (
    <div className="space-y-16">
      <PageIntro eyebrow="AI / studio" title="Learn by making something you can use." khmer="រៀនដោយបង្កើតអ្វីដែលអាចប្រើបានពិតប្រាកដ" description="The AI room is for experiments with a destination. Keep the prompt, make the first version, then return with better questions." />
      <section className="page-reveal stagger-1 grid gap-5 lg:grid-cols-[.92fr_1.08fr]">
        <div className="rounded-[1.7rem] bg-[hsl(var(--secondary))] p-7 text-[hsl(var(--secondary-foreground))] sm:p-9"><div className="flex items-center justify-between"><SectionLabel light>current loop / 01</SectionLabel><Zap className="h-5 w-5 text-[hsl(var(--sidebar-primary))]" /></div><h2 className="mt-10 max-w-sm font-display text-3xl font-extrabold leading-tight tracking-[-.04em] text-[#f4efe5]">From question to working surface.</h2><p className="font-khmer mt-4 text-sm text-[#bfd2cd]">សំណួរ → សាកល្បង → ចែករំលែក</p><div className="mt-10 space-y-5">{['Find the edge of the question', 'Build a small, visible version', 'Keep what makes the next version easier'].map((item, index) => <div className="flex gap-3" key={item}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${index === 0 ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar))]' : 'border border-[#617b75] text-[#afc4bd]'}`}>{index === 0 ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><p className="text-sm leading-6 text-[#d1dfdb]">{item}</p></div>)}</div></div>
        <div className="rounded-[1.7rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-7 shadow-[var(--shadow-soft)] sm:p-9"><div className="flex items-center justify-between"><div><SectionLabel>workbench / local draft</SectionLabel><h2 className="mt-3 font-display text-xl font-extrabold">What are you building next?</h2></div><span className="rounded-full bg-[#e9d9b8] px-3 py-1 font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#735c30]">no backend</span></div><label className="sr-only" htmlFor="ai-build-prompt">Describe the next build</label><textarea id="ai-build-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="A small problem I want to solve..." className="mt-8 min-h-[142px] w-full resize-none rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 text-sm leading-6 outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.16)]" data-testid="input-ai-build-prompt" /><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[hsl(var(--muted-foreground))]">{built ? 'Draft captured locally. The next step is yours.' : 'A private scratchpad for the first sentence.'}</span><button type="button" onClick={() => setBuilt(true)} disabled={!prompt.trim()} className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-capture-ai-idea">{built ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}{built ? 'Captured' : 'Capture idea'}</button></div></div>
      </section>
      <section className="page-reveal stagger-2"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><SectionLabel>learning proof / sololearn</SectionLabel><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em]">Small certificates. Long momentum.</h2><p className="font-khmer mt-2 text-sm text-[hsl(var(--primary))]">ស្នាមជើងតូចៗ នាំទៅកាន់ដំណើរឆ្ងាយ</p></div><span className="font-mono-ui text-xs text-[hsl(var(--muted-foreground))]">{CERTIFICATES.length} linked proofs</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{visibleCerts.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[hsl(var(--accent))] hover:shadow-[var(--shadow-soft)]" data-testid={`link-certificate-${index + 1}`}><div className="relative aspect-[1.42] overflow-hidden rounded-xl bg-[#e9ddc4]"><img src={url} alt={`Sololearn learning certificate ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-[#172b3a]/0 transition-colors group-hover:bg-[#172b3a]/12" /></div><div className="flex items-center justify-between px-1 py-2"><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">proof {String(index + 1).padStart(2, '0')}</span><ExternalLink className="h-3 w-3 text-[hsl(var(--muted-foreground))]" /></div></a>)}</div><button type="button" onClick={() => setShowAll((show) => !show)} className="mt-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-bold transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]" data-testid="button-toggle-certificates">{showAll ? 'Show a focused selection' : `View all ${CERTIFICATES.length} linked certificates`}<ChevronRight className={`h-4 w-4 transition-transform ${showAll ? 'rotate-90' : ''}`} /></button></section>
    </div>
  );
}

function KiPage() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const signals = [
    { type: 'question', title: 'What makes a helpful AI tool feel human?', tag: 'design', color: '#d9876b' },
    { type: 'reference', title: 'Express middleware is a sequence of decisions', tag: 'systems', color: '#78b7aa' },
    { type: 'note', title: 'Learning proof is evidence, not identity', tag: 'practice', color: '#d4b66a' },
  ];
  const visibleSignals = signals.filter((signal) => filter === 'all' || signal.tag === filter).filter((signal) => signal.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-16">
      <PageIntro eyebrow="KI / library" title="Keep the signal. Let the noise pass." khmer="រក្សាសញ្ញាដែលមានប្រយោជន៍ ទុកសំឡេងរំខានឲ្យឆ្លងកាត់" description="KI is the shelf behind the work: ideas with handles, references with context, and signals that become more useful each time you return." />
      <section className="page-reveal stagger-1 grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><div className="rounded-[1.7rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-7 shadow-[var(--shadow-soft)] sm:p-9"><div className="flex flex-wrap items-center justify-between gap-4"><div><SectionLabel>signal board / 03</SectionLabel><h2 className="mt-3 font-display text-2xl font-extrabold">What is worth keeping?</h2></div><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><label htmlFor="ki-search" className="sr-only">Search the signal board</label><input id="ki-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a signal" className="w-40 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2 pl-9 pr-3 text-xs outline-none focus:border-[hsl(var(--primary))] sm:w-48" data-testid="input-ki-search" /></div></div><div className="mt-7 flex gap-2 overflow-auto pb-1">{['all', 'design', 'systems', 'practice'].map((item) => <button type="button" onClick={() => setFilter(item)} key={item} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-colors ${filter === item ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`} data-testid={`button-filter-${item}`}>{item}</button>)}</div><div className="mt-6 space-y-3">{visibleSignals.map((signal, index) => <div key={signal.title} className="group flex items-start gap-4 rounded-2xl border border-[hsl(var(--border))] p-4 transition-colors hover:border-[hsl(var(--accent)/.7)]"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: signal.color }} /><div className="min-w-0 flex-1"><p className="text-sm font-bold leading-6">{signal.title}</p><p className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.13em] text-[hsl(var(--muted-foreground))]">{signal.type} · {signal.tag}</p></div><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">0{index + 1}</span></div>)}{visibleSignals.length === 0 && <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No signal matches that search yet.</div>}</div></div><div className="relative overflow-hidden rounded-[1.7rem] bg-[#b8d8ce] p-7 text-[#214b4b] sm:p-9"><div className="absolute -bottom-16 -right-12 h-48 w-48 rounded-full border-[22px] border-[#8ebfb2]/65" /><BookOpen className="h-6 w-6" /><h2 className="mt-8 font-display text-3xl font-extrabold leading-tight tracking-[-.04em]">A library should help you return.</h2><p className="font-khmer mt-3 text-sm">ចំណេះដឹងល្អ តែងតែហៅយើងត្រឡប់មកវិញ</p><p className="mt-5 text-sm leading-6 text-[#4c6e6c]">Not a vault. A living shelf that gives the next build a better starting point.</p><div className="mt-10 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em]"><CircleDot className="h-3.5 w-3.5" /> local-first by design</div></div></section>
      <section className="page-reveal stagger-2 grid gap-5 md:grid-cols-2"><div className="rounded-[1.7rem] bg-[#ead8b3] p-7 sm:p-9"><SectionLabel>new note / local draft</SectionLabel><h2 className="mt-4 font-display text-2xl font-extrabold">Leave one useful sentence.</h2><textarea aria-label="New knowledge note" placeholder="Something I want to remember..." className="mt-6 min-h-[110px] w-full resize-none rounded-2xl border border-[#d3bd8e] bg-[#f3e6c8] p-4 text-sm leading-6 text-[#3b3630] outline-none placeholder:text-[#887a5d] focus:border-[#a57931]" data-testid="input-ki-new-note" /><div className="mt-4 flex items-center justify-between"><span className="text-xs text-[#77684b]">{saved ? 'Saved in your local workspace.' : 'No sync. No noise.'}</span><button type="button" onClick={() => setSaved(true)} className="rounded-full bg-[#254b4c] px-4 py-2 text-sm font-bold text-[#f4efe5] transition-transform hover:-translate-y-0.5" data-testid="button-save-ki-note">{saved ? 'Saved' : 'Keep note'}</button></div></div><div className="rounded-[1.7rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-7 sm:p-9"><SectionLabel>knowledge rhythm</SectionLabel><div className="mt-7 flex items-end gap-2"><span className="font-mono-ui text-5xl font-medium tracking-[-.08em]">12</span><span className="mb-2 text-sm text-[hsl(var(--muted-foreground))]">signals kept this month</span></div><div className="mt-7 flex h-16 items-end gap-2">{[28, 44, 36, 68, 51, 79, 58, 90, 74, 100].map((height, index) => <span key={index} className={`flex-1 rounded-t-sm ${index > 7 ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary)/.35)]'}`} style={{ height: `${height}%` }} />)}</div><p className="mt-5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">The archive grows at the speed of attention, not the speed of collection.</p></div></section>
    </div>
  );
}

function MiKPage() {
  const [eventSeen, setEventSeen] = useState(false);
  const layers = [
    { icon: ShieldCheck, title: 'Guard the routes', code: 'HELMET + CORS', copy: 'Baseline browser and header protection around the router.', color: 'bg-[#b9d9cc] text-[#195f56]' },
    { icon: TerminalSquare, title: 'Read every request', code: 'PINO HTTP', copy: 'Structured request logs make the path visible when systems grow.', color: 'bg-[#e8d4aa] text-[#745d29]' },
    { icon: KeyRound, title: 'Trust node-to-node', code: 'API KEY MIDDLEWARE', copy: 'Protected API routes reject unknown callers. The key stays server-side.', color: 'bg-[#efc3af] text-[#814331]' },
    { icon: Radio, title: 'Move the alert', code: 'SOCKET.IO', copy: 'A future event mesh for alerts from AI or KI to the KHOEM-AI home.', color: 'bg-[#c6cbe4] text-[#4e5681]' },
  ];
  return (
    <div className="space-y-16">
      <PageIntro eyebrow="MI-K / mesh" title="The quiet layer that keeps the work connected." khmer="ស្រទាប់ស្ងប់ស្ងាត់ ដែលភ្ជាប់ការងារទាំងអស់" description="MI-K describes the connection layer across KHOEM-AI, AI, and KI. These are architecture concepts from the notes, shown honestly as a map — not as a live backend." />
      <section className="page-reveal stagger-1 rounded-[1.7rem] bg-[hsl(var(--secondary))] p-7 text-[hsl(var(--secondary-foreground))] sm:p-10"><div className="flex flex-wrap items-start justify-between gap-6"><div><SectionLabel light>concept map / mi-i router</SectionLabel><h2 className="mt-4 max-w-xl font-display text-3xl font-extrabold tracking-[-.04em] text-[#f4efe5]">A three-room system needs a fourth wall.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-[#b7cbc6]">MI-K is that wall: it protects the entrances, records the movement, and leaves a path for real-time signals.</p></div><span className="rounded-full border border-[#58736e] px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[.13em] text-[#c8d8d3]">conceptual / not connected</span></div><div className="mt-10 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center"><div className="rounded-2xl border border-[#48645f] bg-[#28474a] p-5"><div className="flex items-center gap-2 text-[hsl(var(--sidebar-primary))]"><Orbit className="h-4 w-4" /><span className="font-mono-ui text-[10px]">KHOEM-AI</span></div><p className="mt-3 text-sm font-semibold text-[#e2ece8]">Home hub</p></div><ArrowRight className="hidden text-[#76928b] md:block" /><div className="rounded-2xl border border-[hsl(var(--sidebar-primary)/.55)] bg-[#34575a] p-5"><div className="flex items-center gap-2 text-[hsl(var(--sidebar-primary))]"><Network className="h-4 w-4" /><span className="font-mono-ui text-[10px]">MI-K</span></div><p className="mt-3 text-sm font-semibold text-[#e2ece8]">Central router concept</p></div><ArrowRight className="hidden text-[#76928b] md:block" /><div className="rounded-2xl border border-[#48645f] bg-[#28474a] p-5"><div className="flex items-center gap-2 text-[#b7d8cc]"><Boxes className="h-4 w-4" /><span className="font-mono-ui text-[10px]">AI + KI</span></div><p className="mt-3 text-sm font-semibold text-[#e2ece8]">Companion nodes</p></div></div></section>
      <section className="page-reveal stagger-2"><div className="mb-7 flex items-end justify-between gap-5"><div><SectionLabel>architecture notes / បច្ចេកទេស</SectionLabel><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em]">Four ideas worth carrying forward.</h2></div><span className="hidden font-mono-ui text-[10px] uppercase tracking-[.13em] text-[hsl(var(--muted-foreground))] sm:block">Express · Node · Socket.IO</span></div><div className="grid gap-4 sm:grid-cols-2">{layers.map((layer, index) => <article key={layer.code} className="group rounded-[1.5rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1"><div className="flex items-start justify-between"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${layer.color}`}><layer.icon className="h-5 w-5" /></div><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">0{index + 1}</span></div><p className="mt-8 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{layer.code}</p><h3 className="mt-2 font-display text-xl font-extrabold">{layer.title}</h3><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{layer.copy}</p></article>)}</div></section>
      <section className="page-reveal stagger-3 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-[1.7rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-7 sm:p-9"><div className="flex items-center gap-3"><BellRing className="h-5 w-5 text-[hsl(var(--accent))]" /><SectionLabel>event preview</SectionLabel></div><h2 className="mt-6 font-display text-2xl font-extrabold">See the shape of an alert.</h2><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">This button only previews a local event state. No socket is open and no data is sent.</p><button type="button" onClick={() => setEventSeen((seen) => !seen)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5" data-testid="button-preview-mi-k-event">{eventSeen ? <Check className="h-4 w-4" /> : <Radio className="h-4 w-4" />}{eventSeen ? 'Preview acknowledged' : 'Preview local event'}</button></div><div className="rounded-[1.7rem] bg-[#203c40] p-7 font-mono-ui text-sm text-[#bed1cb] sm:p-9"><div className="mb-5 flex items-center justify-between border-b border-[#3b5a5b] pb-4"><span className="text-[10px] uppercase tracking-[.17em] text-[#8da8a1]">MI-K / event shape</span><span className="flex items-center gap-2 text-[10px] text-[#9ac28a]"><span className="h-1.5 w-1.5 rounded-full bg-[#9ac28a]" /> local preview</span></div><pre className="overflow-auto whitespace-pre-wrap text-[12px] leading-7">{`{
  "source": "KI",
  "event": "system_alert",
  "severity": "observe",
  "message": "${eventSeen ? 'A useful signal is ready for the mesh.' : 'Waiting for a future signal...'}",
  "transport": "Socket.IO",
  "status": "not connected"
}`}</pre></div></section>
    </div>
  );
}

export function KhoemApp() {
  const [location] = useLocation();
  const page = useMemo(() => {
    if (location === '/ai') return <AiPage />;
    if (location === '/ki') return <KiPage />;
    if (location === '/mi-k') return <MiKPage />;
    return <HomePage />;
  }, [location]);
  return <Shell>{page}</Shell>;
}
