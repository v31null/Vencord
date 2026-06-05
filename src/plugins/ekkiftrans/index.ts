import definePlugin from "@utils/types";
import { count } from "console";

declare const propertime: any;
export default definePlugin({
    name: "Algíhíili ekta’kíf",
    description: "Algíhíili",
    authors: [{ name: "V31NULL", id: 1108761945303158784n }],

    start() {
        const timeScript = document.createElement("script");
        timeScript.src =
            "https://cdn.jsdelivr.net/gh/v31null/V0309S@main/time.js";
        document.head.appendChild(timeScript);
        const style = document.createElement("style");
        style.id = "ek-kif-css";
        style.textContent = `
        .timestamp_c19a55.latin12CompactTimeStamp_c19a55 {
            width: 3.25rem !important;
        }
    `;
        document.head.appendChild(style);
        const monthMap = {
            "tammik.": "01",
            "helmik.": "02",
            "maalisk.": "03",
            "huhtik.": "04",
            "toukok.": "05",
            "kesäk.": "06",
            "heinäk.": "07",
            "elok.": "08",
            "syysk.": "09",
            "lokak.": "10",
            "marrask.": "11",
            "jouluk.": "12",
            tammikuu: "01",
            helmikuu: "02",
            maaliskuu: "03",
            huhtikuu: "04",
            toukokuu: "05",
            kesäkuu: "06",
            heinäkuu: "07",
            elokuu: "08",
            syyskuu: "09",
            lokakuu: "10",
            marraskuu: "11",
            joulukuu: "12",
            tammikuuta: "01",
            helmikuuta: "02",
            maaliskuuta: "03",
            huhtikuuta: "04",
            toukokuuta: "05",
            kesäkuuta: "06",
            heinäkuuta: "07",
            elokuuta: "08",
            syyskuuta: "09",
            lokakuuta: "10",
            marraskuuta: "11",
            joulukuuta: "12",
        };
        const replacements = [
            {
                repA: "Yli $n uutta viestiä $d.$d.$d klo $n.$n lähtien",
                repB: "NEW_MSG_OVER",
            },
            {
                repA: "$n uutta viestiä klo $n.$n $ampm lähtien",
                repB: "NEW_MSG_TIME_ONLY",
            },
            {
                repA: "$n uutta viestiä klo $n.$n lähtien",
                repB: "NEW_MSG_TIME_ONLY",
            },
            {
                repA: "$n uusi viesti klo $n.$n $ampm lähtien",
                repB: "NEW_MSG_TIME_ONLY_S",
            },
            {
                repA: "$n uusi viesti klo $n.$n lähtien",
                repB: "NEW_MSG_TIME_ONLY_S",
            },
            {
                repA: "Yli $n uutta viestiä $d. $month $d klo $n.$n lähtien",
                repB: "NEW_MSG_OVER",
            },
            {
                repA: "$n uutta viestiä $d. $month $d, klo $n.$n lähtien",
                repB: "NEW_MSG_PLURAL",
            },
            {
                repA: "$n uusi viesti $d. $month $d, klo $n.$n lähtien",
                repB: "NEW_MSG_SINGULAR",
            },

            {
                repA: "Tästä näet toimintasi edellisen 30 päivän ajalta.",
                repB: "Híran kùtn ič Buztn uù’rùmän\u00A0, fùțùz uù’RŻG ùzan 30-on\u00A0gífas.",
            },
            { repA: "eilen klo $n.$n", repB: "TIME_ONLY" },
            { repA: "$d.$d.$d $n.$n", repB: "DATE_TIME" },
            { repA: "$d.$d.$d", repB: "DATE_STRICT" },
            { repA: "$d.$d.$d.", repB: "DATE_STRICT" },
            { repA: "$d. $month $d", repB: "DATE_TEXT" },

            {
                repA: "Lisää tuotteita tähän selaamalla kauppaa ja napauttamalla kiinnostavien tuotteiden sydänkuvaketta.",
                repB: "Híre kùtn mílksfas uq’merngäs\u00A0, ùír țùra gíh e uù’hasùfía u-ùínaț brčo uù'fùnasùar Nżúùa ekta’merngäs Alríüakahan̈a.",
            },
            {
                repA: "Etsi keskustelu tai aloita se",
                repB: "Pșíč íün̈ iídsùgín ka pștí íün̈",
            },

            { repA: "Kopioi kuva", repB: "Kopií̈ uq’nżúù" },
            { repA: "Tallenna kuva", repB: "Baíbíz uq’nżúù" },
            { repA: "Kopioi linkki", repB: "Kopií̈ uq’línk" },
            { repA: "Avaa linkki", repB: "Tučasa uq’línk" },
            { repA: "Lähetä viesti: ", repB: "Kríb e " },
            {
                repA: "Muistiinpano (näkyy vain sinulle)",
                repB: "Kríbmíin̈a\u00A0—\u00A0Żaúsaíün̈iínt Tae ičbíz",
            },

            {
                repA: "$n uutta viestiä klo $n.$n lähtien",
                repB: "$n‑ùns Síntùns naíkríbas ùzan $n:$n",
            },
            {
                repA: "$n uusi viesti klo $n.$n lähtien",
                repB: "$n Síntù naíkríb ùzan $n:$n",
            },
            {
                repA: "Lisää muistiinpano klikkaamalla",
                repB: "Brčo híre\u00A0, Úír mílksfas íün̈ kríbmíin̈a",
            },
            { repA: "👋  Heiluta", repB: "Gùtíteh" },
            { repA: "Heiluta käyttäjälle", repB: "Gùtíteh e uù’kípaman" },

            { repA: "Kuva", repB: "Nżúù" },
            { repA: "kuva", repB: "nżúù" },
            { repA: "video", repB: "úidío" },
            { repA: "linkki", repB: "línk" },
            { repA: "tiedosto", repB: "alkarí" },
            { repA: "upotus", repB: "baíraznga" },
            { repA: "Viesti sisältää", repB: "Naíkríb gbrù" },
            { repA: "ääni", repB: "koían" },
            { repA: "kysely", repB: "almaníren" },
            { repA: "tarra", repB: "maíagon̈ga" },
            { repA: "välitä", repB: "alsíünù" },

            { repA: "Lähettänyt", repB: "Gùsíünùín bze" },
            { repA: "Maininta käyttäjästä", repB: "Úrmíț uùtí’kípaman" },
            { repA: "Nyt on hiljaista", repB: "Ríkíùsa níe uùtí’koían" },
            {
                repA: "Kun joku kaverisi tekee jotain, vaikka alkaa pelaamaan tai aloittaa puhechatin, näytämme sen täällä!",
                repB: "Ùí íün̈ dùrína uùtí’taùík : síù e rùmän , gíheíù e uù’plígna , ka čípgíníù uq’nùa‑raúzù agșpíù brí číraín Tae hír !",
            },

            { repA: "oli minuutin", repB: "Íüù íùsamíin̈a" },
            { repA: "oli tunnin", repB: "Íüù íùsa" },
            { repA: "oli sekunnin", repB: "Íüù íùsačík̈a" },

            { repA: "yhden minuutin", repB: "Íüù íùsamíin̈a" },
            { repA: "yhden tunnin", repB: "Íüù íùsa" },
            { repA: "yhden sekunnin", repB: "Íüù íùsačík̈a" },

            { repA: "oli muutaman", repB: "Daùns" },
            { repA: "muutaman", repB: "Daùns" },

            { repA: "oli ", repB: "" },
            { repA: "Ruudunjakaminen ", repB: "Ekran‑síünùmíț" },

            { repA: "Avaa", repB: "Tučasasa" },
            { repA: "Katkaise yhteys", repB: "Gíhan uùtí’čípgín" },
            { repA: "Jaa näyttösi", repB: "Síünùmíț ekrän" },
            { repA: "Koko näyttö", repB: "Alùznù ekrän" },
            { repA: "Laitteet", repB: "Míțífíiliías" },
            { repA: "Pelaaminen", repB: "Plígna" },
            { repA: "Sulavampi videokuva", repB: "Naíračas úidío" },
            { repA: "Kytke kamera päälle", repB: "Skíafí uq’kamera" },
            { repA: "Liity puheluun", repB: "Mír uù’čípgín" },
            { repA: "Liity videopuheluun", repB: "Mír uù’čípgin Úidía" },
            { repA: "Poista mykistys", repB: "Enraùn̈a" },
            { repA: "Jaa nöyttö", repB: "Síünùmíț uq’ekrän" },
            { repA: "minuutin", repB: "íùsamíin̈äs" },
            { repA: "tunnin", repB: "íùsäs" },
            { repA: "sekunnin", repB: "íùsačík̈äs" },

            { repA: "yhden", repB: "Íüù" },
            { repA: "kahden", repB: "Ínùns" },
            { repA: "kolmen", repB: "Süùns" },
            { repA: "neljän", repB: "Níù̈ns" },
            { repA: "viiden", repB: "Gúùns" },
            { repA: "kuuden", repB: "Banùns" },
            { repA: "seitsemän", repB: "Nanùns" },
            { repA: "kahdeksan", repB: "Ačíùns" },
            { repA: "yhdeksän", repB: "Kíùùns" },
            { repA: "kymmenen", repB: "Żiùns" },
            { repA: "muokattu", repB: "\u00A0Albríní\u00A0" },

            { repA: "Et vastannut käyttäjän", repB: "Íüùítn čípgín bze" },
            { repA: "puheluun", repB: "níh" },
            { repA: "aloitti puhelun", repB: "pștí̈ù íün̈ čípgín" },
            { repA: "jonka kesto", repB: "Síùík bríní" },
            {
                repA: "kiinnitti",
                repB: "gùfírnín",
            },
            { repA: "viestin", repB: "iün̈ naíkríb" },
            { repA: "tähän kanavaan", repB: "e Hírùm čenl̈" },
            {
                repA: "Katso kaikki ",
                repB: " uír nočțùm’iía alùz Fírn̈ga‑naíkríbas",
            },
            { repA: "Lisää suodattimia", repB: "Mílks gríanas" },
            {
                repA: "päivämäärät, laatijan tyyppi ja muuta",
                repB: "grías\u00A0, úan asífù ípmùkman\u00A0,\u00A0&\u00A0mílks",
            },
            { repA: "kiinnitetyt viestit", repB: "Brčo híre\u00A0," },
            { repA: "Yhteydet", repB: "Linkas" },
            { repA: "Jäsen alkaen", repB: "Teíman ùzan" },
            { repA: "Viestitä käyttäjälle", repB: "Naíkríb uù’kípaman" },
            { repA: "Friends since", repB: "Buztn dùrína ùzan" },
            { repA: "Viesti", repB: "Síünù naíkríb" },
            { repA: "Taulu", repB: "Mbrlí" },
            { repA: "Toiminta", repB: "Rùmänas" },
            { repA: "Toivelista", repB: "Míțíf uùtí’íilían" },
            { repA: "Ei yhteisiä kavereita", repB: "Níe Kíùrem dùrínäs" },
            {
                repA: "Ei yhteisiä palvelimia",
                repB: "Níe Kíùrem dùrínașas",
            },
            { repA: "Puhelussa", repB: "Uù’čípgín" },
            { repA: "äänipankki", repB: "maímbrlí uùtí’koían" },
            {
                repA: "Poista video käytöstä",
                repB: "Albrí uq’úidío níh kípabíz",
            },
            { repA: "Näytä vahvistuskoodi", repB: "Ič uq’kod uùtí’baíúrn" },
            {
                repA: "Näytä ilman videokuvaa osallistuvat",
                repB: "Ič uq’míreías níe uù’úidío",
            },
            { repA: "Yksityisviestit", repB: "E alùz níh naíkríbas" },
            { repA: "Kaverit", repB: "Dùrínäs" },
            { repA: "Nitro-aloitussivu", repB: "Hasùfía fùnș nitro" },
            { repA: "Kauppa", repB: "Hasùfía" },
            { repA: "uusi", repB: "sínt" },
            { repA: "Uusi", repB: "Sínt" },
            { repA: "Tehtävät", repB: "Mùmíkas" },
            { repA: "Etsi", repB: "Pșič" },
            {
                repA: "Discord ei näemmä havaitse mitään syötettä mikrofonistasi. Korjataan asia!",
                repB: "Dískort\u00A0, naíičbíz\u00A0, kùnt żenan egíh uùtí’koían baùspr míkrofon̈ uùtí’taùík níh. Kírín Síùíke čírun̈a țùra\u00A0!",
            },
            { repA: "Virhe:", repB: "Fùțfíe\u00A0:" },
            { repA: "Siirry asetuksiin", repB: "Gíh e uù’bímíțíf" },
            {
                repA: "Etsi keskustelu tai aloita se",
                repB: "Pșič íün̈en iídsùgín ka pștí síùíke",
            },
            { repA: "Lisää rooli", repB: "Síünù naíúatas" },
            { repA: "Välitetty", repB: "Alsíünùnga" },
            {
                repA: "Katso liite napsauttamalla",
                repB: "Brčo híre\u00A0, úír ič uq’alagon̈ga",
            },
            { repA: "Kuva", repB: "" },

            { repA: "$n tunniksi", repB: "Úír $n‑țíz íùsäs" },
            { repA: "Yhdeksi tunniksi", repB: "Úír íüíz íùsa" },
            { repA: "$n minuutiksi", repB: "Úír $n‑țíz íùsamíin̈äs" },
            { repA: "$n sekunniksi", repB: "Úír $n‑țíz íùsačík̈äs" },
            { repA: "$n päivää", repB: "Úír $n‑țíz gífas" },
            { repA: "$n viikoksi", repB: "Úír $n‑țíz nan‑gífas" },
            { repA: "$n kuukaudeksi", repB: "Úír $n‑țíz gùżas" },
            { repA: "$n vuodeksi", repB: "Úír $n‑țíz íürínas" },

            { repA: "1\u00A0tunti", repB: "1‑ù íùsa" },
            { repA: "tunti", repB: "íùsa" },
            { repA: "1\u00A0kuukausi", repB: "1‑ù gùż" },
            { repA: "kuukausi", repB: "gùż" },
            { repA: "1\u00A0vuosi", repB: "1-ù íürín" },
            { repA: "vuosi", repB: "íürín" },
            { repA: "1\u00A0päivä", repB: "1‑ù gíf" },
            { repA: "päivä", repB: "gíf" },

            { repA: "Suodattimet", repB: "Gríanas" },
            { repA: "Tietyltä käyttäjältä", repB: "Baùspr uùtí’kípaman" },
            {
                repA: "Sisältää tietyn tyyppisiä tietoja",
                repB: "Gbrù Íüțù karí",
            },
            { repA: "Näytä koko biografia", repB: "Mílks tù̈ramíënsí" },
            { repA: "Muokkaa profiilia", repB: "Albrí Buztn profíl̈" },
            { repA: "sisältää:", repB: "gbrù\u00A0:" },
            {
                repA: "linkki, upotus tai tiedosto",
                repB: "linkas\u00A0, mílksfasngäs\u00A0, ka úíčíras",
            },
            { repA: "Historia", repB: "Atrí" },
            { repA: "Merkitse luetuksi", repB: "Naítíü țùra gùbaíičín" },
            { repA: "käyttäjältä", repB: "uùtí’kípaman" },
            {
                repA: "Sisältää tietyn käyttäjän maininnan",
                repB: "Gbrù ùrmíț íüs kípaman",
            },
            { repA: "käyttäjä", repB: "kípaman" },
            { repA: "maininta:", repB: "ùrmíț\u00A0:" },
            { repA: "VIRALLINEN", repB: "SÍZȚÍ" },
            { repA: "$n kk sitten", repB: "$n gùż an" },
            { repA: "1 t:n maraton", repB: "maraton e 1‑ùn íùsa" },
            { repA: "$n t:n maraton", repB: "maraton e $n‑on íùsäs" },
            { repA: "$n yhteistä kaveria", repB: "$n‑ùns Kíùrùns dùrínäs" },
            { repA: "1 yhteinen kaveri", repB: "1-ù Kíùrù dùrína" },
            {
                repA: "$n yhteistä palvelinta",
                repB: "$n‑ùns Kíùrùns dùrínașas",
            },
            { repA: "1 yhteinen palvelin", repB: "1-ù Kíùrù dùrínaș" },
            { repA: "Käyttäjäasetukset", repB: "Bímíțífas" },
            {
                repA: "Katselet vanhempia viestejä",
                repB: "Ičíarùítn șís naíkríbasas Síümílksena",
            },
            { repA: "Siirry nykyisiin", repB: "Kafui síù síčas" },

            {
                repA: "Mukauta profiiliasi pienoisohjelmilla",
                repB: "Pșgrían Buztn profil̈ ekùa’ùídżetas",
            },
            { repA: "Suosikkipeli", repB: "Ríüakù plígna" },
            { repA: "Minulle mieluiset pelit", repB: "Asgațșùns plígnäs" },
            {
                repA: "Jaa lisätietoja itsestäsi ja kiinnostuksen kohteistasi valitsemalla mieleisesi pienoisohjelmat kirjastostamme",
                repB: "Úír żomíin̈a uù’alùz‑raúzùas fùnș\u00A0: Tíùík\u00A0&\u00A0Buztn ekta’ríüakäs\u00A0, bunenma íün̈en ùídżetas baùspr uùtí’fzíța bze Bzítí‑eaík",
            },
            { repA: "Kierrossa olevat pelit", repB: "Plígnäs ús skíafínga" },
            { repA: "Haluan pelata", repB: "Íilíannga plígnäs" },

            { repA: "Pienoisohjelmat", repB: "Ùídżetas" },
            { repA: "Lisää pienoisohjelma", repB: "Mílksfas íün̈en ùídżetas" },
            { repA: "Lisää peli", repB: "Mílksfas íün̈en plígnäs" },
            {
                repA: "Lisää enintään 5 peliä. Tämä pienoisohjelma ei näy profiilissasi ennen kuin olet lisännyt vähintään Íüù pelin.",
                repB: "Kùtn níh iík 5-ùns plíngäs mílksfas. Hírù ùídżet brí e Buztn une’profíl̈ ičbíz níh\u00A0, ùír albrí țùra mílksfas 1-ùm plígna íüșta uùtí’orahanní.",
            },

            { repA: "Nykyinen toiminta", repB: "Ríkù rùmän" },
            { repA: "Pelaa:", repB: "Plígníù\u00A0:" },
            { repA: "Katselee:", repB: "Očií̈aríù\u00A0:" },
            { repA: "Äskettäinen toiminta", repB: "E atrí rùmän" },
            { repA: "Lisätietoja", repB: "Baíič míčas" },

            {
                repA: "Ei sydämiä vielä",
                repB: "Gùríüakaín íün̈en ùanlíùbäs níh",
            },
            { repA: "Tutustu kauppaan", repB: "Pșič e une’hasùfía" },

            { repA: "$n jäsentä", repB: "$n‑ùns teímanas" },
            { repA: "1 jäsentä", repB: "1‑ù teíman" },

            {
                repA: "Teillä ei ole mitään yhteisiä palvelimia",
                repB: "Kíùrùns dùrínașas ús íntí\u00A0: Síùíke\u00A0&\u00A0Tae síù níh.",
            },
            {
                repA: "Teillä ei ole yhtään yhteistä kaveria",
                repB: "Kíùrù dùrína ús gbrù\u00A0: Síùíke\u00A0&\u00A0Tae síù níh.",
            },
            {
                repA: "Yhteisten palvelimien lista: tyhjä mutta potentiaalin täyttämä",
                repB: "Maímíțíf ekta'dùrínașas Kíùra\u00A0: Hír așíníh ígù ídinem Mílksín kùntbízuana",
            },
            {
                repA: "Kaveriverkkojen multiversumi havaittu – on crossover-jakson aika! 🎬",
                repB: "Gùičín multí‑úërs ekta’Alserețú‑dùrínäs\u00A0—\u00A0eq’íùsa uùtí’Kros̈öúr̈‑ùzmíin̈a\u00A0! 🎬",
            },

            { repA: "Siirry palvelimelle", repB: "Mír uù’dùrínaș" },
            { repA: "Luotu tammi ", repB: "Ípmùknga e une’" },
            { repA: "1 paikalla", repB: "1‑ù aldarbíz" },
            { repA: "$n paikalla", repB: "$n‑ùns aldarbízas" },
            { repA: "Paikalla", repB: "Aldarbíz" },
            { repA: "Kaikki", repB: "Alùz" },
            { repA: "Implicit", repB: "Implicit" },
            { repA: "Odottaa", repB: "E fùečmíț" },
            { repA: "Lisää kaveri", repB: "Mílksfas șís dùrínäs" },
            { repA: "Aktiivisena nyt", repB: "E une’rùmän rík" },

            {
                repA: "Kavereitasi ei ole tällä hetkellä online-tilassa. Tarkista tilanne myöhemmin!",
                repB: "Buztn dùrínäs ríkíùsa aldarbíz níh. Tù̈ramíënsí uù’bítemír așpí̈ùsa\u00A0!",
            },

            { repA: "Muokkaa viestiä", repB: "Albrí uù’naíkríb" },
            { repA: "Vastaa", repB: "Sùgínunna" },
            { repA: "Välitä", repB: "Alsíünù" },
            { repA: "Kiinnitä viesti", repB: "Fírnafí" },
            { repA: "Sovellukset", repB: "Maíțúčmíțas" },
            {
                repA: "Merkitse lukemattomaksi",
                repB: "Naíțíü líùba gùbaíičín níh",
            },
            { repA: "Kopioi viestilinkki", repB: "Kopií̈ uq’línk" },
            { repA: "Poista viesti", repB: "Naù uq’naíkríb" },

            { repA: "Ei paikalla", repB: "Aldarbízmení" },
            { repA: "Toimeton", repB: "E șírt" },
            { repA: "Näkymätön", repB: "Așíičùnna" },
            { repA: "Pysyvästi", repB: "Íbùntíint" },
            { repA: "Vaihda tilejä", repB: "Alulti șís kípamanas" },
            { repA: "Älä häiritse", repB: "Oțmom Eaí níh" },

            { repA: "Profiili", repB: "Profil̈" },
            { repA: "Puhelu", repB: "Čípgín" },
            { repA: "Lisää muistiinpano", repB: "Mílksfas íün̈en kríbmíin̈a" },
            { repA: "Pin DMs", repB: "Fírnafí uq’EANN" },
            { repA: "Sulje yksityisviesti", repB: "Úlfí uq’EANN" },
            { repA: "Kutsu palvelimelle", repB: "Síünùe uù’dùrínaș" },
            { repA: "Poista kaveri", repB: "Naù uùtí’dùrínäs" },
            { repA: "Hylkää", repB: "Brí dùrína níh" },
            { repA: "Estä", repB: "Mùínän" },
            { repA: "Mykistä", repB: "Enra" },
            {
                repA: "Kunnes otan sen uudelleen käyttöön",
                repB: "Enra bíùz ùí íilíanșùn",
            },

            { repA: "Näkyy vain sinulle", repB: "Żaúsaíün̈ínt așíič Tae" },
            { repA: "Hallinnoi tilejä", repB: "Naíeplík șís maímíțífas" },
            {
                repA: "Et saa työpöytäilmoituksia",
                repB: "bítn alșíżzí une’Čír‑mbrlí níh",
            },
            {
                repA: "Näyt offline-tilassa olevana",
                repB: "Ihrtí Tae líùba Taùík aldarbízmení",
            },

            { repA: "Trendaavat GIFit", repB: "GIFas ús kùmmínunnaín" },
            { repA: "GIFit", repB: "GIFas" },
            { repA: "Tarrat", repB: "Maíagon̈ga" },
            { repA: "Emoji", repB: "Emożi" },
            { repA: "Pșič Tenorista", repB: "Pșič uù’tenora" },
            { repA: "Suosikit", repB: "Ríüakangäs" },

            { repA: "", repB: "" },
            { repA: "", repB: "" },
            { repA: "", repB: "" },
        ];

        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }

        const compiledReplacements = replacements.map((r) => {
            let pattern = escapeRegExp(r.repA);
            pattern = pattern.replace(/[ \u00A0]/g, "[\\s\\u00A0]+");

            if (r.repB.startsWith("NEW_MSG")) {
                pattern = pattern
                    .replace(/\\\$n/g, "(\\d+)")
                    .replace(/\\\$d/g, "(\\d+)")
                    .replace(/\\\$month/g, "([a-zA-ZäöÄÖ]+\\.?)")
                    .replace(/\\\$ampm/g, "(ap\\.|ip\\.)"); 

                return {
                    regex: new RegExp(pattern, "g"),
                    replacement: r.repB,
                    type: "NEW_MSG_COMPLEX",
                };
            }

            const isTimeOnly = r.repB === "TIME_ONLY";

            const isDateStrict = r.repB === "DATE_STRICT";
            const isDateText = r.repB === "DATE_TEXT";
            const isDateTime = r.repB === "DATE_TIME";

            if (isDateStrict) {
                pattern = pattern.replace(/\\\$d/g, "(\\d{1,4})");
            }

            if (isDateTime) {
                pattern = pattern
                    .replace(/\\\$d/g, "(\\d{1,4})")
                    .replace(/\\\$n/g, "(\\d{1,2})");
            } else if (isDateText) {
                pattern = pattern
                    .replace(/\\\$d/g, "(\\d{1,4})")
                    .replace(/\\\$month/g, "([a-zA-ZäöÄÖ]+\\.?)");
            } else {
                pattern = pattern.replace(
                    /\\\$n/g,
                    "(\\d+(?:[\\s\\u00A0]\\d+)*)"
                );
            }

            return {
                regex: new RegExp(pattern, "g"),
                replacement: r.repB,
                type: isDateStrict
                    ? "DATE_STRICT"
                    : isDateText
                    ? "DATE_TEXT"
                    : isDateTime
                    ? "DATE_TIME"
                    : isTimeOnly
                    ? "TIME_ONLY"
                    : "NORMAL",
            };
        });

        function applyTransform(text) {
            let newText = text;
            for (const item of compiledReplacements) {
                if (item.type === "DATE_STRICT") {
                    newText = newText.replace(
                        item.regex,
                        (match, p1, p2, p3) => {
                            const day = p1.padStart(2, "0");
                            const month = p2.padStart(2, "0");
                            const year = p3;
                            return `${year}/${month}/${day}`;
                        }
                    );
                } else if (item.type === "DATE_TEXT") {
                    newText = newText.replace(
                        item.regex,
                        (match, p1, p2, p3) => {
                            const day = p1.padStart(2, "0");
                            const monthStr = p2.toLowerCase();
                            const year = p3;

                            const monthNum = monthMap[monthStr] || "00";

                            return `${year}/${monthNum}/${day}`;
                        }
                    );
                } else if (item.type === "TIME_ONLY") {
                    newText = newText.replace(item.regex, (match, p1, p2) => {
                        const h = parseInt(p1);
                        const suffix = h >= 12 ? "PM" : "AM";
                        const hour = (h % 12).toString().padStart(2, "0");

                        const ptMin = String(parseInt(p2) + 1).padStart(2, "0");

                        return `TŻG ${hour}:${ptMin}\u00A0${suffix}`;
                    });
                } else if (item.type === "DATE_TIME") {
                    newText = newText.replace(
                        item.regex,
                        (match, p1, p2, p3, p4, p5) => {
                            const day = p1.padStart(2, "0");
                            const month = p2.padStart(2, "0");
                            const year = p3;
                            const h = parseInt(p4);
                            const suffix = h >= 12 ? "PM" : "AM";
                            const hour = (h % 12).toString().padStart(2, "0");
                            const min = p5.padStart(2, "0");
                            return `${year}/${month}/${day} ${hour}:${min}\u00A0${suffix}`;
                        }
                    );
                } else if (item.type === "NEW_MSG_COMPLEX") {
                    newText = newText.replace(
                        item.regex,
                        (match, count, p2, p3, p4, h, m) => {
                            
                            if (item.replacement === "NEW_MSG_TIME_ONLY") {
                                const hourNum = parseInt(p2);
                                let suffix = "AM";
                                
                                if (p4 === "ap." || p4 === "ip.") {
                                    suffix = p4 === "ip." ? "PM" : "AM";
                                } else {
                                    suffix = hourNum >= 12 ? "PM" : "AM";
                                }

                                const hh = (hourNum % 12).toString().padStart(2, "0");
                                
                                const ptMin = String(parseInt(p3) + 1).padStart(2, "0");
                                
                                return `${count}‑ùns Síntùns naíkríbas ùzan ${hh}:${ptMin}\u00A0${suffix}`;
                            }else if (item.replacement === "NEW_MSG_TIME_ONLY_S") {
                                const hourNum = parseInt(p2);
                                let suffix = "AM";
                                
                                if (p4 === "ap." || p4 === "ip.") {
                                    suffix = p4 === "ip." ? "PM" : "AM";
                                } else {
                                    suffix = hourNum >= 12 ? "PM" : "AM";
                                }

                                const hh = (hourNum % 12).toString().padStart(2, "0");
                                
                                const ptMin = String(parseInt(p3) + 1).padStart(2, "0");
                                
                                return `${count}‑ù Síntù naíkríb ùzan ${hh}:${ptMin}\u00A0${suffix}`;
                            }
                            let d, mo, year;
                            if (isNaN(p3)) {
                                d = p2.padStart(2, "0");
                                mo = monthMap[p3.toLowerCase()] || "00";
                                year = p4;
                            } else {
                                d = p2.padStart(2, "0");
                                mo = p3.padStart(2, "0");
                                year = p4;
                            }

                            const hourNum = parseInt(h);
                            const suffix = hourNum >= 12 ? "PM" : "AM";
                            const hh = (hourNum % 12)
                                .toString()
                                .padStart(2, "0");

                            const mm = m.padStart(2, "0");

                            const dateTimeStr = `${year}/${mo}/${d} ${hh}:${mm}\u00A0${suffix}`;

                            if (item.replacement === "NEW_MSG_OVER") {
                                return `Uștara iík ${count}‑em Síntem naíkríbas ùzan ${dateTimeStr}`;
                            } else if (item.replacement === "NEW_MSG_PLURAL") {
                                return `${count}‑ùns Síntùns naíkríbas ùzan ${dateTimeStr}`;
                            } else {
                                return `${count} Síntù naíkríb ùzan ${dateTimeStr}`;
                            }
                        }
                    );
                } else {
                    newText = newText.replace(item.regex, (...args) => {
                        let res = item.replacement;
                        for (let j = 1; j < args.length - 2; j++) {
                            res = res.replace("$n", args[j]);
                        }
                        return res;
                    });
                }
            }
            return newText;
        }

        function handleTextNode(node) {
            if (!node.nodeValue) return;
            if (
                node.parentElement &&
                node.parentElement.classList.contains("akaBadge__488b1")
            ) {
                if (node.nodeValue === "Alias") {
                    node.nodeValue = "Gùíelelaí’iíaín míra : ";
                    return;
                }
            }

            if (node.nodeValue.includes("Katso kaikki")) {
                const splitIndex = node.nodeValue.lastIndexOf("Katso kaikki");

                if (splitIndex > 0) {
                    const secondPart = node.splitText(splitIndex);

                    const linkNode = secondPart.nextSibling;
                    if (
                        linkNode &&
                        linkNode.nodeType === 1 &&
                        linkNode.textContent.includes("viestit")
                    ) {
                        linkNode.parentNode.insertBefore(linkNode, secondPart);
                    }
                } else if (splitIndex === 0) {
                    const linkNode = node.nextSibling;
                    if (
                        linkNode &&
                        linkNode.nodeType === 1 &&
                        linkNode.textContent.includes("viestit")
                    ) {
                        linkNode.parentNode.insertBefore(linkNode, node);
                    }
                }
            }

            const transformed = applyTransform(node.nodeValue);
            if (transformed !== node.nodeValue) {
                node.nodeValue = transformed;
            }
        }
        function handleElement(el) {
            if (el.tagName === "TIME" && el.getAttribute("datetime")) {
                const date = new Date(el.getAttribute("datetime"));
                if (!isNaN(date.getTime())) {
                    const Y = date.getFullYear();
                    const M = String(date.getMonth() + 1).padStart(2, "0");
                    const D = String(date.getDate()).padStart(2, "0");
                    const H = date.getHours();
                    const ampm = H >= 12 ? "PM" : "AM";
                    const H12 = String(H % 12).padStart(2, "0");

                    const Min = String(date.getMinutes() + 1).padStart(2, "0");
                    const Sec = String(date.getSeconds() + 1).padStart(2, "0");

                    const pt = propertime(
                        `${Y}${M}${D}${H12}${Min}${Sec}${ampm}`
                    );
                    const newTime = `${pt.hr}:${pt.min}\u00A0${pt.ampm}`;

                    let child = el.firstChild;
                    while (child) {
                        if (child.nodeType === 3) {
                            let val = child.nodeValue;
                            const timeRegex = /\b\d{1,2}[.:]\d{2}\b/;
                            if (
                                timeRegex.test(val) &&
                                !val.includes("AM") &&
                                !val.includes("PM")
                            ) {
                                val = val.replace(timeRegex, newTime);
                                val = val.replace("eilen klo", "TŻG");
                                child.nodeValue = val;
                            }
                        }
                        child = child.nextSibling;
                    }
                }
            }

            if (el.placeholder) {
                el.placeholder = applyTransform(el.placeholder);
            }
            const aria = el.getAttribute("aria-label");
            if (aria) {
                const transformed = applyTransform(aria);
                if (transformed !== aria)
                    el.setAttribute("aria-label", transformed);
            }
        }

const isEditable = (node: Node | null): boolean => {
    const el = node?.nodeType === 1 ? (node as HTMLElement) : node?.parentElement;
    if (!el) return false;
    return el.tagName === "INPUT" || 
           el.tagName === "TEXTAREA" || 
           !!el.closest('[contenteditable="true"]') || 
           el.isContentEditable;
};

function walk(root) {
    if (!root || isEditable(root)) return; 
    
    if (root.shadowRoot) walk(root.shadowRoot);

    if (root.nodeType === 3) {
        handleTextNode(root);
    } else if (root.nodeType === 1 || root.nodeType === 11) {
        handleElement(root);
        let child = root.firstChild;
        while (child) {
            walk(child);
            child = child.nextSibling;
        }
    }
}

this.observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes) {
            mutation.addedNodes.forEach((node) => {
                walk(node);
            });
        }
        if (mutation.type === "characterData") {
            if (!isEditable(mutation.target)) {
                handleTextNode(mutation.target);
            }
        }
    }
        });

        walk(document.documentElement);
        this.observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        this.interval = setInterval(() => walk(document.body), 2000);
    },

    stop() {
        if (this.observer) this.observer.disconnect();
        if (this.interval) clearInterval(this.interval);
    },
});
