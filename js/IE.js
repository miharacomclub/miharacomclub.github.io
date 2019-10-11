if (/trident/i.test(navigator.userAgent)) {
	var script = document.querySelector("script[src*='/IE.js']");
	script.outerHTML = '<p style="font-weight:bold">現在お使いのブラウザでは' + (script.dataset.level === "1"? "、一部の機能が": "") +
	'ご利用になれません。<br><a target="_blank" href="https://www.google.com/intl/ja_ALL/chrome/">Google Chrome</a>や、<a target="_blank" href="https://www.mozilla.org/ja/firefox/new/">Firefox</a>など他のブラウザをお使いください。</p>'
	document.body.innerHTML += "<style>.notIE {display: none !important;}</style>"
}