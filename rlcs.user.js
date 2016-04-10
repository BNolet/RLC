// ==UserScript==
// @name         RLCS
// @namespace    http://tampermonkey.net/
// @version      1.01
// @description  Chat-like functionality for Reddit Live
// @author       FatherDerp, Stjerneklar
// @include      https://www.reddit.com/live/*
// @exclude      https://www.reddit.com/live/
// @exclude      https://www.reddit.com/live
// @exclude      https://www.reddit.com/live/*/edit*
// @exclude      https://www.reddit.com/live/*/contributors*
// @require      http://code.jquery.com/jquery-latest.js
// @grant   GM_addStyle
// ==/UserScript==                
$(document).ready(function() {
    $("body").append('<div id="rlc-main"><div id="rlc-chat"></div><div id="rlc-messagebox"></div></div><div id="rlc-sidebar"></div>');
    $('.liveupdate-listing').appendTo('#rlc-chat');
    $('#new-update-form').appendTo('#rlc-messagebox');
    $('#liveupdate-header').prependTo('#rlc-sidebar');
    $('#liveupdate-options').prependTo('#rlc-sidebar');
    $('.main-content aside.sidebar').appendTo('#rlc-sidebar');
    $("#nightSwitchToggle").click();    
    $(document).keydown(function(e){
      if (e.keyCode == 13) {
          $(".save-button .btn").click();  
      }
  });   
    $('body').on('contextmenu', ".liveupdate .author", function (event) {
        event.preventDefault();
        var username = String($(this).text()).trim();
        var source = String($(".usertext-edit.md-container textarea").val());
        // Focus textarea and set the value of textarea
        $(".usertext-edit.md-container textarea").focus().val("").val(source + " " + username + " ");
    });
});
/*add css styles, every line must end with \  */
      GM_addStyle(" \
/* Custom elements */\
#rlc-main { \
    width: 70%; \
    height: 100%; \
    position: fixed; \
    top: 63px; \
    left:0; \
} \
#rlc-sidebar { \
    width: 30%; \
    height: 100%; \
    position: fixed; \
    top: 63px; \
    right:0; \
} \
#rlc-sidebar *, #rlc-main * {opacity:1!important}; \
/*general modifications*/\
#liveupdate-options {\
    position: absolute;\
    top:116px;\
    left: 5px;\
} \
.res-nightmode #liveupdate-options {color:white;}\
/* hard removal */\
.footer-parent, \
#rlc-main .liveupdate-listing .separator,\
#rlc-main .liveupdate-listing li.liveupdate ul.buttonrow,\
#rlc-main .liveupdate-listing li.liveupdate time:before,\
.help-toggle, \
.reddiquette,\
body > .content { display: none!important; }\
/*chat window*/\
#rlc-main .liveupdate-listing { \
    max-width: 100%; \
    overflow-y: scroll;  \
    height: calc(100vh - 138px); \
    padding:5px;\
    box-sizing:border-box;\
    display: flex; \
    flex-direction: column-reverse; \
} \
#rlc-main .liveupdate-listing .liveupdate .body {\
    max-width: none!important;\
    margin-bottom: 0!important;\
    padding:2px!important;\
}  \
#rlc-main .liveupdate-listing .liveupdate {  \
    border-top:1px solid grey;\
    padding-top:2px; \
    height: auto!important; \
    overflow:visible!important;\
} \
#rlc-main .liveupdate-listing a.author {\
    display: block;\
    width: 12%;\
    float: left;\
    margin: 0;\
    text-align: right;\
    } \
#rlc-main .liveupdate-listing .liveupdate time {\
    padding: 0;\
    width: 12%;\
    float:left;\
    margin: 0;\
    text-align: right;\
} \
#rlc-main .liveupdate-listing .liveupdate .body div.md {\
    width: 86%;\
    display: block;\
    float: right;\
    margin-bottom:0;\
    max-width: none;\
} \
/*message input and send button*/\
#new-update-form .usertext {\
    max-width: 100%;\
    float: left;\
    width: 100%;\
} \
.usertext-edit .md {min-width: 100%!important;} \
div#new-update-form textarea { \
    height:45px;\
    overflow:hidden;  \
} \
div#new-update-form { \
    width: 100%; \
    margin: 0; \
} \
.usertext-edit.md-container { \
    max-width: 100%; \
    margin: 0; \
} \
.usertext-edit.md-container {  position: relative;}  \
#new-update-form .bottom-area { \
    position: absolute; \
    top: 4px; \
    right: 15px; \
    left: 15px; \
    text-align: center; \
    letter-spacing: 1px; \
} \
#new-update-form .save-button .btn { \
    width: 100%; \
    text-transform: capitalize; \
} \
.usertext-edit.md-container { \
    margin-top: 3px; \
} \
.usertext-edit.md-container textarea { \
    padding:2px; \
} \
/*sidebar*/\
aside.sidebar.side.md-container { \
    max-width:100%;\
    width:98%;\
} \
#liveupdate-header {\
    width: 100%;\
    margin:0!important;\
    padding:0!important;\
    text-align:center;\
    max-width: none;\
} \
");
