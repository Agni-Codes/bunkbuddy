// ─── Fun Layer ────────────────────────────────────────────────────────────────
// Lightweight, non-intrusive motivational flavour. Supports the experience,
// never competes with it. Zero gamification.

const MEME_CARDS = [
  { min: 90, emoji: '😇', title: "Professor's favourite", sub: "You could write a textbook on showing up." },
  { min: 85, emoji: '🎓', title: "Attendance royalty", sub: "Your parents would be so proud." },
  { min: 80, emoji: '😤', title: "Solid attendance", sub: "You've earned a guilt-free bunk or two." },
  { min: 75, emoji: '🎪', title: "Walking the tightrope", sub: "You're okay, but don't push your luck." },
  { min: 70, emoji: '🌶️', title: "Getting spicy", sub: "Your professor can smell the absences on you." },
  { min: 65, emoji: '😬', title: "Okay, this is real now", sub: "Time to become best friends with your classroom." },
  { min: 60, emoji: '🏠', title: "Part-time student", sub: "Your home couch has better attendance than you." },
  { min: 0,  emoji: '😭', title: "Legend mode: unlocked", sub: "jk please come to class we're begging you." }
];

const QUOTES = [
  "Show up. That's 90% of college.",
  "Attendance today → exam seat tomorrow.",
  "Even if you sleep in class, at least you're there.",
  "Future you will thank present you for attending.",
  "Every class skipped is a math problem you'll regret.",
  "Your GPA won't fix itself with bunks.",
  "Motivation is a myth. Discipline isn't.",
  "The professor remembers faces. Be a face.",
  "You're not too tired. You're too comfortable.",
  "Attendance is the price of admission to the exam hall."
];

const SAFE_MESSAGES = {
  plenty: [
    "You're in great shape — bunk responsibly 😎",
    "Room to breathe. Don't waste it all at once.",
    "You've got buffer. Use it wisely."
  ],
  some: [
    "You've got a little room. Stay sharp.",
    "Don't spend it all in one week.",
    "Tread carefully — comfort zones are dangerous."
  ],
  tight: [
    "Zero wiggle room. Every class counts now.",
    "Attend. Everything. No exceptions.",
    "This is not a drill."
  ],
  recovery: [
    "Time to grind. You've got classes to make up.",
    "Recovery mode. Eyes on the prize.",
    "You're below target. Attendance > sleep right now."
  ]
};

/** Get a meme card object for a given attendance percentage */
export function getMemeCard(pct) {
  for (const card of MEME_CARDS) {
    if (pct >= card.min) return card;
  }
  return MEME_CARDS[MEME_CARDS.length - 1];
}

/** Get a random motivational quote */
export function getQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

/** Get a safe-leave flavour message based on safe leave count */
export function getSafeMessage(safeLeaves) {
  if (safeLeaves < 0) return pick(SAFE_MESSAGES.recovery);
  if (safeLeaves === 0) return pick(SAFE_MESSAGES.tight);
  if (safeLeaves <= 3) return pick(SAFE_MESSAGES.some);
  return pick(SAFE_MESSAGES.plenty);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Render a small confetti burst on a target element */
export function celebrate(targetEl) {
  if (!targetEl) return;
  const colors = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#60a5fa'];
  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('span');
    dot.className = 'confetti-dot';
    dot.style.cssText = `
      --x: ${(Math.random() - 0.5) * 120}px;
      --y: ${-(Math.random() * 80 + 40)}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 200}ms;
    `;
    targetEl.appendChild(dot);
    setTimeout(() => dot.remove(), 1000);
  }
}
