for (const input of $$("input")) input.checked = input.defaultChecked;
const doDefault = Symbol();



const Game = (() => {
	// text > line > romajis, kanas, sentence > cands > cand, romaji > key
	let text, startTime, btn;
	const rmn = $("#remainingNum"),


	prepare = async event => {
		if (!event.target.matches(".themeButtons button")) return;
		btn = event.target;

		const btns = $$(`[data-tsv-name^="${btn.dataset.tsvName}"]`);
		btns.length > 1 && btns.pop();

		const category = $(`[name="tab"]:checked`).id;
		const tsvs = (await Promise.all(btns.map(b =>
			fetch(`/src/typing/${category}/${b.dataset.tsvName}.tsv`)
			.then(resp => resp.ok? resp.text(): "")
		))).filter(v => v);

		const lines = tsvs.join("\n").split(/\r?\n/).filter(v => v);
		if (lines.length === 0) return;

		text = lines.map(line => line.replace(/^[^\t]+$/, "$&\t$&").split(/\t/));
		for (const line of text) line.push(Romaji.romanizeKana(line[1]));

		const initialValue = ({words:15, short:10})[category] || 99;
		rmn.max            = Math.min(text.length, 99);
		rmn.placeholder    = Math.min(initialValue, rmn.max);
		if (!btn.dataset.prevRmnValue) btn.dataset.prevRmnValue = rmn.placeholder;

		const title = btn.textContent;
		$("#maxLines").textContent     = rmn.max;
		$("#textTitle").textContent    = title;
		$("#englishMode").checked      = title.includes("英語");
		$("#invisibleMode").checked    = $("#shiftIsPressed").checked;
		$("#displaySelection").checked = false;

		text.inOrder = "inOrder" in btn.dataset || ["long", "classic"].includes(category);
		reset();
	},


	onKeyDown = key => {
		const typedKbd = Kbd.search(key, true);
		if ($("#displayResults").checked) return Results.onKeyDown(key);

		if (!startTime) {
			const isRmnFocused = rmn === document.activeElement;
			if (key === "Tab")    return rmn[isRmnFocused? "blur": "focus"]();
			if (isRmnFocused)     return key === "Escape"? rmn.blur(): doDefault;
			if (key === "Escape") return exit();
		}
		if (!typedKbd)                 return doDefault;
		if (key === "Escape")          return reset();
		if (!Romaji.isKeyCorrect(key)) return onTypo();

		!startTime && start();
		Sounds.correct.play();
		if (Romaji.indexOfKana() >= 0) return recolor();

		const aryIfOnEndOfGame = moveToNext();
		if (aryIfOnEndOfGame) {
			reset();
			Results.show(...aryIfOnEndOfGame);
		}
	},


	reset = () => {
		if (!text.inOrder) {
			for (let i = text.length; --i > 0;) {
				const j = Math.floor(Math.random() * (i + 1));
				[text[i], text[j]] = [text[j], text[i]];
			}
		}
		startTime    = 0;
		rmn.value    = +btn.dataset.prevRmnValue + 1;
		rmn.disabled = false;

		$("#maxLines").textContent = rmn.max;
		$("#sentencesFrame").classList.remove("frameOnTypo");
		moveToNext();
	},


	start = () => {
		if (!rmn.checkValidity()) rmn.value = rmn.placeholder;
		$("#maxLines").textContent = btn.dataset.prevRmnValue = rmn.value = +rmn.value; // 0.9e+1 → 9
		Sounds.incorrect.playCount = Sounds.correct.playCount = 0;
		rmn.disabled = true;
		startTime    = new Date();
	},


	recolor = () => {
		// abc.split(/(.{2}})(.*)/) → [,ab,c,]
		const [, ...rubySentence] = $("#rubySentence").textContent
			.split(new RegExp(`(.{${Romaji.indexOfKana()}})(.*)`));

		const updateSentence = (spans, values) => spans.forEach(span => span.textContent = values.shift());
		updateSentence($$("#rubySentence span"), rubySentence);
		updateSentence($$("#romanized span"), Romaji.getRomanized());

		for (const kbd of $$(".candidate, .otherCandidates")) {
			kbd.classList.remove("candidate", "otherCandidates");
		}

		for (const [i, romaji] of Romaji.getCands().entries()) {
			const kbd = Kbd.search(romaji);
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
		if (--rmn.value < 1) return [
			Sounds.correct.playCount, Sounds.incorrect.playCount, (new Date() - startTime) / 1000
		];
		const lines = [...text].splice(btn.dataset.prevRmnValue - rmn.value, 2);
		Romaji.prepare(lines[0][2]);

		$("#rubyBase").textContent     = lines[0][0];
		$("#nextSentence").textContent = rmn.value - 1? lines[1][+$("#englishMode").checked]: "";
		$("#rubySentence").innerHTML   = `<span></span><span>${lines[0][1]}</span>`;
		recolor();
	},


	exit = () => {
		btn.dataset.prevRmnValue = rmn.checkValidity()? rmn.value: rmn.placeholder;
		$("#displaySelection").checked = true;
		btn.focus();
	},



	onKbdPressed = event => {
		if (!event.target.matches("#typingScreen kbd")) return;
		const kbd = event.target;

		if (kbd.textContent === "Shift") {
			$("#shiftIsPressed").checked = !$("#shiftIsPressed").checked;
		} else {
			const key = $("#shiftIsPressed").checked? kbd.dataset.onShift: kbd.textContent || kbd.id;
			if (!key || doDefault === onKeyDown(key)) return;
		}
		event.preventDefault();
	};

	document.addEventListener("click",      prepare);
	document.addEventListener("touchstart", onKbdPressed, {passive: false});
	document.addEventListener("mousedown",  event =>  event.button === 0 && onKbdPressed(event));
	document.addEventListener("keyup",      event =>  $("#shiftIsPressed").checked = event.shiftKey);
	document.addEventListener("keydown",    event => {$("#shiftIsPressed").checked = event.shiftKey;
		event.ctrlKey
		|| event.metaKey
		|| event.altKey
		|| event.key === "Shift"
		|| (event.shiftKey && event.key === "0")
		|| $("#displaySelection").checked
		|| doDefault === onKeyDown(event.key)
		|| event.preventDefault();
	});
})();



const Results = (() => {
	const storage = JSON.parse(localStorage.getItem("typing")) || {},
	rankNamesAndColors = {}, // keyは整数なので、昇順に並び替えられる

	roundOff = num => Math.round(num * 10) / 10,

	onKeyDown = key => {
		if (key !== "Escape") return doDefault;
		$("#displayResults").checked = false;
	},


	storeHighScore = score => {
		if ((storage.highScore || -1) < score) {
			storage.highScore = score;
			localStorage.setItem("typing", JSON.stringify(storage));
		}
		$("#rankList").dataset.score = storage.highScore;
		$("#rankList").style.setProperty("--high-score", storage.highScore);
	},


	show = (keystrokes, typos, time) => {
		const kps      = keystrokes / time;
		const kpm      = kps * 60;
		const accuracy = keystrokes / (keystrokes + typos);
		const score    = Math.round(kpm * accuracy ** 2);
		const [rankName, rankColor] = rankNamesAndColors[
			Object.keys(rankNamesAndColors).reverse().find(value => value <= score)
		];
		const ddValues = [
			score, rankName, roundOff(time), keystrokes, roundOff(kps),
			roundOff(accuracy * 100), typos, Math.round(kpm)
		];
		for (const dd of $$("#results dd")) dd.textContent = ddValues.shift();

		$("#rankName").style.color = rankColor;
		storeHighScore(score);
		$("#displayResults").checked = true;
	};


	$$("#rankList li").reduce((superior, rank) => {
		const rankName      = rank.textContent.trim();
		const rankColor     = rank.style.color;
		const requiredScore = +rank.style.getPropertyValue("--required-score");
		const superiorScore = +superior.style.getPropertyValue("--required-score") || 950;

		rank.dataset.score  = requiredScore;
		rank.dataset.requiredKps = roundOff(requiredScore / 60 / 0.97 ** 2);
		rank.style.setProperty("--score-range", superiorScore - requiredScore);
		superior.style.setProperty("--inferior-score", requiredScore);

		if (rankName.length > 1) {
			rankNamesAndColors[requiredScore] = [rankName, rankColor];
		} else {
			const suffixes = ["-", "", "+", "++"];
			for (let score = requiredScore; score < superiorScore; score += 25) {
				rankNamesAndColors[score] = [rankName + suffixes.shift(), rankColor];
			}
		}
		return rank;
	});
	$("#rankList").style.visibility = "visible";
	storeHighScore(0);

	return {onKeyDown, show};
})();



const Romaji = (() => {
	let kanaIndex, romajiIndex, romajis, firstCands;
	const table = {},

	prepare     = _romajis => [kanaIndex, romajiIndex, romajis, firstCands] = [0, 0, [..._romajis], []],

	getCands    = () => [...new Set(romajis[kanaIndex].map(cand => cand[romajiIndex]))],

	indexOfKana = () => kanaIndex < romajis.length? kanaIndex: -1,


	getRomanized = () => {
		if (kanaIndex > 0) firstCands[kanaIndex - 1] = romajis[kanaIndex - 1][0];
		const buf = [kanaIndex, romajiIndex, [...romajis]];

		for (let i = kanaIndex; i < romajis.length; i++) {
			while (i === kanaIndex && isKeyCorrect(romajis[kanaIndex][0][romajiIndex]));
			if (firstCands[i] === (firstCands[i] = romajis[i][0])) break;
		}
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

		if ((romajiIndex %= cands[0].length) === 0) {
			kanaIndex++;
			romajis[kanaIndex] && romajis[kanaIndex][0] === "" && kanaIndex++;
		}
		return true;
	},


	romanizeKana = sentence => {
		const hiraganas = sentence.replace(/[ァ-ヶ]/g,
			katakana => String.fromCharCode(katakana.charCodeAt(0) - 0x60)
		);
		const _romajis = [...hiraganas].map(kana => [...(table[kana] || kana)]);

		for (let i = hiraganas.length; --i > 0;) {
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
				!"aiueony'".includes(cand[0]) &&
				`n${cand[0]}${table[/[a-z]/.test(cand[0])? "sokuon": "yoon"]}`
			);
		}
		return _romajis;
	};


	fetch("/src/typing/romaji.tsv")
	.then(resp => resp.ok? resp.text(): "").then(tsv => {
		for (const line of tsv.split(/\r?\n/)) {
			((key, ...values) => table[key] = values)(...line.split("\t"));
		}
	});
	return {prepare, getCands, indexOfKana, isKeyCorrect, getRomanized, romanizeKana};
})();



const Kbd = (() => {
	const
	kbds = $$("#typingScreen kbd"),
	keys = kbds.map(kbd => [
		kbd.textContent, kbd.id, kbd.dataset.otherKey, kbd.dataset.onShift
	].filter(v => v)),

	search = (keyName, typeIfFound = false) => {
		const kbd = kbds[keys.findIndex(keyNames => keyNames.includes(keyName))];

		if (typeIfFound && kbd) {
			kbd.classList.add("onType");
			setTimeout(() => kbd.classList.remove("onType"), 100);
		}
		return kbd;
	};
	return {search};
})();



const Sounds = (() => { // Safariでの処理落ちを防ぐ
	if (window.webkitAudioContext) window.AudioContext = new window.webkitAudioContext();

	function SE(name) {
		this.sources = [...Array(10)].map(() => new Audio(`/src/typing/${name}.aac`));
		this.playCount = 0;
	}
	SE.prototype.play = function() {
		this.sources[this.playCount++ % 10].play();
	}
	return {
		correct: new SE("correct"),
		incorrect: new SE("incorrect"),
	};
})();