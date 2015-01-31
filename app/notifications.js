(function() {

    function drawAttention() {
        chrome.app.window.current().drawAttention();
    }

    function clearAttention() {
        chrome.app.window.current().clearAttention();
    }

    var webview = document.querySelector('webview');

    //Inject the notification trapper
    webview.addEventListener('contentload', function (e) {
        console.log('Starting poller');

        download("../guest/trap-notification.js", function(content){
            var code = 'var script = document.createElement("script");' +
                'script.innerHTML="eval(atob(\''+ btoa(content) + '\'))";' +
                'document.head.appendChild(script);';
            webview.executeScript(
                {
                    code: code
                },function(e){
                    console.log(chrome.runtime.lastError);
                }
            );
        });

        initTrapper();

        //Hide the notification permission bar, in case something happens and we dont hide it
        webview.insertCSS({
            code: '.butterbar-notification {  display: none !important; }'
        });
    });



    //Workarounds to avoid the drawAttention being stuck
    window.addEventListener('focus', clearAttention);
    window.addEventListener('mousedown', clearAttention);
    window.addEventListener('keydown', clearAttention);

    function initTrapper() {
        //Initialize the notification handler. We will try to initialize every second until it replies
        var interval = setInterval(function () {
            webview.contentWindow.postMessage({type: 'handshake'}, "*");
        }, 1000);

        addEventListener('message', function(e) {
            var msg = e.data;
            if(msg.type == 'notif') {
                if (!document.hasFocus()) {
                    var notification = new Notification(msg.conversation, msg.data);

                    notification.addEventListener('click', function() {
                        webview.contentWindow.postMessage({type: 'click', id: msg.id}, "*");
                        chrome.app.window.current().clearAttention();
                        chrome.app.window.current().show(true);
                    });

                    setTimeout(function() {
                        notification.close();
                    }, 9000);

                    drawAttention();
                } else {
                    clearAttention();
                }
            } else if (msg.type == 'init') {
                clearInterval(interval);
                console.log("Notification trapper init");
            }
        });
    }

    function download(url, callback) {
        var oReq = new XMLHttpRequest();
        //oReq.responseType = 'arraybuffer';
        oReq.onload = function(){callback(oReq.response)};
        oReq.open("get", url, true);
        oReq.send();
    }

}());
