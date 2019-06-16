const screens = {};
class Screen {
	constructor(el) {
		this.style = el.style;
	}
	isVisible() {
		return this.style.display !== "none";
	}
	show() {
		for (const scr of Object.values(screens)) {
			scr.style.display = scr === this? "": "none";
		}
	}
}
for (const scr of $$("[id$=Screen]")) {
	screens[scr.id.replace("Screen", "")] = new Screen(scr);
}
screens.selection.show();



const storage = JSON.parse(localStorage.getItem("typing")) || {};

const storeHighScore = score => {
	if (!storage.highScore || storage.highScore < score) {
		storage.highScore = score;
		localStorage.setItem("typing", JSON.stringify(storage));
	}
	$("#rankList").dataset.score = storage.highScore;
	$("#rankList").style.setProperty("--high-score", storage.highScore);
};
storeHighScore(0);


// keyは整数なので、自動で昇順に並び替えられる
const rankNamesAndColors = {};

for (const item of $$("[data-required-kps]")) {
	const rankName      = item.textContent.trim();
	const rankColor     = item.style.getPropertyValue("color");
	const requiredScore = +item.style.getPropertyValue("--required-score");

	if (rankName.length > 1) {
		rankNamesAndColors[requiredScore] = [rankName, rankColor];
		continue;
	}
	const suffixes = ["-","","+","++"];
	const scoreMax = requiredScore + +item.style.getPropertyValue("--score-range");

	for (let score = requiredScore; score < scoreMax; score += 25) {
		rankNamesAndColors[score] = [rankName + suffixes.shift(), rankColor];
	}
}



const updateTypingResults = typingSkills => {
	const [keystrokes, typos, time] = typingSkills;
	const kps      = keystrokes / time;
	const kpm      = kps * 60;
	const accuracy = keystrokes / (keystrokes + typos);
	const score    = Math.round(kpm * accuracy ** 2);

	const [rankName, rankColor] = rankNamesAndColors[
		Object.keys(rankNamesAndColors).reverse().find(value => value <= score)
	];
	const roundOff   = num => Math.round(num * 10) / 10;
	const ddContents = [
		score, rankName,
		roundOff(time), keystrokes, roundOff(kps),
		roundOff(accuracy * 100), typos, Math.round(kpm)
	];

	for (const dd of $$("#resultsFrame dd")) {
		dd.textContent = ddContents.shift();
	}
	$("#rankName").style.color = rankColor;
	storeHighScore(score);
};



import Typing from "./type.js";

const readyTyping = async clickedBtn => {
	const category = $("[name=tab]:checked").id;
	const tsvData = clickedBtn.dataset;

	const tsv = (await Promise.all(
		$$(`[data-tsv-name^="${tsvData.tsvName}"]:not([data-multiple-tsvs])`).map(btn =>
			fetch(`/src/typing/${category}/${btn.dataset.tsvName}.tsv`)
			.then(response => response.ok? response.text(): "")
		)
	)).filter(v => v).join("\n");
	if (!tsv) return;

	Typing.init(
		clickedBtn.textContent,
		tsv,
		!("inOrder" in tsvData || category === "long"),
		"multipleTsvs" in tsvData && 20
	);
	screens.typing.show();
};


// return truthy → preventDefault
const onKeyDown = key => {
	if (screens.typing.isVisible()) {

		const result = Typing.onKeyDown(key);
		if (key === "Escape" && !result) {
			screens.selection.show();
			return true;
		}
		if (!Array.isArray(result)) return result;

		updateTypingResults(result);
		screens.results.show();
		return true;

	} else if (screens.results.isVisible()) {
		if (key === "Escape") {
			screens.selection.show();
			return true;
		} else if (key === " ") {
			screens.typing.show();
			return true;
		}
	}
};


if (navigator.userAgent.match(/(iPhone|iPad|iPod|Android|Tablet|Mobile)/i)) {
    onlyIE.textContent = "このゲームはパソコンでお楽しみください。";
	onlyIE.style.display = "block";

} else {
	document.addEventListener("click", event => {
		const el = event.target;
		
		if (el.matches("[data-event-key]")) {
			onKeyDown(el.dataset.eventKey);
		} else if (el.matches("button")) {
			readyTyping(el);
		}
	});
	document.addEventListener("keydown", event => {
		!(event.ctrlKey || event.metaKey || event.altKey) &&
		onKeyDown(event.key) && event.preventDefault();
	});
}