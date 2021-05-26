function getUrlParameter(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
  // eslint-disable-next-line no-restricted-globals
  const results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function setQueryStringParameter(name, value) {
  // console.log("name", name, "value", value);
  const params = new URLSearchParams(window.location.search);
  params.set(name, value);
  window.history.replaceState(
    {},
    "",
    decodeURIComponent(`${window.location.pathname}?${params}`)
  );
}
