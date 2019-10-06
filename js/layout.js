const years = [51,52,53,54,55,56,58,61,62,64,69,73,74,76,79,80,82,83,84,85,86,90,107].map(v => 1900 + v);
range.value = range.max = years.length - 1;

const sources = {
	1947: ["10月", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=219827"],
	1968: ["5月", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=664551"],
	1970: ["6月", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=409019"],
	1975: ["3月", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=944865"],
	1982: ["1月", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=208420"],
	1986: ["4月", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=339788"],
	2004: ["4月", "https://mapps.gsi.go.jp/maplibSearch.do?specificationId=21633"],
	2007: ["以降", "https://maps.gsi.go.jp/#17/34.282055/134.781588/&ls=std|airphoto"],
};

const updateLayout = () => {
	const y = years[+range.value];
	$("#year").textContent = `（${+range.value < +range.max? y + "年": "現在"}）`;

	for (const g of $$("g")) {
		const period = `${g.dataset.period},9999`.split(",");
		g.classList[(+period[0] <= y && y < +period[1])? "add": "remove"]("exists");
	}

	const photoYears	= Object.keys(sources);
	const photoIndex	= [1952,1969,1973,1980,1985,1990,2007].findIndex(v => y < v);
	const photoYear		= photoYears[photoIndex] || photoYears[photoYears.length - 1];
	const photoWrapper	= $(".lastPhotoWrapper");

	if (photoWrapper && photoWrapper.children[0].src.includes(photoYear)) return;
	photoWrapper && photoWrapper.classList.remove("lastPhotoWrapper");

	$(`[src*="/${photoYear}.jpg"]`).parentNode.classList.add("lastPhotoWrapper");
	$("#yearTaken").textContent = `${photoYear}年${sources[photoYear][0]}撮影`;

	const source = sources[photoYear][1];
	const sourceTitle = source.includes("maplibSearch")? "地図・空中写真閲覧サービス": "地理院地図";
	$("#source").textContent = `『${sourceTitle}』より作成`;
	$("#source").parentNode.setAttributeNS("http://www.w3.org/1999/xlink", "href", source);
};


const hash = +location.hash.slice(1);
if (hash) range.value = Math.max(years.findIndex(v => hash < v), 0) || +range.max;

updateLayout();
range.addEventListener("input", updateLayout);
$("#layout").style.opacity = 1;


document.addEventListener("keydown", event => {
	if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;

	if (event.key === "Escape") {
		$("#dialog").classList.remove("open");
	} else if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
		$("#range").value -= event.key.includes("Left")? 1: -1;
		updateLayout();
	} else {
		return;
	}
	event.preventDefault();
});


document.addEventListener("click", event => {
	event.target.matches("#dialog, #close") && $("#dialog").classList.remove("open");
	if (!event.target.matches("[data-captions] *")) return;

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