Code for setting up rocket.chat integration


## Rocket.Chat


To install the chat server - Make a debian box and run:

```
sudo apt install snapd
sudo snap install rocketchat-server
```

It will be available on port :3000

To setup a rocket.chat server:

1) Go to your admin page e.g. http://35.232.236.127:3000/admin/Accounts
2) Click iframe -> allow embedding
3) Save

Recs:

* Turn off rate limiting.

## Chat Server Configuration (config.yml - Don't check in)


```
username: `<admin username>`
password: `<password>`
server: `<server url>`
```
