import rateLimit from 'express-rate-limit';

// Applied to every request. Generous enough not to bother real usage, tight
// enough to blunt scripted abuse against an API with no other throttling.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
});

// The invite code is 8 uppercase alphanumeric characters — a huge keyspace,
// but with zero throttling it's still guessable given enough time. This
// caps guesses per IP without affecting legitimate use (nobody joins a
// household 10+ times in 15 minutes).
export const joinHouseholdLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many join attempts, please try again later.' },
});
