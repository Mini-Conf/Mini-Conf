const allow_cookies = Cookies.get('allow-cookies');

if (!allow_cookies) {
    $('.gdpr').show();
}
$('.gdpr-btn').on('click',
  () => {
      Cookies.set('allow-cookies', 1, {expires: 7})
      $('.gdpr').hide();
  })
