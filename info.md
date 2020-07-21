# Vivint/Vivotek Video Doorbell Card for Lovelace

This is a Lovelace based Doorbell Card for Home Assistant that is for use with a Vivint/Vivotek Video Doorbell that has been configured for local use. It allows the user to view the current video image from the doorbell, and with the press of a button, it can also place a SIP call to the Doorbell via Asterisk.  Note: As the Vivint Doorbell uses the software from Vivotek, this card should work with any Vivotek camera that has a speaker and microphone, and in theory, this should work with any camera that supports SIP.

For details, check out this [README.md](https://github.com/tommyjlong/doorvivint-card/blob/master/README.md).

An example of what the card would look like:


![DoorVivint Card](https://github.com/tommyjlong/doorvivint-card/blob/master/DoorVivint-Card.jpg?raw=true)


# Installation:
## HACS

- Go to the HACS Settings, and under ADD CUSTOM RESPOSITORY, paste ```https://github.com/tommyjlong/doorvivint-card ```, and chose ```Plugin``` for the Category.  Hit save, and a new entry titled **[plugin]
tommyjlong/doorvivint-card** should be created under CUSTOM REPOSITORY.  
- Click on the new entry and a page should appear which will allow you to install this.  
- Make sure to follow the instructions at the very bottom of the page for adding the url and type to the lovelace configuration.


## Manually: 
If you want to manually install, check out this [README.md](https://github.com/tommyjlong/doorvivint-card/blob/master/README.md).

# Lovelace Configuration:

When adding a card, make the type `custom:doorvivint-card`:

Here is an example:
```yaml
- title: Doorbell
  cards:
    - type: custom:doorvivint-card
      camera_entity: camera.YOUR_CAMERA_NAME
      title: null
      sip_settings:
        sip_server: my.duckdns.org 
        sip_username: '1001'
        sip_password: mypassword 
        sip_wss_url: 'wss://my.duckdns.org:8089/ws'
        sip_doorbell_username: '101'
        sip_doorbell_domain: '192.168.1.6' #Asterisk LAN IP address
      style: |
          ha-card {
            display: block;
            margin-left: auto;
            margin-right: auto;
            width: 88%;
          }

```
- ```sip_server:``` This is part of the Browser's WebRTC Client SIP URI:  ```sip:sip_username@sip_server``` which is used by SIP to identify itself to Asterisk.  From our example this will become: ```sip:1001@my.duckdns.org```
- ```sip_username:```  (See ```sip_server```)
- ```sip_password:``` This is used as part of the SIP Authentication with Asterisk.
- ```sip_wss_url:``` This is the websocket URL to connect to Asterisk's websocket server. From the example, the browser client will attempt to connect to Asterisk using a TLS websocket to your external world's domain/IP address (my.duckdns.org) using port 8089.
- ```sip_doorbell_username:``` This is part of the destination doorbell's SIP URI. ```sip:sip_doorbell_username@sip_doorbell_domain```.  From our example, this will become: ```sip:101@192.168.1.6```.
- ```sip_doorbell_domain:```  (See ```sip_doorbell_username```)


