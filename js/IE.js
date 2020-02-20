if (/trident/i.test(navigator.userAgent)) document.getElementsByTagName("h2")[0].outerHTML +=
'<p style="font-weight:bold;background:lavender;padding:1em;">現在お使いのブラウザでは、一部機能がご利用になれません。<br>' +
'<a target="_blank" href="https://www.google.com/intl/ja_ALL/chrome/">Google Chrome</a>や、' +
'<a target="_blank" href="https://www.mozilla.org/ja/firefox/new/" class="nowrap">Firefox</a>などのブラウザをお使いください。</p>';