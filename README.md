# 🐚 Morski Boj

Igrica v slogu klasičnega Breakout, tokrat s podvodsko tematiko. Igraj kot biser, podri bloke in poišči skrinjico!

---

## 🎮 Kako igrati

- Pritisni **A** za premik ploščice v levo
- Pritisni **D** za premik ploščice v desno
- Odbijaj žogico (biser) navzgor, da zadeneš bloke
- Ko zadaneš **skrinjico** — zmagaš!
- Če žogica pade na tla — igra je končana

---

## 🕹️ Gumbi

| Gumb | Opis |
|------|------|
| Začni igro | Zažene novo igro |
| Ponastavi igro | Ustavi igro in prikaže začetni zaslon |
| Pavza / Nadaljuj | Zamrzne in nadaljuje igro |

---

## 🧱 Bloki

Bloki so razporejeni v 5 vrstic. Vsaka vrstica ima drugačno trdoto — zgornji bloki potrebujejo več zadetkov:

| Vrstica | Zadetki za uničenje |
|---------|---------------------|
| 1. (zgoraj) | 5 |
| 2. | 4 |
| 3. | 3 |
| 4. | 2 |
| 5. (spodaj) | 1 |

---

## 🏆 Lestvica

Rezultati se shranijo lokalno v brskalnik (`localStorage`). Lestvica prikazuje top 10 rezultatov, razvrščenih po točkah (urejanje z vstavljanjem).

---

## 📁 Struktura projekta

```
bricks-main/
├── index.html          # Glavna stran
├── css/
│   └── style.css       # Videz igre
├── js/
│   ├── script.js       # Logika igre
│   ├── alerts.js       # SweetAlert2 sporočila (zmaga / konec igre)
│   └── jquery.js       # jQuery knjižnica
├── img/
│   ├── bubble.png      # Slika mehurčka
│   └── chest.png       # Skrinjica (cilj igre)
└── README.md
```

---

## 🛠️ Tehnologije

- HTML5 Canvas
- JavaScript (jQuery)
- [SweetAlert2](https://sweetalert2.github.io/) — lepa opozorila
- Google Fonts — pisava *Cinzel*
- localStorage — shranjevanje rezultatov

