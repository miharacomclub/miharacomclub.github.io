let text;
let lineMax;
let needsShuffle;
let startTime; // falsyのときは中断している
let isShiftPressed;

const rm = $("#remaining");
import RomajiJS from "./romaji.js";

// text > line > sentence
export default class {
	static init(title, tsv, _needsShuffle, _defaultValue) {

		$("#textTitle").textContent = title;
		text = tsv.split(/\r?\n/).filter(v => v).map(line => line.replace(/^[^\t]+$/, "$&\t$&").split(/\t/));

		rm.max = Math.min(text.length, 99);
		lineMax = rm.placeholder = _defaultValue || +rm.max;
		needsShuffle = _needsShuffle;

		$("#typingScreen").classList[isShiftPressed? "add": "remove"]("invisibleMode");
		for (const line of text) line.push(RomajiJS.romanizeKana(line[1]));
		resetGame();
	}


	static onKeyDown(key) {
		if (!startTime) {
			const isFocused = document.activeElement === rm;
			if (key === "Tab")		return rm[isFocused? "blur": "focus"](), true;
			else if (isFocused)		return;
		}
		else if (key === "Escape")	return resetGame(), true;
		else if (key === "0" && isShiftPressed) return;

		const typedKbd = searchKbd(key);
		if (!typedKbd) return;

		typedKbd.classList.add("onType");
		setTimeout(() => typedKbd.classList.remove("onType"), 100);

		const resultOfKey = RomajiJS.isKeyCorrect(key);
		if (resultOfKey === "incorrect") return startTime && onTypo(), true;

		if (!startTime) {
			startTime = new Date();
			sounds.correct.playCount = sounds.incorrect.playCount = 0;
		
			if (!rm.checkValidity()) rm.value = rm.placeholder;
			rm.disabled = true;
			lineMax = +rm.value;
		}
		sounds.correct.play();

		if (resultOfKey === "end") {
			const resultIfOnEndOfGame = moveToNextSentence();
			if (resultIfOnEndOfGame) return resetGame(), resultIfOnEndOfGame;
		}
		recolorSentencesAndKbds();
		return true;
	}


	static onShiftStateChange(_isShiftPressed) {
		isShiftPressed = _isShiftPressed;
		$("#Shift").classList[isShiftPressed? "add": "remove"]("onType");
		$("#keyboard").classList[isShiftPressed? "add": "remove"]("shiftIsPressed");
	}
}


class SE {
	constructor(name) {
		this._objects = [...Array(10)].map(() => new Audio(`/src/typing/${name}.mp4`));
		this.playCount = 0;
	}
	play() {
		this._objects[this.playCount++ % 10].play();
	}
}
const sounds = ["correct", "incorrect"].reduce((hash, name) => (hash[name] = new SE(name), hash), {});
if (window.webkitAudioContext) window._audioCtx = new window.webkitAudioContext(); // safariの処理落ちを防ぐ


const onTypo = (onlyRemoveAnimation = false) => {
	const frame = $("#sentencesFrame");
	frame.classList.remove("frameOnTypo");
	if (onlyRemoveAnimation) return; // animationの暴発を防ぐ

	sounds.incorrect.play();
	frame.offsetWidth;
	frame.classList.add("frameOnTypo");
};


const resetGame = () => {
	if (needsShuffle) {
		for (let i = text.length; --i;) {
			const j = Math.floor(Math.random() * (i + 1));
			[text[i], text[j]] = [text[j], text[i]];
		}
	}
	startTime = 0;
	rm.value = lineMax + 1;
	rm.disabled = false;

	onTypo(true);
	moveToNextSentence();
	recolorSentencesAndKbds();
};


const moveToNextSentence = () => {
	if (--rm.value < 1) return [
		sounds.correct.playCount, sounds.incorrect.playCount, (new Date() - startTime) / 1000
	];
	const lines = [...text].splice(lineMax - rm.value, 2);
	RomajiJS.init(lines[0][2]);

	$("#rubyBase").textContent		= lines[0][0];
	$("#nextRubyBase").textContent	= lines[1][0] || "";
	$("#rubySentence").innerHTML	= `<span></span><span>${lines[0][1]}</span>`;	
	$("#meter").style.setProperty("--value", `${rm.value / lineMax * 100}%`);
};


const recolorSentencesAndKbds = () => {
	const rubySentence = $("#rubySentence")  // 123.split(/(.{2}})(.*)/) → [,12,3,]
		.textContent.split(new RegExp(`(.{${RomajiJS.getKanaIndex()}})(.*)`)).slice(1);

	const updateSentence = (els, values) => els.forEach(el => el.textContent = values.shift());
	updateSentence($$("#rubySentence span"), rubySentence);
	updateSentence($$("#romanized span"), RomajiJS.getRomanized());

	for (const kbd of $$(".candidate, .otherCandidates")) {
		kbd.classList.remove("candidate", "otherCandidates");
	}

	for (const [i, romaji] of RomajiJS.getCands().entries()) {
		const kbd = searchKbd(romaji);
		const className = i > 0? "otherCandidates": "candidate";
		kbd.classList.add(className);
		kbd.dataset.onShift === romaji && $("#Shift").classList.add(className);
	}
};


const kbdKeys = $$("#keyboard kbd").map(kbd => [
	kbd.textContent, kbd.id, kbd.dataset.otherKey, kbd.dataset.onShift
].filter(v => v));
const searchKbd = key => $$("#keyboard kbd")[kbdKeys.findIndex(keys => keys.includes(key))];