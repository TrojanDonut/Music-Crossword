# Projektni plan: Glasbena križanka

## Cilj
- Spletna aplikacija, kjer uporabnik v križanko vpisuje note (12 tonov v referenčni oktavi) in rešuje geslo z prepoznavanjem melodij.
- Poudarek na poslušanju, enostavnem vnosu tonov in igrifikaciji učenja.

## Ključne funkcionalnosti
- **Baza motivov**: zbiranje motivov iz javnih korpusov (Lakh, Mutopia, Essen, GiantMIDI, MuseScore, ABC arhivi), normalizacija v zaporedja tonov ene oktave, shranjevanje v SQLite/PostgreSQL.
- **Generator križank**: prilagoditev crossword algoritmov, razporejanje notnih motivov, začetni ton kot namig, nadzor nad smiselnostjo križanj.
- **Uporabniški vmesnik**: SvelteKit, vizualna mreža, izbira ene od 12 not, predvajanje tona ob kliku, prikaz napredka in povratnih informacij.
- **Avdio plast**: Web Audio API (po potrebi Tone.js ali soundfont-player) za sintetizacijo in predvajanje motivov, uvoz MusicXML/MIDI/ABC z obstoječimi knjižnicami (`tonal`, `abcjs`).
- **Strežniški del**: endpoints za preverjanje rešitev, shranjevanje ugank in napredka, API za podatke in konfiguracijo ugank.
- **Gostovanje**: ciljna platforma Okeanos, konfiguracija prilagodljiva glede na končne potrebe.

## Arhitektura podatkov in algoritma
- Struktura podatkov se oblikuje neposredno iz zahtev algoritma za križanke; podatkovni model mora omogočati hitro transponiranje, primerjavo motivov in generiranje križišč.
- Normalizirani motivi bodo vsebovali:
  - zaporedje tonov (12-tonska kromatika, indeksirana za referenčno oktavo),
  - metapodatke (vir, tonaliteta, licenca, opis gesla),
  - morebitne alternative ali delne motive za fleksibilnost generiranja.
- Algoritem za križanko potrebuje:
  - API za pridobivanje kandidatov motivov glede na dolžino in kompatibilnost tonov,
  - hitre operacije za preverjanje križišč (ujemanje tonov v transponirani obliki),
  - možnost predvajanja posameznih tonov ob generiranju (za testiranje) in v UI.
- Zaradi tesne povezanosti bo razvoj potekal iterativno: vsaka izboljšava algoritma bo sprožila revizijo sheme podatkov (npr. dodatna polja za težavnost, lokacije križišč ali ritmične vzorce).

## Implementacijski koraki
1. **Podatkovna baza**:
   - Osnovni vir bo zbirka Essen Folksong (monofoni motivi, javna domena); pripravimo ETL skripto za ABC/MusicXML → JSON/CSV, kasneje dodamo Mutopia in GiantMIDI.
   - Normalizacija v referenčno oktavo: shranimo `pitch_sequence` (12-tonska kromatika), `interval_profile`, `length`, `allowed_transpositions`, `difficulty`, `source_dataset`, `license`, `descriptor`, `audio_preview` (MIDI/OGG), `tags`.
   - Shema (SQLite za MVP) z relaciono tabelo `motifs`, `sources`, `tags`, in `motif_tags`; indeksiramo po dolžini in prvem/končnem tonu za hitro filtriranje.
   - Uvozne skripte (Python) obdelajo datoteke, validirajo podatke, generirajo checksum in pripravijo seed podatke za backend/API.
2. **Algoritem križanke**:
   - Izberemo MIT odprtokodni `crossword-layout` (Node) kot osnovo; vhod je seznam `{ id, answer, clue }`, kjer `answer` postane niz not (npr. `C# D E F#`).
   - Razširimo generator z adapterjem, ki prejme JSON iz baze, odstrani nepotrebne metapodatke in doda vezane koordinate ali začetne tone kot namige.
   - Dodamo modul za validacijo križišč (ujemanje tonov in intervalov), simuliramo generacijo na testnih motivih, shranimo mreže in koordinate v bazo.
   - Pripravimo API/skripto za batched generiranje, ki vrača layout + referenco na `motif_id`, kar UI uporabi za prikaz, predvajanje in spremljanje napredka.
3. **MVP**: osnovni UI v SvelteKit, vizualizacija mreže, vnos not, poslušanje posameznih tonov, strežniško preverjanje pravilnosti.
4. **Izboljšave UX & funkcionalnosti**: napredne povratne informacije, shranjevanje napredka, boljša navigacija po uganki, morebitna transpozicija za uporabnike.
5. **Vrednotenje in iteracija**: SUS vprašalnik, kratke ankete, zbiranje povratnih informacij, iterativne izboljšave algoritma in baze.

## Testiranje in validacija
- **Avtomatsko**:
  - enotski testi transponiranja in primerjave notnih nizov,
  - testi generatorja (preverjanje pravilnosti križišč, validnost generiranih mrež),
  - API testi strežniških endpointov.
- **Ročno**:
  - UX preizkusi vnosov in poslušanja tonov,
  - validacija algoritma z znanimi motivi,
  - preizkusi različnih naprav/brskalnikov.
- **Uporabniško vrednotenje**:
  - SUS vprašalnik, zbiranje odzivov prijateljev in svojcev,
  - beleženje glavnih težav in iterativno odpravljanje.

## Odvisnosti in tveganja
- Licenciranje in razpoložljivost motivov iz različnih korpusov.
- Kompleksnost prilagoditve generatorja križank za note in potreba po tesnem usklajevanju podatkovne sheme.
- Performančni izzivi pri predvajanju zvoka in generiranju večjih mrež znotraj brskalnika.
- Možnost zamenjave tehnologij (npr. zamenjava baze ali avdio knjižnice) – zasnova mora ostati prilagodljiva in modularna.

Plan služi kot referenčni dokument za celoten projekt; vsako odstopanje dokumentiramo in sproti posodobimo načrt.

