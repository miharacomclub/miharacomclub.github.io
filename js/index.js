window.addEventListener("touchstart", () => {}); // iOS Safariの:hoverを有効にする
window.$  = (selector, target = document) => target.querySelector(selector);
window.$$ = (selector, target = document) => [...target.querySelectorAll(selector)];


window.openImgInNewTabOnClick = (target = document) => {
	for (const a of $$("a:not([href]):not([target])", target)) {
		Object.assign(a, {
			href  : $("img", a).getAttribute("src"), // a.srcは絶対パスを返す
			target: "_blank"
		});
		a.classList.add("enlargeable");
	}
};


const complementTimeElAttrs = (target = document) => {
	for (const timeEl of $$("time:not([datetime])", target)) {

		const jpDateStr = (timeEl.dataset.datePrefix || "").replace(
			/-*$/, hyphens => timeEl.textContent.slice(hyphens.length)
		);
		const [ymd, yearValue] = parseJpDateStr(jpDateStr);
		const isoDateStr       = ymd.join("-0").replace(/-0(\d\d)/g, "-$1");
		timeEl.setAttribute("datetime", isoDateStr);

		// [data-tooltip]内は、改行されないため短くする
		timeEl.innerHTML  = timeEl.innerHTML.replace(/(.+年度?)([^度]+)/, "<span>$1</span>$2");
		const tooltipedEl = $("span", timeEl) || timeEl;
		tooltipedEl.dataset.tooltip = yearValue;
	}
};


window.parseJpDateStr = jpDateStr => {
	const eraNames     = "令和,平成,昭和,大正,明治,天明".split(",");
	const zerothYears  = [2018,1988,1925,1911,1867,1780];
	const splitIntoYmd = dateStr => dateStr.split(/年度?|月|日/).filter(v => v);
	const yearUnit     = `${jpDateStr}年`.match(/年度?/)[0];

	if (+jpDateStr[0]) {
		const ymd      = splitIntoYmd(jpDateStr).map(v => +v);
		const eraIndex = zerothYears.findIndex(v => v < ymd[0]);

		let jpYear = ymd[0] - zerothYears[eraIndex];
		if (jpYear === 1) jpYear = "元";
		return [ymd, eraNames[eraIndex] + jpYear + yearUnit];
	}

	// 二十三 → (2)1?0(3) → 23
	const ymd = splitIntoYmd(jpDateStr.slice(2)).map(v => +v
		.replace(/\D/g, kanji => "元一二三四五六七八九十".indexOf(kanji) || 1)
		.replace(/(\d)\d?\d(\d)/, "$1$2")
	);
	const eraIndex = eraNames.indexOf(jpDateStr.slice(0, 2));
	ymd[0] += zerothYears[eraIndex];
	return [ymd, ymd[0] + yearUnit];
};


openImgInNewTabOnClick();
complementTimeElAttrs();



const isIframeSameOrigin = iframe => {
	try {return iframe.contentDocument} catch(e){}
};

for (const iframe of $$(`iframe:not([src*="."])`)) {
	iframe.addEventListener("load", () => {
		if (!isIframeSameOrigin(iframe)) return;
		openImgInNewTabOnClick(iframe.contentDocument);
		complementTimeElAttrs(iframe.contentDocument);
	});
}
for (const tooltip of $$("[data-tooltip]")) {
	tooltip.insertAdjacentElement("beforebegin", document.createElement("wbr"));
}


window.mailform && mailform.contentWindow.addEventListener("submit", () => {$("address").classList.add("submited")});