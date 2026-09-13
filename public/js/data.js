/**
 * HealthyLife – static content for the awareness library and lifestyle tips.
 * All content is general awareness information, written in simple language.
 */

const LIFESTYLE_TIPS = [
  { id: 1, category: 'food', icon: '🥗', title: 'Eat the rainbow',
    text: 'Try to include colourful vegetables and fruits in your meals — different colours bring different nutrients.' },
  { id: 2, category: 'food', icon: '🍚', title: 'Whole grains keep you full',
    text: 'Choose whole wheat roti, brown rice or oats when you can — they release energy slowly and keep you full longer.' },
  { id: 3, category: 'food', icon: '🍬', title: 'Go easy on sugar',
    text: 'Cut down on sugary drinks and packaged snacks. Water, buttermilk or fresh fruit are fresher choices.' },
  { id: 4, category: 'food', icon: '🍳', title: 'Do not skip breakfast',
    text: 'A simple breakfast helps concentration in morning classes. Even a banana and some nuts is a good start.' },
  { id: 5, category: 'hydration', icon: '💧', title: 'Start the day with water',
    text: 'A glass of water after waking up helps rehydrate your body after sleep.' },
  { id: 6, category: 'hydration', icon: '🚰', title: 'Carry a bottle',
    text: 'Keep a reusable water bottle with you — you are far more likely to sip regularly when water is at hand.' },
  { id: 7, category: 'hydration', icon: '🥤', title: 'Watch sugary drinks',
    text: 'Aerated drinks and packaged juices add a lot of sugar with little nutrition. Plain water is the best default.' },
  { id: 8, category: 'hydration', icon: '☀️', title: 'Drink more when it is hot',
    text: 'In summer or after playing sports, your body loses more water — top up extra glasses.' },
  { id: 9, category: 'screen-time', icon: '⏰', title: 'The 20-20-20 rule',
    text: 'Every 20 minutes of screen time, look at something 20 feet away for 20 seconds to rest your eyes.' },
  { id: 10, category: 'screen-time', icon: '🌙', title: 'Screens before bed',
    text: 'Put phones away 30–60 minutes before sleeping — the light and the scrolling both keep your brain alert.' },
  { id: 11, category: 'screen-time', icon: '🚶', title: 'Move between sessions',
    text: 'Stand up and stretch for 2–3 minutes after every hour of sitting, gaming or studying.' },
  { id: 12, category: 'screen-time', icon: '📵', title: 'Phone-free meals',
    text: 'Keep meals screen-free — you eat more mindfully and digest better.' },
  { id: 13, category: 'posture', icon: '🪑', title: 'Sit tall like a string',
    text: 'Imagine a string pulling the top of your head up — shoulders relaxed, back straight, feet on the floor.' },
  { id: 14, category: 'posture', icon: '📱', title: 'Hold screens at eye level',
    text: 'Looking down at a phone for hours strains the neck. Lift the phone closer to eye level.' },
  { id: 15, category: 'posture', icon: '🎒', title: 'Both straps on the backpack',
    text: 'Carry your school bag on both shoulders and keep it light — one-shoulder carrying strains your back.' },
  { id: 16, category: 'posture', icon: '🧘', title: 'Stretch it out',
    text: 'A quick neck, shoulder and back stretch in the morning and evening keeps muscles relaxed.' }
];

const AWARENESS_ARTICLES = [
  {
    id: 'nutrition',
    icon: '🥗',
    title: 'Eating well, simply',
    summary: 'A balanced plate gives you steady energy for study and play.',
    points: [
      'Fill about half your plate with vegetables and fruits, a quarter with grains (roti, rice, oats) and a quarter with protein (dal, eggs, paneer, nuts).',
      'Homemade food is usually fresher and lighter than packaged snacks.',
      'Eat slowly and stop when you feel comfortably full — it takes the brain about 20 minutes to notice.',
      'If you want a snack, fruits, nuts, roasted chana or curd are filling and nutritious.'
    ]
  },
  {
    id: 'hygiene',
    icon: '🧼',
    title: 'Everyday hygiene basics',
    summary: 'Small daily habits stop germs from spreading.',
    points: [
      'Wash hands with soap for at least 20 seconds before eating and after using the washroom.',
      'Cover coughs and sneezes with your elbow, not your palm.',
      'Drink clean, safe water — boiled, filtered or from a trusted source.',
      'Keep nails trimmed and clean, and change into clean clothes daily.',
      'Aim for a daily bath, especially after sports or a hot day.'
    ]
  },
  {
    id: 'sleep-hygiene',
    icon: '😴',
    title: 'Sleep hygiene 101',
    summary: 'Good sleep is a superpower for memory, mood and immunity.',
    points: [
      'Most teenagers need around 8–10 hours of sleep each night; adults around 7–9.',
      'Keep the same sleep and wake time every day, including weekends.',
      'Avoid caffeine (tea, coffee, cola, energy drinks) after mid-afternoon.',
      'Keep the bedroom cool, dark and quiet; use a fan or soft earplugs if needed.',
      'Wind down before bed with a book, light stretches or quiet music instead of screens.'
    ]
  },
  {
    id: 'stress',
    icon: '🌿',
    title: 'Managing everyday stress',
    summary: 'Feeling stressed sometimes is normal — simple habits help you recover.',
    points: [
      'Name the feeling: writing down what is bothering you often makes it feel lighter.',
      'Take movement breaks — a short walk or stretching lowers tension.',
      'Try slow breathing: in for 4 counts, hold 4, out for 4, hold 4. A few rounds can calm the mind.',
      'Talk to someone you trust — a friend, parent, teacher or mentor.',
      'Keep sleep and meals regular, even during exam time — routine is a stress buffer.',
      'If stress feels too heavy for many days, speaking to a school counsellor or a qualified professional is a strong, healthy step.'
    ]
  }
];

/* Fallback suggestions used when the AI recommendation service is unavailable. */
const FALLBACK_SUGGESTIONS = [
  'Try going to bed 20 minutes earlier tonight — small shifts are easier to keep than big ones.',
  'Keep a water bottle on your desk today; you will sip more without thinking about it.',
  'Take a 10-minute walk after dinner — light movement helps both digestion and sleep.',
  'Use the 20-20-20 rule during study sessions today: every 20 minutes, look far away for 20 seconds.',
  'Put your phone away 30 minutes before bed tonight and notice the difference tomorrow.'
];
