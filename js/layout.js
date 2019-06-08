const updateLayout = () => {
	const y = +$("#range").value;

	for (const el of $$("[data-period]")) {
		const period = `${el.dataset.period},9999`.split(",");
		el.style.display = period[0] <= y && y <= period[1]? "block": "none";
	}
	const photoYear = [1947,1968,1970,1975,1982,1986,2004][
		[1951,1968,1972,1978,1984,1989,1990].findIndex(v => y <= v)
	] || 2009;

	$("#aerialPhoto image").setAttribute("xlink:href", `/src/aerial/${photoYear}.jpg`);
	$("#aerialPhoto text").textContent = `${photoYear}年撮影`;
	
	$("#currentYear").textContent = `（${y < $("#range").max? y + "年": "現在"}）`;
};


if (location.hash) $("#range").value = location.hash.slice(1);
$("#range").addEventListener("input", updateLayout);
updateLayout();
$("#displayDialog").checked = false;


document.addEventListener("click", event => {
	if (!event.target.matches("[data-captions] .building, [data-captions] .cover")) return;

	const g = event.target.parentNode;
	$("#dialog h3").textContent = $("text:last-of-type", g).textContent;
	$("#slider").innerHTML = "";

	for (const [i, caption] of g.dataset.captions.split(",").entries()) {
		const img = `<img src=/src/buildings/${g.dataset.imgName}${i + 1}.jpg>`;
		$("#slider").innerHTML += `
			<input type=radio name=slide id=slide${i + 1}${i? "": " checked"}>
			<label for=slide${i + 1}>${img}</label>
			<figure><a>${img}</a><figcaption>${caption}</figcaption></figure>`;
	}

	$("#slider").innerHTML += "<div id=btns></div>";
	$("#btns").append(...$$("#slider label").map(label => label.cloneNode(false)));
	if ($$("#btns label").length === 2) $("#btns").innerHTML += $("#btns").innerHTML;

	$("#displayDialog").checked = true;
	enableToOpenImgOnClick($("#slider"));
});