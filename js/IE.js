var h2 = document.getElementsByTagName("h2")[0];

if (/trident/i.test(navigator.userAgent)) {
	h2.outerHTML +=
		'<p class="warning">' +
			'現在お使いのブラウザでは、一部機能がご利用になれません。<br>' +
			'<a target="_blank" rel="noopner" href="https://www.google.com/intl/ja_ALL/chrome/">Google Chrome</a>や、' +
			'<a target="_blank" rel="noopner" href="https://www.mozilla.org/ja/firefox/new/" class="nowrap">Firefox</a>などのブラウザをお使いください。' +
		'</p>';
}

if (new Date() < new Date('2020/7/1')) {
	if (location.search.indexOf("from=webcrow") > -1) {
		h2.outerHTML +=
			'<p class="warning">' +
				'<time datetime="2020-06-30">2020年6月30日</time>をもって、旧URLのリダイレクトを終了します。' +
			'</p>';
	}
}