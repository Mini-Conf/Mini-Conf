const allow_cookies = Cookies.get("miniconf-allow-cookies");

if (!allow_cookies) {
  $(".gdpr").show();
}
$(".gdpr-btn").on("click", () => {
  Cookies.set("miniconf-allow-cookies", 1, { expires: 7 });
  $(".gdpr").hide();
});
