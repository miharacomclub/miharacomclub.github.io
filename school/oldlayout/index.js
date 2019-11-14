const updateLayout = () => {
	const y = +$("#range").value;

	for (const el of $$("[data-period]")) {
		const period = `${el.dataset.period},9999`.split(",");
		el.style.display = (period[0] <= y && y <= period[1])? "block": "none";
	}

	const photoYear = ["1947-10","1968-05","1970-06","1975-03","1982-01","1986-04","2004-04"][
		[1951,1968,1972,1978,1984,1989,1990].findIndex(v => y <= v)
	] || "2009";

	$("#aerialPhoto image").setAttribute("xlink:href", `/src/buildings/${photoYear}.jpg`);
	$("#aerialPhoto text").textContent = `${photoYear.slice(0, 4)}年撮影`;
	$("#currentYear").textContent      = `（${y < $("#range").max? y + "年": "現在"}）`;
};


const displayDialogOnClick = event => {
	if (!event.target.matches("[data-captions] .building, [data-captions] .cover")) return;

	const g = event.target.parentNode;
	$("dialog h3").textContent = $("text:last-of-type", g).textContent;
	$("#slider").innerHTML     = "";

	const specialNames = (g.dataset.specialImgNames || "").split(",");

	for (const [i, caption] of g.dataset.captions.split(",").entries()) {

		const img = `<img src=/src/buildings/${specialNames[i] || g.dataset.imgName + (i + 1)}.jpg`;
		$("#slider").innerHTML += `
			<input type="radio" name="slide" class="tabbable" id="slide${i + 1}" ${i? "": "checked"}>
			<label for="slide${i + 1}">${img}</label>
			<figure>
				<a>${img}</a>
				<figcaption>${caption}</figcaption>
			</figure>`;
	}

	$("#slider").innerHTML += `<div id="btns"></div>`;
	$("#btns").append(...$$("#slider label").map(label => label.cloneNode(false)));

	// スライドが2枚のとき、ボタンが足らなくなるので増やす
	if ($$("#btns label").length === 2) $("#btns").innerHTML += $("#btns").innerHTML;

	$("dialog").setAttribute("open", "");
	openImgInNewTabOnClick($("#slider"));
}


if (location.hash) $("#range").value = location.hash.slice(1);
updateLayout();

$("#range").addEventListener("input", updateLayout);
document.addEventListener("click", displayDialogOnClick);

for (const el of $$("dialog, #close")) {
	el.addEventListener("click", event =>
		event.target === event.currentTarget && $("dialog").removeAttribute("open")
	);
}
document.addEventListener("keydown", event =>
	event.key === "Escape" && $("dialog").removeAttribute("open") // , event.preventDefault();
);