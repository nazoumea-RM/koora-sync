// ─────────────────────────────────────────────────────────────────────────
// Arabic names for the app's Arabic language mode.
//
// No free football API returns Arabic names, so:
//   • teams and leagues  → hand-written dictionary (all teams of the app's leagues)
//   • famous players     → hand-written dictionary
//   • everyone else      → automatic Latin → Arabic transliteration
//
// The sync writes these next to the original fields (nameAr, leagueNameAr,
// playerAr, labelAr, ...). The English/French fields are never changed, so an
// app version that doesn't read the *Ar fields keeps working exactly as before.
// To fix a name, add or edit it in TEAMS / PLAYERS below.
// ─────────────────────────────────────────────────────────────────────────

// Words dropped before matching ("FC Barcelona" == "Barcelona").
const NOISE = new Set([
  "fc", "afc", "cf", "sc", "ac", "as", "ssc", "cd", "ud", "sd", "rc", "club", "de", "del", "la",
  "vfb", "vfl", "tsg", "sv", "1", "calcio", "sl", "ca", "cs", "the",
]);

const fold = (s = "") =>
  String(s)
    .replace(/ß/g, "ss").replace(/[øØ]/g, "o").replace(/[æÆ]/g, "a").replace(/[łŁ]/g, "l").replace(/ı/g, "i")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const words = (s) => fold(s).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
const key = (s) => words(s).filter((w) => !NOISE.has(w)).join(" ");

// ── Leagues ──────────────────────────────────────────────────────────────

const LEAGUES = {
  botola: "البطولة الاحترافية",
  premier: "الدوري الإنجليزي الممتاز",
  laliga: "الدوري الإسباني",
  seriea: "الدوري الإيطالي",
  bundesliga: "الدوري الألماني",
  ligue1: "الدوري الفرنسي",
  ucl: "دوري أبطال أوروبا",
  cafcl: "دوري أبطال إفريقيا",
  cafcc: "كأس الكونفدرالية الإفريقية",
  throne: "كأس العرش",
  coupedutrone: "كأس العرش",
};

const LEAGUES_BY_NAME = [
  [/botola/i, LEAGUES.botola],
  [/premier league/i, LEAGUES.premier],
  [/la ?liga/i, LEAGUES.laliga],
  [/serie a/i, LEAGUES.seriea],
  [/bundesliga/i, LEAGUES.bundesliga],
  [/ligue 1/i, LEAGUES.ligue1],
  [/uefa champions|^champions league/i, LEAGUES.ucl],
  [/caf champions/i, LEAGUES.cafcl],
  [/confederation/i, LEAGUES.cafcc],
  [/throne|tr[oô]ne/i, LEAGUES.throne],
];

function leagueAr(leagueId, name = "") {
  if (LEAGUES[leagueId]) return LEAGUES[leagueId];
  const hit = LEAGUES_BY_NAME.find(([re]) => re.test(name));
  return hit ? hit[1] : name;
}

// ── Teams ────────────────────────────────────────────────────────────────
// "alias | alias | ...": Arabic. Aliases cover the spellings used by
// football-data.org, TheSportsDB and API-Football.

const TEAMS_SRC = {
  // Botola Pro
  "raja | raja casablanca | raja club athletic | raja ca": "الرجاء الرياضي",
  "wydad | wydad casablanca | wydad athletic | wydad ac | wac": "الوداد الرياضي",
  "far | far rabat | armee royale | forces armees royales": "الجيش الملكي",
  "fus | fus rabat | fath union sport | fath rabat": "الفتح الرباطي",
  "rs berkane | renaissance berkane | renaissance sportive berkane | rsb berkane | berkane": "نهضة بركان",
  "maghreb fes | mas fes | maghreb association sportive fes": "المغرب الفاسي",
  "hassania agadir | husa | hassania union sport agadir | husa agadir": "حسنية أكادير",
  "moghreb tetouan | mat tetouan | moghreb atletico tetouan | maghreb tetouan": "المغرب التطواني",
  "olympic safi | olympique safi | olympique club safi | ocs safi": "أولمبيك آسفي",
  "difaa el jadida | difaa hassani el jadidi | dhj | difaa hassani jadida | dh el jadida": "الدفاع الحسني الجديدي",
  "ir tanger | ittihad tanger | ittihad riadi tanger | irt tanger": "اتحاد طنجة",
  "renaissance zemamra | rcz zemamra | zemamra | renaissance club athletic zemamra": "نهضة الزمامرة",
  "union touarga | ust touarga | touarga | union sportive touarga": "اتحاد تواركة",
  "chabab mohammedia | sc chabab mohammedia | scc mohammedia | mohammedia": "شباب المحمدية",
  "kawkab marrakech | kacm | kac marrakech": "الكوكب المراكشي",
  "olympique dcheira | dcheira | olympique club dcheira": "أولمبيك الدشيرة",
  "jeunesse soualem | soualem | js soualem": "شباب السوالم",
  "codm meknes | codm | club omnisports meknes | meknes": "النادي المكناسي",
  "mouloudia oujda | mc oujda | mco oujda": "المولودية الوجدية",
  "youssoufia berrechid | crb berrechid": "يوسفية برشيد",
  "raja beni mellal | rbm beni mellal": "رجاء بني ملال",
  "chabab atlas khenifra | cak khenifra": "شباب أطلس خنيفرة",
  "wydad fes | wydad fez": "وداد فاس",
  "rapide oued zem | oued zem": "سريع وادي زم",

  // Premier League
  "arsenal": "أرسنال",
  "aston villa": "أستون فيلا",
  "bournemouth | afc bournemouth": "بورنموث",
  "brentford": "برينتفورد",
  "brighton | brighton hove | brighton hove albion": "برايتون",
  "chelsea": "تشيلسي",
  "crystal palace": "كريستال بالاس",
  "everton": "إيفرتون",
  "fulham": "فولهام",
  "ipswich | ipswich town": "إيبسويتش تاون",
  "leicester | leicester city": "ليستر سيتي",
  "liverpool": "ليفربول",
  "man city | manchester city": "مانشستر سيتي",
  "man united | man utd | manchester united": "مانشستر يونايتد",
  "newcastle | newcastle united": "نيوكاسل يونايتد",
  "nottingham | nottingham forest | nott m forest": "نوتنغهام فورست",
  "southampton": "ساوثهامبتون",
  "tottenham | tottenham hotspur | spurs": "توتنهام",
  "west ham | west ham united": "وست هام",
  "wolverhampton | wolves | wolverhampton wanderers": "وولفرهامبتون",
  "leeds | leeds united": "ليدز يونايتد",
  "burnley": "بيرنلي",
  "sunderland": "سندرلاند",
  "sheffield united": "شيفيلد يونايتد",
  "luton | luton town": "لوتون تاون",

  // LaLiga
  "real madrid": "ريال مدريد",
  "barca | barcelona": "برشلونة",
  "atleti | atletico madrid | atletico": "أتلتيكو مدريد",
  "athletic | athletic bilbao": "أتلتيك بلباو",
  "real betis | betis": "ريال بيتيس",
  "celta | celta vigo": "سيلتا فيغو",
  "espanyol": "إسبانيول",
  "getafe": "خيتافي",
  "girona": "جيرونا",
  "mallorca": "مايوركا",
  "osasuna": "أوساسونا",
  "rayo vallecano | rayo": "رايو فايكانو",
  "real sociedad": "ريال سوسيداد",
  "sevilla": "إشبيلية",
  "valencia": "فالنسيا",
  "villarreal": "فياريال",
  "alaves | deportivo alaves": "ألافيس",
  "leganes": "ليغانيس",
  "las palmas": "لاس بالماس",
  "real valladolid | valladolid": "بلد الوليد",
  "elche": "إلتشي",
  "levante": "ليفانتي",
  "real oviedo | oviedo": "ريال أوفييدو",
  "cadiz": "قادش",
  "granada": "غرناطة",
  "almeria": "ألميريا",

  // Serie A
  "milan | ac milan": "ميلان",
  "inter | inter milan | internazionale | internazionale milano": "إنتر ميلان",
  "juventus": "يوفنتوس",
  "napoli": "نابولي",
  "roma": "روما",
  "lazio": "لاتسيو",
  "atalanta": "أتالانتا",
  "fiorentina": "فيورنتينا",
  "bologna": "بولونيا",
  "torino": "تورينو",
  "genoa": "جنوى",
  "udinese": "أودينيزي",
  "cagliari": "كالياري",
  "lecce": "ليتشي",
  "verona | hellas verona": "فيرونا",
  "parma": "بارما",
  "como | como 1907": "كومو",
  "sassuolo": "ساسولو",
  "pisa": "بيزا",
  "cremonese": "كريمونيزي",
  "monza": "مونزا",
  "empoli": "إمبولي",
  "venezia": "فينيسيا",
  "salernitana": "ساليرنيتانا",
  "frosinone": "فروزينوني",

  // Bundesliga
  "bayern | bayern munich | bayern munchen": "بايرن ميونخ",
  "dortmund | borussia dortmund": "بوروسيا دورتموند",
  "leverkusen | bayer leverkusen | bayer 04 leverkusen": "باير ليفركوزن",
  "rb leipzig | leipzig": "لايبزيغ",
  "frankfurt | eintracht frankfurt": "آينتراخت فرانكفورت",
  "stuttgart": "شتوتغارت",
  "freiburg": "فرايبورغ",
  "wolfsburg": "فولفسبورغ",
  "m gladbach | monchengladbach | borussia monchengladbach": "بوروسيا مونشنغلادباخ",
  "union berlin": "يونيون برلين",
  "mainz | mainz 05": "ماينتس",
  "hoffenheim": "هوفنهايم",
  "augsburg": "أوغسبورغ",
  "werder | werder bremen": "فيردر بريمن",
  "bochum": "بوخوم",
  "heidenheim": "هايدنهايم",
  "st pauli": "سانت باولي",
  "holstein kiel": "هولشتاين كيل",
  "koln | cologne": "كولن",
  "hsv | hamburg | hamburger": "هامبورغ",
  "darmstadt": "دارمشتات",

  // Ligue 1
  "psg | paris saint germain | paris sg": "باريس سان جيرمان",
  "marseille | olympique marseille": "مارسيليا",
  "lyon | olympique lyonnais": "ليون",
  "monaco": "موناكو",
  "lille | losc lille": "ليل",
  "rennes | stade rennais": "رين",
  "nice | ogc nice": "نيس",
  "lens": "لانس",
  "nantes": "نانت",
  "brest | stade brestois": "بريست",
  "toulouse": "تولوز",
  "strasbourg": "ستراسبورغ",
  "reims | stade reims": "ريمس",
  "montpellier": "مونبلييه",
  "le havre": "لوهافر",
  "auxerre": "أوكسير",
  "angers | angers sco": "أنجيه",
  "saint etienne | st etienne": "سانت إتيان",
  "lorient": "لوريان",
  "paris fc": "باريس إف سي",
  "metz": "ميتز",

  // Rest of Europe (Champions League)
  "benfica": "بنفيكا",
  "porto": "بورتو",
  "sporting | sporting cp | sporting lisbon": "سبورتينغ لشبونة",
  "sporting braga | braga": "براغا",
  "ajax": "أياكس",
  "psv | psv eindhoven": "آيندهوفن",
  "feyenoord": "فينورد",
  "celtic": "سلتيك",
  "rangers": "رينجرز",
  "club brugge | brugge": "كلوب بروج",
  "galatasaray": "غلطة سراي",
  "fenerbahce": "فنربخشة",
  "besiktas": "بشكتاش",
  "shakhtar | shakhtar donetsk": "شاختار دونيتسك",
  "salzburg | rb salzburg | red bull salzburg": "سالزبورغ",
  "copenhagen | kobenhavn": "كوبنهاغن",
  "olympiacos | olympiakos": "أولمبياكوس",
  "slavia praha | slavia prague": "سلافيا براغ",
  "sparta praha | sparta prague": "سبارتا براغ",
  "bodo glimt": "بودو غليمت",
  "qarabag": "قره باغ",
  "union sg | union saint gilloise": "يونيون سان جيلواز",
  "kairat | kairat almaty": "كايرات ألماتي",
  "pafos": "بافوس",
  "dinamo zagreb": "دينامو زغرب",
  "crvena zvezda | red star belgrade": "النجم الأحمر",
  "young boys": "يونغ بويز",
  "sturm graz": "شتورم غراتس",
  "slovan bratislava": "سلوفان براتيسلافا",

  // CAF competitions
  "al ahly | ahly": "الأهلي",
  "zamalek": "الزمالك",
  "pyramids": "بيراميدز",
  "al masry | masry": "المصري",
  "future | modern sport": "مودرن سبورت",
  "esperance | esperance tunis": "الترجي التونسي",
  "club africain": "النادي الإفريقي",
  "etoile sahel | etoile du sahel": "النجم الساحلي",
  "sfaxien": "الصفاقسي",
  "stade tunisien": "الملعب التونسي",
  "mamelodi sundowns | sundowns": "ماميلودي صنداونز",
  "orlando pirates": "أورلاندو بايرتس",
  "kaizer chiefs": "كايزر تشيفز",
  "stellenbosch": "ستيلينبوش",
  "simba": "سيمبا",
  "young africans | yanga": "يانغ أفريكانز",
  "azam": "عزام",
  "tp mazembe | mazembe": "مازيمبي",
  "vita club | as vita club": "فيتا كلوب",
  "belouizdad | cr belouizdad": "شباب بلوزداد",
  "mc alger | mouloudia alger": "مولودية الجزائر",
  "js kabylie | kabylie": "شبيبة القبائل",
  "usm alger": "اتحاد العاصمة",
  "cs constantine | constantine": "شباب قسنطينة",
  "horoya": "حوريا",
  "petro luanda | petro atletico": "بترو أتلتيكو",
  "al hilal omdurman | al hilal": "الهلال السوداني",
  "al merrikh | merrikh": "المريخ",
  "asec mimosas | asec": "أسيك ميموزا",
  "jaraaf": "جاراف",
  "djoliba": "جوليبا",
  "al ahli tripoli | ahli tripoli": "أهلي طرابلس",
  "al ittihad tripoli": "الاتحاد الليبي",
  "enyimba": "إنييمبا",
  "rivers united": "ريفرز يونايتد",
  "san pedro": "سان بيدرو",
  "lupopo | saint eloi lupopo": "لوبوبو",
  "maniema union": "مانييما يونيون",
};

// ── Famous players (everyone else is transliterated) ─────────────────────

const PLAYERS_SRC = {
  // Morocco
  "achraf hakimi": "أشرف حكيمي",
  "yassine bounou | bono": "ياسين بونو",
  "hakim ziyech": "حكيم زياش",
  "sofyan amrabat": "سفيان أمرابط",
  "youssef en nesyri": "يوسف النصيري",
  "noussair mazraoui": "نصير مزراوي",
  "brahim diaz | brahim": "إبراهيم دياز",
  "bilal el khannouss": "بلال الخنوس",
  "azzedine ounahi": "عز الدين أوناحي",
  "abde ezzalzouli | abde": "عبد الصمد الزلزولي",
  "eliesse ben seghir": "إلياس بن صغير",
  "nayef aguerd": "نايف أكرد",
  "romain saiss": "رومان سايس",
  "sofiane boufal": "سفيان بوفال",
  "ayoub el kaabi": "أيوب الكعبي",
  "amine adli": "أمين عدلي",
  "ismael saibari": "إسماعيل صيباري",
  "chadi riad": "شادي رياض",
  "neil el aynaoui": "نائل العيناوي",
  "adam aznou": "آدم أزنو",
  "oussama targhalline": "أسامة ترغالين",
  "munir mohamedi": "منير المحمدي",
  "abdessamad ezzalzouli": "عبد الصمد الزلزولي",
  "soufiane rahimi": "سفيان رحيمي",
  "selim amallah": "سليم أملاح",
  "jawad el yamiq": "جواد الياميق",
  "yahya attiat allah | yahia attiyat allah": "يحيى عطية الله",
  // Arab & African stars
  "mohamed salah": "محمد صلاح",
  "omar marmoush": "عمر مرموش",
  "riyad mahrez": "رياض محرز",
  "rayan ait nouri": "ريان آيت نوري",
  "ismael bennacer": "إسماعيل بن ناصر",
  "houssem aouar": "حسام عوار",
  "amine gouiri": "أمين غويري",
  "hannibal mejbri": "حنبعل المجبري",
  "sadio mane": "ساديو ماني",
  "victor osimhen": "فيكتور أوسيمين",
  "ademola lookman": "أديمولا لوكمان",
  "victor boniface": "فيكتور بونيفاس",
  "serhou guirassy": "سيرهو غيراسي",
  "mohammed kudus": "محمد قدوس",
  "nicolas jackson": "نيكولاس جاكسون",
  "bryan mbeumo": "برايان مبيومو",
  "andre onana": "أندريه أونانا",
  "edouard mendy": "إدوارد ميندي",
  "kalidou koulibaly": "كاليدو كوليبالي",
  // Real Madrid
  "kylian mbappe": "كيليان مبابي",
  "vinicius junior | vinicius jr | vini jr": "فينيسيوس جونيور",
  "jude bellingham": "جود بيلينغهام",
  "rodrygo": "رودريغو",
  "federico valverde": "فيديريكو فالفيردي",
  "luka modric": "لوكا مودريتش",
  "thibaut courtois": "تيبو كورتوا",
  "antonio rudiger": "أنطونيو روديغر",
  "eduardo camavinga": "إدواردو كامافينغا",
  "aurelien tchouameni": "أوريليان تشواميني",
  "trent alexander arnold": "ترينت ألكسندر أرنولد",
  "arda guler": "أردا غولر",
  "dean huijsen": "دين هاوسن",
  "dani carvajal": "داني كارفاخال",
  "eder militao": "إيدير ميليتاو",
  "franco mastantuono": "فرانكو ماستانتونو",
  // Barcelona
  "lamine yamal": "لامين يامال",
  "robert lewandowski": "روبرت ليفاندوفسكي",
  "pedri": "بيدري",
  "gavi": "غافي",
  "raphinha": "رافينيا",
  "frenkie de jong": "فرينكي دي يونغ",
  "marc andre ter stegen": "مارك أندريه تير شتيغن",
  "ronald araujo": "رونالد أراوخو",
  "dani olmo": "داني أولمو",
  "ferran torres": "فيران توريس",
  "pau cubarsi": "باو كوبارسي",
  "jules kounde": "جول كوندي",
  "marcus rashford": "ماركوس راشفورد",
  "joan garcia": "خوان غارسيا",
  // Atletico & Spain
  "antoine griezmann": "أنطوان غريزمان",
  "julian alvarez": "خوليان ألفاريز",
  "jan oblak": "يان أوبلاك",
  "koke": "كوكي",
  "nico williams": "نيكو ويليامز",
  "mikel oyarzabal": "ميكيل أويارزابال",
  // Bayern & Germany
  "harry kane": "هاري كين",
  "jamal musiala": "جمال موسيالا",
  "joshua kimmich": "يوشوا كيميش",
  "manuel neuer": "مانويل نوير",
  "leroy sane": "ليروي ساني",
  "michael olise": "مايكل أوليسي",
  "luis diaz": "لويس دياز",
  "florian wirtz": "فلوريان فيرتز",
  // Manchester City
  "erling haaland": "إرلينغ هالاند",
  "kevin de bruyne": "كيفين دي بروين",
  "phil foden": "فيل فودين",
  "bernardo silva": "برناردو سيلفا",
  "rodri": "رودري",
  "rayan cherki": "ريان شرقي",
  "tijjani reijnders": "تيجاني ريندرز",
  // Arsenal
  "bukayo saka": "بوكايو ساكا",
  "martin odegaard": "مارتن أوديغارد",
  "declan rice": "ديكلان رايس",
  "william saliba": "ويليام صليبا",
  "gabriel martinelli": "غابرييل مارتينيلي",
  "viktor gyokeres": "فيكتور غيوكيريس",
  "eberechi eze": "إيبيريتشي إيزي",
  // Liverpool
  "virgil van dijk": "فيرجيل فان دايك",
  "alisson | alisson becker": "أليسون بيكر",
  "darwin nunez": "داروين نونيز",
  "alexis mac allister": "أليكسيس ماك أليستر",
  "dominik szoboszlai": "دومينيك سوبوسلاي",
  "alexander isak": "ألكسندر إيزاك",
  "hugo ekitike": "هوغو إيكيتيكي",
  "cody gakpo": "كودي غاكبو",
  // Chelsea, United, others
  "cole palmer": "كول بالمر",
  "enzo fernandez": "إنزو فرنانديز",
  "moises caicedo": "مويسيس كايسيدو",
  "joao pedro": "جواو بيدرو",
  "bruno fernandes": "برونو فرنانديز",
  "alejandro garnacho": "أليخاندرو غارناتشو",
  "matheus cunha": "ماتيوس كونيا",
  "benjamin sesko": "بنيامين شيشكو",
  "son heung min | heung min son": "سون هيونغ مين",
  "james maddison": "جيمس ماديسون",
  "bruno guimaraes": "برونو غيماريش",
  "ollie watkins": "أولي واتكينز",
  // PSG & France
  "ousmane dembele": "عثمان ديمبيلي",
  "vitinha": "فيتينيا",
  "gianluigi donnarumma": "جانلويجي دوناروما",
  "khvicha kvaratskhelia": "خفيتشا كفاراتسخيليا",
  "marquinhos": "ماركينيوس",
  "bradley barcola": "برادلي باركولا",
  "desire doue": "ديزيري دويه",
  "joao neves": "جواو نيفيز",
  "nuno mendes": "نونو منديز",
  "mason greenwood": "ماسون غرينوود",
  "pierre emerick aubameyang": "بيير إيمريك أوباميانغ",
  // Italy
  "lautaro martinez": "لاوتارو مارتينيز",
  "marcus thuram": "ماركوس تورام",
  "hakan calhanoglu": "هاكان تشالهان أوغلو",
  "nicolo barella": "نيكولو باريلا",
  "rafael leao": "رافائيل لياو",
  "christian pulisic": "كريستيان بوليسيتش",
  "romelu lukaku": "روميلو لوكاكو",
  "dusan vlahovic": "دوسان فلاهوفيتش",
  "kenan yildiz": "كينان يلدز",
  "paulo dybala": "باولو ديبالا",
  "scott mctominay": "سكوت ماكتوميناي",
  // Legends still playing
  "lionel messi": "ليونيل ميسي",
  "cristiano ronaldo": "كريستيانو رونالدو",
  "neymar | neymar jr": "نيمار",
  "karim benzema": "كريم بنزيمة",
};

// ── Lookup helpers ───────────────────────────────────────────────────────

function compile(src) {
  const exact = new Map();
  const subset = []; // [tokens, ar], longest first
  for (const [aliases, ar] of Object.entries(src)) {
    for (const a of aliases.split("|")) {
      const k = key(a);
      if (!k) continue;
      exact.set(k, ar);
      // Short one-word aliases ("far", "nice", "roma") only match exactly.
      if (k.includes(" ") || k.length >= 5) subset.push([k.split(" "), ar]);
    }
  }
  subset.sort((a, b) => b[0].length - a[0].length || b[0].join("").length - a[0].join("").length);
  return { exact, subset };
}

const TEAMS = compile(TEAMS_SRC);
const PLAYERS = compile(PLAYERS_SRC);

function lookup(dict, name, allowSubset) {
  const k = key(name);
  if (!k) return null;
  if (dict.exact.has(k)) return dict.exact.get(k);
  if (!allowSubset) return null;
  const have = new Set(k.split(" "));
  const hit = dict.subset.find(([toks]) => toks.every((t) => have.has(t)));
  return hit ? hit[1] : null;
}

// ── Transliteration (Latin → Arabic) ─────────────────────────────────────

// Common first names / words written the usual Arabic way.
const WORDS = {
  mohamed: "محمد", mohammed: "محمد", muhammad: "محمد", mohammad: "محمد", mehmet: "محمد", mamadou: "مامادو",
  ahmed: "أحمد", ahmad: "أحمد", youssef: "يوسف", yousef: "يوسف", youcef: "يوسف", yusuf: "يوسف",
  yassine: "ياسين", yassin: "ياسين", hamza: "حمزة", ayoub: "أيوب", ismail: "إسماعيل", ismael: "إسماعيل",
  ibrahim: "إبراهيم", brahim: "إبراهيم", omar: "عمر", oumar: "عمر", ali: "علي", hassan: "حسن",
  hussein: "حسين", houssein: "حسين", karim: "كريم", mehdi: "مهدي", anas: "أنس", zakaria: "زكرياء",
  zakariya: "زكرياء", soufiane: "سفيان", sofiane: "سفيان", sofian: "سفيان", oussama: "أسامة", ousama: "أسامة",
  reda: "رضا", adam: "آدم", amine: "أمين", amin: "أمين", achraf: "أشرف", ashraf: "أشرف", said: "سعيد",
  rachid: "رشيد", khalid: "خالد", khaled: "خالد", jamal: "جمال", nabil: "نبيل", walid: "وليد",
  younes: "يونس", younesse: "يونس", ilias: "إلياس", ilyas: "إلياس", elias: "إلياس", badr: "بدر",
  tarik: "طارق", tarek: "طارق", tariq: "طارق", hicham: "هشام", noureddine: "نور الدين",
  salaheddine: "صلاح الدين", mustapha: "مصطفى", mustafa: "مصطفى", mostafa: "مصطفى",
  abdellah: "عبد الله", abdallah: "عبد الله", abdullah: "عبد الله", imad: "عماد", adil: "عادل",
  fahd: "فهد", marouane: "مروان", marwane: "مروان", marwan: "مروان", houssam: "حسام", hossam: "حسام",
  aymen: "أيمن", aymane: "أيمن", ayman: "أيمن", saad: "سعد", othmane: "عثمان", othman: "عثمان",
  ousmane: "عثمان", yahya: "يحيى", yahia: "يحيى", mohcine: "محسن", mouhcine: "محسن", mounir: "منير",
  salim: "سليم", selim: "سليم", bilal: "بلال", hamid: "حميد", hakim: "حكيم", mahmoud: "محمود",
  abdou: "عبدو", issa: "عيسى", moussa: "موسى", musa: "موسى", idrissa: "إدريسا", driss: "إدريس",
  idriss: "إدريس", jalal: "جلال", zouhair: "زهير", nordin: "نور الدين",
  aziz: "عزيز", abdelaziz: "عبد العزيز", abdelkarim: "عبد الكريم", abderrahim: "عبد الرحيم",
  abderrahmane: "عبد الرحمن", abdelhak: "عبد الحق", abdelilah: "عبد الإله", abdessamad: "عبد الصمد",
  abdelhamid: "عبد الحميد", abdelali: "عبد العالي", abdeljalil: "عبد الجليل", abdelmounaim: "عبد المنعم",
  ben: "بن", ibn: "بن", bin: "بن", ait: "آيت", ould: "ولد", abou: "أبو", abu: "أبو",
  junior: "جونيور", jr: "جونيور", da: "دا", dos: "دوس", van: "فان", von: "فون", der: "دير", den: "دين",
  // team words
  united: "يونايتد", city: "سيتي", town: "تاون", real: "ريال", athletic: "أتلتيك", atletico: "أتلتيكو",
  sporting: "سبورتينغ", olympique: "أولمبيك", olympic: "أولمبيك", union: "يونيون", racing: "راسينغ",
  stade: "ستاد", rovers: "روفرز", wanderers: "واندررز", stars: "ستارز", fc: "إف سي",
};

// Article prefixes written attached to the next word: "El Kaabi" → "الكعبي".
const ARTICLES = new Set(["el", "al", "en", "es", "er", "ez", "et", "ed", "ech", "ad", "an"]);

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

// Longest-first Latin chunks.
const CHUNKS = [
  ["sch", "ش"], ["wh", "و"], ["tch", "تش"], ["dj", "ج"], ["sh", "ش"], ["ch", "ش"], ["kh", "خ"], ["gh", "غ"],
  ["th", "ث"], ["dh", "ذ"], ["ph", "ف"], ["ck", "ك"], ["qu", "ك"], ["ou", "و"], ["oo", "و"],
  ["ee", "ي"], ["ie", "ي"], ["aa", "ا"], ["ai", "اي"], ["ay", "اي"], ["ei", "اي"], ["ey", "اي"],
  ["oi", "وا"], ["tz", "تس"], ["zz", "تز"], ["nh", "ني"], ["lh", "لي"], ["gn", "ني"],
];

const SINGLE = {
  a: "ا", b: "ب", d: "د", e: "ي", f: "ف", h: "ه", i: "ي", j: "ج", k: "ك", l: "ل", m: "م", n: "ن",
  o: "و", p: "ب", q: "ق", r: "ر", s: "س", t: "ت", u: "و", v: "ف", w: "و", x: "كس", y: "ي", z: "ز",
};

const INITIAL = { a: "أ", e: "إ", i: "إ", o: "أو", u: "أو", ou: "أو", ai: "أي", ay: "أي", ei: "إي", ee: "إي", aa: "آ" };

function translitWord(w) {
  w = w.replace(/ñ/g, "ny").replace(/ç/g, "s");
  w = fold(w).replace(/[^a-z]/g, "");
  if (!w) return "";
  if (WORDS[w]) return WORDS[w];
  // "Abdel…/Abdul…" → "عبد ال…"
  const abd = w.match(/^ab(?:d|del|dal|dul|dou)(?=[a-z]{3,})/);
  if (abd && /^abd(?:el|al|ul)/.test(w)) return `عبد ال${translitWord(w.replace(/^abd(?:el|al|ul)/, "")).replace(/^[أإ]/, "ا")}`;

  let out = "";
  let i = 0;
  while (i < w.length) {
    const rest = w.slice(i);
    let piece = null;
    let len = 1;

    if (i === 0) {
      for (const k of ["ou", "ai", "ay", "ei", "ee", "aa"]) {
        if (rest.startsWith(k)) { piece = INITIAL[k]; len = k.length; break; }
      }
      if (!piece && INITIAL[rest[0]] && rest[0] !== "y") { piece = INITIAL[rest[0]]; len = 1; }
    }
    if (!piece) {
      for (const [k, v] of CHUNKS) {
        if (rest.startsWith(k)) { piece = v; len = k.length; break; }
      }
    }
    if (!piece) {
      const c = rest[0];
      const next = rest[1] || "";
      if (c === "c") piece = "eiy".includes(next) && next ? "س" : "ك";
      else if (c === "g") piece = "ei".includes(next) && next ? "ج" : "غ";
      else if (c === rest[1] && !VOWELS.has(c)) { i++; continue; } // double consonant → once
      else piece = SINGLE[c] || "";
    }
    out += piece;
    i += len;
  }
  // final "h" after a vowel is usually silent-ish: "Hamzah" → "حمزة"-like
  out = out.replace(/اه$/, "ة");
  return out;
}

function translit(name = "") {
  const parts = String(name).trim().split(/[\s\-–']+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const w = fold(parts[i]).replace(/[^a-z0-9.]/g, "");
    if (/^\d+$/.test(w)) { out.push(w); continue; }
    if (/^[a-z]\.$/.test(w)) { out.push(translitWord(w[0])); continue; } // initials "J."
    if (ARTICLES.has(w) && i + 1 < parts.length) {
      const nxt = translitWord(parts[++i]).replace(/^[أإآ]/, "ا");
      out.push(`ال${nxt}`);
      continue;
    }
    out.push(translitWord(parts[i]));
  }
  return out.filter(Boolean).join(" ");
}

// ── Public API ───────────────────────────────────────────────────────────

function teamAr(name = "") {
  if (!name || /^tbd$/i.test(name)) return "يحدد لاحقا";
  return lookup(TEAMS, name, true) || translit(name);
}

function playerAr(name = "") {
  if (!name) return "";
  return lookup(PLAYERS, name, false) || translit(name);
}

/** Adds nameAr to a { id, name, logoUrl } team object. */
const withAr = (t) => ({ ...t, nameAr: teamAr(t.name) });

const POSITIONS = {
  goalkeeper: "حارس مرمى", defender: "مدافع", midfielder: "لاعب وسط", forward: "مهاجم",
  attacker: "مهاجم", striker: "مهاجم", winger: "جناح", "centre back": "قلب دفاع", "center back": "قلب دفاع",
  "left back": "ظهير أيسر", "right back": "ظهير أيمن", "defensive midfield": "وسط دفاعي",
  "central midfield": "وسط ميدان", "attacking midfield": "وسط هجومي", "left winger": "جناح أيسر",
  "right winger": "جناح أيمن", "centre forward": "رأس حربة", "center forward": "رأس حربة",
  "left wing": "جناح أيسر", "right wing": "جناح أيمن", manager: "مدرب", coach: "مدرب",
};
const positionAr = (p = "") => POSITIONS[words(p).join(" ")] || p;

const STATS = {
  "ball possession": "الاستحواذ", "total shots": "مجموع التسديدات", "shots on goal": "تسديدات على المرمى",
  "shots on target": "تسديدات على المرمى", "shots off goal": "تسديدات خارج المرمى",
  "shots off target": "تسديدات خارج المرمى", "blocked shots": "تسديدات مصدودة",
  "shots insidebox": "تسديدات من داخل المنطقة", "shots outsidebox": "تسديدات من خارج المنطقة",
  "corner kicks": "الركنيات", corners: "الركنيات", offsides: "التسلل", fouls: "الأخطاء",
  "yellow cards": "البطاقات الصفراء", "red cards": "البطاقات الحمراء", "goalkeeper saves": "تصديات الحارس",
  "total passes": "مجموع التمريرات", "passes accurate": "تمريرات صحيحة", "passes %": "نسبة دقة التمريرات",
  "expected goals": "الأهداف المتوقعة", "expected goals xg": "الأهداف المتوقعة", "free kicks": "الضربات الحرة",
  "throw ins": "رميات التماس", "goal kicks": "ضربات المرمى", tackles: "الافتكاكات",
};
const statAr = (label = "") => STATS[words(label).join(" ")] || label;

module.exports = { teamAr, playerAr, leagueAr, withAr, positionAr, statAr, translit, LEAGUES };
