window.onload = async () => {
  const auth0 = await createAuth0Client({
    domain: auth0_domain,
    client_id: auth0_client_id,
  });
  try {
    await auth0.getTokenSilently();
  } catch (error) {
    if (error.error !== "login_required") {
      throw error;
    }
    if (window.location.href.includes("index.html")) {
      await auth0.loginWithRedirect({
        redirect_uri: window.location.href,
      });
    } else {
      window.location.href = "index.html";
    }
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    // Process the login state
    await auth0.handleRedirectCallback();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
  }
};
