import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

/* ─── Font injection (same as Landing) ─── */
function useFonts() {
  useEffect(() => {
    if (document.getElementById('homesync-fonts')) return;
    const link = document.createElement('link');
    link.id = 'homesync-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

const grainSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.07'/%3E%3C/svg%3E")`;

const css = `
  :root {
    /* Aliased to the shared --hs-* variables (src/index.css) so this page's
       colors invert under dark mode instead of duplicating the palette. */
    --cream:  hsl(var(--hs-cream));
    --tan:    hsl(var(--hs-tan));
    --bark:   hsl(var(--hs-bark));
    --rust:   hsl(var(--hs-rust));
    --olive:  hsl(var(--hs-olive));
    --sand:   hsl(var(--hs-sand));
    --ink:    hsl(var(--hs-ink));
    --muted:  hsl(var(--hs-muted));
    --ff-display: 'Playfair Display', Georgia, serif;
    --ff-mono:    'DM Mono', 'Courier New', monospace;
    --ff-body:    'DM Sans', system-ui, sans-serif;
  }

  .auth-root {
    font-family: var(--ff-body);
    background-color: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    display: flex;
    overflow: hidden;
  }

  .auth-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: ${grainSvg};
    background-repeat: repeat;
    pointer-events: none;
    z-index: 999;
    opacity: 0.4;
  }

  /* ── LEFT PANEL ── */
  .auth-left {
    width: 52%;
    background: var(--ink);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem;
    position: relative;
    overflow: hidden;
  }
  @media (max-width: 900px) { .auth-left { display: none; } }

  /* big decorative letter */
  .auth-left-bg-letter {
    position: absolute;
    right: -8%;
    bottom: -10%;
    font-family: var(--ff-display);
    font-size: 52vw;
    font-weight: 900;
    color: rgba(255,255,255,0.03);
    line-height: 1;
    pointer-events: none;
    user-select: none;
    letter-spacing: -0.05em;
  }

  /* horizontal rule decorations */
  .auth-left-rule {
    width: 100%;
    height: 1px;
    background: rgba(212,184,150,0.15);
    margin: 0;
  }

  .auth-left-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 1;
  }
  .auth-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .auth-logo-mark {
    width: 36px; height: 36px;
    background: var(--rust);
    display: flex; align-items: center; justify-content: center;
    transform: rotate(-3deg);
    flex-shrink: 0;
  }
  .auth-logo-text {
    font-family: var(--ff-mono);
    font-size: 12px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--tan);
    font-weight: 500;
  }
  .auth-left-tag {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(212,184,150,0.4);
    border: 1px solid rgba(212,184,150,0.15);
    padding: 5px 12px;
  }

  .auth-left-mid {
    position: relative;
    z-index: 1;
  }
  .auth-left-kicker {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--rust);
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1.5rem;
  }
  .auth-left-kicker::before {
    content: '';
    display: block;
    width: 30px; height: 1.5px;
    background: var(--rust);
  }
  .auth-left-headline {
    font-family: var(--ff-display);
    font-size: clamp(2.2rem, 3.5vw, 3.2rem);
    font-weight: 900;
    line-height: 1.0;
    color: var(--cream);
    margin: 0 0 1.5rem;
    letter-spacing: -0.02em;
  }
  .auth-left-headline em {
    font-style: italic;
    color: var(--rust);
  }
  .auth-left-desc {
    font-size: 0.9rem;
    color: rgba(245,240,232,0.45);
    line-height: 1.75;
    max-width: 38ch;
    margin-bottom: 2.5rem;
  }

  .auth-features-list {
    list-style: none;
    margin: 0; padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid rgba(212,184,150,0.12);
  }
  .auth-feature-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(212,184,150,0.12);
  }
  .auth-feature-num {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    color: var(--rust);
    opacity: 0.7;
    flex-shrink: 0;
    width: 20px;
  }
  .auth-feature-text {
    font-size: 0.85rem;
    color: rgba(245,240,232,0.55);
    letter-spacing: 0.01em;
  }

  .auth-left-bottom {
    position: relative;
    z-index: 1;
  }
  .auth-left-footnote {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(212,184,150,0.25);
  }

  /* ── RIGHT PANEL ── */
  .auth-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 3rem 2.5rem;
    position: relative;
    background: var(--cream);
  }

  /* subtle vertical rule at split */
  .auth-right::before {
    content: '';
    position: absolute;
    left: 0; top: 10%; bottom: 10%;
    width: 1px;
    background: var(--sand);
    opacity: 0.5;
  }
  @media (max-width: 900px) { .auth-right::before { display: none; } }

  .auth-form-wrap {
    width: 100%;
    max-width: 400px;
  }

  /* back button */
  .auth-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: 2.5rem;
    transition: color 0.2s;
  }
  .auth-back:hover { color: var(--ink); }

  /* mobile logo */
  .auth-mobile-logo {
    display: none;
    align-items: center;
    gap: 10px;
    margin-bottom: 2rem;
  }
  @media (max-width: 900px) { .auth-mobile-logo { display: flex; } }

  /* heading */
  .auth-form-heading {
    margin-bottom: 2.5rem;
  }
  .auth-form-kicker {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--rust);
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0.75rem;
  }
  .auth-form-kicker::before {
    content: '';
    display: block;
    width: 22px; height: 1.5px;
    background: var(--rust);
  }
  .auth-form-title {
    font-family: var(--ff-display);
    font-size: 2rem;
    font-weight: 900;
    color: var(--ink);
    line-height: 1.05;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
  }
  .auth-form-subtitle {
    font-size: 0.875rem;
    color: var(--muted);
    line-height: 1.6;
  }

  /* tab switcher */
  .auth-tabs {
    display: flex;
    border: 1.5px solid var(--sand);
    margin-bottom: 2rem;
    gap: 0;
  }
  .auth-tab {
    flex: 1;
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 10px;
    cursor: pointer;
    background: transparent;
    border: none;
    color: var(--muted);
    transition: background 0.2s, color 0.2s;
    font-weight: 500;
  }
  .auth-tab:first-child {
    border-right: 1.5px solid var(--sand);
  }
  .auth-tab.active {
    background: var(--ink);
    color: var(--cream);
  }
  .auth-tab:not(.active):hover {
    background: var(--tan);
    color: var(--ink);
  }

  /* fields */
  .auth-field {
    margin-bottom: 1.25rem;
  }
  .auth-label {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    display: block;
    margin-bottom: 0.5rem;
  }
  .auth-input-wrap {
    position: relative;
  }
  .auth-input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--sand);
    pointer-events: none;
    display: flex;
    align-items: center;
  }
  .auth-input {
    width: 100%;
    font-family: var(--ff-body);
    font-size: 0.9rem;
    color: var(--ink);
    background: var(--tan);
    border: 1.5px solid var(--sand);
    padding: 11px 14px 11px 38px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    box-sizing: border-box;
    -webkit-appearance: none;
    border-radius: 0;
  }
  .auth-input::placeholder { color: var(--sand); }
  .auth-input:focus {
    border-color: var(--ink);
    background: var(--cream);
  }
  .auth-input.has-toggle { padding-right: 42px; }
  .auth-toggle-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sand);
    padding: 0;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }
  .auth-toggle-btn:hover { color: var(--muted); }

  /* submit */
  .auth-submit {
    width: 100%;
    font-family: var(--ff-mono);
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: var(--rust);
    color: #fff;
    border: 2px solid var(--rust);
    padding: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 500;
    margin-top: 1.75rem;
    transition: background 0.2s, border-color 0.2s, transform 0.15s;
  }
  .auth-submit:hover:not(:disabled) {
    background: var(--bark);
    border-color: var(--bark);
    transform: translateY(-1px);
  }
  .auth-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* bottom note */
  .auth-legal {
    font-size: 0.75rem;
    color: var(--sand);
    text-align: center;
    margin-top: 1.75rem;
    line-height: 1.6;
  }
  .auth-legal a {
    color: var(--muted);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .auth-legal a:hover { color: var(--ink); }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; }
`;

const leftFeatures = [
  'Track and split expenses fairly',
  'Manage chore rotations with streaks',
  'Plan meals and cooking schedules',
  'Keep inventory of shared items',
];

export default function Auth() {
  useFonts();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab as 'signin' | 'signup');

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInLoading(true);
    try {
      await signIn(signInEmail, signInPassword);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpLoading(true);
    try {
      await signUp(signUpEmail, signUpPassword, signUpName);
      toast.success('Account created! Please sign in.');
      setActiveTab('signin');
      setSignInEmail(signUpEmail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setSignUpLoading(false);
    }
  };

  const isSignIn = activeTab === 'signin';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="auth-root">

        {/* ── LEFT PANEL ── */}
        <div className="auth-left">
          <div className="auth-left-bg-letter" aria-hidden>H</div>

          <div className="auth-left-top">
            <Link to="/">
              <div className="auth-logo">
                <div className="auth-logo-mark"><Home size={16} color="#fff" /></div>
                <span className="auth-logo-text">HomeSync</span>
              </div>
            </Link>
          </div>

          <div className="auth-left-mid">
            <div className="auth-left-kicker">Built for shared living</div>
            <h2 className="auth-left-headline">
              Your home,<br /><em>in sync.</em>
            </h2>
            <p className="auth-left-desc">
              One place for expenses, chores, meals, and everything your household needs to run smoothly.
            </p>

            <ul className="auth-features-list">
              {leftFeatures.map((f, i) => (
                <motion.li
                  key={f}
                  className="auth-feature-item"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.09, duration: 0.5 }}
                >
                  <span className="auth-feature-num">0{i + 1}</span>
                  <span className="auth-feature-text">{f}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="auth-left-bottom">
            <p className="auth-left-footnote">Made with care · Free to use</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right">
          <motion.div
            className="auth-form-wrap"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Back */}
            <button className="auth-back" onClick={() => navigate('/')}>
              <ArrowLeft size={12} />
              Back to home
            </button>

            {/* Mobile logo */}
            <div className="auth-mobile-logo">
              <div className="auth-logo-mark" style={{ background: 'var(--rust)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-3deg)', flexShrink: 0 }}>
                <Home size={16} color="#fff" />
              </div>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 500 }}>HomeSync</span>
            </div>

            {/* Heading — animates on tab switch */}
            <motion.div
              className="auth-form-heading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="auth-form-kicker">
                {isSignIn ? 'Welcome back' : 'Get started'}
              </div>
              <h1 className="auth-form-title">
                {isSignIn ? 'Sign in to your\nhousehold' : 'Create your\naccount'}
              </h1>
              <p className="auth-form-subtitle">
                {isSignIn
                  ? 'Enter your credentials to continue.'
                  : 'It only takes a moment to get started.'}
              </p>
            </motion.div>

            {/* Tab switcher */}
            <div className="auth-tabs">
              <button
                className={`auth-tab${activeTab === 'signin' ? ' active' : ''}`}
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
              <button
                className={`auth-tab${activeTab === 'signup' ? ' active' : ''}`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>

            {/* ── SIGN IN FORM ── */}
            {isSignIn && (
              <motion.form
                key="signin"
                onSubmit={handleSignIn}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="auth-field">
                  <label className="auth-label" htmlFor="si-email">Email address</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Mail size={14} /></span>
                    <input
                      id="si-email"
                      className="auth-input"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={e => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="si-password">Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Lock size={14} /></span>
                    <input
                      id="si-password"
                      className="auth-input has-toggle"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={e => setSignInPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-toggle-btn"
                      onClick={() => setShowPassword(p => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button className="auth-submit" type="submit" disabled={signInLoading}>
                  {signInLoading
                    ? <><Loader2 size={14} className="spin" /> Signing in...</>
                    : 'Sign In →'
                  }
                </button>
              </motion.form>
            )}

            {/* ── SIGN UP FORM ── */}
            {!isSignIn && (
              <motion.form
                key="signup"
                onSubmit={handleSignUp}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="auth-field">
                  <label className="auth-label" htmlFor="su-name">Full name</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><User size={14} /></span>
                    <input
                      id="su-name"
                      className="auth-input"
                      type="text"
                      placeholder="John Doe"
                      value={signUpName}
                      onChange={e => setSignUpName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="su-email">Email address</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Mail size={14} /></span>
                    <input
                      id="su-email"
                      className="auth-input"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={e => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="su-password">Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Lock size={14} /></span>
                    <input
                      id="su-password"
                      className="auth-input has-toggle"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password (min. 6 chars)"
                      value={signUpPassword}
                      onChange={e => setSignUpPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="auth-toggle-btn"
                      onClick={() => setShowPassword(p => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button className="auth-submit" type="submit" disabled={signUpLoading}>
                  {signUpLoading
                    ? <><Loader2 size={14} className="spin" /> Creating account...</>
                    : 'Create Account →'
                  }
                </button>
              </motion.form>
            )}

          </motion.div>
        </div>

      </div>
    </>
  );
}