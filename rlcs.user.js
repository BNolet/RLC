
// ==UserScript==
// @name         RLCS
// @namespace    http://tampermonkey.net/
// @version      0.way too much
// @description  Parrot-like functionality for Reddit Live
// @author       FatherDerp, a few of Stjerneklars brain cells
// @include      https://www.reddit.com/live/wpytzw1guzg2*
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==                
$(document).ready(function() {
  $(document).keydown(function(e){
      if (e.keyCode == 13 && e.ctrlKey == true) {
          $(".save-button .btn").click();  
      }
  });  
});
