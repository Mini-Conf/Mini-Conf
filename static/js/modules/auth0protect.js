let auth0 = null;

window.onload = async () => {
  auth0 = await createAuth0Client({
    domain: auth0_domain,
    client_id: auth0_client_id,
  });

  updateUI();

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    updateUI();
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    // Process the login state
    await auth0.handleRedirectCallback();
    updateUI();
    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
  }

  if (window.location.href.includes("live.html") && !isAuthenticated) {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.href,
    });
  }
};

const updateUI = async () => {
  const isAuthenticated = await auth0.isAuthenticated();
  let gatedContent = document.getElementById("gated-content");

  // NEW - add logic to show/hide gated content after authentication
  if (isAuthenticated) {
    if (gatedContent) gatedContent.classList.remove("hidden");
  } else {
    if (gatedContent) gatedContent.classList.add("hidden");
  }
};

const loginToggle = async () => {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    await auth0.logout({
      returnTo: window.location.origin
    });
  } else {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin
    });
  }
};
