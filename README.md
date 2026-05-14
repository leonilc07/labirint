# labirint

Izdelava igrice Speed Mouse za vajo uporabe JavaScript jezika.

## Ideja

V igrici si miš (Nibbles), ki beži iz laboratorija. Imaš 60 sekund časa, da se prebijta skozi labirint in pobegneš skozi izhod na spodnjem robu. Po labirintu so razpršeni zlati žetoni ur — vsak ti podari dodatnih 10 sekund. Če odštevalnik doseže nič, vrata se zapečatijo in izgubijo.

## Funkcionalnosti

- **Generiran labirint** — labirint je naložen iz SVG datoteke in narisan na HTML canvas elementu
- **Zaznavanje trkov** — igra bere piksle narisanega labirinta za natančno detekcijo zidov
- **Časovnik** — odšteva od 60 sekund; začne teči ob prvem premiku
- **Ure za zbiranje** — 8 ur razporejenimi po labirintu, vsaka doda +10 sekund
- **Lestvica** — 5 najboljših časov shranjenih v `localStorage`
- **Prikaz rešitve** — animirano razkritje rešitvene poti (6 sekund)
- **Nastavitve** — nastavljiva velikost in hitrost miške (zakleni ob začetku igre)
- **Navijači** — animirana množica navijačev pod platnom

## Upravljanje

| Tipka | Akcija |
|-------|--------|
| `W` / `↑` | Gor |
| `S` / `↓` | Dol |
| `A` / `←` | Levo |
| `D` / `→` | Desno |

Dve tipki hkrati omogočata diagonalno gibanje.

## Struktura projekta

```
labirint-main/
├── index.html          # Glavna HTML stran
├── css/
│   └── style.css       # Stiliranje (layout, animacije, paneli)
├── js/
│   ├── character.js    # Logika igre (karakter, trki, časovnik, ure, lestvica)
│   ├── MazeDraw.js     # Risanje labirinta in animacija rešitve
│   └── dialogs.js      # Pojavna okna (intro, navodila, credits)
└── img/
    ├── maze.svg        # Labirint (zidovi + rešitvena pot)
    ├── clock.png       # Ikona ure za zbiranje
    ├── navijac.svg     # Navijač (osnovna poza)
    └── navijacO.svg    # Navijač (alternativna poza)
```

## Tehnologije

- **HTML5 Canvas** — risanje labirinta in karakterja
- **CSS3** — animacije, flexbox layout, CSS spremenljivke
- **Vanilla JavaScript** — vsa logika igre brez zunanjih ogrodij
- **SweetAlert2** — pojavna okna za uvod, zmago in poraz
- **localStorage** — shranjevanje lestvice med sejami
- **Fetch API** — nalaganje SVG labirinta

## Avtor

**Leon Ilc** — 4RA, 3. projektna naloga
