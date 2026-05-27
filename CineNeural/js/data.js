'use strict';

// Movie index for recommendation scoring.
// Each entry: { id: IMDb ID, t: title, g: genres[], k: keyword themes[] }
// OMDB is called for full details when a movie is recommended.

const MOVIE_INDEX = [
  // ── PRISON / CONFINEMENT ───────────────
  {id:'tt0111161',t:'The Shawshank Redemption',g:['Drama','Crime'],k:['prison','hope','friendship','freedom','redemption','escape','injustice','innocence','perseverance']},
  {id:'tt0139654',t:'The Green Mile',g:['Drama','Fantasy','Crime'],k:['prison','death row','supernatural','compassion','miracle','innocence','humanity']},
  {id:'tt0072684',t:'Papillon',g:['Adventure','Biography','Drama'],k:['prison','escape','freedom','survival','friendship','perseverance','French Guiana']},
  {id:'tt0061512',t:'Cool Hand Luke',g:['Drama','Crime'],k:['prison','rebellion','freedom','authority','nonconformity','chain gang','south']},
  {id:'tt1206543',t:'A Prophet',g:['Crime','Drama','Thriller'],k:['prison','crime','power','mafia','survival','identity','French']},
  {id:'tt0077416',t:'Midnight Express',g:['Crime','Drama','Thriller'],k:['prison','drugs','escape','injustice','suffering','Turkey']},
  {id:'tt0098485',t:'Dead Man Walking',g:['Crime','Drama'],k:['prison','death row','redemption','religion','morality','capital punishment']},
  {id:'tt0393162',t:'Oldboy',g:['Action','Drama','Mystery','Thriller'],k:['prison','revenge','mystery','obsession','isolation','identity','Korean']},
  {id:'tt4016934',t:'The Revenant',g:['Adventure','Drama','History'],k:['survival','revenge','wilderness','cold','frontier','nature']},

  // ── MAFIA / ORGANIZED CRIME ────────────
  {id:'tt0068646',t:'The Godfather',g:['Crime','Drama'],k:['mafia','family','power','loyalty','betrayal','honor','corruption','Italian-American']},
  {id:'tt0071562',t:'The Godfather Part II',g:['Crime','Drama'],k:['mafia','family','power','corruption','betrayal','rise and fall','Italian-American']},
  {id:'tt0099685',t:'Goodfellas',g:['Biography','Crime','Drama'],k:['mafia','crime','greed','loyalty','betrayal','violence','drugs','rise and fall']},
  {id:'tt0092005',t:'The Untouchables',g:['Crime','Drama','Thriller'],k:['mafia','prohibition','FBI','corruption','justice','Al Capone']},
  {id:'tt0105236',t:'Reservoir Dogs',g:['Crime','Drama','Thriller'],k:['heist','crime','violence','betrayal','trust','dark','nonlinear']},
  {id:'tt0119488',t:'L.A. Confidential',g:['Crime','Drama','Mystery','Thriller'],k:['corruption','detective','crime','Los Angeles','1950s','justice','conspiracy']},
  {id:'tt0407887',t:'The Departed',g:['Crime','Drama','Thriller'],k:['mafia','undercover','betrayal','identity','police','Boston','loyalty']},
  {id:'tt0110912',t:'Pulp Fiction',g:['Crime','Drama','Thriller'],k:['crime','violence','redemption','hitmen','drugs','dark comedy','nonlinear','intertwining']},
  {id:'tt1853728',t:'Django Unchained',g:['Drama','Western'],k:['slavery','revenge','western','racism','violence','justice','freedom']},

  // ── THRILLER / MYSTERY ─────────────────
  {id:'tt0114369',t:'Se7en',g:['Crime','Drama','Mystery','Thriller'],k:['serial killer','seven deadly sins','detective','dark','murder','nihilism','investigation']},
  {id:'tt0119217',t:'Good Will Hunting',g:['Drama','Romance'],k:['genius','psychology','self-discovery','therapy','trauma','friendship','Boston','working class']},
  {id:'tt1119646',t:'Zodiac',g:['Crime','Drama','Mystery','Thriller'],k:['serial killer','investigation','obsession','unsolved','journalism','real crime','detective']},
  {id:'tt1375670',t:'Prisoners',g:['Crime','Drama','Mystery','Thriller'],k:['kidnapping','investigation','obsession','father','justice','desperation','dark','morality']},
  {id:'tt2267998',t:'Gone Girl',g:['Drama','Mystery','Thriller'],k:['marriage','deception','media','manipulation','disappearance','dark','twist']},
  {id:'tt0167404',t:'The Sixth Sense',g:['Drama','Mystery','Thriller'],k:['supernatural','twist','ghosts','psychology','death','child']},
  {id:'tt0114814',t:'The Usual Suspects',g:['Crime','Mystery','Thriller'],k:['heist','twist','deception','mystery','identity','crime']},
  {id:'tt1130884',t:'Shutter Island',g:['Mystery','Thriller'],k:['psychological','asylum','mystery','conspiracy','identity','trauma','delusion','island']},
  {id:'tt0443706',t:'The Prestige',g:['Drama','Mystery','Sci-Fi','Thriller'],k:['magic','obsession','rivalry','sacrifice','deception','illusion','identity','duality']},
  {id:'tt0209144',t:'Memento',g:['Mystery','Thriller'],k:['memory','identity','revenge','manipulation','nonlinear','investigation','amnesia']},
  {id:'tt0246578',t:'Mulholland Drive',g:['Drama','Mystery','Thriller'],k:['surreal','identity','Hollywood','dreams','dark','mystery','illusion']},
  {id:'tt0081505',t:'The Shining',g:['Drama','Horror'],k:['psychological horror','isolation','madness','supernatural','hotel','family','dark']},
  {id:'tt0986264',t:'Take Shelter',g:['Drama','Thriller'],k:['paranoia','fear','family','mental illness','apocalypse','isolation','dread']},

  // ── DRAMA ──────────────────────────────
  {id:'tt0108052',t:"Schindler's List",g:['Biography','Drama','History','War'],k:['Holocaust','war','humanity','heroism','evil','survival','sacrifice','Nazi','history']},
  {id:'tt0117951',t:'Trainspotting',g:['Drama'],k:['addiction','drugs','friendship','Scotland','youth','dark comedy','poverty','escape']},
  {id:'tt0050083',t:'12 Angry Men',g:['Crime','Drama'],k:['justice','jury','prejudice','debate','innocence','law','democracy','deliberation']},
  {id:'tt0169547',t:'American Beauty',g:['Drama'],k:['suburbia','midlife crisis','beauty','family','dark comedy','identity','desire','appearance']},
  {id:'tt0172495',t:'Gladiator',g:['Action','Adventure','Drama'],k:['revenge','honor','Roman Empire','slavery','betrayal','combat','heroism','family']},
  {id:'tt0095953',t:'Rain Man',g:['Drama'],k:['autism','family','road trip','savant','brotherhood','acceptance','disability']},
  {id:'tt0169547',t:'American Beauty',g:['Drama'],k:['suburbia','identity','beauty','midlife crisis']},
  {id:'tt0119217',t:'Good Will Hunting',g:['Drama','Romance'],k:['genius','therapy','friendship','potential','trauma']},
  {id:'tt0245429',t:'Spirited Away',g:['Animation','Adventure','Family','Fantasy'],k:['fantasy','spirit world','courage','growing up','magical','Japanese mythology','nature']},
  {id:'tt0102926',t:'The Silence of the Lambs',g:['Crime','Drama','Thriller'],k:['serial killer','FBI','psychological','cannibalism','manipulation','profiling','investigation']},
  {id:'tt2582802',t:'Whiplash',g:['Drama','Music'],k:['obsession','music','ambition','abuse','perfectionism','jazz','student-teacher','sacrifice','greatness']},
  {id:'tt1504320',t:"The King's Speech",g:['Biography','Drama','History'],k:['speech','royalty','friendship','overcoming fear','World War II','courage','history']},
  {id:'tt0120338',t:'Titanic',g:['Drama','Romance'],k:['love','tragedy','class','ship','disaster','sacrifice','historical']},
  {id:'tt0454921',t:'The Pursuit of Happyness',g:['Biography','Drama'],k:['perseverance','poverty','family','ambition','success','father','American dream']},
  {id:'tt2582802',t:'Whiplash',g:['Drama','Music'],k:['obsession','perfectionism','music','jazz','ambition']},
  {id:'tt3170832',t:'Room',g:['Drama','Thriller'],k:['captivity','escape','mother','child','survival','trauma','freedom','recovery']},
  {id:'tt2024544',t:'12 Years a Slave',g:['Biography','Drama','History'],k:['slavery','racism','survival','injustice','freedom','historical','humanity']},

  // ── ACTION / SUPERHERO ─────────────────
  {id:'tt0468569',t:'The Dark Knight',g:['Action','Crime','Drama','Thriller'],k:['chaos','heroism','morality','sacrifice','anarchy','corruption','vigilante','duality']},
  {id:'tt1375666',t:'Inception',g:['Action','Adventure','Sci-Fi','Thriller'],k:['dreams','reality','heist','guilt','memory','mind','subconscious','layers']},
  {id:'tt0133093',t:'The Matrix',g:['Action','Sci-Fi'],k:['simulation','reality','AI','revolution','identity','dystopia','cyberpunk','choice']},
  {id:'tt0266697',t:'Kill Bill: Volume 1',g:['Action','Crime','Thriller'],k:['revenge','violence','martial arts','female protagonist','stylized','vengeance']},
  {id:'tt0378194',t:'Kill Bill: Volume 2',g:['Action','Crime','Thriller'],k:['revenge','closure','female protagonist','vengeance','confrontation']},
  {id:'tt1392190',t:'Mad Max: Fury Road',g:['Action','Adventure','Sci-Fi'],k:['post-apocalyptic','survival','dystopia','feminist','chase','freedom','war']},
  {id:'tt0110413',t:'Léon: The Professional',g:['Action','Crime','Drama','Thriller'],k:['hitman','friendship','crime','mentor','child','love','loneliness','Paris']},
  {id:'tt0082971',t:'Raiders of the Lost Ark',g:['Action','Adventure'],k:['adventure','archaeology','treasure','action','historical','mystery']},

  // ── SCI-FI ─────────────────────────────
  {id:'tt0816692',t:'Interstellar',g:['Adventure','Drama','Sci-Fi'],k:['space','time','relativity','love','survival','fatherhood','black hole','dimensions']},
  {id:'tt2543164',t:'Arrival',g:['Drama','Mystery','Sci-Fi'],k:['language','time','aliens','communication','grief','motherhood','perception','nonlinear']},
  {id:'tt0083658',t:'Blade Runner',g:['Action','Drama','Sci-Fi','Thriller'],k:['dystopia','AI','humanity','android','identity','future','memory','Los Angeles']},
  {id:'tt1856101',t:'Blade Runner 2049',g:['Action','Drama','Sci-Fi'],k:['dystopia','AI','identity','humanity','memory','cyberpunk','existential','replicant']},
  {id:'tt3783958',t:'La La Land',g:['Comedy','Drama','Music','Romance'],k:['dreams','Hollywood','love','jazz','ambition','sacrifice','nostalgia','music']},
  {id:'tt0910970',t:'WALL-E',g:['Animation','Adventure','Family','Romance','Sci-Fi'],k:['love','environment','loneliness','dystopia','robots','humanity','space','consumerism']},
  {id:'tt1285016',t:'The Social Network',g:['Biography','Drama'],k:['betrayal','ambition','friendship','startup','Harvard','success','loneliness','genius']},
  {id:'tt1371111',t:'Ex Machina',g:['Drama','Sci-Fi','Thriller'],k:['AI','consciousness','manipulation','humanity','identity','Turing test','isolation']},
  {id:'tt0119116',t:'The Fifth Element',g:['Action','Adventure','Comedy','Sci-Fi'],k:['sci-fi','colorful','future','love','adventure','action','space']},
  {id:'tt0088763',t:'Back to the Future',g:['Adventure','Comedy','Sci-Fi'],k:['time travel','family','friendship','adventure','1980s','comedy','science']},

  // ── HORROR / DARK ─────────────────────
  {id:'tt0073195',t:'Jaws',g:['Adventure','Horror','Thriller'],k:['shark','fear','ocean','survival','community','monster','suspense']},
  {id:'tt0090605',t:'Aliens',g:['Action','Adventure','Sci-Fi','Thriller'],k:['survival','alien','action','space','fear','motherhood','sci-fi']},
  {id:'tt1375670',t:'Prisoners',g:['Crime','Drama','Mystery'],k:['kidnapping','justice','desperation','moral ambiguity']},
  {id:'tt0079470',t:'Apocalypse Now',g:['Drama','Mystery','War'],k:['war','Vietnam','madness','jungle','morality','darkness','horror','power']},
  {id:'tt0052357',t:'Vertigo',g:['Mystery','Romance','Thriller'],k:['obsession','identity','mystery','love','deception','psychology','1950s']},

  // ── WAR / HISTORY ─────────────────────
  {id:'tt0120815',t:'Saving Private Ryan',g:['Drama','War'],k:['war','World War II','sacrifice','heroism','duty','D-Day','brotherhood','survival']},
  {id:'tt0110322',t:'Forrest Gump',g:['Drama','Romance'],k:['life journey','love','history','kindness','destiny','war','americana','hope','disability']},
  {id:'tt0087884',t:'Amadeus',g:['Biography','Drama','Music'],k:['genius','jealousy','music','Mozart','classical','obsession','art','rivalry']},
  {id:'tt0172495',t:'Gladiator',g:['Action','Adventure','Drama'],k:['revenge','honor','Roman Empire','slavery','combat','heroism']},
  {id:'tt0112573',t:'Braveheart',g:['Biography','Drama','History','War'],k:['freedom','war','Scotland','revenge','heroism','love','rebellion','sacrifice']},

  // ── ROMANCE / LIFE ────────────────────
  {id:'tt0119488',t:'L.A. Confidential',g:['Crime','Drama','Mystery'],k:['corruption','detective','noir','1950s','justice']},
  {id:'tt0338013',t:'Eternal Sunshine of the Spotless Mind',g:['Drama','Romance','Sci-Fi'],k:['memory','love','heartbreak','identity','loss','relationship','surreal','erasing']},
  {id:'tt0317219',t:'Lost in Translation',g:['Drama','Romance'],k:['loneliness','Tokyo','connection','identity','midlife','alienation','Japan']},
  {id:'tt0107048',t:'Groundhog Day',g:['Comedy','Fantasy','Romance'],k:['time loop','self-improvement','love','philosophy','repetition','change','comedy']},
  {id:'tt0117060',t:'Jerry Maguire',g:['Comedy','Drama','Romance','Sport'],k:['redemption','love','sports','integrity','money','relationships']},
  {id:'tt0364569',t:'Oldboy',g:['Action','Drama','Mystery'],k:['revenge','mystery','imprisonment']},

  // ── DARK COMEDY / SATIRE ──────────────
  {id:'tt0110912',t:'Pulp Fiction',g:['Crime','Drama'],k:['dark comedy','crime','violence']},
  {id:'tt0118715',t:'The Big Lebowski',g:['Comedy','Crime'],k:['mystery','crime','friendship','bowling','dark comedy','cult','laid-back']},
  {id:'tt0120735',t:'Lock, Stock and Two Smoking Barrels',g:['Comedy','Crime'],k:['crime','heist','British','dark comedy','friends','gambling','intertwining']},
  {id:'tt0190590',t:'O Brother, Where Art Thou?',g:['Adventure','Comedy','Crime'],k:['odyssey','American south','comedy','friendship','music','Depression-era','quirky']},
  {id:'tt0361748',t:'Inglourious Basterds',g:['Adventure','Drama','War'],k:['World War II','revenge','Jewish','Nazi','alternate history','violence','dark comedy']},
  {id:'tt4729430',t:'Parasite',g:['Comedy','Drama','Thriller'],k:['class divide','poverty','deception','family','wealth','social commentary','dark comedy','Korea']},

  // ── INDIE / ART HOUSE ─────────────────
  {id:'tt0120689',t:'The Green Mile',g:['Drama','Fantasy'],k:['prison','death row','miracle','compassion']},
  {id:'tt0116282',t:'Fargo',g:['Crime','Drama','Thriller'],k:['crime','Minnesota','dark comedy','kidnapping','police','quirky','cold','absurd']},
  {id:'tt0382932',t:'Ratatouille',g:['Animation','Comedy','Family'],k:['dreams','cooking','Paris','friendship','talent','prejudice','ambition']},
  {id:'tt1504320',t:"The King's Speech",g:['Biography','Drama'],k:['speech','royalty','courage','history','friendship']},
  {id:'tt0120382',t:'American History X',g:['Crime','Drama'],k:['racism','redemption','prison','hate','violence','change','family','neo-Nazi']},
  {id:'tt0209144',t:'Memento',g:['Mystery','Thriller'],k:['memory','revenge','identity','manipulation']},
  {id:'tt1049413',t:'Up',g:['Animation','Adventure','Comedy','Drama','Family'],k:['love','adventure','grief','old age','friendship','dreams','journey']},
  {id:'tt0073486',t:"One Flew Over the Cuckoo's Nest",g:['Drama'],k:['mental institution','freedom','rebellion','authority','friendship','individuality','sanity']},
  {id:'tt1010048',t:'Slumdog Millionaire',g:['Crime','Drama','Romance'],k:['poverty','love','destiny','survival','India','hope','fate','triumph']},
  {id:'tt0266543',t:'Finding Nemo',g:['Animation','Adventure','Comedy','Drama'],k:['family','ocean','journey','friendship','father','courage','hope']},
];

// Remove duplicates by IMDb ID
const seen = new Set();
const MOVIES = MOVIE_INDEX.filter(m => {
  if (seen.has(m.id)) return false;
  seen.add(m.id); return true;
});
