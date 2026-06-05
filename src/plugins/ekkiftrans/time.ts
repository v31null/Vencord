
const propertime = (function () {
/**
 * ============================================================================
 *                             PROPERTIME LOGIC
 * ============================================================================
 *
 * This library implements a historically and astronomically flawless time
 * system based on the English calendar transitions and the exact sidereal day.
 *
 * ----------------------------------------------------------------------------
 * 1. THE TIME SYSTEM (01-60 MIN/SEC, 00 HOURS)
 * ----------------------------------------------------------------------------
 * Minutes and seconds run from 01 to 60, NEVER 00.
 * Why? Because they derive from the Latin "pars minuta prima" (first small part)
 * and "pars minuta secunda" (second small part). Because they represent active,
 * physical "laps" or fractions of ongoing time, there is no "zero" lap.
 *
 * Hours, however, represent COMPLETED units of time. Therefore, the hour
 * starts at 00.
 *
 * Example Start of Day: 00:01:01 AM
 *
 * ----------------------------------------------------------------------------
 * 2. THE EXACT DAY (SIDEREAL TIME & NO DRIFT)
 * ----------------------------------------------------------------------------
 * A true standard day is exactly 86,164 seconds long (a Sidereal Day).
 * Because 86,164 seconds translates to 23 hours, 56 minutes, and 4 seconds,
 * the clock does NOT drift. Instead, a standard day ends exactly at:
 *
 *       --> 11:57:04 PM
 *
 * Upon the very next second, it snaps directly to 00:01:01 AM of the next day.
 *
 * Leap seconds are natively inserted:
 * - Mathematical 11-day cycle leap seconds (ending at 11:57:05 PM).
 * - Official scientifically added leap seconds (e.g., Jan 1, 1973) — totals to 11:57:06 PM when applicable.
 *
 * ----------------------------------------------------------------------------
 * 3. HISTORICAL CALENDAR ERAS (N.S. vs O.S.)
 * ----------------------------------------------------------------------------
 * The timeline faithfully tracks England's civil calendar, but recognizes that
 * "New Style" (N.S.) was actually invented by Julius Caesar, not England.
 *
 * ERA 1: Pre-45 A.C. (O.S. - The Ancient Roman Calendar)
 *   - The ancient 10-month calendar. January and February do not exist.
 *   - The year starts in March (Month 01) and ends in December (Month 10).
 *   - December absorbs all remaining days, culminating in the 170-day
 *     December of 46 A.C. ("The Year of Confusion").
 *
 * ERA 2: 45 A.C. to 1154 (N.S. - The Julian Standard)
 *   - Julius Caesar introduces New Style (N.S.).
 *   - 12 standard months, the year legally starts on January 1st.
 *
 * ERA 3: 1155 to 1751 (O.S. - The English Lady Day Shift)
 *   - England shifts the start of the New Year to March 25th.
 *   - This forces a reversion to Old Style (O.S.).
 *   - Transition Year 1154 becomes 448 days long, possessing two Januaries,
 *     two Februaries, and two Marches, because the year 1155 is legally
 *     held back until March 25th.
 *
 * ERA 4: 1752 to Present (N.S. - Return to Sanity)
 *   - England finally returns to New Style (N.S.) and aligns with the
 *     Gregorian solar shift.
 *   - To fix the calendar drift, 11 days are wiped from existence:
 *     1752 09/02 11:57:04 PM (O.S.) immediately ticks over to
 *     1752 09/14 00:01:01 AM (N.S.).
 *
 * ----------------------------------------------------------------------------
 * 4. ABBREVIATIONS & TERMINOLOGY
 * ----------------------------------------------------------------------------
 * A.C. = Ante Christum (Before Christ).
 * A.D. = Anno Domini (In the Year of Our Lord). There is NO Anno Domini support printed after
 *        the A.C. era ends. Positive years are simply raw numbers.
 * O.S. = Old System / Old Style.
 * N.S. = New System / New Style.
 * Month 90 = Winter.
 * Month 91 = Mercedonius (also Intercalaris) is a leap-month 
 *            inserted after Februarius by Roman priests to realign the 
 *            355-day lunar year with the sun. 
 * Month 92 = Intercalaris Prior. The first of two massive extra months Julius 
 *            Caesar shoved between November and December in 46 A.C.
 * Month 93 = Intercalaris Posterior. The second extra month added by Caesar 
 *            to 46 A.C.
 * Z = Zulu time. 
 * J = Japan time.
 * ----------------------------------------------------------------------------
 * 5. DON'Ts
 * ----------------------------------------------------------------------------
 * - DON'T ASSUME minutes and seconds start at 00. They are strictly 01 to 60.
 * - DON'T ASSUME midnight/noon is 12:xx AM/PM. It is strictly 00:xx AM/PM.
 * - DON'T ASSUME this is not a solar clock. It is. Noon is strictly when the sun is at its zenith,
 *   and midnight is strictly when the sun is at its nadir. Because of the exact 86,164-second day,
 *   the clock snaps to these solar points every day without drift.
 * - DON'T ASSUME a day is 86,400 seconds (24 hours). A day is exactly 86,164 
 *   seconds, ending at 11:57:04 PM.
 * - DON'T ASSUME the calendar shift happened in 1582. We are following the 
 *   English civil calendar, meaning the Gregorian 11-day skip happens in 
 *   September 1752, completely ignoring the 1582 Catholic papal decree.
 * - DON'T ASSUME years are zero-padded to 4 digits. Years are dynamic length 
 *   (e.g., year 45 prints as "45", not "0045").
 * - DON'T ASSUME chronological linearity. Days disappear (1752), months 
 *   overlap (1154/1155 Lady Day), and ancient months literally do not exist 
 *   depending on the exact ancient era.
 * - DON'T ASSUME days never exceed 31. While days are now securely parsed as 
 *   strictly 2 digits (December is no longer a bloated 170-day month), ancient 
 *   intercalary months still stretch beyond normal limits. Dies Hiberni (Month 90) 
 *   reaches up to 62 days, Intercalaris Prior (Month 92) is 33 days, and 
 *   Intercalaris Posterior (Month 93) hits 34 days.
 * - DON'T ASSUME days are strictly sequential. They will skip abruptly when 
 *   adding time across the 1752 transition (Sept 2 jumps to Sept 14).
 * - DON'T ASSUME the year started on January 1st. Example: betwixt 1155 and 1751, 
 *   the civil year officially started on March 25th (Lady Day), creating 
 *   "Double Months" (e.g., two Januaries existing inside the civil year 1154).
 * - DON'T ASSUME Month 01 is always January. Before 45 A.C., Month 01 is 
 *   Martius, and Month 10 is December.
 * - DON'T ASSUME time is 9 hours ahead of UTC. System is the UTC. Greenwich Mean Time is
 *   9 hours behind UTC. Center of Time-keeping is Akashi Munipicial Planetarium in Japan.
 * - DON'T ASSUME there is a Year 0. The timeline jumps directly from 1 A.C. 
 *   to Year 1. 
 * - DON'T ASSUME leap seconds only happen when modern scientists say so. 
 *   This system uses a strict mathematical 11-day sidereal cycle that natively 
 *   extends specific days to end at :05 PM, in addition to the official array 
 *   of 20th-century leap seconds.
 * - DON'T ASSUME the parser reads left-to-right. The input string parses the 
 *   fixed 2-digit time and dates from the right, leaving whatever remains on 
 *   the far left as the dynamic year.
 * - DON'T ASSUME an input of 00:01:00 AM is valid. Because seconds run 01-60, 
 *   inputting 00 seconds triggers a mathematical underflow that rolls back to 
 *   the previous day.
 * - DON'T CONFUSE A.C. with A.D. by thinking of it as "After Christ". 
 *   A.C. is in Latin language. It stands for Ante Christum which means Before Christ. 
 *   A.D. stands for Anno Domini which means In the Year of Our Lord.
 * - DON'T ASSUME the system is purely based on the Gregorian, Julian, or Roman 
 *   calendars alone. It is a proleptic, continuous mathematical bridge of all of them.
 * - DON'T ASSUME AM or PM stands for "Before/After Midnight". They are in Latin. 
 *   AM stands for Ante Meridiem which means Before Midday. 
 *   PM stands for Post Meridiem which means After Midday.
 * - DON'T ASSUME N.S. of Julius Caesar is the same as N.S. of England.
 * - DON'T ATTEMPT to get a "year zero" by adding time backwards from 1.
 * - DON'T ATTEMPT to parse the 1154 transition without tagging with O.S. or N.S. 
 *   suffixes. The system needs those suffixes to determine the correct transition.
 * - DON'T ASSUME Ianuarius and Februarius exist all the time. Before 713 A.C. 
 *   (the Romulan calendar), Romans tracked the year from the spring rebirth of 
 *   Martius through to December, but viewed the freezing gap afterward as a dead, 
 *   nameless void. This bleak winter period was deemed completely unworthy of 
 *   menses, so the logic simply dumps these uncounted days into Month 90 
 *   (Dies Hiberni) until Ianuarius and Februarius were finally invented.
 * - DON'T ASSUME 1154 is 365 days long. It is 448 days long.
 * - DON'T ASSUME days drift. They do not. Each day is exactly 86,164 seconds, 
 *   and the clock snaps to the next day at exactly 11:57:04 PM. 
 *   Noon is always 00:01:01 PM, and midnight is always 00:01:01 AM.
 * ----------------------------------------------------------------------------
 * 6. USAGE MANUAL
 * ----------------------------------------------------------------------------
 * 
 * [A] INITIALIZATION
 *   let now = propertime();                           — Grabs current local time
 *   let past = propertime("19390101000101AM");        — Specific exact time
 *   let ancient = propertime("450101000101AM A.C.");  — A.C. time
 * 
 *   String Format required for parsing:
 *   [Year][Month][Day][Hour][Min][Sec][AM/PM][Optional Suffixes]
 *   - Month, Day, Hour, Min, Sec MUST be parsed as exactly 2 digits each.
 *   - Year is variable length, read from right-to-left.
 *   - Suffixes supported: "A.C.", "O.S.", "N.S."
 *   - A.C. gets precedence over O.S./N.S. if both are present.
 * 
 * [B] TIME TRAVEL (ADDING/SUBTRACTING)
 *   Use the .add() method. Negative numbers go backward in time.
 *   
 *   let nextDay = past.add(1, "DAYS");
 *   let lastSec = past.add(-1, "SS");
 * 
 *   Supported Units:
 *   "SS"   : Seconds (Accounts for 86,164s days & leap seconds)
 *   "MM"   : Minutes (Steps by 60s)
 *   "HH"   : Hours (Steps by 3600s)
 *   "DAYS" : Sidereal Days
 *   "WEEK" : 7 Sidereal Days
 *   "MON"  : Months (Dynamically respects 10-month/12-month eras)
 *   "YRS"  : Years (Skips Year 0 correctly)
 *   "DEC"  : Decades (10 Years)
 *   "CEN"  : Centuries (100 Years)
 *   "MIL"  : Millennia (1000 Years)
 * 
 * [C] OUTPUTTING DATA
 *   past.toString();
 *   // Returns: "1939 01⁄01 00:01:01 AM"
 * 
 *   past.toAltFormats();
 *   // Returns Array:["1939/01/01", "1939 january 1", "19390101", etc.]
 * 
 *   past.getMeta();
 *   // Returns Object: { displayYear: "1939", suffix: "" } 
 *   // (Useful for extracting dynamic suffixes like " O.S.")
 * [D] FORMAT
 * Format is ab ovo designt to flow as big→small. Different formats ,
 * e.g./ dd.mm.yyyy or mm/dd/yyyy can be achieved by ProperTime.
 * 
 * ============================================================================
 * NOTE: this is a standard, it can not be copyrighted in any way.
 * It is free for anyone to implement in any programming language,
 * and to use for any purpose, commercial or non-commercial.
 * This replaces ISO 8601 as a new time standard for my-self
 * and for anyone who wants to use it.
 * Trying to copyright this is stupid. Dont waste your time. Just use it.
 */

const UNITS =["SS", "MM", "HH", "DAYS", "WEEK", "MON", "YRS", "DEC", "CEN", "MIL"];
const FS = "\u2044";
const MONTHS_FULL =["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTHS_SHORT =["jan.", "feb.", "mar.", "apr.", "may", "jun.", "jul.", "aug.", "sep.", "oct.", "nov.", "dec."];
const propertime = (function () {
	function pad(n, l = 2) {
		return String(n).padStart(l, "0");
	}

	function prolepticJulianJdn(ay, m, d) {
		let astroY = ay < 0 ? ay + 1 : ay;
		let I = Math.floor((14 - m) / 12);
		let Y2 = astroY + 4800 - I;
		let M2 = m + 12 * I - 3;
		return d + Math.floor((153 * M2 + 2) / 5) + 365 * Y2 + Math.floor(Y2 / 4) - 32083;
	}

	function startOfAncientYear(y) {
		if (y > -46) return 1704987;
		if (y === -46) return 1704542;
		let diff = -46 - y;
		let leaps = Math.floor(-47 / 4) - Math.floor((y - 1) / 4);
		return 1704542 - (diff * 365 + leaps);
	}

	function ymdToJdn(ay, m, d) {
		if (ay <= -46) {
			let jdn = startOfAncientYear(ay);
			let mOrder;

			if (ay <= -713) {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 90];
			} else if (ay === -46) {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 92, 93, 10, 11, 12, 91];
			} else {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 91];
			}

			for (let i = 0; i < mOrder.length; i++) {
				let curM = mOrder[i];
				if (curM === m) break;
				jdn += getDaysInMonth(ay, curM);
			}
			return jdn + (d - 1);
		}
		let jdn = prolepticJulianJdn(ay, m, d);
		let astroY = ay < 0 ? ay + 1 : ay;
		if (astroY > 1752 || (astroY === 1752 && m > 9) || (astroY === 1752 && m === 9 && d >= 14)) {
			let Y2 = astroY + 4800 - Math.floor((14 - m) / 12);
			jdn = d + Math.floor((153 * (m + 12 * Math.floor((14 - m) / 12) - 3) + 2) / 5) + 365 * Y2 + Math.floor(Y2 / 4) - Math.floor(Y2 / 100) + Math.floor(Y2 / 400) - 32045;
		}
		return jdn;
	}

	function jdnToYmd(jdn) {
		if (jdn < 1704987) {
			let Y = -46 - Math.floor((1704542 - jdn) / 365.2425);
			if (Y > -46) Y = -46;

			while (startOfAncientYear(Y) <= jdn) Y++;
			Y--;

			let mStart = startOfAncientYear(Y);
			let mOrder;

			if (Y <= -713) {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 90];
			} else if (Y === -46) {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 92, 93, 10, 11, 12, 91];
			} else {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 91];
			}

			for (let i = 0; i < mOrder.length; i++) {
				let curM = mOrder[i];
				let dim = getDaysInMonth(Y, curM);
				if (jdn < mStart + dim) {
					return { y: Y, m: curM, d: jdn - mStart + 1 };
				}
				mStart += dim;
			}
		}

		let f = jdn + 1401;
		if (jdn > 2361221) f += Math.floor((Math.floor((4 * jdn + 274277) / 146097) * 3) / 4) - 38;
		let e = Math.floor((4 * f + 3) / 1461);
		let g = Math.floor((1461 * e) / 4);
		let h = 5 * (f - g) + 2;
		let D = Math.floor((h % 153) / 5) + 1;
		let M = ((Math.floor(h / 153) + 2) % 12) + 1;
		let Y = e - 4716 + Math.floor((14 - M) / 12);
		return { y: Y <= 0 ? Y - 1 : Y, m: M, d: D };
	}

	function getDaysInMonth(ay, m) {
		if (ay <= -46) {
			if (ay <= -713) {
				if (m === 1 || m === 3 || m === 5 || m === 8) return 31;
				if (m === 2 || m === 4 || m === 6 || m === 7 || m === 9 || m === 10) return 30;
				if (m === 90) {
					let isLeap = ay % 4 === 0;
					return isLeap ? 62 : 61;
				}
				return 0;
			}

			if (m === 1 || m === 3 || m === 5 || m === 8) return 31;
			if (m === 2 || m === 4 || m === 6 || m === 7 || m === 9 || m === 10 || m === 11) return 29;
			if (m === 12) return 28;

			if (m === 91) {
				if (ay === -46) return 23;
				let isLeap = ay % 4 === 0;
				return isLeap ? 11 : 10;
			}
			if (ay === -46) {
				if (m === 92) return 33;
				if (m === 93) return 34;
			}
			return 0;
		}
		let astroY = ay < 0 ? ay + 1 : ay;
		let isGregorian = astroY > 1752 || (astroY === 1752 && m >= 9);

		if (m === 2) {
			let isLeap = isGregorian ? astroY % 4 === 0 && (astroY % 100 !== 0 || astroY % 400 === 0) : astroY % 4 === 0;
			return isLeap ? 29 : 28;
		}
		if ([4, 6, 9, 11].includes(m)) {
			if (astroY === 1752 && m === 9) return 19;
			return 30;
		}
		return 31;
	}

	function _addStep(d, n, unit) {
		let y = parseInt(d.year),
			m = parseInt(d.month),
			day = parseInt(d.day),
			h = parseInt(d.hr);
		if (d.ampm === "PM" && h !== 12) h += 12;
		if (d.ampm === "AM" && h === 12) h = 0;
		let min = parseInt(d.min),
			sec = parseInt(d.sec);

		if (["YRS", "DEC", "CEN", "MIL"].includes(unit)) {
			let addY = n * (unit === "YRS" ? 1 : unit === "DEC" ? 10 : unit === "CEN" ? 100 : 1000);
			let oldY = y;
			y += addY;
			if (oldY < 0 && y >= 0) y += 1;
			if (oldY > 0 && y <= 0) y -= 1;
		} else if (unit === "MON") {
			let step = n > 0 ? 1 : -1;
			let absN = Math.abs(n);
			for (let i = 0; i < absN; i++) {
				m += step;
				let maxM = y <= -46 ? 10 : 12;
				if (m > maxM) {
					m = 1;
					y++;
					if (y === 0) y = 1;
				} else if (m < 1) {
					y--;
					if (y === 0) y = -1;
					m = y <= -46 ? 10 : 12;
				}
			}
		}
		if (["YRS", "DEC", "CEN", "MIL", "MON"].includes(unit)) {
			let maxD = getDaysInMonth(y, m);
			if (day > maxD) day = maxD;
			if (y === 1752 && m === 9 && day > 2 && day < 14) day = 14;
		}

		if (["SS", "MM", "HH", "DAYS", "WEEK"].includes(unit)) {
			let jdn = ymdToJdn(y, m, day);
			let totalSec = sec + (min - 1) * 60 + h * 3600;

			if (unit === "DAYS") jdn += n;
			if (unit === "WEEK") jdn += n * 7;
			
			if (unit === "HH") {
				h += n;
				let addDays = Math.floor(h / 24);
				jdn += addDays;
				h = h % 24;
				if (h < 0) h += 24;
				totalSec = sec + (min - 1) * 60 + h * 3600;
			}

			if (unit === "SS") totalSec += n;
			if (unit === "MM") totalSec += n * 60;

			let tempSec = totalSec - 1;

			function getDayLen(j) {
				let len = 86164;
				if (j % 11 === 0) len += 1;

				let dp = jdnToYmd(j);
				if (dp.m === 1 && dp.d === 1 &&[1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1988, 1990, 1991, 1996, 1999, 2006, 2009, 2017].includes(dp.y)) len += 1;
				else if (dp.m === 7 && dp.d === 1 &&[1972, 1981, 1982, 1983, 1985, 1992, 1993, 1994, 1997, 2012, 2015].includes(dp.y)) len += 1;

				return len;
			}
			while (tempSec >= 86400) {
				tempSec -= 86400;
				jdn++;
			}
			while (tempSec < 0) {
				jdn--;
				tempSec += 86400;
			}
			
			if (tempSec >= getDayLen(jdn)) {
				if (n >= 0) {
					tempSec = 0;
					jdn++;
				} else {
					tempSec = getDayLen(jdn) - 1; 
				}
			}
			while (tempSec < 0) {
				jdn--;
				tempSec += getDayLen(jdn);
			}

			let datePart = jdnToYmd(jdn);
			y = datePart.y;
			m = datePart.m;
			day = datePart.d;

			sec = (tempSec % 60) + 1;
			min = (Math.floor(tempSec / 60) % 60) + 1;
			h = Math.floor(tempSec / 3600) % 24;
		}

		let h12 = h % 12;
		let ampm = h >= 12 ? "PM" : "AM";
		return { year: y.toString(), month: pad(m), day: pad(day), hr: pad(h12), min: pad(min), sec: pad(sec), ampm: ampm };
	}

	class ProperTime {
		constructor(d) {
			this.year = d.year;
			this.month = d.month;
			this.day = d.day;
			this.hr = d.hr;
			this.min = d.min;
			this.sec = d.sec;
			this.ampm = d.ampm;
		}

		add(n, unit) {
			return new ProperTime(_addStep(this, n, unit));
		}

		getMeta() {
			let ay = parseInt(this.year),
				m = parseInt(this.month),
				day = parseInt(this.day);
			let py = ay;
			if (ay >= 1155 && ay <= 1751 && (m === 1 || m === 2 || (m === 3 && day < 25))) {
				py = ay - 1;
				if (py === 0) py = -1;
			}
			let suffix = "";
			if (ay < 0 || py < 0) {
				suffix = " A.C.";
				let absY = Math.abs(py);
				if (absY >= 46 && absY <= 80) suffix += " O.S.";
				else if (absY >= 20 && absY <= 45) suffix += " N.S.";
			} else if (ay >= 1740 && ay <= 1760) {
				if (ay < 1752) suffix = " O.S.";
				else if (ay === 1752) {
					if (m < 9 || (m === 9 && day <= 2)) suffix = " O.S.";
					else suffix = " N.S.";
				} else suffix = " N.S.";
			} else if (ay >= 1145 && ay <= 1165) {
				if (ay < 1155) suffix = " N.S.";
				else suffix = " O.S.";
			}
			return { displayYear: Math.abs(py).toString(), suffix };
		}

		toString() {
			const meta = this.getMeta();
			return `${meta.displayYear} ${this.month}${FS}${this.day} ${this.hr}:${this.min}:${this.sec} ${this.ampm}${meta.suffix}`;
		}

		toAltFormats() {
			const meta = this.getMeta();
			let ay = parseInt(this.year);
			let mi = parseInt(this.month);

			let mf = "",
				ms = "";
			if (ay <= -46) {
				const ancientNames = {
					1: "martius",
					2: "aprilis",
					3: "maius",
					4: "iunius",
					5: "quintilis",
					6: "sextilis",
					7: "september",
					8: "october",
					9: "november",
					10: "december",
					11: "ianuarius",
					12: "februarius",
					90: "dies hiberni",
					91: "mercedonius",
					92: "intercalaris prior",
					93: "intercalaris posterior",
				};
				mf = ancientNames[mi] || "";
				ms = mf ? (mi === 90 ? "dies." : mf.substring(0, 4) + ".") : "";
			} else {
				mi -= 1;
				mf = MONTHS_FULL[mi] || "";
				ms = MONTHS_SHORT[mi] || "";
			}

			const m = parseInt(this.month).toString(),
				dy = parseInt(this.day).toString();
			return[`${meta.displayYear}/${this.month}/${this.day}`, `${meta.displayYear} ${this.month}/${this.day}`, `${meta.displayYear}${this.month}${this.day}`, `${meta.displayYear}${m}${dy}`, `${meta.displayYear}${this.month}${dy}`, `${meta.displayYear}${m}${this.day}`, `${meta.displayYear} ${mf} ${this.day}`, `${meta.displayYear} ${mf} ${dy}`, `${meta.displayYear} ${ms} ${dy}`, `${meta.displayYear} ${ms} ${this.day}`];
		}
	}

	return function propertime(input) {
		if (input) {
			let s = input
				.replace(/\s/g, "")
				.replace(/A\.C\./i, "")
				.replace(/O\.S\./i, "")
				.replace(/N\.S\./i, "");
			let isAC = input.toUpperCase().includes("A.C.");
			let isBC = isAC || s.startsWith("-");
			if (s.startsWith("-")) s = s.substring(1);
			if (s.length < 11) throw new Error("Invalid propertime string");

			let ampm = s.slice(-2).toUpperCase();
			let sec = parseInt(s.slice(-4, -2));
			let min = parseInt(s.slice(-6, -4));
			let hr = parseInt(s.slice(-8, -6));
			let dateStr = s.slice(0, -8);

			const day = parseInt(dateStr.slice(-2));
			const month = parseInt(dateStr.slice(-4, -2));
			let py = parseInt(dateStr.slice(0, -4));

			if (isBC) py = -py;

			let ay = py;
			if (py >= 1155 && py <= 1750 && (month === 1 || month === 2 || (month === 3 && day < 25))) {
				ay = py + 1;
			} else if (py === 1154 && input.toUpperCase().includes("O.S.") && (month === 1 || month === 2 || (month === 3 && day < 25))) {
				ay = 1155;
			}
			return new ProperTime({ year: ay.toString(), month: pad(month), day: pad(day), hr: pad(hr), min: pad(min), sec: pad(sec), ampm }).add(0, "SS");
		}

		const now = new Date();
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: "Asia/Tokyo",
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
			hour12: false,
		}).formatToParts(now);

		let Y, M, D, H, m, s;
		parts.forEach((p) => {
			if (p.type === "year") Y = parseInt(p.value);
			if (p.type === "month") M = parseInt(p.value);
			if (p.type === "day") D = parseInt(p.value);
			if (p.type === "hour") H = parseInt(p.value);
			if (p.type === "minute") m = parseInt(p.value);
			if (p.type === "second") s = parseInt(p.value);
		});

		if (H === 24) H = 0;
		let hr12 = H % 12;
		let ampm = H >= 12 ? "PM" : "AM";

		return new ProperTime({
			year: Y.toString(),
			month: pad(M),
			day: pad(D),
			hr: pad(hr12),
			min: pad(m + 1),
			sec: pad(s + 1),
			ampm: ampm,
		});
	};
})();
})();

// Add this line at the very bottom:
export default propertime;