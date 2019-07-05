const puncMarks = [",、",".。","/・","-ー"] // 約物
const table = {
	"っ":"ltu	ltsu	xtu	xtsu",
	"ゎ":"lwa	xwa",
	"ん":"nn	xn",
}
const sokuonMark = "*";
const yoonMark = "+";

let kanaIndex;
let romajiIndex;
let romajis;
let firstCands; // candidates
let typedRomajis;


// romajis > cands > cand / romaji
// [[si,shi,ci],...] > [si,shi,ci] > si
export default class {
	static romanizeKana(sentence) {
		const _romajis = [...sentence].map(kana => [...table[kana]]);

		for (let i = sentence.length - 1; i > 0; i--) {
			if ("ぁぃぅぇぉゃゅょ".includes(sentence[i])) {
				// {}内は新しく追加される要素
				// しゃ → [si/shi/ci/{sha+/sya+}, lya/xya]
				const yoonRomaji = table[sentence[i - 1] + sentence[i]];
				yoonRomaji && _romajis[i - 1].unshift(...yoonRomaji.map(cand => cand + yoonMark));

			} else if (sentence[i - 1] === "っ") {
				// っし → [ltu/ltsu/xtu/xtsu/{ss*/cc*}, si/shi/ci]
				// ss→っｓ　　aa→ああ　nn→ん 00→００ ,,→、、
				_romajis[i - 1].unshift(
					...new Set(_romajis[i] // Set()で重複を削除
					.filter(cand => cand[0].match(/[a-z]/) && !"aiueon".includes(cand[0]))
					.map(cand => cand[0] + cand[0] + sokuonMark))
				);

			} else if (sentence[i - 1] === "ん") {
				// んし → [nn/xn/{ns*/nc*}, si/shi/ci]
				// ん。 → [nn/xn/{n.+}, .]
				// ns→んｓ n0→ん０ n.→ん。　　nya→にゃ na→な nna→んあ nnna→んな
				_romajis[i - 1].unshift(
					...new Set(_romajis[i]
					.filter(cand => !"aiueony".includes(cand[0]))
					.map(cand => "n" + cand[0] + (cand[0].match(/[a-z]/)? sokuonMark: yoonMark)))
				);
			}
		}
		return _romajis;
	}


	static init(_romajis) {
		romajiIndex = 0;
		kanaIndex = 0;
		romajis = [..._romajis];
		firstCands = [];
		typedRomajis = "";
		predictCands();
	}


	static onKeyDown(key) {
		const result = isKeyCorrectAndFilterCands(key);
		if (result === "correct" || result === "end") {
			typedRomajis += key;

			// っしゅ ssyu → ccilyu　　3つ先の仮名まで予測する
			// っっっっしゅ sssssyu → ccccsyu
			(result === "correct") && predictCands(3);
		}
		return result;
	}


	static getCands() {
		return [...new Set((romajis[kanaIndex] || []).map(cand => cand[romajiIndex]))];
	}
	static getRomanized() {
		return [typedRomajis, firstCands.join("").slice(typedRomajis.length)];
	}
	static getKanaIndex() {
		return kanaIndex;
	}
}


// 自動補完　　rangeは仮名の数
const predictCands = (range = 50) => {

	const tmp = [kanaIndex, romajiIndex, [...romajis]];
	const kanaMin = Math.max(0, kanaIndex - 1);
	const kanaMax = Math.min(kanaIndex + range, romajis.length);

	for (let loopCount = 200; loopCount--;) {
		const firstCandRomaji = romajis[kanaIndex][0][romajiIndex];
		if (isKeyCorrectAndFilterCands(firstCandRomaji) === "end" ||
			kanaIndex >= kanaMax) break;
	}

	for (let i = kanaMin; i < kanaMax; i++) {
		firstCands[i] = romajis[i][0];
	}
	[kanaIndex, romajiIndex, romajis] = tmp;
}



// keyがromaji（一文字のa-z,0-9,punkMarks）でないとき、何も返さない
// "incorrect" "correct" "end"
const isKeyCorrectAndFilterCands = key => {

	if (!(romajis && key && key.length === 1)) return;
	if (!(key.match(/[a-z]|\d/i) || puncMarks.some(mark => mark[0] === key))) return;

	const cands = (romajis[kanaIndex] || []).filter(cand => cand[romajiIndex] === key);
	if (!cands.length) return "incorrect"; // [] はfalsyではない
	romajis[kanaIndex] = cands;


	if (cands.length === 1) {
		if (cands[0].slice(-1) === sokuonMark) {
			cands[0] = cands[0].slice(0, -1);

			// ここまでの処理と似通った処理をする
			for (let i = kanaIndex + 1; i < 50; i++) {
				const nextCands = romajis[i];
				romajis[i] = nextCands.filter(cand => cand[0] === key).map(cand => cand.slice(1));

				if (!(nextCands.length === 1 && nextCands[0].slice(-1) === sokuonMark)) break;
				nextCands[0] = nextCands[0].slice(0, -1);
			}

		} else if (cands[0].slice(-1) === yoonMark) {
			cands[0] = cands[0].slice(0, -1);
			romajis[kanaIndex + 1] = [""];
		}

		if (romajiIndex === cands[0].length - 1) {
			romajiIndex = 0;
			(romajis[++kanaIndex] || [])[0] === "" && kanaIndex++;
			return (kanaIndex < romajis.length? "correct": "end");
		}
	}

	romajiIndex++;
	return "correct";
}




{
	const delimiter = "	"; // タブ

	const addToTable = (kana, romaji) => {
		const value = table[kana];
		table[kana] = (value? value + delimiter: "") + romaji;
	}


	for (const marks of puncMarks) {
		addToTable(marks[1], marks[0]);
	}
	for (let i = 0; i < 10; i++) {
		addToTable("０１２３４５６７８９"[i], i);
	}


	const gojuon = [
		"あいうえお" , "かきくけこk", "がぎぐげごg" , "さしすせそs",
		"かしくせこc", "ざじずぜぞz", "たちつてとt" , "だぢづでどd",
		"なにぬねのn", "はひふへほh", "ばびぶべぼb" , "ぱぴぷぺぽp",
		"まみむめもm", "らりるれろr", "　ゐ　ゑ　wy", "　　ゔ　　v",
		"ぁぃぅぇぉl", "ぁぃぅぇぉx", "ゃぃゅぇょly", "ゃぃゅぇょxy",
		"や,い,ゆ,いぇ,よ,y".split(","),"わ,うぃ,う,うぇ,を,w".split(",")
	];
	for (const column of gojuon) {
		const consonant = column.slice(5);
		for (let r = 0; r < 5; r++) { // rowIndex
			column[r] !== "　" && addToTable(column[r], consonant + "aiueo"[r]);
		}
	}


	const addYoonsToTable = (suteganas, yoonConsonants) => {
		for (const yoonConsonant of yoonConsonants.split(",")) {

			const consKana = yoonConsonant[0];
			const consRomaji = yoonConsonant.match(/[a-z]+/)[0];

			// 拗音の子音にあたる仮名の母音と、捨て仮名の母音が一致するか調べる
			const mayNotYoon = yoonConsonant.includes("*");
			const consKanaVowel = table[consKana].slice(-1);

			for (let i = 0; i < 5; i++) {
				const sutegana = (mayNotYoon && consKanaVowel === "aiueo"[i])? "": suteganas[i];
				addToTable(consKana + sutegana, consRomaji + "aiueo"[i]);
			}
		}
	}
	addYoonsToTable("ぁぃぅぇぉ", "うwh*,くq*,くqw,くkw,ぐgw,すsw,つts*,とtw,どdw,ふf*,ふhw,ふfw,ゔv*");
	addYoonsToTable("ゃぃゅぇょ", // ch*→ちゃ,ち,...　cy→ちゃ,ちぃ,...
		"きky,くqy,ぎgy,しsh*,しsy,じj*,じzy,じjy,ちty,ちch*,ちcy,ぢdy,てth,でdh,にny,ひhy,ふfy,びby,ぴpy,みmy,りry,ゔvy"
	);


	// 二重に登録されるので例外的に処理する
	table["ゔ"] = "vu";
	// 後から入れたromajiの優先度は下がる
	table["ふゅ"] += delimiter + "hwyu";
	for (const kana of Object.keys(table)) {
		table[kana] = table[kana].split(delimiter);
	}
	Object.freeze(table);
}