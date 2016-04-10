// ==UserScript==
// @name         RLCS
// @namespace    http://tampermonkey.net/
// @version      0.9 Revamp 
// @description  Chat-like functionality for Reddit Live
// @author       FatherDerp, Stjerneklar
// @include      https://www.reddit.com/live/*
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
  display:block; \
} \
div#liveupdate-options {color:white;position: absolute;bottom: 60px;left: 5px;} \
.footer-parent, .separator,\
.liveupdate-listing li.liveupdate ul.buttonrow,\
body > .content {display: none!important;}\
.liveupdate .body {max-width: none!important;margin-bottom: 0!important;padding:2px!important;}  \
#new-update-form .usertext {max-width: 100%;float: left;width: 92%;} \
.usertext-edit .md {min-width: 100%!important;} \
div#new-update-form textarea { height:25px;overflow:hidden;  } \
div#new-update-form { \
    width: 100%; \
    margin: 0; \
} \
.usertext-edit.md-container { \
    max-width: 100%; \
    margin: 0; \
} \
aside.sidebar.side.md-container { \
    max-width:100%;\
    width:98%;\
} \
ol.liveupdate-listing { \
    max-width: 100%; \
    overflow-y: scroll;  \
    height: calc(100vh - 130px); \
    padding:5px;\
    box-sizing:border-box;\
} \
.liveupdate-listing li.liveupdate {  border-top:1px solid grey;padding-top:2px; } \
.liveupdate-listing li.liveupdate .body div.md {\
    width: 86%;\
    display: block;\
    float: right;\
    margin-bottom:0;\
    max-width: none;\
} \
a.author {\
    display: block;\
    width: 12%;\
    float: left;\
    margin: 0;\
    text-align: right;\
    } \
.liveupdate-listing li.liveupdate time {\
    padding: 0;\
    width: 12%;\
    float:left;\
    margin: 0;\
    text-align: right;\
} \
.liveupdate-listing li.liveupdate time:before {\
 display:none; \
}  \
ol.liveupdate-listing { \
    display: flex; \
    flex-direction: column-reverse; \
} \
.liveupdate-listing li.liveupdate {height: auto!important;overflow:visible;} \
#liveupdate-header {\
    width: 100%;\
    margin:0!important;\
    padding:0!important;\
    text-align:center;\
    max-width: none;\
} \
aside.sidebar #discussions li {background:#404040;} \
.md a {color:#5ED7FF!important;} \
.sidebar a {color:#5ED7FF!important;} \
body.loggedin.liveupdate-app {background:#404040;color:white;} \
div.content{background:#404040;color:white;} \
div.md{color:white;} \
aside.sidebar {background:#404040;!important} \
h2{color:white!important} \
");
