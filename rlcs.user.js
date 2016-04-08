// ==UserScript==
// @name         RLCS
// @namespace    http://tampermonkey.net/
// @version      0.way too much
// @description  Parrot-like functionality for Reddit Live
// @author       FatherDerp, Stjerneklar
// @include      https://www.reddit.com/live/*
// @require      http://code.jquery.com/jquery-latest.js
// @grant   GM_addStyle
// ==/UserScript==                
$(document).ready(function() {
  $(document).keydown(function(e){
      if (e.keyCode == 13 && e.ctrlKey == true) {
          $(".save-button .btn").click();  
      }
  });   
 
 /*add css styles, every line must end with \  */
     GM_addStyle(" \
          a.author {float:left;} \
          body.loggedin.liveupdate-app {background:#575757;color:white;}\
          div.content{background:#575757;color:white;}\
          div.md{color:white;}\
         .liveupdate-listing li.liveupdate .time {width:80px}  \
         .liveupdate .body {   \
            padding: 5px; \
            max-width:600px!important; \
         } \
");

});
