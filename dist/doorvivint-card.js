class DoorVivintCard extends HTMLElement {
// Version number is contained in the console.info() below.

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    set hass(hass) {
        if(this.notYetInitialized()) {
            this.initJsSIPIfNecessary(hass);
            this.initCameraView(hass);
        } else if(this.cameraEntityHasNewAccessToken(hass)) {
            this.updateCameraView(hass);
        }
    }

    setConfig(config) {
        if (!config.camera_entity) {
            throw new Error('You need to define a camera entity');
        }
        if(!config.sip_settings) {
            throw new Error('You need to define the SIP settings');
        } else {
            if(!config.sip_settings.sip_wss_url) throw new Error('You need to define the SIP Secure Webservice url');
            if(!config.sip_settings.sip_server) throw new Error('You need to define the SIP Server (ip or hostname)');
            if(!config.sip_settings.sip_username) throw new Error('You need to define the SIP username');
            if(!config.sip_settings.sip_password) throw new Error('You need to define the SIP password');
        }
        this.config = config;
        const root = this.shadowRoot;
        if (root.lastChild) root.removeChild(root.lastChild);


        const card = document.createElement('ha-card');
        const content = document.createElement('div');
        const style = document.createElement('style');
        style.textContent = `
            ha-card {
                /* sample css */
            }
            .button {
                overflow: auto;
                padding: 16px;
                text-align: right;
            }
            #cameraview img{
                object-fit: cover;
                height: 400px;
            }
            mwc-button {
                margin-right: 16px;
            }
            `;
        content.innerHTML = `
        <div id='cameraview'>
            <p style="padding: 16px">Initializing SIP connection and webcam view</p>
            <audio id='audio-player'></audio>
        </div>
        <div class='button'>
        <!--<mwc-button raised id='btn-open-door'>` + 'Open the portal' + `</mwc-button> -->
            <mwc-button raised id='btn-make-call'>` + 'Call the Doorbell' + `</mwc-button>
            <mwc-button style='display:none' raised id='btn-accept-call'>` + 'Accept call' + `</mwc-button>
            <mwc-button style='display:none' raised id='btn-reject-call'>` + 'Reject call' + `</mwc-button>
            <mwc-button style='display:none' raised id='btn-end-call'>` + 'Terminate call' + `</mwc-button>
        </div>
        `;
        card.appendChild(content);
        card.appendChild(style);
        root.appendChild(card);
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return 1;
    }

    notYetInitialized() {
        return window.JsSIP && !this.sipPhone && this.config;
    }

    initJsSIPIfNecessary(hass) {
        let droidCard = this;
        console.info("%c  DoorVivint-Card  \n%c  Version 0.1.0    ","color: orange; font-weight: bold; background: black","color: white; font-weight: bold; background: dimgray");
        //If you want to add another button to perform some other action, can use the following:
//      let openDoorBtn = droidCard.getElementById('btn-open-door');
//      openDoorBtn.addEventListener('click', function(opendoor) {
//          hass.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.door' });
//      });

        // Audio
        //   Local audio stream (input from mic, output to speaker) is handled
        //   by getUserMedia which is called under the covers by JSSIP.
        //   getUserMedia checks that the user has 
        //   given permission for this code to access the mic/speaker.
        //   Remote:
        //   The html tag and element <audio> represents the peer's audio stream to listen to.
        const remoteAudio = document.createElement('audio');

        let sip_doorbell_username = this.config.sip_settings.sip_doorbell_username;
        let sip_doorbell_domain = this.config.sip_settings.sip_doorbell_domain;

        console.log('Loading SIPPhone');
        let socket = new JsSIP.WebSocketInterface(this.config.sip_settings.sip_wss_url);
        let configuration = {
            sockets  : [ socket ],
            uri      : `sip:${this.config.sip_settings.sip_username}@${this.config.sip_settings.sip_server}`,
            password : this.config.sip_settings.sip_password
        };
        //Create a new SIP User Agent, and start it (connect to SIP server, Register, etc.)
        this.sipPhone = new JsSIP.UA(configuration);
        this.sipPhone.start();


        // Register callbacks for outgoing call events.
        // It appears the following eventHandlers are JsSIP.RTCSession Events which can 
        // also be registered during Session Outgoing Events, which is what I'll do for now.
//      var eventHandlers = {
//          'progress': function(e) {
//            console.log('call is in progress');
//          },
//          'failed': function(e) {
//            console.log('call failed with cause: '+ e.cause);
//          },
//          'ended': function(e) {
//            console.log('call ended with cause: '+ e.cause);
//          },
//          'confirmed': function(e) {
//            console.log('call confirmed');
//          },
//      };

        let callOptions = { 
//          'eventHandlers'   : eventHandlers,
            'mediaConstraints': { 'audio': true, 'video': false } // only audio calls
        };

        //Register callbacks to tell us SIP Registration events
        this.sipPhone.on("registered", () => console.log('SIPPhone Registered with SIP Server'));
        this.sipPhone.on("unregistered", () => console.log('SIPPhone Unregistered with SIP Server'));
        this.sipPhone.on("registrationFailed", () => console.log('SIPPhone Failed Registeration with SIP Server'));

        //Register a callback when a new WebRTC media session is established
        //  which occurs on incoming or outgoing calls.
        this.sipPhone.on("newRTCSession", function(data){
            let session = data.session;
            if (session.direction === "incoming") {
                console.log('Session - Incoming call from ' + session.remote_identity );

                //If you want to perform an action on incoming call, can use the following:
//              hass.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.gds_ringing' });

                let acceptCallBtn = droidCard.getElementById('btn-accept-call');
                let rejectCallBtn = droidCard.getElementById('btn-reject-call');
                let endCallBtn = droidCard.getElementById('btn-end-call');
                let makeCallBtn = droidCard.getElementById('btn-make-call');

                makeCallBtn.style.display = 'none';
                acceptCallBtn.style.display = 'inline-flex';
                rejectCallBtn.style.display = 'inline-flex';

                //Register for various incoming call session events
                session.on("accepted", () => {
                    console.log('Incoming - call accepted');
                    acceptCallBtn.style.display = 'none';
                    rejectCallBtn.style.display = 'none';
                    endCallBtn.style.display = 'inline-flex';
                });
                session.on("confirmed", () => console.log('Incoming - call confirmed'));
                session.on("ended", () => {console.log('Incoming - call ended'); droidCard.cleanup(hass)});
                session.on("failed", () =>{console.log('Incoming - call failed'); droidCard.cleanup(hass)});
                session.on("peerconnection", () => {
                    session.connection.addEventListener("addstream", (e) => {
                        console.log('Incoming - adding audiostream')
                        remoteAudio.srcObject = e.stream;
                        remoteAudio.play();
                    })
                });
                acceptCallBtn.addEventListener('click', () => {
                    session.answer(callOptions);

                    //If you want to perform an action on accepting an incoming call, can use the following:
//                  hass.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.gds_ringing' });

                });
                endCallBtn.addEventListener('click', () => session.terminate());
                rejectCallBtn.addEventListener('click', () => {

                    //If you want to perform an action on rejecting an incoming call, can use the following:
//                  hass.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.gds_ringing' });

                    session.answer(callOptions);
                    setTimeout(() => {
                        session.terminate();
                    }, 1000);
                });

                acceptCallBtn.style.display = 'inline-flex';
                rejectCallBtn.style.display = 'inline-flex';
            }
            if (session.direction === "outgoing") {
                console.log('Session - Outgoing Call Event')

                let endCallBtn = droidCard.getElementById('btn-end-call');
                let makeCallBtn = droidCard.getElementById('btn-make-call');

                makeCallBtn.style.display = 'none';
                endCallBtn.style.display = 'inline-flex';
                endCallBtn.addEventListener('click', () => session.terminate());

                //Register for various call session events:
                session.on('progress', function(e) { 
                    console.log('Outgoing - call is in progress');
                });
                session.on('failed', function(e) {
                    console.log('Outgoing - call failed with cause: '+ e.cause);
                    if (e.cause === JsSIP.C.causes.SIP_FAILURE_CODE) {
                        console.log('  Called party may not be reachable');
                    };
                    droidCard.cleanup(hass);
                });
                session.on('confirmed', function(e) {
                    console.log('Outgoing - call confirmed');
                });
                session.on('ended', function(e) {
                    console.log('Outgoing - call ended with cause: '+ e.cause);
                    droidCard.cleanup(hass);
                });
                //Note: peerconnection never fires for outoing, but I'll leave it here anyway.
                session.on('peerconnection', () => console.log('Outgoing - Peer Connection'));

                //Note: 'connection' is the RTCPeerConnection instance - set after calling ua.call().
                //    From this, use a WebRTC API for registering event handlers.
                //Note: Was not able to get session.connection.ontrack = function(e) to work
                session.connection.onaddstream = function(e) { 
                    console.log('Outoing - addstream');
                    remoteAudio.srcObject = e.stream;
                    remoteAudio.play();
                };
                //Handle Browser not allowing access to mic and speaker
                session.on("getusermediafailed", function(DOMError) {
                    console.log('Get User Media Failed Call Event ' + DOMError )
                });
            }

        });

        let MakeCallBtn = droidCard.getElementById('btn-make-call');
        MakeCallBtn.addEventListener('click', () => {
          //console.log('Making Call...');
            console.log('Calling '+`sip:${sip_doorbell_username}@${sip_doorbell_domain}`);
          //this.sipPhone.call('sip:4001@192.168.0.11', callOptions);
          //this.sipPhone.call('sip:2001@192.168.0.31', callOptions);
            this.sipPhone.call(`sip:${sip_doorbell_username}@${sip_doorbell_domain}`, callOptions);
        });
    }

    initCameraView(hass) {
        this.cameraViewerShownTimeout = window.setTimeout(() => this.isDoorVivintNotShown() , 15000);
        const cameraView = this.getElementById('cameraview');
        const imgEl = document.createElement('img');
        const camera_entity = this.config.camera_entity;
        this.access_token = hass.states[camera_entity].attributes['access_token'];
        imgEl.src = `/api/camera_proxy_stream/${camera_entity}?token=${this.access_token}`;
        imgEl.style.width = '100%';
        while (cameraView.firstChild) {
            cameraView.removeChild(cameraView.firstChild);
        }
        cameraView.appendChild(imgEl);
        console.log('initialized camera view');
    }

    updateCameraView(hass) {
        const imgEl = this.shadowRoot.querySelector('#cameraview img');
        const camera_entity = this.config.camera_entity;
        this.access_token = hass.states[camera_entity].attributes['access_token'];
        imgEl.src = `/api/camera_proxy_stream/${camera_entity}?token=${this.access_token}`;
    }

    cameraEntityHasNewAccessToken(hass) {
        clearTimeout(this.cameraViewerShownTimeout);
        this.cameraViewerShownTimeout = window.setTimeout(() => this.isDoorVivintNotShown() , 15000);

        if(!this.sipPhone) return false;
        const old_access_token = this.access_token;
        const new_access_token = hass.states[this.config.camera_entity].attributes['access_token'];

        return old_access_token !== new_access_token;
    }

    isDoorVivintNotShown() {
        const imgEl = this.shadowRoot.querySelector('#cameraview img');
        if(!this.isVisible(imgEl)) {
            this.stopCameraStreaming();
        }
    }

    stopCameraStreaming() {
        console.log('Stopping camera stream...');
        const imgEl = this.shadowRoot.querySelector('#cameraview img');
        imgEl.src = '';
        this.access_token = undefined;
    }

    isVisible(el) {
        if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) {
            return false;
        }
        return true;
    }

    cleanup(hass) {
        let acceptCallBtn = this.getElementById('btn-accept-call');
        let rejectCallBtn = this.getElementById('btn-reject-call');
        let endCallBtn = this.getElementById('btn-end-call');
        let makeCallBtn = this.getElementById('btn-make-call');

        //acceptCallBtn remove eventlisteners and hide
        let clonedAcceptCallBtn = acceptCallBtn.cloneNode(true)
        clonedAcceptCallBtn.style.display = 'none';
        acceptCallBtn.parentNode.replaceChild(clonedAcceptCallBtn, acceptCallBtn);

        //rejectCallBtn remove eventlisteners and hide
        let clonedRejectCallBtn = rejectCallBtn.cloneNode(true)
        clonedRejectCallBtn.style.display = 'none';
        rejectCallBtn.parentNode.replaceChild(clonedRejectCallBtn, rejectCallBtn);

        //endCallBtn remove eventlisteners and hide
        let clonedEndCallBtn = endCallBtn.cloneNode(true)
        clonedEndCallBtn.style.display = 'none';
        endCallBtn.parentNode.replaceChild(clonedEndCallBtn, endCallBtn);

        makeCallBtn.style.display = 'inline-flex';

    }


    getElementById(id) {
        return this.shadowRoot.querySelector(`#${id}`);
    }
}

customElements.define('doorvivint-card', DoorVivintCard);

