import { PreloadedMatch, CommentatorPersona, LanguageOption } from "./types";

export const PRELOADED_MATCHES: PreloadedMatch[] = [
  {
    id: "wc2022",
    title: "World Cup Final 2022: Argentina vs France",
    sport: "Football",
    teamA: "Argentina",
    teamB: "France",
    initialEvents: [
      { minute: 23, text: "Angel Di Maria is tripped in the French box! Penalty Argentina! Lionel Messi steps up to take it..." },
      { minute: 23, text: "GOOOAAAL! Messi sends Lloris the wrong way, sliding it coolly into the bottom right! Argentina leads 1-0!" },
      { minute: 36, text: "A breath-taking counter-attack! Mac Allister passes across the box to Di Maria... GOAL ARGENTINA! 2-0!" },
      { minute: 80, text: "Otamendi fouls Kolo Muani! Penalty France! Kylian Mbappe steps up... AND SCORES! There is hope! 2-1!" },
      { minute: 81, text: "UNBELIEVABLE! Coman wins it, feeds Mbappe, who volleys a rocket past Martinez! GOAL FRANCE! 2-2 in a flash!" },
      { minute: 108, text: "GOAL ARGENTINA! Lautaro Martinez's shot is parried, and Lionel Messi pokes the rebound over the line! 3-2!" },
      { minute: 118, text: "Penalty France for a handball by Montiel! Mbappe steps up... AND SCORERS A HAT-TRICK! 3-3! Absolute soccer madness!" }
    ]
  },
  {
    id: "cl1999",
    title: "Champions League Final 1999: Man United vs Bayern",
    sport: "Football",
    teamA: "Manchester United",
    teamB: "Bayern Munich",
    initialEvents: [
      { minute: 6, text: "Mario Basler curls a clever free-kick around the Manchester United wall! GOAL BAYERN! 1-0 early lead." },
      { minute: 79, text: "Bayern's Carsten Jancker hits a spectacular overhead kick that crashes off the crossbar! United escapes!" },
      { minute: "90+1", text: "United corner. Beckham swings it in... Giggs tries a volley, and Teddy Sheringham redirects it home! GOAL! 1-1!" },
      { minute: "90+3", text: "ANOTHER CORNER BECKHAM! Sheringham flick-on, and SOLSKJAER STRETCHES TO STAB IT INTO THE ROOF! GOAL! 2-1!" },
      { minute: "90+5", text: "Full time whistle! Manchester United pulls off the most legendary injury-time comeback in European history!" }
    ]
  },
  {
    id: "wc1986",
    title: "World Cup QF 1986: Argentina vs England",
    sport: "Football",
    teamA: "Argentina",
    teamB: "England",
    initialEvents: [
      { minute: 51, text: "Diego Maradona challenges Shilton in the air, punching the ball into the net! It is given! Hand of God! 1-0!" },
      { minute: 55, text: "Maradona receives in his own half, spins away, beats Beardsley, Reid, Butcher, Fenwick, and Shilton... GOAL OF THE CENTURY!" },
      { minute: 81, text: "Gary Lineker scores a powerful header at the back post! England pulls one back! 2-1, high tension in Mexico City!" }
    ]
  },
  {
    id: "wc2014",
    title: "World Cup SF 2014: Brazil vs Germany",
    sport: "Football",
    teamA: "Brazil",
    teamB: "Germany",
    initialEvents: [
      { minute: 11, text: "Thomas Muller is left completely unmarked from a German corner. Taps it home. GOAL GERMANY! 1-0!" },
      { minute: 23, text: "Miroslav Klose scores on the rebound! He breaks the all-time World Cup scoring record! 2-0 Germany!" },
      { minute: 24, text: "Toni Kroos fires a brilliant half-volley into the bottom corner! GOAL GERMANY! 3-0 in absolute shock!" },
      { minute: 26, text: "Kroos steals the ball, plays a quick 1-2, and slots it past Julio Cesar! 4-0! The stadium is in absolute tears!" },
      { minute: 29, text: "Sami Khedira plays a neat pass to Ozil, receives it back, and slams it home! 5-0 inside 30 minutes! Catastrophic!" }
    ]
  }
];

export const COMMENTATORS: CommentatorPersona[] = [
  {
    id: "hype",
    name: "Slick Ricardo",
    role: "The Hype Man",
    avatar: "🎙️",
    description: "High-voltage, caps-lock-loving broadcaster who treats every minor pass like a cosmic alignment. High energy, rapid pacing.",
    voiceSettings: {
      pitch: 1.3,
      rate: 1.25,
      voiceNameLang: "en-US"
    },
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30"
  },
  {
    id: "grumpy",
    name: "Sir Alastair",
    role: "The Grumpy Analyst",
    avatar: "🤨",
    description: "Cynical British analyst who despises modern tactics, players, hairstyles, and goals. Extremely sarcastic and nostalgic for 1974.",
    voiceSettings: {
      pitch: 0.75,
      rate: 0.85,
      voiceNameLang: "en-GB"
    },
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30"
  },
  {
    id: "heartbroken",
    name: "Marco",
    role: "The Heartbroken Fan",
    avatar: "😭",
    description: "Hyper-sensitive superfan of Team A. Suffers heart palpitations, extreme anxiety, and is always on the verge of a full theatrical breakdown.",
    voiceSettings: {
      pitch: 1.15,
      rate: 0.9,
      voiceNameLang: "en-US"
    },
    colorClass: "text-rose-400",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/30"
  },
  {
    id: "poet",
    name: "Jean-Pierre",
    role: "The Romantic Poet",
    avatar: "🌹",
    description: "Philosophical commentator who views the pitch as a canvas of existential drama. Speaks in lavish romantic metaphors.",
    voiceSettings: {
      pitch: 0.95,
      rate: 0.85,
      voiceNameLang: "en-US" // or fr-FR if available, but en-US standard
    },
    colorClass: "text-violet-400",
    bgClass: "bg-violet-500/10",
    borderClass: "border-violet-500/30"
  }
];

export const STADIUM_SOUNDS = [
  { id: "roar", name: "Stadium Roar", emoji: "🏟️", audioUrl: "/sounds/roar.mp3", description: "Crowd explodes into massive cheers!" },
  { id: "whistle", name: "Referee Whistle", emoji: "💨", audioUrl: "/sounds/whistle.mp3", description: "Standard match start/stoppage." },
  { id: "sigh", name: "Crowd Groan/Sigh", emoji: "🤦", audioUrl: "/sounds/groan.mp3", description: "When a huge chance is missed." },
  { id: "airhorn", name: "Fandom Airhorn", emoji: "🎺", audioUrl: "/sounds/airhorn.mp3", description: "Blasting celebration horn!" },
  { id: "gasp", name: "Gasps of Tension", emoji: "😮", audioUrl: "/sounds/gasp.mp3", description: "Collective panic in the stands." }
];

export const INDIAN_CONSTITUTION_LANGUAGES: LanguageOption[] = [
  { id: "english", name: "English", nativeName: "English" },
  { id: "hindi", name: "Hindi", nativeName: "हिन्दी" },
  { id: "bengali", name: "Bengali", nativeName: "বাংলা" },
  { id: "marathi", name: "Marathi", nativeName: "मराठी" },
  { id: "telugu", name: "Telugu", nativeName: "తెలుగు" },
  { id: "tamil", name: "Tamil", nativeName: "தமிழ்" },
  { id: "gujarati", name: "Gujarati", nativeName: "ગુજરાતી" },
  { id: "urdu", name: "Urdu", nativeName: "اردو" },
  { id: "kannada", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { id: "odia", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { id: "punjabi", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { id: "malayalam", name: "Malayalam", nativeName: "മലയാളം" },
  { id: "assamese", name: "Assamese", nativeName: "অসমীয়া" },
  { id: "maithili", name: "Maithili", nativeName: "मैथिली" },
  { id: "santhali", name: "Santali", nativeName: "संताली" },
  { id: "kashmiri", name: "Kashmiri", nativeName: "कश्मीरी" },
  { id: "nepali", name: "Nepali", nativeName: "नेपाली" },
  { id: "कोंकणी", name: "Konkani", nativeName: "कोंकणी" },
  { id: "sindhi", name: "Sindhi", nativeName: "सिंधी" },
  { id: "dogri", name: "Dogri", nativeName: "डोगरी" },
  { id: "manipuri", name: "Manipuri", nativeName: "মণিপুরী" },
  { id: "bodo", name: "Bodo", nativeName: "बर'" },
  { id: "sanskrit", name: "Sanskrit", nativeName: "संस्कृतम्" }
];

