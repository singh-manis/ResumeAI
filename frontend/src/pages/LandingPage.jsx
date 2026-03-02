import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    BotMessageSquare, ScanSearch, ArrowRight, CheckSquare, Star,
    Menu, X, Github, Twitter, Linkedin, MessageSquare,
    Trophy, PenTool, Zap, ChevronRight, Sparkles, Target, Rocket, BarChart3, Play
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

/* ────────────────────────────────────────────────────────────
   Rezlo Logo Mark — CSS gradient bg, NO SVG gradient IDs
   ──────────────────────────────────────────────────────────── */
const RezloMark = ({ size = 28 }) => (
    <span
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.26),
            background: 'linear-gradient(135deg,#6366f1,#ec4899)',
            flexShrink: 0,
        }}
    >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="2" y="1" width="4" height="24" rx="2" fill="white" />
            <path d="M6 1 H15 C19.4 1 23 4.6 23 9 C23 13.4 19.4 17 15 17 H6"
                stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="14" y1="17" x2="23" y2="25" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
    </span>
);

/* Animated counter */
const Counter = ({ target, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const [started, setStarted] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started) {
                setStarted(true);
                let s = 0;
                const n = parseInt(target, 10);
                const step = Math.max(1, Math.floor(n / 80));
                const t = setInterval(() => {
                    s += step;
                    if (s >= n) { setCount(n); clearInterval(t); }
                    else setCount(s);
                }, 20);
            }
        }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [target, started]);
    return <span ref={ref}>{count}{suffix}</span>;
};

/* ════════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════════ */
const LandingPage = () => {
    const { isAuthenticated, user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [navScrolled, setNavScrolled] = useState(false);
    const heroRef = useRef(null);

    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    useEffect(() => {
        const fn = () => setNavScrolled(window.scrollY > 40);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const dashLink =
        user?.role === 'CANDIDATE' ? '/candidate' :
            user?.role === 'RECRUITER' ? '/recruiter' : '/admin';

    const features = [
        {
            icon: <ScanSearch size={26} />, title: 'AI Resume Analysis',
            desc: 'Deep neural extraction of skills, gaps & ATS scores in seconds.', color: 'blue',
            img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80&auto=format&fit=crop',
        },
        {
            icon: <MessageSquare size={26} />, title: 'AI Mock Interviews',
            desc: 'Real-time adaptive AI interviewer with instant personalised feedback.', color: 'purple',
            img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
        },
        {
            icon: <Trophy size={26} />, title: 'Gamified Learning',
            desc: 'XP, streaks, leaderboards — career growth made addictive.', color: 'orange',
            img: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=600&q=80&auto=format&fit=crop',
        },
        {
            icon: <PenTool size={26} />, title: 'Smart Resume Builder',
            desc: 'ATS-optimised templates crafted by AI, polished for humans.', color: 'green',
            img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80&auto=format&fit=crop',
        },
        {
            icon: <BotMessageSquare size={26} />, title: 'AI Career Advisor',
            desc: 'Your personal AI mentor — always on, always insightful.', color: 'yellow',
            img: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&q=80&auto=format&fit=crop',
        },
        {
            icon: <Zap size={26} />, title: 'Instant Job Matching',
            desc: 'Precision-matched opportunities aligned to your unique profile.', color: 'pink',
            img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop',
        },
    ];

    const testimonials = [
        { name: 'Sarah K.', role: 'Software Developer', av: 'S', quote: 'Landed my dream job in 2 weeks after the AI identified gaps I never noticed!' },
        { name: 'Michael R.', role: 'HR Manager', av: 'M', quote: 'Saves me hours of manual screening. The matching is incredibly accurate.' },
        { name: 'Emily T.', role: 'Data Analyst', av: 'E', quote: 'ATS score jumped from 45% to 92% overnight. Total game-changer.' },
        { name: 'David L.', role: 'Frontend Engineer', av: 'D', quote: 'Stunning interface, and the insights are actually useful. Love it!' },
        { name: 'Jessica M.', role: 'Product Manager', av: 'J', quote: 'Finally a tool that understands context, not just keywords.' },
        { name: 'Raj P.', role: 'ML Engineer', av: 'R', quote: 'Matched with 3 top-tier companies in my first week using this platform.' },
    ];

    const skills = [
        { l: 'React.js', p: 92, c: '#6366f1' },
        { l: 'Node.js', p: 78, c: '#a855f7' },
        { l: 'Python', p: 65, c: '#ec4899' },
    ];

    return (
        <div className="lp-root">

            {/* ── NAV ─────────────────────────────────────────────────── */}
            <nav className={`lp-nav ${navScrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-nav__inner">
                    <Link to="/" className="lp-logo">
                        <RezloMark size={34} />
                        <span>Rezlo</span>
                    </Link>
                    <div className={`lp-nav__links ${menuOpen ? 'lp-nav__links--open' : ''}`}>
                        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
                        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
                        <a href="#testimonials" onClick={() => setMenuOpen(false)}>Reviews</a>
                        <div className="lp-nav__mobile-cta">
                            {isAuthenticated
                                ? <Link to={dashLink} className="lp-btn lp-btn--primary">Dashboard</Link>
                                : <><Link to="/login" className="lp-btn lp-btn--ghost">Sign In</Link>
                                    <Link to="/register" className="lp-btn lp-btn--primary">Get Started</Link></>
                            }
                        </div>
                    </div>
                    <div className="lp-nav__cta">
                        {isAuthenticated
                            ? <Link to={dashLink} className="lp-btn lp-btn--primary">Dashboard <ArrowRight size={16} /></Link>
                            : <><Link to="/login" className="lp-btn lp-btn--ghost">Sign In</Link>
                                <Link to="/register" className="lp-btn lp-btn--primary">Get Started <ArrowRight size={16} /></Link></>
                        }
                    </div>
                    <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="menu">
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <section className="lp-hero" ref={heroRef}>
                <div className="lp-hero__bg">
                    <div className="lp-hero__grid" />
                    <div className="lp-orb lp-orb--violet" />
                    <div className="lp-orb lp-orb--pink" />
                    <div className="lp-orb lp-orb--cyan" />
                </div>

                <motion.div className="lp-hero__inner" style={{ y: heroY, opacity: heroOpacity }}>
                    {/* Left copy */}
                    <div className="lp-hero__copy">
                        <motion.div className="lp-badge"
                            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Sparkles size={14} /><span>Next-Gen AI Career Platform</span>
                        </motion.div>
                        <motion.h1 className="lp-hero__title"
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            Land Your<br /><span className="lp-accent">Dream Job</span><br />with AI Power
                        </motion.h1>
                        <motion.p className="lp-hero__sub"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                            Upload your resume. Get instant AI analysis, smart job matching, and
                            personalised career coaching — all in one platform.
                        </motion.p>
                        <motion.div className="lp-hero__actions"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
                            {isAuthenticated
                                ? <Link to={dashLink} className="lp-btn lp-btn--primary lp-btn--xl lp-btn--glow">
                                    Open Dashboard <ArrowRight size={20} />
                                </Link>
                                : <>
                                    <Link to="/register" className="lp-btn lp-btn--primary lp-btn--xl lp-btn--glow">
                                        Start Free <ArrowRight size={20} />
                                    </Link>
                                    <Link to="/login" className="lp-btn lp-btn--outline lp-btn--xl">
                                        <Play size={18} /> Sign In
                                    </Link>
                                </>
                            }
                        </motion.div>
                        <motion.div className="lp-trust"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
                            <div className="lp-trust__avs">
                                {['S', 'M', 'E', 'D', 'J'].map((l, i) => (
                                    <div key={i} className="lp-trust__av" style={{ '--i': i }}>{l}</div>
                                ))}
                            </div>
                            <span><strong>10,000+</strong> professionals already onboard</span>
                        </motion.div>
                    </div>

                    {/* Right — 3D image visual */}
                    <motion.div className="lp-hero__visual"
                        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9, delay: 0.5 }}>
                        <div className="lp-3d-scene">
                            <div className="lp-3d-glow" />
                            <motion.img
                                src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop"
                                alt="Premium AI fluid abstract"
                                className="lp-3d-img"
                                animate={{ y: [0, -16, 0] }}
                                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <div className="lp-3d-overlay">
                                <div className="lp-3d-stat-card">
                                    <div className="lp-3d-stat-header">
                                        <span className="lp-dot lp-dot--green" />
                                        <span>Resume AI Score</span>
                                        <strong className="lp-score-badge">85%</strong>
                                    </div>
                                    <div className="lp-skill-list">
                                        {skills.map(s => (
                                            <div key={s.l} className="lp-skill-row">
                                                <span>{s.l}</span>
                                                <div className="lp-skill-bar">
                                                    <motion.div
                                                        className="lp-skill-fill"
                                                        style={{ background: s.c }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${s.p}%` }}
                                                        transition={{ duration: 1.3, delay: 1.2 }}
                                                    />
                                                </div>
                                                <span>{s.p}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Floating badges */}
                        <motion.div className="lp-float lp-float--match"
                            animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                            <Target size={18} />
                            <div><strong>96% Match Found</strong><span>Senior Dev @ TechCorp</span></div>
                        </motion.div>
                        <motion.div className="lp-float lp-float--xp"
                            animate={{ y: [0, 12, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
                            <Trophy size={18} />
                            <div><strong>+250 XP Earned!</strong><span>Interview Ace Badge</span></div>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Stats bar */}
                <div className="lp-stats-bar">
                    {[{ v: '10', s: 'K+', l: 'Resumes Analyzed' }, { v: '95', s: '%', l: 'Match Accuracy' }, { v: '500', s: '+', l: 'Partner Companies' }, { v: '24', s: '/7', l: 'AI Support' }]
                        .map((st, i) => (
                            <div key={i} className="lp-stat">
                                <span className="lp-stat__val"><Counter target={st.v} suffix={st.s} /></span>
                                <span className="lp-stat__lbl">{st.l}</span>
                            </div>
                        ))}
                </div>
            </section>

            {/* ── FEATURES ─────────────────────────────────────────────── */}
            < section id="features" className="lp-features" >
                <div className="lp-container">
                    <motion.div className="lp-section-head"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="lp-chip"><Rocket size={14} />Core Features</div>
                        <h2>Everything You Need to <span className="lp-accent">Win</span></h2>
                        <p>Six powerful AI tools designed to transform your job search from frustrating to unstoppable.</p>
                    </motion.div>
                    <div className="lp-features__grid">
                        {features.map((f, i) => (
                            <motion.div key={i} className={`lp-feat lp-feat--${f.color}`}
                                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ delay: i * 0.1 }} whileHover={{ y: -8, scale: 1.02 }}>
                                <div className="lp-feat__imgwrap">
                                    <img src={f.img} alt={f.title} className="lp-feat__img" loading="lazy" />
                                    <div className="lp-feat__imgoverlay" />
                                    <div className="lp-feat__icon lp-feat__icon--over">{f.icon}</div>
                                </div>
                                <div className="lp-feat__body">
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </div>
                                <div className="lp-feat__glow" />
                                <ChevronRight size={18} className="lp-feat__arr" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section >

            {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
            < section id="how-it-works" className="lp-how" >
                <div className="lp-container">
                    <motion.div className="lp-section-head"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="lp-chip"><BarChart3 size={14} />Simple Process</div>
                        <h2>From Resume to <span className="lp-accent">Hired</span> in 3 Steps</h2>
                        <p>Our streamlined AI pipeline gets you from upload to offer letter in record time.</p>
                    </motion.div>
                    <div className="lp-steps">
                        {[
                            {
                                n: '01', icon: <ScanSearch size={32} />, title: 'Upload Resume',
                                desc: 'Drop your PDF or Word doc. Our parser extracts every detail instantly.'
                            },
                            {
                                n: '02', icon: <Sparkles size={32} />, title: 'AI Deep Analysis',
                                desc: 'Skills mapping, ATS scoring, and gap detection — all automated.'
                            },
                            {
                                n: '03', icon: <Rocket size={32} />, title: 'Get Matched & Hired',
                                desc: 'Curated job matches and AI coaching to smash every interview.'
                            },
                        ].map((step, i) => (
                            <motion.div key={i} className="lp-step"
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.2 }}>
                                <div className="lp-step__num">{step.n}</div>
                                <div className="lp-step__icon">{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                                {i < 2 && <div className="lp-step__line" />}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section >

            {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
            < section id="testimonials" className="lp-reviews" >
                <div className="lp-container">
                    <motion.div className="lp-section-head"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="lp-chip"><Star size={14} />User Reviews</div>
                        <h2>Loved by <span className="lp-accent">Thousands</span></h2>
                        <p>Real results from real professionals who transformed their careers with Rezlo.</p>
                    </motion.div>
                    <div className="lp-marquee">
                        <div className="lp-marquee__track">
                            {[...testimonials, ...testimonials].map((t, i) => (
                                <div key={i} className="lp-review">
                                    <div className="lp-review__stars">
                                        {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                                    </div>
                                    <p>"{t.quote}"</p>
                                    <div className="lp-review__author">
                                        <div className="lp-review__av">{t.av}</div>
                                        <div><strong>{t.name}</strong><span>{t.role}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section >

            {/* ── CTA ──────────────────────────────────────────────────── */}
            < section className="lp-cta" >
                <div className="lp-container">
                    <motion.div className="lp-cta__box"
                        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                        <div className="lp-orb lp-orb--cta-v" /><div className="lp-orb lp-orb--cta-p" />
                        <div className="lp-chip lp-chip--light"><Sparkles size={14} />Start Today — It's Free</div>
                        <h2>Ready to <span className="lp-accent">Supercharge</span> Your Career?</h2>
                        <p>Join 10,000+ professionals using Rezlo to land jobs faster with AI.</p>
                        <div className="lp-cta__actions">
                            {isAuthenticated
                                ? <Link to={dashLink} className="lp-btn lp-btn--primary lp-btn--xl lp-btn--glow">
                                    Open Dashboard <ArrowRight size={20} />
                                </Link>
                                : <Link to="/register" className="lp-btn lp-btn--primary lp-btn--xl lp-btn--glow">
                                    Get Started Free <ArrowRight size={20} />
                                </Link>
                            }
                        </div>
                        <div className="lp-cta__perks">
                            {['Free to start', 'No credit card', 'Instant AI analysis'].map(p => (
                                <span key={p}><CheckSquare size={16} />{p}</span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section >

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            < footer className="lp-footer" >
                <div className="lp-container">
                    <div className="lp-footer__top">
                        <div className="lp-footer__brand">
                            <Link to="/" className="lp-logo">
                                <RezloMark size={28} /><span>Rezlo</span>
                            </Link>
                            <p>AI-powered resume analysis and job matching platform. Land your dream job, faster.</p>
                            <div className="lp-footer__socials">
                                <a href="#" aria-label="GitHub"><Github size={20} /></a>
                                <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                                <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                            </div>
                        </div>
                        <div className="lp-footer__links">
                            {[
                                { t: 'Product', l: ['Features', 'How It Works', 'Pricing'] },
                                { t: 'Company', l: ['About', 'Careers', 'Contact'] },
                                { t: 'Legal', l: ['Privacy', 'Terms', 'Security'] },
                            ].map(col => (
                                <div key={col.t} className="lp-footer__col">
                                    <h4>{col.t}</h4>
                                    {col.l.map(l => <a key={l} href="#">{l}</a>)}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lp-footer__bottom">
                        <p>© 2026 Rezlo. All rights reserved.</p>
                        <p>Built with <span style={{ color: '#ec4899' }}>♥</span> for job seekers worldwide</p>
                    </div>
                </div>
            </footer >

        </div >
    );
};

export default LandingPage;
