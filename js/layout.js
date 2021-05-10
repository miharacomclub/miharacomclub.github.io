document.addEventListener("keydown", event => {
	if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
	const dialog = $("#dialog.open");

	if (event.key === "Escape" && dialog) {
		dialog.classList.remove("open");

	} else if (/Arrow(Left|Right)/.test(event.key) && !dialog) {
		$("#yearSlider").value -= event.key.includes("Left")? 1: -1;
		updateLayout();

	} else return;
	event.preventDefault();
});


document.addEventListener("click", event => {
	event.target.matches("#dialog, #close") && $("#dialog").classList.remove("open");
	if (!event.target.matches("[data-captions] > *")) return;

	const g = event.target.parentNode;
	$("#dialog h3").textContent = g.dataset.title || $("text", g).textContent;
	$("#slider").innerHTML = "";

	const specialNames = (g.dataset.specialImgNames || "").split(",");
	for (const [i, caption] of g.dataset.captions.split(",").entries()) {

		const imgName = specialNames[i] || g.dataset.imgName + (i + 1);
		const img = `<img src="/src/buildings/${imgName}.jpg">`;

		$("#slider").innerHTML += `
			<input type="radio" name="slide" class="tabbable" id="slide${i + 1}" ${i? "": "checked"}>
			<label for="slide${i + 1}">${img}</label>
			<figure><a>${img}</a><figcaption>${caption}</figcaption></figure>`;
	}

	$("#slider").innerHTML += `<div id="btns"></div>`;
	$("#btns").append(...$$("#slider label").map(label => label.cloneNode(false)));

	// スライドが2枚のとき、ボタンが足らなくなるので増やす
	if ($$("#btns label").length === 2) $("#btns").innerHTML += $("#btns").innerHTML;

	$("#dialog").style.left = "";
	$("#dialog").classList.add("open");
	openImgInNewTabOnClick($("#slider"));
});


const years = [...new Set(
	$$("[data-range]").reduce((yearsStr, el) => `${yearsStr},${el.dataset.range}`, "").split(",")
)].filter(v => v).map(v => +v).sort();

$("#yearSlider").value = $("#yearSlider").max = years.length - 1;
const hash  = +location.hash.slice(1);
if (hash) $("#yearSlider").value = [...years, 9999].findIndex(v => hash < v) - 1;


let bgPhotoEl;

const updateLayout = () => {
	const year = years[+$("#yearSlider").value];
	const generateYearTspans = (ad, jp) => `<tspan class="ad">${ad}</tspan><tspan class="jp">${jp}</tspan>`;

	$("#year").innerHTML = `（${
		+$("#yearSlider").value < +$("#yearSlider").max
		? generateYearTspans(year + "年", parseJpDateStr("" + year)[1])
		: "現在"
	}）`;
	for (const el of $$("[data-range]")) {
		const range = `${el.dataset.range},9999`.split(",");
		el.classList[+range[0] <= year && year < +range[1]? "add": "remove"]("exists");
	}
	if (bgPhotoEl === (bgPhotoEl = $$("img.exists").pop())) return;


	const dateTaken = bgPhotoEl.src.replace(/.+?(\d+)-?0?(\d*)\.jpg$/, "$1年$2月");
	const [ymd, jpYearTaken] = parseJpDateStr(dateTaken);
	$("#dateTaken").innerHTML = `${generateYearTspans(ymd[0] + "年", jpYearTaken)}${ymd[1]? ymd[1] + "月": ""}撮影`;

	$("#dateTaken").parentNode.setAttributeNS("http://www.w3.org/1999/xlink", "href", bgPhotoEl.getAttribute("src"));
	$("#citation" ).parentNode.setAttributeNS("http://www.w3.org/1999/xlink", "href", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=" + bgPhotoEl.dataset.mappsId);
	$$("#citation~*").forEach(icon => icon.setAttribute("x", $("#citation").getStartPositionOfChar(0).x - 19));
};

$("#yearSlider").addEventListener("input", updateLayout);
updateLayout();
$("#layout").style.opacity = 1;