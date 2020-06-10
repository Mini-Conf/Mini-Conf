# Rocket.Chat

## Configuration

Code for setting up rocket.chat integration


To configure a rocket.chat server:

1) Go to your admin page and search for Iframe
2) In General, turn off  "Restrict access inside any Iframe"

Troubleshooting:

* Turn off API rate limiting.

## Installation

There are three ways to install

### Rocket.Chat (expensive, free trial)

Rocket chat will host a paid server for you. You can go to their website and negotiate a per user deal.

### Sloppy.io (cheap, free trial)

1) Create an account on sloppy.io.
2) Click "Upload json" and use the `sloppy.json` config file in this repo.
3) Start the mongo server and then the rocket chat server through their UI.

You can then click the link to go to your chat server.


### Manual (no https, a bit dangerous)

To install the chat server - Make a debian box and run:

```
sudo apt install snapd
sudo snap install rocketchat-server
```

It will be available on port :3000

## OAuth

We recommend using Auth0 with OAuth for single sign-on.

See this post for setting up rocket.chat

https://forums.rocket.chat/t/anyone-auth0-sso-experience/2060/6


## Scripts

`make_poster_rooms.py` -> for creating a chat room for each poster.


## Chat Server Configuration (config.yml - Don't check in)


```
username: `<admin username>`
password: `<password>`
server: `<server url>`
```
