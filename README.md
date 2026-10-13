# Super Magnio

Et bursdagsspill til Magne. Det spilles som de gamle 2D-Mario-spillene, men
foregår der han har levd livet sitt, i den rekkefølgen han har levd det.

En mystisk mann i frakk og hatt har stjålet den røde verktøykassa hans, og
Magnio følger sporene gjennom livet sitt. Folk han møter underveis, gir ham
spor i saken. (Det er Gorm i forkledning. Han trengte verktøyet til en statue.)

1. **Harøya**, der han er født: myr, sau, kirka og kaia i Steinshamn med
   sildetønner og hvalstasjonen. På enden av kaia sluker en hval ham.
   Ved et av husene står en rød stasjonsvogn. Snakker man med den (opp eller
   △), blir det kjøretur rundt øya, sett ovenfra: opp og ned styrer, og veien
   blir smalere og raskere til han kjører utfor. Bilen ruller ned bakken,
   Magnio kryper ut uskadd, og ved siden av ham står en engel. Englevakt!
   Etterpå er man tilbake ved bilen.
2. **I hvalens buk**: ribbein, magesyre og Jonas, som har bodd der en stund.
   Ut kommer man gjennom blåseholet.
3. **Trondheim**: bryggene og Nidarosdomen over elva, universitetet,
   Bakklandet og Lykkens portal, der Tove venter. Hun gir ham boksehansker i
   stedet for sigaren, og brettet slutter når man har pratet med henne.
4. **Heim**: hytta, og to turer over fjorden med sjekta mens makrellen hopper.
5. **Værnes**: flyplassen. Ved gatene velger man Moraira, Praha eller Lillesand
   (trykk opp eller △). Moraira og Praha er valgfrie sideturer der
   leietakerne betaler husleie. Lillesand fører historien videre.
6. **Lillesand**: fra brygga, gjennom sentrum og opp til huset på Blåbæråsen.
   Aslak, Kathinka, Fride, Tellef og Asta er med underveis. Barna sier
   «Beste» og «Farmor».
7. **Finalen** på Blåbæråsen: mannen i frakk venter ved flaggstanga. Det blir
   boksekamp (dukk med venstre eller ned når han varsler slaget, slå med ✕
   eller □ når han er åpen; man taper aldri). Når han går i gulvet, ryker
   forkledningen, og det er Gorm. Et helikopter senker en rytterstatue av
   Magne på hval, med hockeysveis, flagget heises, og hele familien feirer:
   «Gratla med dagen, Magnio!» Til slutt kommer rulleteksten.
8. **Etter rulleteksten**, som i Marvel-filmene: kaka sett ovenfra. Magne
   bestemmer selv hvor stort stykket blir (venstre og høyre, ✕ forsyner seg).
   Vi ser ikke folka rundt bordet, bare det de sier, og jo større stykket blir,
   jo mer overdrevet blir utropene. Stykket kan bli større enn kaka, fatet,
   bordet og til slutt hele Norge. Det gjør ingenting. Til slutt danser
   Magnio og Frodigi til funky musikk, og folk og dyr fra hele spillet kommer
   inn og danser bak dem, mens hvalen nikker og synger med i bakgrunnen.
   Av og til hopper noen inn i munnen på hvalen og blir blåst ut av
   blåsehullet.

Mellom brettene er det et kart over Sør-Norge. Pilene flytter Magnio til
stedet som ligger i den retningen, ✕ reiser dit, og □ viser sporene. Fremgang, kroner og spor
lagres i nettleseren. Legg til `?ny` i adressen for å starte på nytt, og `?stille` for å slå av all
lyd (for eksempel `?ny&stille`).

Spillet er vanlig HTML og JavaScript, uten byggesteg og uten filer som må
lastes ned.

## Kjøre det

```bash
python3 serve.py
```

Åpne deretter http://localhost:8123. `serve.py` er som `python3 -m http.server
8123`, men ber nettleseren om ikke å lagre filene, så en ny innlasting alltid
får med seg siste versjon av alt. I de fleste nettlesere går det også an å
åpne `index.html` direkte.

`?snarvei` i adressen viser en side med lenker rett til hver scene: det
ferdige kartet, hvert brett, boksekampen, finalen, rulleteksten, kaka og
dansen. Fremgangen lagres ikke når man bruker en snarvei. Legg til `?x=150`
for å starte et brett ved kolonne 150, for eksempel `?til=haroya&x=150`. Det er
nyttig når man tester senere deler av brettet.

## Kontroller

| | PlayStation-kontroll | Tastatur (spiller 1) | Tastatur (spiller 2) |
|---|---|---|---|
| Gå | Styrekryss eller venstre spak | Piltaster | A / D |
| Hopp | ✕ eller ○ | Z eller mellomrom | G |
| Snakk med folk | △ eller opp | Pil opp | W |
| Røykring (sigar) eller slag (hansker) | □ eller en skulderknapp | X | H |
| Pause | Options | Enter eller Esc | |

F eller dobbeltklikk gir fullskjerm. M slår musikken av og på.

Spiller 2 blir med når som helst ved å trykke hopp på en kontroll til, og
spiller som Frodigi. Kameraet følger Magnio, og Frodigi hentes tilbake til
ham hvis han blir hengende etter.

## Det som er med

- **Kroner** er mynter. De telles øverst i hjørnet.
- **Sjokolade** gjør Magnio stor.
- **Sigar** gir ham røykringer som tar fiendene. Etter Trondheim blir den
  byttet ut med **boksehansker**, som slår ut en trykkbølge.
- **Konjakk** gjør ham gyllen og uovervinnelig i ti sekunder. "SKÅL!"
- **Regninger**, sinte konvolutter, går rundt overalt. Hopper man på en, er
  den BETALT.
- **Krabber** på brygga. Hopper man på en, trekker den inn beina og kan
  sparkes bortover.
- **Flått** i lyngen på Blåbæråsen, **måker** over Harøya, og **reker** og
  **maneter** inne i hvalen.
- Ett skjult felt har en pengesekk, og én trekasse er full av mynter.
- Brettet slutter ved flaggstanga hans. Flagget heises når han kommer hjem.

## Litt snillere enn originalen

Spillet er justert til å være rausere enn Mario, uten at det står noe om det
i selve spillet:

- Ingen klokke, ingen liv og ingen «game over».
- Faller man i vannet, kommer man opp igjen på siste trygge sted.
- Blir man truffet som liten, mister man opptil 5 kr og blir dyttet litt bakover.
- Et hopp virker en liten stund etter at man har gått utfor en kant, og et
  hopp som trykkes litt for tidlig, blir husket.
- Treffer man hjørnet på en kasse med hodet, glir man forbi.
- Fiendene går sakte, hopp på dem teller selv om de er litt sene, og et
  krabbeskall som glir, skader aldri spillerne.
- Spaken må skyves et godt stykke før den reagerer, og hopp ligger på to knapper.

Tallene står øverst i `src/game.js`.

## Filene

- `src/haroya.js`, `src/hvalen.js`, `src/trondheim.js` og `src/lillesand.js`
  har brettene, med folkene og replikkene deres. Rekkefølgen står i `ORDER`
  øverst i `src/game.js`.
- `src/sprites.js` har all pikselgrafikken, tegnet som tekstrutenett.
- `src/audio.js` har lydeffektene og bakgrunnsmusikken, som er en egen melodi.
- `src/input.js` håndterer tastatur og kontroller.
- `src/game.js` har fysikken, fiendene, historien, kartet og tegningen.
- `src/kjoretur.js` har kjøreturen på Harøya.
- `src/kake.js` har kakescenen etter rulleteksten, og `src/fest.js` dansen
  etter den.
- `IDEER.md` samler idéer til flere minispill.
