document.addEventListener("keydown", event => {
	if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
	const dialog = $("#dialog.open");

	if (event.key === "Escape" && dialog) {
		dialog.classList.remove("open");

	} else if (/Arrow(Left|Right)/.test(event.key) && !dialog) {
		$("#range").value -= event.key.includes("Left")? 1: -1;
		updateLayout();

	} else return;
	event.preventDefault();
});


document.addEventListener("click", event => {
	event.target.matches("#dialog, #close") && $("#dialog").classList.remove("open");
	if (!event.target.matches("[data-captions] > *")) return;

	const g = event.target.parentNode;
	$("#dialog h3").textContent	= g.dataset.title || $("text", g).textContent;
	$("#slider").innerHTML = "";

	const specialNames = (g.dataset.specialImgNames || "").split(",");
	for (const [i, caption] of g.dataset.captions.split(",").entries()) {

		const imgName = specialNames[i] || g.dataset.imgNamePrefix + (i + 1);
		const img = `<img src="/src/buildings/${imgName}.jpg">`;

		$("#slider").innerHTML += `
			<input type="radio" name="slide" id="slide${i + 1}" ${i? "": "checked"}>
			<label for="slide${i + 1}">${img}</label>
			<figure><a>${img}</a><figcaption>${caption}</figcaption></figure>`;
	}

	$("#slider").innerHTML += `<div id="btns"></div>`;
	$("#btns").append(...$$("#slider label").map(label => label.cloneNode(false)));

	// スライドが2枚のとき、ボタンが足らなくなるので増やす
	if ($$("#btns label").length === 2) $("#btns").innerHTML += $("#btns").innerHTML;

	$("#dialog").style.visibility = "visible";
	$("#dialog").classList.add("open");
	openImgInNewTabOnClick($("#slider"));
});



const years = [...new Set($$("[data-period]").reduce((str, el) => `${str},${el.dataset.period}`, "").split(","))]
			.filter(v => v).map(v => +v).sort();
range.value = range.max = years.length - 1;

const hash = +location.hash.slice(1);
if (hash) range.value = [...years, 9999].findIndex(v => hash < v) - 1;

let photo;
const updateLayout = () => {
	const y = years[+range.value];
	$("#year").textContent = `（${+range.value < +range.max? y + "年": "現在"}）`;

	for (const el of $$("[data-period]")) {
		const period = `${el.dataset.period},9999`.split(",");
		el.classList[+period[0] <= y && y < +period[1]? "add": "remove"]("exists");
	}

	if (photo === (photo = $$("a.exists img").pop())) return;
	$("#dateTaken").textContent = photo.src.replace(/.+?(\d+)-?0?(\d*)\.jpg$/, "$1年$2月撮影").replace("年月", "年");

	const source = photo.dataset.mappsId
		? ["地図・空中写真閲覧サービス", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=" + photo.dataset.mappsId]
		: ["地理院地図", "https://maps.gsi.go.jp/#17/34.282055/134.781588/&ls=std|airphoto"];

	$("#citation").textContent = `『${source[0]}』より作成`;
	$("svg a").setAttributeNS("http://www.w3.org/1999/xlink", "href", source[1]);
};

range.addEventListener("input", updateLayout);
updateLayout();
$("#layout").style.opacity = 1;