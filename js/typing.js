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
	if ((storage.highScore || -1) < score) {
		storage.highScore = score;
		localStorage.setItem("typing", JSON.stringify(storage));
	}
	$("#rankList").dataset.score = storage.highScore;
	$("#rankList").style.setProperty("--high-score", storage.highScore);
};
storeHighScore(0);

// keyは整数なので、自動で昇順に並び替えられる
const rankNamesAndColors = {};

$$("#rankList li").reduce((superior, item) => {
	const rankName		= item.textContent.trim();
	const rankColor		= item.style.color;
	const requiredScore	= +item.style.getPropertyValue("--required-score");
	const superiorScore	= +superior.style.getPropertyValue("--required-score") || 950;

	item.dataset.score	= requiredScore;
	item.dataset.requiredKps = Math.round(requiredScore / 60 / 0.97 ** 2 * 10) / 10;
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


const showResultsScreen = (keystrokes, typos, time) => {
	const kps		= keystrokes / time;
	const kpm		= kps * 60;
	const accuracy	= keystrokes / (keystrokes + typos);
	
	const score		= Math.round(kpm * accuracy ** 2);
	const [rankName, rankColor] = rankNamesAndColors[
		Object.keys(rankNamesAndColors).reverse().find(value => value <= score)
	];

	const roundOff	= num => Math.round(num * 10) / 10;
	const ddValues	= [score, rankName,
		roundOff(time), keystrokes, roundOff(kps),
		roundOff(accuracy * 100), typos, Math.round(kpm)
	];
	for (const dd of $$("#resultsFrame dd")) dd.textContent = ddValues.shift();
	
	$("#rankName").style.color = rankColor;
	storeHighScore(score);
	screens.results.show();
};


import TypeJS from "./type.js";

const prepareGame = async clickedBtn => {
	const category = $("[name=tab]:checked").id;
	const btns = $$(`[data-tsv-name^="${clickedBtn.dataset.tsvName}"]`);
	if (btns.length > 1) btns.pop();
	
	const tsv = (await Promise.all(btns.map(btn =>
		fetch(`/src/typing/${category}/${btn.dataset.tsvName}.tsv`).then(resp => resp.ok && resp.text())
	))).filter(v => v);
	if (tsv.length === 0) return;
	
	TypeJS.init(
		clickedBtn.textContent,
		tsv.join("\n"),
		!("inOrder" in clickedBtn.dataset || category === "long"),
		tsv.length > 1 && 20
	);
	screens.typing.show();
};


// return truthy → preventDefault
const onKeyDown = key => {
	if (screens.typing.isVisible()) {
		const result = TypeJS.onKeyDown(key);

		if (key === "Escape" && !result) {
			screens.selection.show();
			return true;
		}
		Array.isArray(result) && showResultsScreen(...result);
		return result;

	} else if (screens.results.isVisible() && [" ", "Escape"].includes(key)) {
		screens[key === " "? "typing": "selection"].show();
		return true;
	}
};


if (/(Phone|iPad|iPod|Android|Tablet|Mobile|Touch)/i.test(navigator.userAgent)) {
	$("#about + section strong").style.display = "";
	
} else {
	document.addEventListener("click", event => {
		const el = event.target;
		if (el.matches("[data-event-key]")) {
			onKeyDown(el.dataset.eventKey);
		} else if (el.matches("button")) {
			prepareGame(el);
		}
	});

	document.addEventListener("keydown", event => {
		if (event.key === "Shift") {
			TypeJS.onShiftStateChange(true);		
		} else if (!(event.ctrlKey || event.metaKey || event.altKey)) {
			onKeyDown(event.key) && event.preventDefault();
		}
	});
	
	document.addEventListener("keyup", event => {
		event.key === "Shift" && TypeJS.onShiftStateChange(false);
	});
}