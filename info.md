# Vivint/Vivotek Video Doorbell Card for Lovelace

This is a Lovelace based Doorbell Card for Home Assistant that is for use with a Vivint/Vivotek Video Doorbell that has been setup for local use (in other words, is no longer part of the Vivint ecosystem). It allows the user to view the current video image from the doorbell, and with the press of a button, it can also place a SIP call to the Doorbell via Asterisk.  Note: As the Vivint Doorbell uses the software from Vivotek, this card should work with any Vivotek camera that has a speaker and microphone, and in theory, this should work with any camera that supports SIP.

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)

This card is a modified version of the Ronald Dehuysser's [rdehuyss](https://github.com/rdehuyss/DoorDroid) DoorDroid Card.  It has been modified to place a SIP call from the card to the doorbell. The ability to call this card from some other SIP client (such as the DoorDroid) still remains, however the buttons to Accept or Reject the incoming call do not show up until the call comes in.

The Vivint/Vivotek Doorbell supports SIP, but only for a 1-way call to the doorbell.  The Vivint/Vivotek Doorbell does send audio in the reverse direction using RTSP (muxed with the video), but Home Assistant does not support carrying the reverse audio.  A companion project [app_rtsp_sip](https://github.com/tommyjlong/app_rtsp_sip) provides an Asterisk application that can be used to call the doorbell, send SIP audio to the doorbell, plus extract the reverse audio from the doorbell's RTSP stream and insert it into the calling SIP channel which, in this case is the Vivint Doorbell Card.  In effect, the companion project allows the DoorVivint Card to setup a two-way audio channel to the Vivint/Vivotek Video Doorbell.

An example of what the card would look like:



![DoorVivint Card](https://github.com/tommyjlong/doorvivint-card/blob/master/DoorVivint-Card.jpg?raw=true)

# Installation:
The recommended way to install is to use HACS. Alternatively, this can be manually installed.

## HACS
- Go to the HACS Settings (look for 3 vertical dots), and under ADD CUSTOM RESPOSITORY, paste ```https://github.com/tommyjlong/doorvivint-card ```, and chose ```Lovelace``` (or ```Plugin```) for the Category.  Hit Add (or Save), and a new entry titled **Doorvivint Card** should now be present.  
- Click on this new entry and a page should appear which will allow you to install this.  Now install it.
- Make sure to follow the instructions at the very bottom of the page for adding the url and type to the lovelace resource configuration.   It should be something like:
```yaml
  - url: /hacsfiles/doorvivint-card/jssip-3.5.3.min.js
    type: js
  - url: /hacsfiles/doorvivint-card/doorvivint-card.js
    type: module
```


## Manually: 
If you want to manually install, check out this [README.md](https://github.com/tommyjlong/doorvivint-card/blob/master/README.md).

# Lovelace Configuration:

When adding a card, make the type `custom:doorvivint-card`:

Here is an example:
```yaml
- title: Doorbell
  cards:
    - type: custom:doorvivint-card
      camera_entity: camera.YOUR_HA_DOORBELL_CAMERA_NAME
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
- ```sip_username:```  (See ```sip_server```).  This is also the extension phone number that Asterisk will associate with the DoorVivint WebRTC Client.
- ```sip_password:``` This is used as part of the SIP Authentication with Asterisk.
- ```sip_wss_url:``` This is the websocket URL to connect to Asterisk's websocket server. From the example, the browser client will attempt to connect to Asterisk using a TLS websocket to your external world's domain/IP address (my.duckdns.org) using port 8089.  If a NAT router is used,  it should be setup to "Port Forward" this to your Asterisk Local Area Network name/address using the `tlsbindaddr` websocket port (See below).
- ```sip_doorbell_username:``` This is part of the destination doorbell's SIP URI. ```sip:sip_doorbell_username@sip_doorbell_domain```.  From our example, this will become: ```sip:101@192.168.1.6```.
- ```sip_doorbell_domain:```  This is the SIP domain, which in this case is the Local Area Network name/address of the Asterisk Server. (See also ```sip_doorbell_username```)

# Asterisk Configuration: 
Check out this [README.md](https://github.com/tommyjlong/doorvivint-card/blob/master/README.md).
