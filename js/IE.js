var h2 = document.getElementsByTagName("h2")[0];

if (/trident/i.test(navigator.userAgent)) {
	h2.outerHTML +=
		'<p class="warning">' +
			'現在お使いのブラウザでは、一部機能がご利用になれません。<br>' +
			'<a target="_blank" rel="noopner" href="https://www.google.com/intl/ja_ALL/chrome/">Google Chrome</a>や、' +
			'<a target="_blank" rel="noopner" href="https://www.mozilla.org/ja/firefox/new/" class="nowrap">Firefox</a>などのブラウザをお使いください。' +
		'</p>';
}

if (new Date() < new Date('2020/10/1')) {
	if (location.search.indexOf("from=webcrow") > -1 || h2.textContent === 'トップページ') {
		h2.outerHTML +=
			'<p class="warning">' +
				'<time datetime="2020-09-30">2020年9月30日</time>に、旧URL（http://miharacomb.webcrow.jp）から<br>' +
				'現URL（https://miharacomclub.github.io）へのリダイレクトを終了します。' +
			'</p>';
	}
}