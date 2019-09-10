const table = {
	っ: "ltu	ltsu	xtu	xtsu",
	ゎ: "lwa	xwa",
	ん: "nn	xn	n'",
	ゔ: "vu"
}
const sokuonSign = "促";
const yoonSign = "拗";

let romajis;
let romajiIndex;
let kanaIndex;

// romajis / kanas(sentence) > cands > cand / romaji > key
// [[i,yi], [u,wu,whu]] > [u,wu,whu] > whu > w
export default class {
	static init(_romajis) {
		romajis = [..._romajis];
		romajiIndex = 0;
		kanaIndex = 0;
	}
	static getCands() {
		return [...new Set(romajis[kanaIndex].map(cand => cand[romajiIndex]))];
	}
	static getKanaIndex() {
		return kanaIndex;
	}


	static getRomanized() {
		const buf = [kanaIndex, romajiIndex, [...romajis]];
		while (this.isKeyCorrect(romajis[kanaIndex][0][romajiIndex]) === "correct");
	
		const firstCands = romajis.map(ary => ary[0]);
		[kanaIndex, romajiIndex, romajis] = buf;

		const indeterminate = firstCands.slice(kanaIndex).join("").slice(romajiIndex);
		return [firstCands.join("").slice(0, -indeterminate.length), indeterminate];
	}


	static isKeyCorrect(key) {
		const cands = romajis[kanaIndex].filter(cand => cand[romajiIndex] === key);
		if (!key || !cands.length) return "incorrect"; // [] ≠ falsy
	
		romajis[kanaIndex] = cands;
		romajiIndex++;
		if (cands.length > 1) return "correct";
	
		const removed = (ary, sign) => ary[0] !== (ary[0] = ary[0].replace(sign, ""));
		if (removed(cands, sokuonSign)) {

			for (let i = kanaIndex + 1; i < romajis.length; i++) {
				romajis[i] = romajis[i].filter(cand => cand[0] === key).map(cand => cand.slice(1));
				if (romajis[i].length > 1 || !removed(romajis[i], sokuonSign)) break;
			}
			
		} else if (removed(cands, yoonSign)) {
			romajis[kanaIndex + 1] = [""];
		}
	
		romajiIndex %= cands[0].length;
		romajiIndex === 0 && romajis[++kanaIndex] && romajis[kanaIndex][0] === "" && kanaIndex++;
		return kanaIndex < romajis.length? "correct": "end";
	}
	

	static romanizeKana(sentence) {
		const hiraganas = sentence.replace(/[ァ-ヶ]/g, katakana => String.fromCharCode(katakana.charCodeAt(0) - 0x60));
		const _romajis = [...hiraganas].map(kana => [...(table[kana] || kana)]);

		for (let i = hiraganas.length - 1; i > 0; i--) {
			
			// うぁ [[wha拗,u,wu,whu], [la,xa]]
			if ("ぁぃぅぇぉゃゅょ".includes(hiraganas[i])) {
				const yoonRomaji = table[hiraganas.substr(i - 1, 2)];
				yoonRomaji && _romajis[i - 1].unshift(...yoonRomaji.map(cand => cand + yoonSign));
			}

			const prependCandsIfPrevKanaIs = (kana, filter, map) => hiraganas[i - 1] === kana &&
				_romajis[i - 1].unshift(...new Set(_romajis[i].filter(filter).map(map))); // Setで重複削除

			// っう [[ww促,ltu,ltsu,xtu,xtsu], [u,wu,whu]]
			prependCandsIfPrevKanaIs("っ",
				cand => /^(?![aiueon])[a-z]/.test(cand[0]),
				cand => cand[0].repeat(2) + sokuonSign
			);
			// ん。 [[n.拗,nn,xn,n'], [.]]
			// んう [[nw促,nn,xn,n'], [u,wu,whu]]
			prependCandsIfPrevKanaIs("ん",
				cand => !"aiueony'".includes(cand[0]),
				cand => `n${cand[0]}${/[a-z]/.test(cand[0])? sokuonSign: yoonSign}`
			);
		}
		return _romajis;
	}
}


const addToTable = (kana, romaji) => {
	table[kana] = `${table[kana]? table[kana] + "\t": ""}${romaji}`;
}

const punctuations = `！!”"＃#＄$％%＆&’'（(）)ー-＝=＾^～~￥\\｜|＠@‘${"`"}「[｛{」]｝}；;：:＋+＊*、,。.・/＜<＞>？?＿_`;
for (const punc of punctuations.split(/(..)/).filter(v => v)) addToTable(...punc);

const syllabary = [
	"あいうえお"  ,"かきくけこk" ,"がぎぐげごg" ,"さしすせそs","かしくせこc","ざじずぜぞz" ,"たちつてとt","だぢづでどd","なにぬねのn" ,
	"はひふへほh" ,"ばびぶべぼb" ,"ぱぴぷぺぽp" ,"まみむめもm","らりるれろr","　ゐ　ゑ　wy","ぁぃぅぇぉl","ぁぃぅぇぉx","ゃぃゅぇょly",
	"ゃぃゅぇょxy","ゕ　　ゖ　lk","ゕ　　ゖ　xk","や,い,ゆ,いぇ,よ,y".split(","),"わ,うぃ,う,うぇ,を,w".split(",")
];
for (const column of syllabary) {
	const consonant = column.slice(5);
	for (let r = 0; r < 5; r++) {
		column[r] !== "　" && addToTable(column[r], consonant + "aiueo"[r]);
	}
}


const addYoonsToTable = (suteganas, yoonConsonants) => {
	for (const yoonCons of yoonConsonants.split(",")) {
		const consKana		= yoonCons[0];					// し し
		const consRomaji	= yoonCons.match(/[a-z]+/)[0];	// sh sy
		const mayNotYoon	= yoonCons.includes("*");		// *
		const consKanaVowel	= table[consKana].slice(-1);	// i  i

		for (let i = 0; i < 5; i++) {						// "" ぃ
			const sutegana = (mayNotYoon && consKanaVowel === "aiueo"[i])? "": suteganas[i];
			addToTable(consKana + sutegana, consRomaji + "aiueo"[i]);
		}
	}
};
addYoonsToTable("ぁぃぅぇぉ", "うwh*,くq*,くqw,くkw,ぐgw,すsw,つts*,とtw,どdw,ふf*,ふhw,ふfw,ゔv*");
addYoonsToTable("ゃぃゅぇょ", "きky,くqy,ぎgy,しsh*,しsy,じj*,じzy,じjy,ちty,ちch*,ちcy,ぢdy,てth,でdh,にny,ひhy,ふfy,びby,ぴpy,みmy,りry,ゔvy");


table["ゔ"] = "vu"; // 二重に登録されるので直す
table["ふゅ"] += "\t" + "hwyu"; // 後ろに追加すると優先されない

for (const kana of Object.keys(table)) table[kana] = table[kana].split("\t");