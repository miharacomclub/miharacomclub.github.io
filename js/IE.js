var h2 = document.getElementsByTagName("h2")[0];

if (/trident/i.test(navigator.userAgent) || (!CSS.supports("(vector-effect: non-scaling-stroke)") && h2.textContent === '生徒数の推移')) {
	h2.outerHTML +=
		'<p class="warning">' +
			'現在お使いのブラウザでは、一部機能がご利用になれません。<br>' +
			'<a target="_blank" rel="noopner" href="https://www.google.com/intl/ja_ALL/chrome/">Google Chrome</a>や、' +
			'<a target="_blank" rel="noopner" href="https://www.mozilla.org/ja/firefox/new/" class="nowrap">Firefox</a>などのブラウザをお使いください。' +
		'</p>';
}

if (new Date() < new Date('2020/10/1')) {
	if (/from=webcrow/.test(location.search) || h2.textContent === 'トップページ') {
		h2.outerHTML +=
			'<p class="warning">' +
				'<time>2020年9月30日</time>をもって、' +
				'<span data-tooltip="miharacomb.webcrow.jp">旧URL</span>のリダイレクトを終了します。' +
			'</p>';
	}
}