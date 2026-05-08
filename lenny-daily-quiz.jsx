import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Check, X, Clock, Users, Sparkles, Coffee, ArrowRight, Share2, Calendar, Headphones, Play, BookOpen, ExternalLink, Bookmark, TrendingUp, ChevronRight, Quote } from 'lucide-react';

export default function LennyDailyQuiz() {
  const [screen, setScreen] = useState('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [leaderboardScope, setLeaderboardScope] = useState('global');

  const today = {
    date: 'Thursday, May 7',
    theme: 'Pricing that actually scales',
    episode: {
      title: 'Monetization, pricing, and packaging',
      guest: 'Madhavan Ramanujam',
      guestRole: 'Author of Monetizing Innovation, Partner at Simon-Kucher',
      number: 'Episode 142',
      duration: '1:24:18',
    },
    pullQuote: 'If you don\'t have the willingness-to-pay conversation in the first 90 days of building, you\'re building blind.',
    questions: [
      {
        timestamp: '12:40',
        section: 'The four monetization mistakes',
        q: 'You\'re a PM at a 60-person SaaS preparing your next quarter\'s roadmap. Five features compete for slots — each backed by interview research showing customers say they want them. Per Madhavan\'s view on feature shock, before scoping any of them tomorrow morning, you should —',
        options: [
          'Build the smallest two as fast experiments and measure usage.',
          'Ask ten of those same customers what they\'d pay for each feature.',
          'Run a competitive teardown of how rivals price similar features.',
          'Trust the interviews — qualitative signal is enough at this stage.',
        ],
        correct: 1,
        explainer: 'Feature shock isn\'t about building bad features — it\'s about building features no one will pay for. The WTP conversation, not the interest conversation, is the gate.',
        takeaway: 'This week: pick the top item on next quarter\'s roadmap and ask 10 prospective buyers what they\'d pay for it before scoping a single line of code.',
      },
      {
        timestamp: '24:15',
        section: 'Willingness to pay, early',
        q: 'You\'re four months into building a B2B AI product. You have an MVP in early access and 12 design partners giving feedback. Your team wants to wait until product-market fit before talking pricing. Per Madhavan, tomorrow morning you should —',
        options: [
          'Wait — until you have PMF, you\'re guessing about value.',
          'Start the willingness-to-pay conversation now, alongside your design-partner work.',
          'Pick a number based on what competitors charge, and adjust later.',
          'Charge nothing until 100 paying customers — gather usage data first.',
        ],
        correct: 1,
        explainer: 'WTP belongs in the first 90 days — alongside problem validation, not after PMF. Asking "would you pay?" early reframes everything you build.',
        takeaway: 'This week: if your product hasn\'t had a WTP conversation in its first 90 days, schedule one with three design partners before Friday.',
      },
      {
        timestamp: '38:50',
        section: 'Leader, filler, killer',
        q: 'You\'re packaging your product into three tiers and you\'ve inventoried 24 features. Per Madhavan\'s leader-filler-killer framework, the first sort to make tomorrow morning is —',
        options: [
          'Group by build cost — cheapest features in basic, expensive in enterprise.',
          'Group by usage frequency — most-used in basic, niche in premium.',
          'Label each feature leader, filler, or killer — then pack each tier around the leaders.',
          'Group by competitor parity — match your tiers to your closest competitor.',
        ],
        correct: 2,
        explainer: 'Killers are table-stakes — their absence kills deals; their presence doesn\'t drive purchase. Leaders drive purchase. Most teams over-invest in killers and under-invest in leaders.',
        takeaway: 'This week: take your current pricing tiers and label every feature leader / filler / killer. Most teams find they over-invest in killers and under-invest in leaders.',
      },
      {
        timestamp: '52:20',
        section: 'Bundling and tiering',
        q: 'You\'re auditing your company\'s pricing tiers. Tier 1 has 8 features, Tier 2 has 14, Tier 3 has 22 — neatly stacking. Marketing is happy; sales hits quota. Per Madhavan\'s framing, the missing step in this design is —',
        options: [
          'There\'s no annual prepay discount option.',
          'The middle tier is priced too close to the top tier.',
          'The tiers map to feature counts, not customer segments — "who buys this tier?" isn\'t answered.',
          'There aren\'t enough tiers — most B2B benefits from 4–5 tiers.',
        ],
        correct: 2,
        explainer: 'Tiers should map to who the customer is, not what features exist. The right question is "who buys this tier?" Feature-based tiering produces incoherent packaging.',
        takeaway: 'This week: name each of your tiers after the customer who buys it (solo founder / growing team / enterprise). If you can\'t, your tiers are mis-designed.',
      },
      {
        timestamp: '1:08:30',
        section: 'Raising prices without losing customers',
        q: 'You need to raise prices 15% on existing customers. Your CFO wants it done this quarter. Tomorrow morning, the move with the lowest churn risk is —',
        options: [
          'Give 90+ days advance notice and grandfather your most loyal customers.',
          'Ship a meaningful product improvement the same week as the increase.',
          'Offer an annual prepay discount as the alternative — let customers self-select.',
          'Quietly migrate new customers to the new price; leave existing customers alone.',
        ],
        correct: 1,
        explainer: 'Price increases stick when paired with new value. Customers don\'t resent paying more for more — they resent paying more for the same.',
        takeaway: 'This week: if you\'re planning a price rise, line up one shippable product improvement to release the same week customers see the new price.',
      },
    ],
  };

  const globalLeaderboard = [
    { rank: 1, name: 'Shreya P.', role: 'Sr. PM, Stripe', score: 5, time: '1:42', streak: 89, avatar: '#CC5500' },
    { rank: 2, name: 'Marcus T.', role: 'Group PM, Notion', score: 5, time: '2:08', streak: 62, avatar: '#8B4513' },
    { rank: 3, name: 'Aiko N.', role: 'Staff PM, Figma', score: 5, time: '2:31', streak: 71, avatar: '#A0522D' },
    { rank: 4, name: 'Diego M.', role: 'PM, Mercado Libre', score: 5, time: '2:44', streak: 54, avatar: '#5C4634' },
    { rank: 5, name: 'Jamal W.', role: 'PM, Linear', score: 4, time: '1:55', streak: 38, avatar: '#D2691E' },
    { rank: 6, name: 'Priya S.', role: 'Sr. PM, Airbnb', score: 4, time: '2:12', streak: 44, avatar: '#8B7355' },
    { rank: 7, name: 'Tomás V.', role: 'PM Lead, Rappi', score: 4, time: '2:38', streak: 31, avatar: '#A0522D' },
    { rank: 8, name: 'Hannah L.', role: 'Director, Webflow', score: 4, time: '3:01', streak: 29, avatar: '#5C4634' },
    { rank: 9, name: 'Wei C.', role: 'PM, Shopify', score: 3, time: '2:18', streak: 22, avatar: '#D2691E' },
    { rank: 10, name: 'Rohan K.', role: 'Sr. PM, Atlassian', score: 3, time: '2:45', streak: 41, avatar: '#8B4513' },
  ];

  const allTimeLeaderboard = [
    { rank: 1, name: 'Shreya P.', role: 'Sr. PM, Stripe', score: 542, time: '—', streak: 89, avatar: '#CC5500' },
    { rank: 2, name: 'Aiko N.', role: 'Staff PM, Figma', score: 489, time: '—', streak: 71, avatar: '#A0522D' },
    { rank: 3, name: 'Marcus T.', role: 'Group PM, Notion', score: 456, time: '—', streak: 62, avatar: '#8B4513' },
    { rank: 4, name: 'Diego M.', role: 'PM, Mercado Libre', score: 398, time: '—', streak: 54, avatar: '#5C4634' },
    { rank: 5, name: 'Priya S.', role: 'Sr. PM, Airbnb', score: 367, time: '—', streak: 44, avatar: '#8B7355' },
  ];

  const activeBoard = leaderboardScope === 'allTime' ? allTimeLeaderboard : globalLeaderboard;

  const score = answers.filter(a => a.correct).length;
  const finalTime = elapsed;
  const yourRank = score === 5 && finalTime < 130 ? 4 : score === 5 ? 6 : score === 4 ? 12 : score === 3 ? 47 : 89;
  const hasPlayed = answers.length === today.questions.length;

  useEffect(() => {
    if (screen === 'quiz' && startTime) {
      const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
      return () => clearInterval(interval);
    }
  }, [screen, startTime]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const startQuiz = () => {
    setScreen('quiz');
    setStartTime(Date.now());
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setRevealed(false);
  };

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === today.questions[currentQ].correct;
    setAnswers([...answers, { questionIdx: currentQ, selected: idx, correct }]);
  };

  const next = () => {
    if (currentQ < today.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setScreen('results');
    }
  };

  return (
    <div style={{ fontFamily: '"Fraunces", Georgia, serif', backgroundColor: '#FBF7F0', minHeight: '100vh', color: '#2A1810' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,400..900;9..144,1,400..900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .sans { font-family: 'DM Sans', system-ui, sans-serif; }
        .serif { font-family: 'Fraunces', Georgia, serif; }
        @keyframes flame { 0%, 100% { transform: rotate(-3deg) scale(1); } 50% { transform: rotate(3deg) scale(1.08); } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        @keyframes correctPulse { 0% { box-shadow: 4px 4px 0 #2A1810; } 50% { box-shadow: 4px 4px 0 #2A1810, 0 0 0 8px rgba(90,138,58,0.25); } 100% { box-shadow: 4px 4px 0 #2A1810; } }
        .flame-icon { animation: flame 1.6s ease-in-out infinite; }
        .slide-in { animation: slideUp 0.4s ease-out; }
        .shake { animation: shake 0.4s ease; }
        .correct-pulse { animation: correctPulse 0.6s ease; }
        .grain { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E"); }
        .btn-press:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 0 0 #2A1810 !important; }
      `}</style>

      <header style={{ backgroundColor: '#FBF7F0', borderBottom: '2px solid #2A1810', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#D2691E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #2A1810', boxShadow: '3px 3px 0 #2A1810', transform: 'rotate(-3deg)'
            }}>
              <Coffee size={20} color="#FBF7F0" strokeWidth={2.5} />
            </div>
            <div>
              <div className="serif" style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
                The Daily PM
              </div>
              <div className="sans" style={{ fontSize: '10px', color: '#8B7355', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
                Sourced from Lenny's Podcast
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFE8C2', padding: '6px 12px', borderRadius: '999px', border: '2px solid #2A1810' }}>
            <span className="flame-icon" style={{ fontSize: '14px' }}>🔥</span>
            <span className="sans" style={{ fontWeight: 700, fontSize: '14px' }}>47</span>
          </div>
        </div>
      </header>

      {screen !== 'quiz' && (
        <nav style={{ borderBottom: '1px solid #E5D9C4', backgroundColor: '#FBF7F0', position: 'sticky', top: '69px', zIndex: 40 }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', gap: '4px', padding: '0 24px' }}>
            {[
              { id: 'intro', label: hasPlayed ? 'Today' : 'Today\'s set', icon: Calendar },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            ].map(tab => {
              const Icon = tab.icon;
              const active = screen === tab.id || (tab.id === 'intro' && screen === 'results');
              return (
                <button key={tab.id} onClick={() => setScreen(tab.id)} className="sans"
                  style={{
                    padding: '14px 20px', background: 'none', border: 'none',
                    borderBottom: active ? '3px solid #D2691E' : '3px solid transparent',
                    color: active ? '#2A1810' : '#8B7355',
                    fontWeight: active ? 700 : 500, fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                  }}>
                  <Icon size={15} /> {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {screen === 'intro' && !hasPlayed && (
          <div className="slide-in">
            <div style={{ marginBottom: '24px' }}>
              <div className="sans" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#D2691E', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px', backgroundColor: '#FFE8C2', padding: '6px 14px', borderRadius: '999px', border: '2px solid #D2691E' }}>
                <Calendar size={12} /> {today.date} · Today's set
              </div>
              <h1 className="serif" style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 12px 0' }}>
                {today.theme}.
              </h1>
              <p className="serif" style={{ fontSize: '19px', fontStyle: 'italic', color: '#5C4634', margin: 0, lineHeight: 1.4, fontWeight: 400 }}>
                Five questions drawn straight from this week's deep-dive episode.
              </p>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '20px',
              border: '2px solid #2A1810', boxShadow: '6px 6px 0 #D2691E',
              overflow: 'hidden', marginBottom: '20px',
            }}>
              <div style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '110px', height: '110px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
                  border: '2px solid #2A1810', flexShrink: 0,
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div className="grain" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}></div>
                  <Headphones size={36} color="#FBF7F0" strokeWidth={2} style={{ position: 'relative' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sans" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D2691E', marginBottom: '6px' }}>
                    {today.episode.number} · {today.episode.duration}
                  </div>
                  <h3 className="serif" style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                    {today.episode.title}
                  </h3>
                  <div className="sans" style={{ fontSize: '14px', fontWeight: 600, color: '#2A1810', marginBottom: '2px' }}>
                    with {today.episode.guest}
                  </div>
                  <div className="sans" style={{ fontSize: '12px', color: '#8B7355' }}>
                    {today.episode.guestRole}
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px 24px', backgroundColor: '#FBF1DC', borderTop: '2px solid #2A1810', position: 'relative' }}>
                <Quote size={20} color="#D2691E" style={{ position: 'absolute', top: '14px', left: '20px' }} />
                <p className="serif" style={{ fontSize: '16px', fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 0 32px', fontWeight: 500, color: '#2A1810' }}>
                  {today.pullQuote}
                </p>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '2px solid #2A1810', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="sans" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: '#2A1810', color: '#FBF7F0',
                  border: 'none', borderRadius: '999px', padding: '8px 16px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}>
                  <Play size={14} fill="#FBF7F0" /> Listen on Spotify
                </button>
                <button className="sans" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'transparent', color: '#2A1810',
                  border: '1.5px solid #2A1810', borderRadius: '999px', padding: '8px 16px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}>
                  <BookOpen size={14} /> Read transcript
                </button>
                <button className="sans" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'transparent', color: '#8B7355',
                  border: 'none', padding: '8px 8px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}>
                  <Bookmark size={14} /> Save
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: '#2A1810', color: '#FBF7F0', borderRadius: '20px',
              padding: '24px', marginBottom: '20px',
              border: '2px solid #2A1810', boxShadow: '5px 5px 0 #8B4513',
              position: 'relative', overflow: 'hidden',
            }}>
              <div className="grain" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}></div>
              <div style={{ position: 'relative' }}>
                <div className="sans" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E8B04B', marginBottom: '14px' }}>
                  How it works
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    'Five questions, drawn from this episode. One attempt.',
                    'Same set for every PM, everywhere, today only.',
                    'Each wrong answer links you to the exact moment in the episode.',
                    'New episode, new set, every weekday at midnight your time.',
                  ].map((rule, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div className="serif" style={{ fontSize: '15px', fontWeight: 700, color: '#D2691E', minWidth: '20px' }}>
                        0{i + 1}
                      </div>
                      <div className="serif" style={{ fontSize: '15px', lineHeight: 1.4, fontWeight: 500 }}>{rule}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '2px solid #2A1810' }}>
                <Users size={15} color="#D2691E" />
                <span className="sans" style={{ fontSize: '13px', fontWeight: 600 }}>4,247 played today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '2px solid #2A1810' }}>
                <Clock size={15} color="#D2691E" />
                <span className="sans" style={{ fontSize: '13px', fontWeight: 600 }}>~3 minutes</span>
              </div>
            </div>

            <button onClick={startQuiz} className="sans btn-press" style={{
              width: '100%', backgroundColor: '#D2691E', color: '#FBF7F0',
              border: '2px solid #2A1810', borderRadius: '16px', padding: '20px',
              fontSize: '17px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '5px 5px 0 #2A1810',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.15s'
            }}>
              Start today's set <ArrowRight size={20} />
            </button>
          </div>
        )}

        {screen === 'quiz' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="sans" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B7355' }}>
                  Question {currentQ + 1} of {today.questions.length}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5C4634' }}>
                  <Clock size={14} />
                  <span className="sans" style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(elapsed)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {today.questions.map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: '8px', borderRadius: '999px', border: '2px solid #2A1810',
                    backgroundColor: i < currentQ ? (answers[i]?.correct ? '#5A8A3A' : '#B84A2A') : i === currentQ ? '#D2691E' : '#F0E8D4',
                    transition: 'all 0.3s'
                  }} />
                ))}
              </div>
            </div>

            <div className="slide-in" key={currentQ}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#FBF1DC', border: '1.5px solid #8B7355', padding: '5px 12px', borderRadius: '999px', marginBottom: '14px' }}>
                <Headphones size={12} color="#8B7355" />
                <span className="sans" style={{ fontSize: '11px', fontWeight: 600, color: '#5C4634' }}>
                  {today.episode.guest} · <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{today.questions[currentQ].timestamp}</span> · {today.questions[currentQ].section}
                </span>
              </div>

              <h2 className="serif" style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em', margin: '0 0 24px 0' }}>
                {today.questions[currentQ].q}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {today.questions[currentQ].options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrect = idx === today.questions[currentQ].correct;
                  let bg = '#FFFFFF', border = '#2A1810', textColor = '#2A1810', extraClass = '';
                  if (revealed) {
                    if (isCorrect) { bg = '#E8F0DC'; border = '#5A8A3A'; extraClass = isSelected ? 'correct-pulse' : ''; }
                    else if (isSelected) { bg = '#F8DDD3'; border = '#B84A2A'; extraClass = 'shake'; }
                    else { textColor = '#A89580'; }
                  } else if (isSelected) { bg = '#FFE8C2'; border = '#D2691E'; }

                  return (
                    <button key={idx} onClick={() => handleSelect(idx)} disabled={revealed}
                      className={`sans btn-press ${extraClass}`}
                      style={{
                        backgroundColor: bg, color: textColor,
                        border: `2px solid ${border}`, borderRadius: '14px', padding: '16px 18px',
                        fontSize: '15px', fontWeight: 500, textAlign: 'left',
                        cursor: revealed ? 'default' : 'pointer',
                        boxShadow: revealed ? 'none' : '4px 4px 0 #2A1810',
                        display: 'flex', alignItems: 'center', gap: '14px',
                        transition: 'all 0.15s', lineHeight: 1.4,
                      }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: `2px solid ${revealed && isCorrect ? '#5A8A3A' : revealed && isSelected ? '#B84A2A' : '#2A1810'}`,
                        backgroundColor: revealed && isCorrect ? '#5A8A3A' : revealed && isSelected ? '#B84A2A' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontFamily: 'Fraunces', fontSize: '13px', fontWeight: 700,
                        color: revealed && (isCorrect || isSelected) ? '#FBF7F0' : '#2A1810'
                      }}>
                        {revealed && isCorrect ? <Check size={16} strokeWidth={3} /> :
                         revealed && isSelected ? <X size={16} strokeWidth={3} /> :
                         String.fromCharCode(65 + idx)}
                      </div>
                      <span style={{ flex: 1 }}>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {revealed && (
                <>
                  {/* TAKEAWAY HERO — the most important block on this screen */}
                  <div className="slide-in" style={{
                    backgroundColor: '#FFE8C2', color: '#2A1810',
                    borderRadius: '16px', padding: '20px 22px', marginBottom: '14px',
                    border: '2px solid #2A1810', boxShadow: '5px 5px 0 #D2691E',
                    position: 'relative',
                  }}>
                    <div className="sans" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D2691E', marginBottom: '10px' }}>
                      This week —
                    </div>
                    <p className="serif" style={{ fontSize: '22px', fontStyle: 'italic', lineHeight: 1.25, margin: 0, fontWeight: 600, letterSpacing: '-0.01em' }}>
                      {today.questions[currentQ].takeaway}
                    </p>
                  </div>

                  <div className="slide-in" style={{
                    backgroundColor: '#2A1810', color: '#FBF7F0',
                    borderRadius: '14px', padding: '18px', marginBottom: '14px',
                    border: '2px solid #2A1810',
                  }}>
                    <div className="sans" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E8B04B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={12} /> Why
                    </div>
                    <p className="serif" style={{ fontSize: '15px', lineHeight: 1.5, margin: 0, fontWeight: 400 }}>
                      {today.questions[currentQ].explainer}
                    </p>
                  </div>

                  <button className="sans slide-in" style={{
                    width: '100%', backgroundColor: '#FBF1DC', border: '2px dashed #8B7355',
                    borderRadius: '12px', padding: '12px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '14px', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#D2691E',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Play size={14} color="#FBF7F0" fill="#FBF7F0" />
                      </div>
                      <div>
                        <div className="sans" style={{ fontSize: '13px', fontWeight: 700, color: '#2A1810' }}>
                          Listen at {today.questions[currentQ].timestamp}
                        </div>
                        <div className="sans" style={{ fontSize: '11px', color: '#8B7355' }}>
                          Hear Madhavan explain it himself
                        </div>
                      </div>
                    </div>
                    <ExternalLink size={14} color="#8B7355" />
                  </button>

                  <button onClick={next} className="sans btn-press slide-in" style={{
                    width: '100%', backgroundColor: '#D2691E', color: '#FBF7F0',
                    border: '2px solid #2A1810', borderRadius: '14px', padding: '18px',
                    fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '4px 4px 0 #2A1810',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.15s'
                  }}>
                    {currentQ < today.questions.length - 1 ? 'Next question' : 'See your result'} <ArrowRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {screen === 'results' && (
          <div className="slide-in">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="sans" style={{ color: '#D2691E', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {today.date} · Done
              </div>
              <h1 className="serif" style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>
                {score === 5 ? 'Clean sheet.' : score === 4 ? 'Solid run.' : score === 3 ? 'Decent.' : score >= 1 ? 'Tomorrow\'s another set.' : 'Rough one.'}
              </h1>
              <p className="serif" style={{ fontSize: '18px', fontStyle: 'italic', color: '#5C4634', margin: 0, fontWeight: 400 }}>
                {score === 5 ? 'You absorbed Madhavan\'s playbook.' : 'Every miss is a thing you now know.'}
              </p>
            </div>

            <div style={{
              backgroundColor: '#2A1810', color: '#FBF7F0', borderRadius: '20px',
              padding: '24px', marginBottom: '16px',
              border: '2px solid #2A1810', boxShadow: '6px 6px 0 #D2691E',
              position: 'relative', overflow: 'hidden',
            }}>
              <div className="grain" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}></div>
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <div className="sans" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E8B04B', marginBottom: '6px' }}>Score</div>
                  <div className="serif" style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                    {score}<span style={{ color: '#8B7355' }}>/5</span>
                  </div>
                </div>
                <div>
                  <div className="sans" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E8B04B', marginBottom: '6px' }}>Time</div>
                  <div className="serif" style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(finalTime)}
                  </div>
                </div>
                <div>
                  <div className="sans" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E8B04B', marginBottom: '6px' }}>Rank</div>
                  <div className="serif" style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                    #{yourRank}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#D2691E', color: '#FBF7F0', borderRadius: '14px',
              padding: '18px', marginBottom: '16px',
              border: '2px solid #2A1810', boxShadow: '4px 4px 0 #2A1810',
              display: 'flex', alignItems: 'center', gap: '14px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div className="grain" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}></div>
              <div style={{ fontSize: '36px', position: 'relative' }} className="flame-icon">🔥</div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div className="serif" style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.1 }}>48 days</div>
                <div className="sans" style={{ fontSize: '12px', color: '#FFE8C2', marginTop: '2px' }}>
                  Best streak so far. Tomorrow's session at 8am your local time.
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '16px',
              border: '2px solid #2A1810', boxShadow: '4px 4px 0 #8B4513',
              overflow: 'hidden', marginBottom: '16px',
            }}>
              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '54px', height: '54px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
                  border: '2px solid #2A1810', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div className="grain" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}></div>
                  <Headphones size={22} color="#FBF7F0" style={{ position: 'relative' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sans" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D2691E', marginBottom: '2px' }}>
                    Now go deeper
                  </div>
                  <div className="serif" style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.2 }}>
                    {today.episode.title}
                  </div>
                  <div className="sans" style={{ fontSize: '12px', color: '#8B7355', marginTop: '2px' }}>
                    {today.episode.duration} · {today.episode.guest}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1.5px solid #E5D9C4', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="sans" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: '#2A1810', color: '#FBF7F0',
                  border: 'none', borderRadius: '999px', padding: '7px 14px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                }}>
                  <Play size={12} fill="#FBF7F0" /> Listen
                </button>
                <button className="sans" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: 'transparent', color: '#2A1810',
                  border: '1.5px solid #2A1810', borderRadius: '999px', padding: '7px 14px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                }}>
                  <BookOpen size={12} /> Transcript
                </button>
                <button className="sans" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: 'transparent', color: '#8B7355',
                  border: '1.5px solid #E5D9C4', borderRadius: '999px', padding: '7px 14px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                }}>
                  <Bookmark size={12} /> Save
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '18px',
              marginBottom: '16px', border: '2px solid #2A1810',
            }}>
              <div className="sans" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8B7355', marginBottom: '12px' }}>
                Question recap · tap to revisit
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {answers.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
                    backgroundColor: a.correct ? '#F4EFD8' : '#F8E8E0', borderRadius: '10px', cursor: 'pointer'
                  }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: a.correct ? '#5A8A3A' : '#B84A2A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {a.correct ? <Check size={13} color="#FBF7F0" strokeWidth={3} /> : <X size={13} color="#FBF7F0" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sans" style={{ fontSize: '12px', fontWeight: 600, color: '#5C4634', lineHeight: 1.3 }}>
                        Q{i + 1}: {today.questions[i].section}
                      </div>
                      <div className="sans" style={{ fontSize: '11px', color: '#8B7355', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                        {today.questions[i].timestamp}
                      </div>
                    </div>
                    <ChevronRight size={14} color="#8B7355" />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setScreen('leaderboard')} className="sans btn-press" style={{
                flex: 1, backgroundColor: '#D2691E', color: '#FBF7F0',
                border: '2px solid #2A1810', borderRadius: '14px',
                padding: '15px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', boxShadow: '4px 4px 0 #2A1810',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <Trophy size={15} /> See leaderboard
              </button>
              <button className="sans btn-press" style={{
                backgroundColor: '#FFFFFF', color: '#2A1810',
                border: '2px solid #2A1810', borderRadius: '14px',
                padding: '15px 18px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', boxShadow: '4px 4px 0 #2A1810',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <Share2 size={15} /> Share
              </button>
            </div>
          </div>
        )}

        {screen === 'leaderboard' && (
          <div className="slide-in">
            <div style={{ marginBottom: '20px' }}>
              <div className="sans" style={{ color: '#D2691E', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {leaderboardScope === 'allTime' ? 'All-time leaders' : `${today.date} · Leaderboard`}
              </div>
              <h1 className="serif" style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>
                {leaderboardScope === 'allTime'
                  ? <>The compounders.</>
                  : <>Same five questions. <em style={{ color: '#D2691E', fontStyle: 'italic', fontWeight: 600 }}>Different times.</em></>}
              </h1>
              <p className="sans" style={{ fontSize: '13px', color: '#5C4634', margin: 0 }}>
                {leaderboardScope === 'allTime'
                  ? 'Ranked by total points. Streak shown as tie-break — consistency beats intensity.'
                  : 'Ranked by score, then time. 4,247 PMs played today\'s set.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', backgroundColor: '#F0E8D4', padding: '4px', borderRadius: '12px', border: '2px solid #2A1810' }}>
              {[
                { id: 'global', label: 'This week', icon: Users },
                { id: 'allTime', label: 'All-time', icon: TrendingUp },
              ].map(scope => {
                const Icon = scope.icon;
                const active = leaderboardScope === scope.id;
                return (
                  <button key={scope.id} onClick={() => setLeaderboardScope(scope.id)} className="sans"
                    style={{
                      flex: 1, padding: '10px',
                      backgroundColor: active ? '#2A1810' : 'transparent',
                      color: active ? '#FBF7F0' : '#5C4634',
                      border: 'none', borderRadius: '8px',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s'
                    }}>
                    <Icon size={14} /> {scope.label}
                  </button>
                );
              })}
            </div>

            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '20px',
              border: '2px solid #2A1810', boxShadow: '5px 5px 0 #D2691E',
              overflow: 'hidden',
            }}>
              {leaderboardScope !== 'allTime' && activeBoard.length >= 3 && (
                <div style={{ padding: '24px', backgroundColor: '#FBF1DC', borderBottom: '2px solid #2A1810' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', maxWidth: '420px', margin: '0 auto' }}>
                    {[activeBoard[1], activeBoard[0], activeBoard[2]].map((p, i) => {
                      const heights = ['72px', '100px', '60px'];
                      const colors = ['#8B7355', '#CC5500', '#A0522D'];
                      return (
                        <div key={p.rank} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{
                            width: '46px', height: '46px', margin: '0 auto 6px',
                            borderRadius: '50%', backgroundColor: p.avatar,
                            color: '#FBF7F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'DM Sans', fontWeight: 700, fontSize: '16px',
                            border: `3px solid ${colors[i]}`, position: 'relative'
                          }}>
                            {p.name[0]}
                            <div style={{
                              position: 'absolute', top: '-10px', right: '-6px',
                              backgroundColor: colors[i], borderRadius: '50%',
                              width: '22px', height: '22px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '2px solid #2A1810',
                              fontFamily: 'Fraunces', fontSize: '11px', fontWeight: 800, color: '#FBF7F0'
                            }}>
                              {p.rank}
                            </div>
                          </div>
                          <div className="serif" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div className="sans" style={{ fontSize: '10px', color: '#8B7355', marginBottom: '6px', fontVariantNumeric: 'tabular-nums' }}>
                            {p.score}/5 · {p.time}
                          </div>
                          <div style={{
                            height: heights[i], backgroundColor: colors[i],
                            borderRadius: '8px 8px 0 0', border: '2px solid #2A1810', borderBottom: 'none',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10px'
                          }}>
                            {i === 1 && <Crown size={20} color="#FBF7F0" fill="#FBF7F0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasPlayed && leaderboardScope !== 'allTime' && (
                <div style={{
                  padding: '14px 20px', backgroundColor: '#FFE8C2',
                  borderBottom: '2px solid #2A1810',
                  display: 'flex', alignItems: 'center', gap: '12px', position: 'relative',
                }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#D2691E' }} />
                  <div className="serif" style={{ width: '32px', textAlign: 'center', fontSize: '17px', fontWeight: 800, color: '#D2691E' }}>
                    #{yourRank}
                  </div>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: '#8B4513', color: '#FBF7F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'DM Sans', fontWeight: 700, fontSize: '14px',
                    border: '2px solid #2A1810', flexShrink: 0
                  }}>D</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="serif" style={{ fontSize: '15px', fontWeight: 700 }}>
                      You <span className="sans" style={{ fontSize: '9px', backgroundColor: '#D2691E', color: '#FBF7F0', padding: '2px 7px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>You</span>
                    </div>
                    <div className="sans" style={{ fontSize: '11px', color: '#8B7355' }}>Head of Product</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '50px' }}>
                    <span style={{ fontSize: '13px' }}>🔥</span>
                    <span className="sans" style={{ fontSize: '12px', fontWeight: 600, color: '#5C4634' }}>48</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="serif" style={{ fontSize: '15px', fontWeight: 700 }}>{score}/5</div>
                    <div className="sans" style={{ fontSize: '10px', color: '#8B7355', fontVariantNumeric: 'tabular-nums' }}>{formatTime(finalTime)}</div>
                  </div>
                </div>
              )}

              {activeBoard.map((p, i) => (
                <div key={p.rank} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 20px',
                  borderBottom: i < activeBoard.length - 1 ? '1px solid #E5D9C4' : 'none',
                }}>
                  <div className="serif" style={{
                    width: '32px', textAlign: 'center', fontSize: '17px', fontWeight: 800,
                    color: p.rank <= 3 ? '#CC5500' : '#8B7355'
                  }}>
                    {p.rank}
                  </div>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: p.avatar, color: '#FBF7F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'DM Sans', fontWeight: 700, fontSize: '14px',
                    border: '2px solid #2A1810', flexShrink: 0
                  }}>
                    {p.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="serif" style={{ fontSize: '15px', fontWeight: 700 }}>{p.name}</div>
                    <div className="sans" style={{ fontSize: '11px', color: '#8B7355' }}>{p.role}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '50px' }}>
                    <span style={{ fontSize: '13px' }}>🔥</span>
                    <span className="sans" style={{ fontSize: '12px', fontWeight: 600, color: '#5C4634' }}>{p.streak}</span>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '64px' }}>
                    <div className="serif" style={{ fontSize: '15px', fontWeight: 700 }}>
                      {leaderboardScope === 'allTime' ? p.score : `${p.score}/5`}
                    </div>
                    <div className="sans" style={{ fontSize: '10px', color: '#8B7355', fontVariantNumeric: 'tabular-nums' }}>
                      {leaderboardScope === 'allTime' ? 'total' : p.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '16px', padding: '14px 18px',
              backgroundColor: '#2A1810', color: '#FBF7F0',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px'
            }}>
              <Users size={18} color="#E8B04B" />
              <span className="sans">
                {leaderboardScope === 'allTime'
                  ? <><strong>Top 5 PMs</strong> by total points. Longest active streak: <strong>89 days</strong>.</>
                  : <><strong>4,247</strong> PMs played today's set. Median score: <strong>3.2/5</strong>. Median time: <strong>2:47</strong>.</>}
              </span>
            </div>

            {!hasPlayed && (
              <button onClick={() => setScreen('intro')} className="sans btn-press" style={{
                marginTop: '16px', width: '100%',
                backgroundColor: '#D2691E', color: '#FBF7F0',
                border: '2px solid #2A1810', borderRadius: '14px',
                padding: '16px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                boxShadow: '4px 4px 0 #2A1810',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                Play today's set <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
