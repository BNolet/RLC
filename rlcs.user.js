// ==UserScript==
// @name         RLCS
// @namespace    http://tampermonkey.net/
// @version      0.4 
// @description  Parrot-like functionality for Reddit Live
// @author       FatherDerp, Stjerneklar
// @include      https://www.reddit.com/live/*
// @require      http://code.jquery.com/jquery-latest.js
// @grant   GM_addStyle
// ==/UserScript==                
$(document).ready(function() {
  
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
 
 /*add css styles, every line must end with \  */
      GM_addStyle(" \
        .liveupdate-listing li.liveupdate ul.buttonrow { display: none!important;} \
        .liveupdate-listing li.liveupdate .time {}   \
        .liveupdate .body {max-width: none!important;}  \
        aside.sidebar #discussions li {background:#404040;} \
        .md a {color:#5ED7FF!important;} \
        .sidebar a {color:#5ED7FF!important;} \
        body.loggedin.liveupdate-app {background:#404040;color:white;} \
        div.content{background:#404040;color:white;} \
        div.md{color:white;} \
        div#liveupdate-options {color:white;position: absolute;top: 19px;right: 18px;} \
        aside.sidebar {background:#404040;!important} \
        h2{color:white!important} \
        #new-update-form .usertext {  max-width: none;} \
.usertext-edit .md {min-width: 100%!important;} \
.content { \
    width: 95%; \
    position:relative; \
} \
header#liveupdate-header { \
    position: absolute; \
    right: 10px; \
    top:10px; \
    width: 305px; \
} \
div#new-update-form { \
    position: absolute; \
    bottom: 5px; \
    background: #161616; \
    width: 74%; \
    margin: 0; \
    left: 10px; \
} \
.main-content { \
    margin-top: 0; \
    width: 100%; \
} \
aside.sidebar.side.md-container { \
    position: absolute; \
    right: 0; \
    top: 190px; \
    padding:10px; \
} \
ol.liveupdate-listing { \
    max-width: 76%; \
    overflow-y: scroll; \
    padding-right: 15px; \
    height: calc(100vh - 250px); \
    margin-bottom: 150px; \
} \
.liveupdate-listing li.liveupdate {  border-top:1px solid grey;padding-top:2px; } \
.liveupdate-listing li.liveupdate .body div.md { \
    width: 84%; \
    display: block; \
    float: right; \
    margin-bottom:0; \
    max-width: none; \
} \
a.author { \
    display: block; \
    width: 15%; \
    float: left; \
    } \
.liveupdate-listing li.liveupdate time { \
    padding: 0; \
    width: 15%; \
    float:left; \
} \
.usertext-edit.md-container { \
    max-width: 100%; \
    margin: 0; \
} \
ol.liveupdate-listing { \
    display: flex; \
    flex-direction: column-reverse; \
} \
.liveupdate-listing li.liveupdate {height: auto!important;overflow:visible;} \
.footer-parent {    display: none; } \
");
});


