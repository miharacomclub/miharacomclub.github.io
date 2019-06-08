let text;
let needsShuffleText;
let defaultLineMax;

let lineMax;
let lineIndex;
let startTime; // falsyのときは中断している


import Romaji from "./romaji.js";

// text > line > sentence
export default class {
	static init(title, tsv, _needsShuffleText, defaultLineCount) {

		$("#textTitle").textContent = title;
		text = tsv.split(/\r?\n/).filter(l => l).map(line => line.split(/\t/));
		needsShuffleText = _needsShuffleText;

		$("#remainingNum").max = Math.min(text.length, 99);
		defaultLineMax = defaultLineCount || +$("#remainingNum").max;
		lineMax = defaultLineMax;

		for (const line of text) {
			line.push(Romaji.romanizeKana(line[1]));
		}
		resetTyping();
	}


	static onKeyDown(key) {
		if (key === "Escape") {
			if (!startTime) return;
			return resetTyping(), true;

		} else if (!startTime && key === "Tab") {
			return $("#remainingNum")[
				document.activeElement === $("#remainingNum")? "blur": "focus"
			](), true;
		}

		const typedKbd = searchKbd(key);
		if (!typedKbd) return;
		typedKbd.classList.add("onTyped");
		setTimeout(() => {typedKbd.classList.remove("onTyped")}, 100);

		const result = Romaji.onKeyDown(key);
		if (result === "incorrect" || !result) {
			if (startTime) {
				restartAnimation($("#sentencesFrame"), "frameOnTypo");
				sounds.incorrect.play();
			}
			return true;
		}


		if (!startTime) startTyping();
		recolorSentencesAndKbds();
		sounds.correct.play();

		if (result === "end") {
			if (lineIndex + 1 === lineMax) {
				const typingSkills = [
					sounds.correct.playCount,
					sounds.incorrect.playCount,
					(new Date() - startTime) / 1000
				];
				return resetTyping(), typingSkills;
			};
			moveToNextSentence();
		}
		return true;
	}
}



class SoundEffect {
	constructor(name) {
		this._objects = [...Array(10)].map(value => new Audio(`/src/typing/${name}.mp4`));
		this.playCount = 0;
	}
	play() {
		this._objects[this.playCount++ % 10].play();
	}
}
// safariで処理落ちしないようにする
window._audioCtx = window.webkitAudioContext && new window.webkitAudioContext();
const sounds = {
	correct: new SoundEffect("correct"),
	incorrect: new SoundEffect("incorrect")
};


const restartAnimation = (el, className) => {
	el.classList.remove(className);
	el.offsetWidth;
	el.classList.add(className);
};


const startTyping = () => {
	sounds.correct.playCount = 0;
	sounds.incorrect.playCount = 0;
	startTime = new Date();

	if (!$("#remainingNum").checkValidity()) {
		$("#remainingNum").value = defaultLineMax;
	}
	$("#remainingNum").blur();
	$("#remainingNum").disabled = true;
	lineMax = +$("#remainingNum").value;
};


const resetTyping = () => {
	if (needsShuffleText) {
		for (let i = text.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[text[i], text[j]] = [text[j], text[i]];
		}
	}

	startTime = 0;
	lineIndex = -1;
	$("#remainingNum").disabled = false;

	// 画面が切り替わったときに、animationが暴発するのを防ぐ
	$("#sentencesFrame").classList.remove("frameOnTypo");
	moveToNextSentence();
};



const moveToNextSentence = () => {
	lineIndex++;
	$("#remainingNum").value = lineMax - lineIndex;
	const sentences = text[lineIndex];
	if (!sentences) return;

	Romaji.init(sentences[2]);
	recolorSentencesAndKbds();

	$("#rubyBase").textContent = sentences[0];
	$("#nextRubyBase").textContent = (lineIndex + 1 < lineMax)? text[lineIndex + 1][0]: "";
	$("#meter").style.setProperty("--value", `${(1 - lineIndex / lineMax) * 100}%`);
};



const recolorSentencesAndKbds = () => {
	const updateBisectedSentence = (p, bisectedSentence) => {
		[p.children[0].textContent, p.children[1].textContent] = bisectedSentence;
	};

	// "abcdefg".split(/(.{3})(.*)/) → ["","abc","defg",""]
	updateBisectedSentence($("#rubySentence"), text[lineIndex][1].split(
		new RegExp(`(.{${Romaji.getKanaIndex()}})(.*)`)
	).slice(1, 3));
	updateBisectedSentence($("#romanized"), Romaji.getRomanized());


	$(".candidate") && $(".candidate").classList.remove("candidate");
	for (const kbd of $$(".otherCandidates")) {
		kbd.classList.remove("otherCandidates");
	}
	for (const [i, romaji] of Romaji.getCands().entries()) {
		searchKbd(romaji).classList.add(i > 0? "otherCandidates": "candidate");
	}
};



const searchKbd = key => {
	// edgeはkbdEvent.codeに対応していない
	return (key.length === 1 && $$("kbd").find(
			kbd => kbd.textContent.toLowerCase() === key)
		) || $("#" + ({
			Hankaku: "hankaku",
			Zenkaku: "hankaku",
			Tab: "tab",
			CapsLock: "caps",
			Alphanumeric: "caps",
			Shift: "lshift",
			Backspace: "backspace",
			Enter: "enter",
		})[key]);
};