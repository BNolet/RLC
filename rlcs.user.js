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
          aside.sidebar #discussions li {background:#404040;}\
          .md a {color:#5ED7FF!important;}\
          .sidebar a {color:#5ED7FF!important;}\
          body.loggedin.liveupdate-app {background:#404040;color:white;}\
          div.content{background:#404040;color:white;}\
          div.md{color:white;}\
          div#liveupdate-options {color:white;}\
          aside.sidebar {background:#404040;!important}\
          h2{color:white!important}\
         .liveupdate-listing li.liveupdate ul.buttonrow { display: none!important;}\
         .liveupdate-listing li.liveupdate .time {width:80px}  \
         .liveupdate .body {   \
            padding: 5px; \
            max-width:600px!important; \
         } \
");

});
