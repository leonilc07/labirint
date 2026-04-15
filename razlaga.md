# Razlaga enačbe za odboj žogce od ploščice

```javascript
dx = 8 * ((x - (paddlex + paddlew / 2)) / paddlew)
```

Formula izračuna nov vodoravni kot odboja glede na to, **kje na ploščici** je žogca zadela.

---

## Korak po korak

### 1. `paddlex + paddlew / 2` → sredina ploščice
```
paddlex = 100, paddlew = 75  →  sredina = 100 + 37.5 = 137.5
```

### 2. `x - (paddlex + paddlew / 2)` → razdalja od sredine
- žogca zadane **levo od sredine** → negativna vrednost (npr. `-30`)
- žogca zadane **točno na sredini** → `0`
- žogca zadane **desno od sredine** → pozitivna vrednost (npr. `+30`)

### 3. `/ paddlew` → normalizacija na razpon `[-0.5, +0.5]`

Vrednost se deli s širino ploščice, da dobimo delež:

    (x - sredina) / paddlew  ∈  [-0.5, +0.5]

### 4. `* 8` → povečanje na razpon `[-4, +4]`

Končni `dx` je torej med `-4` in `+4`.

---

## Primer s ploščico širine 75

| Mesto zadetka  | dx           |
|----------------|--------------|
| Levi rob       | ≈ -4 (gre močno levo)  |
| Leva četrtina  | ≈ -2         |
| Sredina        | ≈  0 (gre naravnost)   |
| Desna četrtina | ≈ +2         |
| Desni rob      | ≈ +4 (gre močno desno) |
