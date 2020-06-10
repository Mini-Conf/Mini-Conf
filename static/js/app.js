


window.onload = async () => {
    const auth0 = await createAuth0Client({
        domain: 'miniconf.auth0.com',
        client_id: 'JIdr6wi0z27LyLgwkJF0fpk700aj7MNH'
    });
    try {
        await auth0.getTokenSilently();
    } catch (error) {
        if (error.error !== 'login_required') {
            throw error;
        }
        await auth0.loginWithRedirect({
            redirect_uri: "http://localhost:5000"
        });
    }

    console.log(await auth0.getUser());
  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    await auth0.handleRedirectCallback();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
  }
};
