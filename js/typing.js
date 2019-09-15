{
	if (/(Phone|iPad|iPod|Android|Tablet|Mobile)/i.test(navigator.userAgent)) $("#onlyMobile").style.display = "";

	const doDefault = Symbol();

	document.addEventListener("click", async event => {
		if (!event.target.matches("#selectionScreen button")) return;

		const btn		= event.target;
		const category	= $("[name=tab]:checked").id;
		const btns		= $$(`[data-tsv-name^="${btn.dataset.tsvName}"]`);
		btns.length > 1 && btns.pop();

		const tsvs		= await Promise.all(btns.map(el =>
			fetch(`/src/typing/${category}/${el.dataset.tsvName}.tsv`).then(res => res.ok && res.text())
		));
		const lines		= tsvs.join("\n").split(/\r?\n/).filter(v => v);

		lines.length > 0 && Game.prepare(
			lines,
			btn.textContent,
			tsvs.length > 1 && 20,
			!("inOrder" in btn.dataset || category === "long")
		);
	});


	document.addEventListener("keyup",   event =>  $("#shiftIsPressed").checked = event.shiftKey);
	document.addEventListener("keydown", event => {$("#shiftIsPressed").checked = event.shiftKey;
		event.ctrlKey
		|| event.metaKey
		|| event.altKey
		|| event.key === "Shift"
		|| (event.shiftKey && event.key === "0")
		|| $("#displaySelection").checked
		|| doDefault === Game.onKeyDown(event.key, doDefault)
		|| event.preventDefault();
	});
}



const Game = (() => {
	// text > line > romajis, kanas, sentence > cands > cand, romaji > key
	let text, startTime;
	const rm	= $("#remaining"),

	onKeyDown = (key, doDefault) => {
		if (doDefault !== Results.onKeyDown(key, doDefault)) return;

		if (!startTime) {
			const isRmFocused = rm === document.activeElement;
			if (key === "Tab")		return rm[isRmFocused? "blur": "focus"]();
			if (isRmFocused)		return doDefault;
			if (key === "Escape")	return $("#displaySelection").checked = true;
		}

		const typedKbd = Kbds.search(key);
		if (!typedKbd) return doDefault;

		typedKbd.classList.add("onType");
		setTimeout(() => typedKbd.classList.remove("onType"), 100);

		if (key === "Escape")			return reset();
		if (!Romaji.isKeyCorrect(key))	return onTypo();

		!startTime && start();
		Sounds.correct.play();
		if (Romaji.indexOfKana() >= 0)	return recolor();

		const aryIfOnEndOfGame = moveToNext();
		if (aryIfOnEndOfGame) {
			reset();
			Results.show(...aryIfOnEndOfGame);
		}
	},


	prepare = (lines, title, defaultValue, needsShuffle) => {

		text = lines.map(line => line.replace(/^[^\t]+$/, "$&\t$&").split(/\t/));
		for (const line of text) line.push(Romaji.romanizeKana(line[1]));

		rm.max			= Math.min(text.length, 99);
		rm.defaultValue	= rm.placeholder = defaultValue || +rm.max;

		$("#textTitle").textContent		= title;
		$("#englishMode").checked		= title.includes("英語");
		$("#invisibleMode").checked		= $("#shiftIsPressed").checked;
		$("#displaySelection").checked	= false;

		reset(needsShuffle);
	},


	reset = needsShuffle => {
		if (needsShuffle) text.needsShuffle = needsShuffle;

		if (text.needsShuffle) {
			for (let i = text.length; --i;) {
				const j = Math.floor(Math.random() * (i + 1));
				[text[i], text[j]] = [text[j], text[i]];
			}
		}
		startTime = 0;
		rm.value = +rm.defaultValue + 1;
		rm.disabled = false;

		$("#sentencesFrame").classList.remove("frameOnTypo");
		moveToNext();
	},


	start = () => {
		Sounds.correct.playCount = Sounds.incorrect.playCount = 0;
		if (!rm.checkValidity()) rm.value = rm.placeholder;
		rm.defaultValue	= rm.value;
		rm.disabled		= true;
		startTime		= new Date();
	},


	recolor = () => {
		// 123.split(/(.{2}})(.*)/) → [,12,3,]
		const [, ...rubySentence] = $("#rubySentence").textContent
			.split(new RegExp(`(.{${Romaji.indexOfKana()}})(.*)`));

		const updateSentence = (els, values) => els.forEach(el => el.textContent = values.shift());
		updateSentence($$("#rubySentence span"), rubySentence);
		updateSentence($$("#romanized span"), Romaji.getRomanized());

		for (const kbd of $$(".candidate, .otherCandidates")) {
			kbd.classList.remove("candidate", "otherCandidates");
		}

		for (const [i, romaji] of Romaji.getCands().entries()) {
			const kbd = Kbds.search(romaji);
			const className = i > 0? "otherCandidates": "candidate";
			kbd.classList.add(className);
			kbd.dataset.onShift === romaji && $("#Shift").classList.add(className);
		}
	},


	onTypo = () => {
		const frame = $("#sentencesFrame");
		frame.classList.remove("frameOnTypo");
		frame.offsetWidth;
		frame.classList.add("frameOnTypo");
		Sounds.incorrect.play();
	},


	moveToNext = () => {
		if (--rm.value < 1) return [
			Sounds.correct.playCount, Sounds.incorrect.playCount, (new Date() - startTime) / 1000
		];
		const lines = [...text].splice(rm.defaultValue - rm.value, 2);
		Romaji.prepare(lines[0][2]);

		$("#rubyBase").textContent		= lines[0][0];
		$("#nextRubyBase").textContent	= rm.value - 1? lines[1][0]: "";
		$("#rubySentence").innerHTML	= `<span></span><span>${lines[0][1]}</span>`;
		$("#meter").style.setProperty("--value", `${rm.value / rm.defaultValue * 100}%`);
		recolor();
	};

	return {onKeyDown, prepare};
})();



const Results = (() => {
	const storage = JSON.parse(localStorage.getItem("typing")) || {},
	rankNamesAndColors = {}, // keyは整数なので、昇順に並び替えられる

	roundOff = num => Math.round(num * 10) / 10,

	storeHighScore = score => {
		if ((storage.highScore || -1) < score) {
			storage.highScore = score;
			localStorage.setItem("typing", JSON.stringify(storage));
		}
		$("#rankList").dataset.score = storage.highScore;
		$("#rankList").style.setProperty("--high-score", storage.highScore);
	},


	show = (keystrokes, typos, time) => {
		const kps		= keystrokes / time;
		const kpm		= kps * 60;
		const accuracy	= keystrokes / (keystrokes + typos);
		const score		= Math.round(kpm * accuracy ** 2);
		const [rankName, rankColor] = rankNamesAndColors[
			Object.keys(rankNamesAndColors).reverse().find(value => value <= score)
		];
		const ddValues	= [
			score, rankName, roundOff(time), keystrokes, roundOff(kps),
			roundOff(accuracy * 100), typos, Math.round(kpm)
		];
		for (const dd of $$("#results dd")) dd.textContent = ddValues.shift();

		$("#rankName").style.color = rankColor;
		storeHighScore(score);
		$("#displayResults").checked = true;
	},


	onKeyDown = (key, doDefault) => {
		if (!$("#displayResults").checked) return doDefault;
		$("#displayResults").checked = key !== "Escape";
	};


	$$("#rankList li").reduce((superior, item) => {
		const rankName		= item.textContent.trim();
		const rankColor		= item.style.color;
		const requiredScore	= +item.style.getPropertyValue("--required-score");
		const superiorScore	= +superior.style.getPropertyValue("--required-score") || 950;

		item.dataset.score	= requiredScore;
		item.dataset.requiredKps = roundOff(requiredScore / 60 / 0.97 ** 2);
		item.style.setProperty("--score-range", superiorScore - requiredScore);
		superior.style.setProperty("--inferior-score", requiredScore);

		if (rankName.length > 1) {
			rankNamesAndColors[requiredScore] = [rankName, rankColor];
		} else {
			const suffixes = ["-","","+","++"];
			for (let score = requiredScore; score < superiorScore; score += 25) {
				rankNamesAndColors[score] = [rankName + suffixes.shift(), rankColor];
			}
		}
		return item;
	});

	$("#rankList").style.visibility = "";
	storeHighScore(0);

	return {show, onKeyDown};
})();



const Romaji = (() => {
	let romajis, kanaIndex, romajiIndex;
	const table = {},

	prepare			= _romajis => [romajis, kanaIndex, romajiIndex] = [[..._romajis], 0, 0],

	getCands		= () => [...new Set(romajis[kanaIndex].map(cand => cand[romajiIndex]))],

	indexOfKana		= () => kanaIndex < romajis.length? kanaIndex: -1,

	getRomanized	= () => {
		const buf = [kanaIndex, romajiIndex, [...romajis]];
		while (romajis[kanaIndex] && isKeyCorrect(romajis[kanaIndex][0][romajiIndex]));

		const firstCands = romajis.map(cands => cands[0]);
		[kanaIndex, romajiIndex, romajis] = buf;

		const indeterminate = firstCands.slice(kanaIndex).join("").slice(romajiIndex);
		return [firstCands.join("").slice(0, -indeterminate.length), indeterminate];
	},


	isKeyCorrect = key => {
		const cands = romajis[kanaIndex].filter(cand => cand[romajiIndex] === key);
		if (!key || !cands.length) return; // [] ≠ falsy

		romajis[kanaIndex] = cands;
		romajiIndex++;
		if (cands.length > 1) return true;

		const removed = (ary, sign) => ary[0] !== (ary[0] = ary[0].replace(sign, ""));
		if (removed(cands, table.sokuon)) {

			for (let i = kanaIndex + 1; i < romajis.length; i++) {
				romajis[i] = romajis[i].filter(cand => cand[0] === key).map(cand => cand.slice(1));
				if (romajis[i].length > 1 || !removed(romajis[i], table.sokuon)) break;
			}

		} else if (removed(cands, table.yoon)) {
			romajis[kanaIndex + 1] = [""];
		}

		romajiIndex %= cands[0].length;
		romajiIndex === 0 && romajis[++kanaIndex] && romajis[kanaIndex][0] === "" && kanaIndex++;
		return true;
	},


	romanizeKana = sentence => {
		const hiraganas = sentence.replace(/[ァ-ヶ]/g, katakana => String.fromCharCode(katakana.charCodeAt(0) - 0x60));
		const _romajis = [...hiraganas].map(kana => [...(table[kana] || kana)]);

		for (let i = hiraganas.length; --i;) {

			// うぁ [[wha拗,u,wu,whu], [la,xa]]
			if ("ぁぃぅぇぉゃゅょ".includes(hiraganas[i])) {
				const yoonRomaji = table[hiraganas.substr(i - 1, 2)];
				yoonRomaji && _romajis[i - 1].unshift(...yoonRomaji.map(cand => cand + table.yoon));
			}

			const prependCandsIfPrevKanaIs = (kana, conv) => hiraganas[i - 1] === kana &&
				_romajis[i - 1].unshift(...new Set(_romajis[i].map(conv).filter(v => v)));

			// っう [[ww促,ltu,ltsu,xtu,xtsu], [u,wu,whu]]
			prependCandsIfPrevKanaIs("っ", cand =>
				/^(?![aiueon])[a-z]/.test(cand[0]) && cand[0].repeat(2) + table.sokuon
			);
			// ん。 [[n.拗,nn,xn,n'], [.]]
			// んう [[nw促,nn,xn,n'], [u,wu,whu]]
			prependCandsIfPrevKanaIs("ん", cand =>
				!"aiueony'".includes(cand[0]) && `n${cand[0]}${table[/[a-z]/.test(cand[0])? "sokuon": "yoon"]}`
			);
		}
		return _romajis;
	};


	fetch("/src/typing/romaji.tsv").then(resp => resp.ok && resp.text()).then(tsv => {
		for (const line of tsv.split(/\r?\n/)) {
			((key, ...values) => table[key] = values)(...line.split("\t"));
		}
	});
	return {prepare, getCands, indexOfKana, isKeyCorrect, getRomanized, romanizeKana};
})();



const Kbds = (() => {
	const
	els		= $$("#typingScreen kbd"),
	keys	= els.map(kbd => [kbd.textContent, kbd.id, kbd.dataset.otherKey, kbd.dataset.onShift].filter(v => v)),

	search	= keyName => els[keys.findIndex(keyNames => keyNames.includes(keyName))];
	return {search};
})();



const Sounds = (() => {
	// safariでの処理落ちを防ぐ
	if (window.webkitAudioContext) window.AudioContext = new window.webkitAudioContext();

	class SE {
		constructor(name) {
			this.sources = [...Array(10)].map(() => new Audio(`/src/typing/${name}.mp4`));
			this.playCount = 0;
		}
		play() {
			this.sources[this.playCount++ % 10].play();
		}
	}
	return {
		correct: new SE("correct"),
		incorrect: new SE("incorrect"),
	};
})();