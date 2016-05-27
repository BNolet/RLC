// ==UserScript==
// @name           RLC
// @version        3.20
// @description    Chat-like functionality for Reddit Live
// @author         FatherDerp & Stjerneklar
// @contributor    Kretenkobr2, thybag, mofosyne, jhon, FlamingObsidian, MrSpicyWeiner, TheVarmari, dashed
// @website        https://github.com/BNolet/RLC/
// @namespace      http://tampermonkey.net/
// @include        https://www.reddit.com/live/*
// @exclude        https://www.reddit.com/live/
// @exclude        https://www.reddit.com/live
// @exclude        https://www.reddit.com/live/*/edit*
// @exclude        https://www.reddit.com/live/*/contributors*
// @exclude        https://*.reddit.com/live/create*
// @require        https://code.jquery.com/jquery-2.2.3.min.js
// @grant          GM_addStyle
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_getResourceText
// @grant          GM_setClipboard
// @grant          GM_deleteValue
// @grant          GM_listValues
// @run-at         document-idle
// @noframes
// ==/UserScript==


//  ██████╗ ██╗      ██████╗    ██╗███╗   ██╗████████╗██████╗  ██████╗
//  ██╔══██╗██║     ██╔════╝    ██║████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗
//  ██████╔╝██║     ██║         ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║
//  ██╔══██╗██║     ██║         ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║
//  ██║  ██║███████╗╚██████╗    ██║██║ ╚████║   ██║   ██║  ██║╚██████╔╝
//  ╚═╝  ╚═╝╚══════╝ ╚═════╝    ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝


//    Welcome to Reddit Live Chat source code, enjoy your visit.
//    Please group your variables with the relevant functions and follow existing structure.
//    (Unless you are willing to rewrite the structure into something more sane)
//    To get a good idea of whats going on, start from window.load near the bottom.
//    I recommend using Sublime Text when browsing this file as these comment blocks are readable from the minimap.
//      - Stjerneklar


//  ██████╗ ██╗      ██████╗     ██████╗ ██████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗
//  ██╔══██╗██║     ██╔════╝    ██╔═══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
//  ██████╔╝██║     ██║         ██║   ██║██████╔╝   ██║   ██║██║   ██║██╔██╗ ██║███████╗
//  ██╔══██╗██║     ██║         ██║   ██║██╔═══╝    ██║   ██║██║   ██║██║╚██╗██║╚════██║
//  ██║  ██║███████╗╚██████╗    ╚██████╔╝██║        ██║   ██║╚██████╔╝██║ ╚████║███████║
//  ╚═╝  ╚═╝╚══════╝ ╚═════╝     ╚═════╝ ╚═╝        ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
//
//  Calls createOption to set up lables, GM values and body classes based on stored GM values if set.
//

    // Create persistant option
    function createOption(name, clickAction, defaultState, description){

        var checkedMarkup;
        var key = "rlc-" + name.replace(/\W/g, "");
        var state = (typeof defaultState !== "undefined") ? defaultState : false;

        // Add if not exist in optionsArray
        if ( !(key in optionsArray) ){
            optionsArray.push(key);
        }
        // Try and state if setting is defined
        if (GM_getValue(key)){
            state = GM_getValue(key);
        }
        // Markup for state
        checkedMarkup = state ? "checked='checked'" : "";

        // sorry, im nub
        if (description === undefined) {
            description = "";
        }
        // Render option
        var $option = $(`<label id='option-${key}'><input type='checkbox' ${checkedMarkup}>${name}<span>${description}</span></label>`).click(function(e){

        // capture only checkbox's event
            var target = $( e.target );
            if ( !target.is( "input" ) ) {
                return;
            }

            var checked = $(this).find("input").is(":checked");

            //console.log("option set to "+checked);

            // Persist state
            if (checked !== state){
                GM_setValue(key, checked);
                state = checked;
            }
            clickAction(checked, $(this));
        });
        // Add to DOM
        $("#rlc-settings").append($option);

        clickAction(state, $option);
        //uncomment below to output option key/value
        //console.log(key+" = "+state);
    }

    function createOptions() {

        // set default states(on first load of RLC, otherwise presists via GM/TM local variables)
        // ONLY NEEEDED FOR DEFAULT TRUE
        if (!GM_getValue("rlc-ChannelColors")) {        GM_setValue("rlc-ChannelColors",            true);}
        if (!GM_getValue("rlc-AutoScroll")) {           GM_setValue("rlc-AutoScroll",               true);}
        if (!GM_getValue("rlc-FullSize")) {             GM_setValue("rlc-FullSize",                 true);}
        if (!GM_getValue("rlc-ShowChannelsUI")) {       GM_setValue("rlc-ShowChannelsUI",           true);}

        // Format: name, function, state, description(optional)
        createOption("Full Size", function(checked){
            if (checked){
                $("body").addClass("rlc-fullwidth");
            } else {
                $("body").removeClass("rlc-fullwidth");
            }
            scrollToBottom();
        },false, "remove RLC max width/height");

        createOption("Dark Mode", function(checked){
           if (loadHistoryMessageException != 1) {  refreshChat(); }
            if (checked){
                $("body").addClass("dark-background");
            } else {
                $("body").removeClass("dark-background");
            }
        },false);

        createOption("Robin Colors", function(checked){
            if (loadHistoryMessageException != 1) {  refreshChat(); }
        },false, "color usernames via robin algorithm (existing messages are not modified)");

        createOption("Compact Mode", function(checked){
            if (checked){
                $("body").addClass("rlc-compact");
            } else {
                $("body").removeClass("rlc-compact");
            }
            scrollToBottom();
        },false, "hide header");

        createOption("Left Panel", function(checked){
            if (checked){
                $("body").addClass("rlc-leftPanel");
            } else {
                $("body").removeClass("rlc-leftPanel");
            }
            scrollToBottom();
        },false, "hide header");

        createOption("Channel Colors", function(checked){
            if (checked){
                $("#rlc-main").addClass("show-colors");
            } else {
                $("#rlc-main").removeClass("show-colors");
            }
        },false, "give channels background colors");

        createOption("Show Channels UI", function(checked){
            if (checked){
                $("body").addClass("rlc-showChannelsUI");
            } else {
                $("body").removeClass("rlc-showChannelsUI");
            }
        },false,"show channel tabs and message channel selector");

        createOption("Channel Message Counters", function(checked){
        },false,"show counters for messages in tabs");

        createOption("12 Hour Mode", function(checked){
            if (loadHistoryMessageException != 1) {  refreshChat(); }
        },false,"12 Hour Time Stamps");

        createOption("Seconds Mode", function(checked){
        if (loadHistoryMessageException != 1) {  refreshChat(); }
            if (checked){
                $("body").addClass("rlc-secondsMode");
            } else {
                $("body").removeClass("rlc-secondsMode");
            }
        },false,"Time Stamps with Seconds");

        createOption("Hide Channels in Global", function(checked){
           if (checked){
                $("body").addClass("rlc-hideChannelsInGlobal");
            } else {
                if (loadHistoryMessageException != 1) {  refreshChat(); }
                $("body").removeClass("rlc-hideChannelsInGlobal");
            }
        },false, "hide in-channel messages in global tab (the channel must added for this to work)");

        createOption("Notification Sound", function(checked){
        },false, "play sound when you are mentioned");

        createOption("Chrome Notifications", function(checked){
            if (checked && Notification && !Notification.permission !== "granted"){
                Notification.requestPermission();
            }
        },false, "show notice when you are mentioned");

        createOption("All Notifications when unfocused", function(checked){
        },false, "show notice on any message if window is not focused");

        createOption("Chrome Scroll Bars", function(checked){
            if (checked){
                $("body").addClass("rlc-customscrollbars");
            } else {
                $("body").removeClass("rlc-customscrollbars");
            }
        },false, "use custom scrollbars");

        createOption("Text To Speech (TTS)", function(checked){
           if (checked){
                $("body").addClass("rlc-TextToSpeech");
                $("#togglebarTTS").addClass("selected");
            } else {
                $("body").removeClass("rlc-TextToSpeech");
                $("#togglebarTTS").removeClass("selected");
                window.speechSynthesis && window.speechSynthesis.cancel && window.speechSynthesis.cancel();
            }
        },false, "read messages aloud");

        createOption("TTS Long Messages", function(checked){
        },false, "read long messages( TTS starts behaving weirdly sometimes)");

        createOption("TTS Username Narration", function(checked){
        },false, "example: [message] said [name]");

        createOption("TTS Disable User-based Voices", function(checked){
        },false, "do not modify TTS voices based on usernames");

        createOption("TTS Disable Self-narration", function(checked){
        },false, "don't read messages sent by me aloud");

        createOption("Auto Scroll", function(checked){
            if (checked){
                $("#togglebarAutoscroll").addClass("selected");
                $("body").addClass("AutoScroll");
            } else {
                $("#togglebarAutoscroll").removeClass("selected");
                $("body").removeClass("AutoScroll");
            }
        },false, "scroll chat on new message");

        createOption("No Emotes", function(checked){
           if (loadHistoryMessageException != 1) {  refreshChat(); }
        },false, "disable RLC smileys");

        createOption("No Twitch Emotes", function(checked){
           if (loadHistoryMessageException != 1) {  refreshChat(); }
        },false, "disable Twitch Emotes");

        createOption("Hide Giphy Images", function(checked){
           if (loadHistoryMessageException != 1) {  refreshChat(); }
        },false, "disable giphy gifs");

        createOption("Disable Markdown", function(checked){
           if (loadHistoryMessageException != 1) {  refreshChat(); }
        },false, "get messages without reddit formatting");

        createOption("Max Messages 25", function(checked){
            if (checked){
                if (loadHistoryMessageException != 1) {
                    cropMessages(25);
                }
            } else {

            }
        },false, "do not show more than 25 messages");

        createOption("Custom Background", function(checked){
            if (checked === true){
                $("body").addClass("rlc-customBg");

                if (loadHistoryMessageException != 1) {  // avoid triggering during init

                    var bgurlsuggestion; //try to get a saved background url depending on dark mode setting
                    if (GM_getValue("rlc-DarkMode")) { bgurlsuggestion = GM_getValue("customBGdark")}
                        else { bgurlsuggestion = GM_getValue("customBGlight");}

                    // if we cant, use the sample url
                    if (typeof bgurlsuggestion === "undefined" ) {
                        bgurlsuggestion = "http://i.imgur.com/uy50nCx.jpg";
                    }

                    var bgurl = prompt("enter background url", bgurlsuggestion);  //prompt user for url with default or saved url suggested

                    if (bgurl != null) { //if the user filled out the prompt
                        $("#customBGstyle").remove(); //clear existing background style tag set in 248 or 251

                        //save bgurl to seperate variables depending on light/dark mode
                        if (GM_getValue("rlc-DarkMode")) {  GM_setValue("customBGdark",bgurl)}
                        else { GM_setValue("customBGlight",bgurl) }

                        var bgimagecss = `body {background-image: url(${bgurl})!important;` //build css rule
                        $("body").append(`<style id='customBGstyle'>${bgimagecss}</style>`); //append style tag with css rule
                    }
                }
                else {
                    //same as above but without the prompt. this code runs on init if option is enabled
                    var bgurl;

                    if (GM_getValue("rlc-DarkMode")) { bgurl = GM_getValue("customBGdark")}
                        else { bgurl = GM_getValue("customBGlight");}

                    if (typeof bgurl === "undefined" ) {
                        bgurl = "http://i.imgur.com/uy50nCx.jpg";
                    }
                        var bgimagecss = `body {background-image: url(${bgurl})!important;` //build css rule
                        $("body").append(`<style id='customBGstyle'>${bgimagecss}</style>`); //append style tag with css rule
                    }
            }
            else {
                $("body").removeClass("rlc-customBg");
                $("#customBGstyle").remove(); //clear existing background style tag set in 248 or 251
            }
        },false, "sample image works best in dark mode");

        createOption("No Message Removal", function(checked){
        },false, "don't remove messages ever");
    }


//  ████████╗ █████╗ ██████╗ ██████╗ ███████╗██████╗      ██████╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗███████╗██╗     ███████╗
//  ╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗    ██╔════╝██║  ██║██╔══██╗████╗  ██║████╗  ██║██╔════╝██║     ██╔════╝
//     ██║   ███████║██████╔╝██████╔╝█████╗  ██║  ██║    ██║     ███████║███████║██╔██╗ ██║██╔██╗ ██║█████╗  ██║     ███████╗
//     ██║   ██╔══██║██╔══██╗██╔══██╗██╔══╝  ██║  ██║    ██║     ██╔══██║██╔══██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║     ╚════██║
//     ██║   ██║  ██║██████╔╝██████╔╝███████╗██████╔╝    ╚██████╗██║  ██║██║  ██║██║ ╚████║██║ ╚████║███████╗███████╗███████║
//     ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚═════╝ ╚══════╝╚═════╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝


    var tabbedChannels = new function(){
        /* Basic usage - tabbedChannels.init( dom_node_to_add_tabs_to );
           and hook up tabbedChannels.proccessLine(lower_case_text, jquery_of_line_container);
           to each line detected by the system */
        var _self = this;

        // Default options
        this.channels = ["%general", "%offtopic"];
        this.mode = "single";

        // internals
        this.unreadCounts = {};
        this.$el = null;
        this.$opt = null;
        this.defaultRoomClasses = "";
        this.channelMatchingCache = [];

        //channels user is in currently
        this.currentRooms = 0;

        // When channel is clicked, toggle it on or off
        this.toggleChannel = function(e){
            var channel = $(e.target).data("filter");
            if (channel===null)return; // no a channel

            if (!$("#rlc-chat").hasClass("rlc-filter-" + channel)){
                _self.enableChannel(channel);
                $(e.target).addClass("selected");
                // clear unread counter
                $(e.target).find("span").text(0);
                _self.unreadCounts[channel] = 0;
            } else {
                _self.disableChannel(channel);
                $(e.target).removeClass("selected");
            }

            // scroll everything correctly
            scrollToBottom();
        };

        // Enable a channel
        this.enableChannel = function(channelID){
            // if using room type "single", deslect other rooms on change
            if (this.mode === "single"){
                this.disableAllChannels();
            }

            $("#rlc-chat").addClass("rlc-filter rlc-filter-" + channelID);
            $("#rlc-chat").attr("data-channel-key", this.channels[channelID]);
            this.currentRooms++;
            // unselect show all
            _self.$el.find("span.all").removeClass("selected");
        };

        // disable a channel
        this.disableChannel = function(channelID){
            $("#rlc-chat").removeClass("rlc-filter-" + channelID);
            this.currentRooms--;

            // no rooms selcted, run "show all"
            if (this.currentRooms === 0){
                this.disableAllChannels();
            } else {
                // Grab next channel name if u leave a room in multi mode
                $("#rlc-chat").attr("data-channel-key", $(".rlc-filters span.selected").first().data("filter-name"));
            }
        };

        // turn all channels off
        this.disableAllChannels = function(){
            $("#rlc-chat").attr("class", _self.defaultRoomClasses).attr("data-channel-key", "");
            _self.$el.find(".rlc-filters > span").removeClass("selected");
            this.currentRooms = 0;

            _self.$el.find("span.all").addClass("selected");
            scrollToBottom();
        };

        // render tabs
        this.drawTabs = function(){
            var html = "";
            for(var i in this.channels){
                if (typeof this.channels[i] === "undefined") continue;
                html += `<span data-filter="${i}" data-filter-name="${this.channels[i]}">${this.channels[i]}(<span>0</span>)</span> `;
            }
            this.$el.find(".rlc-filters").html(html);
        };

        // After creation of a new channel, go find if any content (not matched by a channel already) is relevant
        this.reScanChannels = function(){
            $("#rlc-chat").find("li.rlc-message").each(function(idx,item){
                var line = $(item).find(".body .md").text().toLowerCase();
                tabbedChannels.proccessLine(line, $(item), true);
            });
        };

        // Add new channel
        this.addChannel = function(newChannel){
            if (this.channels.indexOf(newChannel) === -1){
                this.channels.push(newChannel);
                this.unreadCounts[this.channels.length-1] = 0;
                this.updateChannelMatchCache();
                this.saveChannelList();
                this.drawTabs();

                // Populate content for channel
                this.reScanChannels();

                // refresh everything after redraw
                this.disableAllChannels();
            }
        };

        // remove existing channel
        this.removeChannel = function(channel){
            if (confirm("are you sure you wish to remove the " + channel + " channel?")){
                var idx = this.channels.indexOf(channel);
                delete this.channels[idx];
                this.updateChannelMatchCache();
                this.saveChannelList();
                this.drawTabs();

                // sub channels, will fall back to existing channels
                this.reScanChannels();

                // refresh everything after redraw
                this.disableAllChannels();
            }
        };


        // save channel list
        this.saveChannelList = function(){
            // clean array before save
            var channels = this.channels.filter(function (item) { return item !== undefined; });
            GM_setValue("rlc-channels", channels);
        };

        // Change chat mode
        this.changeChannelMode = function(){
            _self.mode = $(this).data("type");

            // swicth bolding
            $(this).parent().find("span").css("font-weight", "normal");
            $(this).css("font-weight", "bold");
            _self.disableAllChannels();

            // Update mode setting
            GM_setValue("rlc-mode", _self.mode);
        };

        this.updateChannelMatchCache = function(){
            var order = this.channels.slice(0);
            order.sort(function(a, b){
                return b.length - a.length; // ASC -> a - b; DESC -> b - a
            });
            for(var i in order){
                order[i] = this.channels.indexOf(order[i]);
            }
            // sorted array of channel name indexs

            this.channelMatchingCache = order;
        };

        // Procces each chat line to create text
        this.proccessLine = function(text, $elment, rescan){
            var i, idx, channel;

            // If rescanning, clear any existing "channel" classes
            if (typeof rescan !== "undefined" && rescan === true){
                $elment.removeClass("in-channel");

                for(i=0; i <= this.channels.length; i++){
                    $elment.removeClass("rlc-filter-" + i);
                }
            }

            // Scan for channel identifiers
            for(i=0; i< this.channelMatchingCache.length; i++){ // Sorted so longer get picked out before shorter ones (sub channel matching)
                idx = this.channelMatchingCache[i];
                channel = this.channels[idx];

                if (typeof channel === "undefined") continue;

                // Handle channel prefix in message
                if (text.indexOf(channel) === 0){
                    $elment.find(".body").append(`<a class='channelname'>&nbsp;in&nbsp;${channel}</a>`);
                    $elment.addClass(`rlc-filter-${idx} in-channel`);
                    this.unreadCounts[idx]++;

                    // Remove channel name in messages
                    var newele = $elment.find(".body .md p").html().replace(channel, "");
                    $elment.find(".body .md p").html(newele);

                    if ($elment.find(".body .md p").html().indexOf("/me") === 0){
                        $elment.addClass("user-narration");
                        $elment.find(".body .md p").html($elment.find(".body .md p").html().replace("/me", " " + $elment.find(".author").html()));
                    }

                    return;
                }
            }
        };

        // If in one channel, auto add channel keys
        this.submitHelper = function(){
            if ($("#rlc-chat").hasClass("rlc-filter")){
                // Auto add channel key
                let channelKey = $("#rlc-chat").attr("data-channel-key");

                if ($("#new-update-form textarea").val().indexOf("/me") === 0){
                    $("#new-update-form textarea").val(channelKey + "/me " + $("#new-update-form textarea").val().substr(3));
                } else if ($("#new-update-form textarea").val().indexOf("/") !== 0){
                    // If it's not a "/" command, add channel
                    $("#new-update-form textarea").val(channelKey + " " + $("#new-update-form textarea").val());
                }
            }
            // else read from dropdown populated by channels
            else {
                let channelKey = $("#rlc-channel-dropdown option:selected" ).text();

                if (channelKey !== "") {
                    if ($("#new-update-form textarea").val().indexOf("/me") === 0){
                        $("#new-update-form textarea").val(channelKey + "/me " + $("#new-update-form textarea").val().substr(3));
                    } else if ($("#new-update-form textarea").val().indexOf("/") !== 0){
                        // If it's not a "/" command, add channel
                        $("#new-update-form textarea").val(channelKey + " " + $("#new-update-form textarea").val());
                    }
                }
            }
        };

        // Update channel message counts
        this.tick = function(){
            _self.$el.find(".rlc-filters span").each(function(){
                if ($(this).hasClass("selected")) return;
                $(this).find("span").text(_self.unreadCounts[$(this).data("filter")]);
            });
        };

        // Init tab zone
        this.init = function($el){
            // Load channels
            if (GM_getValue("rlc-channels")){
                this.channels = GM_getValue("rlc-channels");
            }
            if (GM_getValue("rlc-mode")){
                this.mode = GM_getValue("rlc-mode");
            }

            // Init counters
            for(var i in this.channels){
                this.unreadCounts[i] = 0;
            }

            // Update channel cache
            this.updateChannelMatchCache();

            this.$el = $el;
            // Create inital markup
            this.$el.html("<span class='all selected'>Global</span><span><div class='rlc-filters'></div></span><span class='more'>[Channels]</span>");
            this.$opt = $("<div class='rlc-channel-add' style='display:none'><input name='add-channel'><button>Add channel</button> <span class='channel-mode'>Channel Mode: <span title='View one channel at a time' data-type='single'>Single</span> | <span title='View many channels at once' data-type='multi'>Multi</span></span></div>").insertAfter(this.$el);

            // Attach events
            this.$el.find(".rlc-filters").click(this.toggleChannel);
            this.$el.find("span.all").click(this.disableAllChannels);
            this.$el.find("span.more").click(function(){ $(".rlc-channel-add").toggle(); $("body").toggleClass("rlc-addchanmenu"); });
            this.$el.find(".rlc-filters").bind("contextmenu", function(e){
                e.preventDefault();
                e.stopPropagation();
                var chanID = $(e.target).data("filter");
                if (chanID===null)return; // no a channel
                _self.removeChannel(_self.channels[chanID]);
            });

            // Form events
            this.$opt.find(".channel-mode span").click(this.changeChannelMode);
            this.$opt.find("button").click(function(){
                var newChan = _self.$opt.find("input[name='add-channel']").val();
                if (newChan !== "") _self.addChannel(newChan);
                _self.$opt.find("input[name='add-channel']").val("");
            });


            $(".save-button .btn").click(this.submitHelper);

            // Store default room class
            this.defaultRoomClasses = $("#rlc-chat").attr("class") ? $("#rlc-chat").attr("class") : "";

            // Redraw tabs
            this.drawTabs();

            // Start tab message number ticker if enabled
            if (GM_getValue("rlc-ChannelMessageCounters")){
            setInterval(this.tick, 2000);
            }
        };
    }();

    // Channel Colours for tabbed channels
    var colors = ["rgba(255,0,0,0.1)", "rgba(0,255,0,0.1)", "rgba(0,0,255,0.1)", "rgba(0,255,255,0.1)", "rgba(255,0,255,0.1)", "rgba(255,255,0,0.1)", "rgba(211,211,211, .1)", "rgba(0,100,0, .1)", "rgba(255,20,147, .1)", "rgba(184,134,11, .1)"];
    var color;
    var colorcollection = "";
    for(var c = 0; c < 10; c++){  // c reduced from 35
        color = colors[(c % (colors.length))];

        colorcollection = colorcollection + `#rlc-main.show-colors #rlc-chat li.rlc-message.rlc-filter-${c} { background: ${color};}`;
        colorcollection = colorcollection + `#rlc-chat.rlc-filter.rlc-filter-${c} li.rlc-message.rlc-filter-${c} { display:block;}`;
    }
    GM_addStyle(colorcollection);


//  ██╗   ██╗███████╗███████╗██████╗     ██╗     ██╗███████╗████████╗    ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗███████╗
//  ██║   ██║██╔════╝██╔════╝██╔══██╗    ██║     ██║██╔════╝╚══██╔══╝    ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔════╝
//  ██║   ██║███████╗█████╗  ██████╔╝    ██║     ██║███████╗   ██║       █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ███████╗
//  ██║   ██║╚════██║██╔══╝  ██╔══██╗    ██║     ██║╚════██║   ██║       ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ╚════██║
//  ╚██████╔╝███████║███████╗██║  ██║    ███████╗██║███████║   ██║       ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ███████║
//   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝╚══════╝   ╚═╝       ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚══════╝


    var storedMuteList = GM_getValue("mutedUsers");

    if(storedMuteList!=undefined){
        var mutedUsers = storedMuteList;
    }else{
        var mutedUsers = [];
    }

    function updateMutedUsers() {

        // Reset by removing CSS and userlist
        $("#mystyle").remove();
        $("#bannedlist").empty();

        // Iterate over the muted users
        var selectors = [];
        for(let i = 0; i <= mutedUsers.length; i++){
            if (mutedUsers[i] !== undefined) {    // Avoid the undefined one I cant figure out why I'm puttin in
                selectors.push(`.u_${mutedUsers[i]}{display:none;}`);      // Generate CSS display none rule for user in list
                $('.u_'+mutedUsers[i]).addClass('muted');
                $("#bannedlist").append(`<p>${mutedUsers[i]}</p>`);        // Generate interface element for disabling muting
                //reAlternate(); - seems to do nothing?
            }
        }
        $("body").append(`<style id='mystyle'>${selectors.join(" ")}</style>`); // Inject style tag with user rules

        // Handle clicking in muted user list (needs to be here for scope reasons)
        $("#bannedlist p").click(function(){
            let target = $(this).text();
            let targetPosition = mutedUsers.indexOf(target);
            $('.u_'+mutedUsers[targetPosition]).removeClass('muted');
            reAlternate();
            $(this).remove();  // Remove this element from the muted list
            mutedUsers.splice(targetPosition, 1);  // Remove target from the muted array
            updateMutedUsers(); // Update
            scrollToBottom();
        });
        GM_setValue("mutedUsers", mutedUsers);
    }

    var activeUserArray = [],
        activeUserTimes = [],
        updateArray = [];

    // Update active user list
    function processActiveUsersList() {
        $("#rlc-activeusers ul").empty();
        updateArray = [];

        for(let i = 0; i <= activeUserArray.length; i++){
            if (updateArray.indexOf(activeUserArray[i]) === -1 && activeUserArray[i] !== undefined) {
                updateArray.push(activeUserArray[i]);
                $("#rlc-activeusers ul").append(`<li>
                                                    <span class='activeusersUser'>${activeUserArray[i]}</span> @
                                                    <span class='activeusersTime'>${activeUserTimes[i]}</span>
                                                </li>`);
            } /*else if (updateArray.indexOf(activeUserArray[i]) > -1) {

            }*/
        }
    }


//  ████████╗███████╗██╗  ██╗████████╗    ████████╗ ██████╗     ███████╗██████╗ ███████╗███████╗ ██████╗██╗  ██╗
//  ╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝    ╚══██╔══╝██╔═══██╗    ██╔════╝██╔══██╗██╔════╝██╔════╝██╔════╝██║  ██║
//     ██║   █████╗   ╚███╔╝    ██║          ██║   ██║   ██║    ███████╗██████╔╝█████╗  █████╗  ██║     ███████║
//     ██║   ██╔══╝   ██╔██╗    ██║          ██║   ██║   ██║    ╚════██║██╔═══╝ ██╔══╝  ██╔══╝  ██║     ██╔══██║
//     ██║   ███████╗██╔╝ ██╗   ██║          ██║   ╚██████╔╝    ███████║██║     ███████╗███████╗╚██████╗██║  ██║
//     ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝          ╚═╝    ╚═════╝     ╚══════╝╚═╝     ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝


    var digits = ["", "one ", "two ", "three ", "four ", "five ", "six ", "seven ", "eight ", "nine ", "ten ", "eleven ", "twelve ", "thirteen ", "fourteen ", "fifteen ", "sixteen ", "seventeen ", "eighteen ", "nineteen "],
        tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

    // Numbers to english words for TTS
    function numberToEnglish (num) {
        if ((num = num.toString()).length > 8) return "Overflow in numberToEnglish function.";
        let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);

        // NOTE: IF YOU REPLACE != with !== below, the numbers are read wrong
        if (!n) return; var str = "";
        str += (n[1] != 0) ? (digits[Number(n[1])] || tens[n[1][0]] + " " + digits[n[1][1]]) + "crore " : "";
        str += (n[2] != 0) ? (digits[Number(n[2])] || tens[n[2][0]] + " " + digits[n[2][1]]) + "lakh " : "";
        str += (n[3] != 0) ? (digits[Number(n[3])] || tens[n[3][0]] + " " + digits[n[3][1]]) + "thousand " : "";
        str += (n[4] != 0) ? (digits[Number(n[4])] || tens[n[4][0]] + " " + digits[n[4][1]]) + "hundred " : "";
        str += (n[5] != 0) ? ((str != "") ? "and " : "") + (digits[Number(n[5])] || tens[n[5][0]] + " " + digits[n[5][1]]) + " " : "";
        return str.trim();
    }

    // Select Emoji to narration tone
    var toneList = {
        "smile":   "smiling",
        "evilsmile": "with an evil smile",
        "angry":   "angrily",
        "frown":   "while frowning",
        "confused":"confusedly",
        "disappointed": "in a disappointed tone",
        "meh":     "in a disinterested manner",
        "shocked": "in shock",
        "happy":   "happily",
        "sad":     "looking sad",
        "crying":  "with tears in his eyes",
        "wink":    "while winking",
        "bored":   "boredly",
        "annoyed": "expressing annoyance",
        "xsmile":  "with a grinning broadly",
        "xsad":    "very sadly",
        "xhappy":  "very happily",
        "tongue":  "while sticking out a tongue"
       };

    // Abbreviation Expansion (All keys must be in uppercase)
    var replaceStrList = {
        "AFAIK":   "As Far As I Know",
        "AFK":     "Away From Keyboard",
        "AKA":     "Also Known As",
        "ASAP":    "As Soon As Possible",
        "ATM":     "At the moment",
        "BRB":     "Be right back",
        "B8":      "Bait",
        "BTW":     "By The Way",
        "CYA":     "See Ya",
        "CBA":     "Can't Be Arsed",
        "DAFUQ":   "The Fuck",
        "DEF":     "Definitely",
        "DIY":     "Do It Yourself",
        "FTW":     "For The Win",
        "FK":      "Fuck",
        "FTFY":    "Fixed That For You",
        "FTFY2":   "Fuck That, Fuck You",
        "FFS":     "For Fucks Sake",
        "G2G":     "Got To Go",
        "GR8":     "Great",
        "GL":      "Good Luck",
        "GTFO":    "Get The Fuck Out",
        "HF":      "Have Fun",
        "IRL":     "In Real Life",
        "IIRC":    "If I Recall Correctly",
        "IKR":     "I Know Right",
        "IMO":     "In My Opinion",
        "IDK":     "I don't know",
        "JK":      "Just Kidding",
        "NVM":     "Nevermind",
        "N1":      "Nice One",
        "NP":      "No problem",
        "OFC":     "Of Course",
        "OMG":     "Oh My God",
        "PPL":     "People",
        "PLZ":     "Please",
        "PLS":     "Please",
        "RLY":     "Really",
        "RN":      "Right Now",
        "RTFM":    "Read The Fucking Manual",
        "HAATIVCALBE": "Hobbit's Awesome Abbreviation That Is Very Cool And Loved By Everyone",
        "RLC":     "Reddit Live Chat",
        "SEC":     "Second",
        "STFU":    "Shut The Fuck Up",
        "SRSLY":   "Seriously",
        "SRY":     "Sorry",
        "TLDR":    "Too Long, Didn't Read",
        "TTS":     "Text to speech",
        "TIL":     "Today I learned",
        "TY":      "Thanks",
        "TBH":     "To be honest",
        "WTF":     "What The Fuck",
        "YW":      "You're welcome",
        "KRETENKOBR2": "KretenkobrTwo",
        "<":       "Kleinerdong",
        "PSA":     "Public Service Announcement",
        "PR":      "Pull request",
        "EASTEREGG": "Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo",
        "STJERN":  "stjerneklar"
    };

    // used for TTS voice username-based randomization
    function strSeededRandInt (str, min = 0, max = 256, code = 0){
        for(let i = 0; i < str.length; i++){
            code += str.charCodeAt(i);
        }
        return code % (1 + max - min) + min;
    }

    function getNumbers(input) {
        return input.match(/[0-9]+/g);
    }

    var langSupport = ["el","fr","da","en","en-GB", "en-US", "sv", "es-US", "hi-IN", "it-IT", "nl-NL", "pl-PL", "ru-RU"];
    var urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
    function messageTextToSpeechHandler($msg, $usr) {

        if (GM_getValue("rlc-TextToSpeechTTS")) {

            if(GM_getValue("rlc-TTSLongMessages")){

               // Load in message string
               //var linetoread = $msg.text();
               var linetoread = $msg.html(); // Extract html encoded text
               linetoread = linetoread.replace(/<br>/g, " ... ").replace(/<[^>]+>/g, " "); // Replace tag as pause then strip other tags
               // Unescaped html escaped string by way of crazy voodo magic. (Use textarea to avoid XSS exploits)
               linetoread = $("<textarea/>").html(linetoread).val();

                // Remove any URLs that match urlRegex
                linetoread = linetoread.replace(urlRegex, "");

                var hasTripple = /([^. ])\1\1/.test(linetoread);
                // Check for single character spamming
                if (!hasTripple) {

                    // Abbrev Conversion (Btw: http://www.regexpal.com/ is useful for regex testing)
                    var checkingStr = linetoread.trim(); // Trim spaces to make recognition easier

                    linetoread = linetoread.split(" ").map(function(token){
                        if ( token.replace(/[^\x20-\x7E]/gmi, "").replace(/[.,\/#!(?)$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g,"").toUpperCase() in replaceStrList ){return replaceStrList[token.replace(/[^\x20-\x7E]/gmi, "").replace(/[.,\/#!(?)$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g,"").toUpperCase()];} else {return token;}
                    }).join(" ");

                    // Number To Words Conversion (Moved under abbrev conversion to avoid interfering with Abbrev detection )
                    var numbermatches = getNumbers(linetoread);

                    $.each(numbermatches, function(i) {
                        linetoread = linetoread.split(numbermatches[i]).join(numberToEnglish(numbermatches[i]));
                    });

                    //meMentioned replacement
                    var meMentioned = $msg.parent().parent().hasClass("user-narration");

                    // Narration Style
                    var msg;
                    var usr = $usr.text();
                    //idea: if username is a lot of numbers, call them by the first 3 numbers seperated
                    if (usr == "741456963789852123") { usr = "74"; }
                    if (usr == "Kretenkobr2") { usr = "KretenkobrTwo"; }
                    if (usr == "s3cur1ty") { usr = "Security"; }
                    //if (usr == "Stjerneklar") { usr = "Steeairneklaahr";}

                    // Emoji Detection (Btw: I am a little unconfortable with this function, since its relying on the second class of that span to always be the same )
                    var msgemotes = $msg.find(".mrPumpkin"); // find all emotes in message
                    var msgtwitchemotes = $msg.find(".mrTwitchEmotes");
                    var domEmoji = "";

                    if (msgemotes.length) {
                        var finalemote;

                        $.each(msgemotes, function() {
                            finalemote = $(this).attr("class");

                        });

                        // Btw `.split("mp_")[1]` means to get rid of the `mp_` bit in example `mp_happy` to get just `happy`
                        // (Note: This can be fragile if "mp_" is changed to something else)
                        var lastEmote = finalemote.split(" ")[1].split("mp_")[1];
                        domEmoji = lastEmote;
                    }

                    if (msgtwitchemotes.length) {
                        var finalemote;

                        $.each(msgtwitchemotes, function() {
                            finalemote = $(this).attr("class");

                        });

                        // Btw `.split("mp_")[1]` means to get rid of the `mp_` bit in example `mp_happy` to get just `happy`
                        // (Note: This can be fragile if "mp_" is changed to something else)
                        var lastEmote = finalemote.split(" ")[1].split("tw_")[1];
                        domEmoji = lastEmote;
                    }

                    var toneStr="";
                    if ( domEmoji in toneList ){
                        toneStr = " " + toneList[domEmoji];
                    }

                    if (!GM_getValue("rlc-TTSUsernameNarration")) {
                        msg = new SpeechSynthesisUtterance(linetoread);
                    } else {
                        switch (true) {   //These are causing AutoScroll not to work..? (FF)
                            case meMentioned === true: //Check for /me
                                msg = new SpeechSynthesisUtterance( linetoread  + toneStr  );
                                break;
                            case /.+\?$/.test(checkingStr): // Questioned
                                msg = new SpeechSynthesisUtterance(linetoread + " questioned " + usr + toneStr );
                                break;
                            case /.+\!$/.test(checkingStr):   // Exclaimed
                                msg = new SpeechSynthesisUtterance(linetoread + " exclaimed " + usr + toneStr );
                                break;
                            case /.+[\\\/]s$/.test(checkingStr): // Sarcasm switch checks for /s or \s at the end of a sentence
                                linetoread = linetoread.trim().slice(0, -2);
                                msg = new SpeechSynthesisUtterance(linetoread + " stated " + usr + "sarcastically");
                                break;
                            case checkingStr === checkingStr.toUpperCase(): //Check for screaming
                                msg = new SpeechSynthesisUtterance(linetoread + " shouted " + usr + toneStr );
                                break;
                            default: // said
                                msg = new SpeechSynthesisUtterance(linetoread + " said " + usr + toneStr );
                                break;
                        }
                    }

                    // console.log("TTS | " + linetoread + " by " + usr + " with tone "+ toneStr );

                    msg.voiceURI = 'native';

                    // Set variable voice type
                    if (!GM_getValue("rlc-TTSDisableUserbasedVoices")) {
                        // Select voices that english users can use, even if its not for english exactly...
                        var voiceList = speechSynthesis.getVoices().filter(function(voice) {
                            for (var key in langSupport) {
                                if ( voice.lang.indexOf(langSupport[key]) > -1 ){ return true; }
                            }
                        });

                        // TODO do voice calculations once per user, store voices, perhaps in gmvalues?
                        // Cheap String Seeded Psudo Random Int Hash (Author: mofosyne)
                        msg.voice = voiceList[strSeededRandInt($usr.text(),0,voiceList.length-1)];
                        msg.pitch = 0.0 + (1.6-0.0)*strSeededRandInt($usr.text()+" pitch salt ",0,10)/10; // random range: 0.5 to 1.5
                        msg.rate  = 0.8 + (1.2-0.8)*strSeededRandInt($usr.text()+" rate salt ",0,10)/10; // random range: 0.5 to 1.5
                        //console.log(msg.voice);
                        // pitch alteration is known to break firefox TTS, rate is reset for suspicion of the same behavior
                        if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1)
                        {
                            msg.pitch = msg.pitch.toFixed(1);
                        }

                    }
                    msg.volume = 1; // 0 to 1
                    //msg.rate = 1; // 0.1 to 10
                    //msg.pitch = 1; //0 to 2
                    window.speechSynthesis.speak(msg);
                    // get supported voices
                    //speechSynthesis.getVoices().forEach(function(voice) {  console.log(voice.lang, voice.name);   });
                }
            }

        else{

                // long messages break tts (<300 chars)
                if($msg.text().length<250){

                    // Load in message string
                    var linetoread = $msg.text();

                    // Remove any URLs that match urlRegex
                    linetoread = linetoread.replace(urlRegex, "");

                    var hasTripple = /([^. ])\1\1/.test(linetoread);
                    // Check for single character spamming
                    if (!hasTripple) {

                        // Abbrev Conversion (Btw: http://www.regexpal.com/ is useful for regex testing)
                        var checkingStr = linetoread.trim(); // Trim spaces to make recognition easier

                        linetoread = linetoread.split(" ").map(function(token){
                            if ( token.replace(/[^\x20-\x7E]/gmi, "").replace(/[.,\/#!(?)$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g,"").toUpperCase() in replaceStrList ){return replaceStrList[token.replace(/[^\x20-\x7E]/gmi, "").replace(/[.,\/#!(?)$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g,"").toUpperCase()];} else {return token;}
                        }).join(" ");

                        // Number To Words Conversion (Moved under abbrev conversion to avoid interfering with Abbrev detection )
                        var numbermatches = getNumbers(linetoread);

                        $.each(numbermatches, function(i) {
                            linetoread = linetoread.split(numbermatches[i]).join(numberToEnglish(numbermatches[i]));
                        });

                        //meMentioned replacement
                        var meMentioned = $msg.parent().parent().hasClass("user-narration");

                        // Narration Style
                        var msg;
                        var usr = $usr.text();
                        //idea: if username is a lot of numbers, call them by the first 3 numbers seperated
                        if (usr == "741456963789852123") { usr = "74"; }
                        if (usr == "Kretenkobr2") { usr = "KretenkobrTwo"; }
                        if (usr == "s3cur1ty") { usr = "Security"; }
                        //if (usr == "Stjerneklar") { usr = "Steeairneklaahr";}

                        // Emoji Detection (Btw: I am a little unconfortable with this function, since its relying on the second class of that span to always be the same )
                        var msgemotes = $msg.find(".mrPumpkin"); // find all emotes in message
                        var msgtwitchemotes = $msg.find(".mrTwitchEmotes");
                        var domEmoji = "";

                        if (msgemotes.length) {
                            var finalemote;

                            $.each(msgemotes, function() {
                                finalemote = $(this).attr("class");

                            });

                            // Btw `.split("mp_")[1]` means to get rid of the `mp_` bit in example `mp_happy` to get just `happy`
                            // (Note: This can be fragile if "mp_" is changed to something else)
                            var lastEmote = finalemote.split(" ")[1].split("mp_")[1];
                            domEmoji = lastEmote;
                        }

                        if (msgtwitchemotes.length) {
                            var finalemote;

                            $.each(msgtwitchemotes, function() {
                                finalemote = $(this).attr("class");

                            });

                            // Btw `.split("mp_")[1]` means to get rid of the `mp_` bit in example `mp_happy` to get just `happy`
                            // (Note: This can be fragile if "mp_" is changed to something else)
                            var lastEmote = finalemote.split(" ")[1].split("tw_")[1];
                            domEmoji = lastEmote;
                        }

                        var toneStr="";
                        if ( domEmoji in toneList ){
                            toneStr = " " + toneList[domEmoji];
                        }

                        if (!GM_getValue("rlc-TTSUsernameNarration")) {
                            msg = new SpeechSynthesisUtterance(linetoread);
                        } else {
                            switch (true) {   //These are causing AutoScroll not to work..? (FF)
                                case meMentioned === true: //Check for /me
                                    msg = new SpeechSynthesisUtterance( linetoread  + toneStr  );
                                    break;
                                case /.+\?$/.test(checkingStr): // Questioned
                                    msg = new SpeechSynthesisUtterance(linetoread + " questioned " + usr + toneStr );
                                    break;
                                case /.+\!$/.test(checkingStr):   // Exclaimed
                                    msg = new SpeechSynthesisUtterance(linetoread + " exclaimed " + usr + toneStr );
                                    break;
                                case /.+[\\\/]s$/.test(checkingStr): // Sarcasm switch checks for /s or \s at the end of a sentence
                                    linetoread = linetoread.trim().slice(0, -2);
                                    msg = new SpeechSynthesisUtterance(linetoread + " stated " + usr + "sarcastically");
                                    break;
                                case checkingStr === checkingStr.toUpperCase(): //Check for screaming
                                    msg = new SpeechSynthesisUtterance(linetoread + " shouted " + usr + toneStr );
                                    break;
                                default: // said
                                    msg = new SpeechSynthesisUtterance(linetoread + " said " + usr + toneStr );
                                    break;
                            }
                        }

                        // console.log("TTS | " + linetoread + " by " + usr + " with tone "+ toneStr );

                        msg.voiceURI = 'native';

                        // Set variable voice type
                        if (!GM_getValue("rlc-TTSDisableUserbasedVoices")) {
                            // Select voices that english users can use, even if its not for english exactly...
                            var voiceList = speechSynthesis.getVoices().filter(function(voice) {
                                for (var key in langSupport) {
                                    if ( voice.lang.indexOf(langSupport[key]) > -1 ){ return true; }
                                }
                            });

                            // TODO do voice calculations once per user, store voices, perhaps in gmvalues?
                            // Cheap String Seeded Psudo Random Int Hash (Author: mofosyne)
                            msg.voice = voiceList[strSeededRandInt($usr.text(),0,voiceList.length-1)];
                            msg.pitch = 0.0 + (1.6-0.0)*strSeededRandInt($usr.text()+" pitch salt ",0,10)/10; // random range: 0.5 to 1.5
                            msg.rate  = 0.8 + (1.2-0.8)*strSeededRandInt($usr.text()+" rate salt ",0,10)/10; // random range: 0.5 to 1.5
                            //console.log(msg.voice);
                            // pitch alteration is known to break firefox TTS, rate is reset for suspicion of the same behavior
                            if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1)
                            {
                                msg.pitch = msg.pitch.toFixed(1);
                            }

                        }
                        msg.volume = 1; // 0 to 1
                        //msg.rate = 1; // 0.1 to 10
                        //msg.pitch = 1; //0 to 2
                        window.speechSynthesis.speak(msg);
                        // get supported voices
                        //speechSynthesis.getVoices().forEach(function(voice) {  console.log(voice.lang, voice.name);   });
                    }
                }
            }

        }
    }


//  ███╗   ███╗███████╗ ██████╗     ██╗  ██╗ █████╗ ███╗   ██╗██████╗ ██╗     ██╗███╗   ██╗ ██████╗     ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗███████╗
//  ████╗ ████║██╔════╝██╔════╝     ██║  ██║██╔══██╗████╗  ██║██╔══██╗██║     ██║████╗  ██║██╔════╝     ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔════╝
//  ██╔████╔██║███████╗██║  ███╗    ███████║███████║██╔██╗ ██║██║  ██║██║     ██║██╔██╗ ██║██║  ███╗    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ███████╗
//  ██║╚██╔╝██║╚════██║██║   ██║    ██╔══██║██╔══██║██║╚██╗██║██║  ██║██║     ██║██║╚██╗██║██║   ██║    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ╚════██║
//  ██║ ╚═╝ ██║███████║╚██████╔╝    ██║  ██║██║  ██║██║ ╚████║██████╔╝███████╗██║██║ ╚████║╚██████╔╝    ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ███████║
//  ╚═╝     ╚═╝╚══════╝ ╚═════╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚══════╝


    // Grab users username + play nice with RES
    var robinUser = $("#header-bottom-right .user a").first().text().toLowerCase();

    // Message background alternation via js
    var rowAlternator = false;

    // trigger list. supports multiple triggers for one emote(eg meh) and automaticly matches both upper and lower case letters(eg :o/:O)
    var emojiList={":)": "smile",
                   "3:D": "evilsmile",
                   ":((": "angry",
                   ":(": "frown",
                   ":s": "confused",
                   ":I": "meh",
                   ":|": "meh",
                   ":/": "disappointed",
                   ":o": "shocked",
                   ":D": "happy",
                   "D:": "sad",
                   ";_;": "crying",
                   "T_T": "crying",
                   ";)": "wink",
                   "-_-": "bored",
                   "X|": "annoyed",
                   "X)": "xsmile",
                   "X(": "xsad",
                   "XD": "xhappy",
                   ":P": "tongue",
                  };

    var twitchmojiList={
        "KappaRoss": "ross",
        "KappaClaus": "claus",
        "Kappa": "kappa",
        "PogChamp": "pogchamp",
        "SMOrc": "smorc",
        "NotLikeThis": "notlikethis",
        "FailFish": "failfish",
        "4Head": "4head",
        "EleGiggle": "elegiggle",
        "Kreygasm": "kreygasm",
        "DansGame": "dansgame",
        "WutFace": "wutface",
    };


    function emoteSupport(line, $msg, firstLine) {
        if (!GM_getValue("rlc-NoEmotes")){
            $.each(emojiList, function(emoji,replace){
                if (line.toLowerCase().indexOf(emoji.toLowerCase()) !== -1 && line.indexOf("http") === -1){
                    if ($msg.has("h1").length === 0 && $msg.has("li").length === 0 && $msg.has("code").length === 0 && $msg.has("table").length === 0){
                        firstLine.html(firstLine.html().split(emoji.toUpperCase()).join(emoji.toLowerCase()));
                        firstLine.html(firstLine.html().split(emoji.toLowerCase()).join(`<span class='mrPumpkin mp_${replace}'></span>`));
                    }
                }
            });
        }
    }

    function twitchemoteSupport(line, $msg, firstLine) {
        if (!GM_getValue("rlc-NoTwitchEmotes")){
            $.each(twitchmojiList, function(emoji,replace){
                if (line.toLowerCase().indexOf(emoji.toLowerCase()) !== -1 && line.indexOf("http") === -1){
                    if ($msg.has("h1").length === 0 && $msg.has("li").length === 0 && $msg.has("code").length === 0 && $msg.has("table").length === 0){
                        firstLine.html(firstLine.html().split(emoji.toUpperCase()).join(emoji.toLowerCase()));
                        firstLine.html(firstLine.html().split(emoji.toLowerCase()).join(`<span class='mrTwitchEmotes tw_${replace}'></span>`));
                    }
                }
            });
        }
    }

    function abbrSupport(line, $msg, firstLine) {
        if ( firstLine.html() != null ){ // This is usually for excluding embedded, code or other content that doesn't use html representation
            htmTok = firstLine.html().split(" ");
            htmTok = htmTok.map(function(tokenStr){
                var replaceStrList_key = tokenStr.trim().replace(/[^\x20-\x7E]/gmi, "").replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g,"").toUpperCase(); // Strip trailing space and newlines and punctuations with conversion to newline
                if ( replaceStrList_key in replaceStrList ){
                    return `<abbr title="${replaceStrList[replaceStrList_key]}">${tokenStr}</abbr>`;
                }
                return tokenStr;
            });
            firstLine.html(htmTok.join(" "));
        }
    }

    // Timestamp modification & user activity tracking
    function timeAndUserTracking($el, $usr) {
        var shortTime = $el.find(".simpletime");

        // Add info to activeuserarray
        activeUserArray.push($usr.text());
        //activeUserTimes.push(militarytime);
        activeUserTimes.push(shortTime.text());

        // Moved here to add user activity from any time rather than only once each 10 secs. (Was in tab tick function, place it back there if performance suffers)
        processActiveUsersList();
    }

    function collapseLongMessage($msg,firstLine) {
        if($msg.text().length>250){
            $msg.addClass("longMessageClosed");
            $msg.prepend("<input type='button' value='+' class='extendButton' style='width:18px;height:18px;padding:0px;font-size:0.8em'>");
            $msg.on('click', '.extendButton', function () {
                if($msg.hasClass("longMessageClosed")){
                    $msg.removeClass("longMessageClosed");
                    $msg.find('.extendButton').val('-');
                }else{
                    $msg.addClass("longMessageClosed");
                    $msg.find('.extendButton').val('+');
                }
                scrollToBottom();
            });
        }
    }

    function alternateMsgBackground($el) {
            if (loadHistoryMessageException === 0) {
                var $child = $('.rlc-message-listing:not(.muted)').children()[1];
                rowAlternator=($($child).hasClass('alt-bgcolor'));
            }else{
                rowAlternator=!rowAlternator;
            }
            if(rowAlternator === false){
                $el.addClass("alt-bgcolor");
            }
    }


//  ███╗   ███╗███████╗████████╗ █████╗     ███╗   ███╗███████╗ ██████╗     ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗███████╗
//  ████╗ ████║██╔════╝╚══██╔══╝██╔══██╗    ████╗ ████║██╔════╝██╔════╝     ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔════╝
//  ██╔████╔██║█████╗     ██║   ███████║    ██╔████╔██║███████╗██║  ███╗    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ███████╗
//  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║    ██║╚██╔╝██║╚════██║██║   ██║    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ╚════██║
//  ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║    ██║ ╚═╝ ██║███████║╚██████╔╝    ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ███████║
//  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝     ╚═╝╚══════╝ ╚═════╝     ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚══════╝


    function reAlternate(){
       $('.rlc-message').removeClass('alt-bgcolor');
       $('.rlc-message:odd').addClass('alt-bgcolor');
    }

    // called by the max messages option, removes any message with a number higher than the specified max.
    // this is done by looping trough a list of all messages and for each message checking what number the message is in the list.
    // if the message number in the list(referred to as its index) is heigher than the max number supplied, the message is removed.
    function cropMessages(max) {
        $( ".rlc-message" ).each(function( index ) {
            if (index > max) {
                $( this ).remove();
            }
        });
    }

    // Scroll chat back to bottom
    var scrollToBottom = function(){
        if (GM_getValue("rlc-AutoScroll")){
            $("#rlc-chat").scrollTop($("#rlc-chat")[0].scrollHeight);
        }
    };


//  ██╗   ██╗███████╗███████╗██████╗      ██████╗ ██████╗ ██╗      ██████╗ ██████╗     ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗███████╗
//  ██║   ██║██╔════╝██╔════╝██╔══██╗    ██╔════╝██╔═══██╗██║     ██╔═══██╗██╔══██╗    ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔════╝
//  ██║   ██║███████╗█████╗  ██████╔╝    ██║     ██║   ██║██║     ██║   ██║██████╔╝    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ███████╗
//  ██║   ██║╚════██║██╔══╝  ██╔══██╗    ██║     ██║   ██║██║     ██║   ██║██╔══██╗    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ╚════██║
//  ╚██████╔╝███████║███████╗██║  ██║    ╚██████╗╚██████╔╝███████╗╚██████╔╝██║  ██║    ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ███████║
//   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝    ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚══════╝
//


    // Generate random value based on seed, max and minimum (for user colors)
    Math.seededRandom = function(seed, max = 1, min = 0) {
        // In order to work 'seed' must NOT be undefined,
        // So in any case, you HAVE to provide a Math.seed

        seed = (seed * 9301 + 49297) % 233280;
        var rnd = seed / 233280;

        return parseInt(min + rnd * (max - min));
    };

    //Generates the matching light, dark and Robin colors for username CSS and stores them in a persistent array
    function colorGen($usr) {
        var hexArray = GM_getValue("hexArrayStore", "") || [];
        var tempArray = [];

        // Convert string to hex
        var hexStr = $usr.text();
        var result = "";
        for (var i=0; i<hexStr.length; i++) {
            result += hexStr.charCodeAt(i).toString(16);
        }

        var hexName = result.split("");//Splitting each character up with ""s and converting to hex

        var adder = 1;
        $.each(hexName, function(ind,num){
            num = (parseInt(num) + 1);
            if (num !== 0 && !isNaN(num)){//math
                adder = adder * num;
            }
        });
        adder = adder.toString().replace(".", "").split("0").join("");
        let start = adder.length-10;
        let end = adder.length-4;
        var firstThree = adder.toString().substring(start, end);//moremath
        var amt = 60;

        //Will loop twice, once for light and once for dark, then escapes to Robin colors
        for (i=0;i<2;i++){
            var r = firstThree.slice(0,2);
            var g = firstThree.slice(2,4);
            var b = firstThree.slice(4,6);
            if (rowAlternator) amt+=10;   // TODO: Might want to rethink this
            var randR = (Math.seededRandom(r*100,120,175));
            var randG = (Math.seededRandom(g*100,120,175));
            var randB = (Math.seededRandom(b*100,120,175));
            // This is the randomizer, not much to know about this. Buncha math
            var suppress = (Math.seededRandom(firstThree*r*10,0,6));
            var modAmt =2 ;
            switch(suppress) {
                case 0:
                    randR/=modAmt;
                    break;
                case 1:
                    randG/=modAmt;
                    break;
                case 2:
                    randB/=modAmt;
                    break;
                case 4:
                    randR/=modAmt;
                    randG/=modAmt;
                    break;
                case 5:
                    randR/=modAmt;
                    randB/=modAmt;
                    break;
                case 6:
                    randG/=modAmt;
                    randB/=modAmt;
                    break;
                default:
                    break;
            }
            var hexR = (parseInt(randR) + parseInt(amt)).toString(16);
            var hexG = (parseInt(randG) + parseInt(amt)).toString(16);
            var hexB = (parseInt(randB) + parseInt(amt)).toString(16);
            amt=-40;
            tempArray.push(hexR + hexG + hexB); //pushing the 6 character string to a temporary array, one for light, one for dark
        }

        //Robin Colors
        var colors = ["e50000", "db8e00", "ccc100", "02be01", "0083c7", "820080"];
        var e = $usr.text().toLowerCase(),
            t = e.replace(/[^a-z0-9]/g, ""),
            n = parseInt(t, 36) % 6;

        //Cascading array used to add color schemes to master hex array on a 1:1 user:colorset basis
        //AKA, arrays within an array (multidimensional array)
        tempArray.push(colors[n]);
        hexArray.push(tempArray);
        //console.log(hexArray);
        GM_setValue("hexArrayStore", hexArray); //Store array in scriptmonkey settings for later access
    }


//  ██╗     ██╗██╗   ██╗███████╗     █████╗ ██████╗ ██╗    ██╗    ██╗███████╗██████╗ ███████╗ ██████╗  ██████╗██╗  ██╗███████╗████████╗
//  ██║     ██║██║   ██║██╔════╝    ██╔══██╗██╔══██╗██║    ██║    ██║██╔════╝██╔══██╗██╔════╝██╔═══██╗██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝
//  ██║     ██║██║   ██║█████╗      ███████║██████╔╝██║    ██║ █╗ ██║█████╗  ██████╔╝███████╗██║   ██║██║     █████╔╝ █████╗     ██║
//  ██║     ██║╚██╗ ██╔╝██╔══╝      ██╔══██║██╔═══╝ ██║    ██║███╗██║██╔══╝  ██╔══██╗╚════██║██║   ██║██║     ██╔═██╗ ██╔══╝     ██║
//  ███████╗██║ ╚████╔╝ ███████╗    ██║  ██║██║     ██║    ╚███╔███╔╝███████╗██████╔╝███████║╚██████╔╝╚██████╗██║  ██╗███████╗   ██║
//  ╚══════╝╚═╝  ╚═══╝  ╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝     ╚══╝╚══╝ ╚══════╝╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝

// used to make sure that the url we use to connect the websocket does not end in a slash.
function stripTrailingSlash(str) {
    if(str.substr(-1) === '/') {
        return str.substr(0, str.length - 1);
    }
    return str;
}

/* connectionTimer & incConTimer track how long time has passed since last websocket activity and notifies the user
   if more than 2 minutes have passed without activity, as this is taken as a disconnect.  */
var connectionTimer = 0;
function incConTimer() {
   connectionTimer = connectionTimer + 1;
    if (connectionTimer > 2) {
    location.reload();
   }
}
setInterval(incConTimer, 60000);

+function(){

    $.getJSON(stripTrailingSlash(window.location.href) + "/about.json", function(data) {

        var websocket_url = data.data.websocket_url;

        var ws = new WebSocket(websocket_url);

        ws.onmessage = function (evt) {

                // Ensure data has data
                 if(!data.hasOwnProperty('data'))
                 {
                     console.log("Help me Obi-Wan Kenobi. We got empty data!");
                     return;
                 }

            var msg = JSON.parse(evt.data);
            connectionTimer = 0;  // connection timer is reset on any activity that has data
            switch(msg.type) {
            case 'update':


                var payload = msg.payload.data;

                // See messageFaker function for how messages from json are turned into rlc-messages
                $(".rlc-message-listing").prepend(messageFaker(payload));

                break;

             /*  disabled, liveupdate header already tracks this
            case 'activity':

                var payload = msg.payload;
                console.log('user count from websocket:', payload.count);

                break;
            */

            case 'delete':
                if(!GM_getValue("rlc-NoMessageRemoval")) {
                  console.log("message deleted:"+msg.payload);
                  var messageToDelete = "rlc-id-"+msg.payload;
                  $( "li[name='"+messageToDelete+"']" ).remove();
                  reAlternate();
                }

                break;


            /*  embeds_ready - a previously posted update has
            been parsed and embedded media is available for it now.
            the payload contains a liveupdate_id and list of embeds to add to it.*/
            }

        };

    });

}();


//   ██████╗ ███████╗████████╗    ███╗   ███╗███████╗███████╗███████╗███████╗ █████╗  ██████╗ ███████╗███████╗
//  ██╔════╝ ██╔════╝╚══██╔══╝    ████╗ ████║██╔════╝██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝ ██╔════╝██╔════╝
//  ██║  ███╗█████╗     ██║       ██╔████╔██║█████╗  ███████╗███████╗███████╗███████║██║  ███╗█████╗  ███████╗
//  ██║   ██║██╔══╝     ██║       ██║╚██╔╝██║██╔══╝  ╚════██║╚════██║╚════██║██╔══██║██║   ██║██╔══╝  ╚════██║
//  ╚██████╔╝███████╗   ██║       ██║ ╚═╝ ██║███████╗███████║███████║███████║██║  ██║╚██████╔╝███████╗███████║
//   ╚═════╝ ╚══════╝   ╚═╝       ╚═╝     ╚═╝╚══════╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝


function getContributors() {

     var urlToGet = stripTrailingSlash(window.location.href) + "/contributors.json";

     var ajaxLoadUsers =     $.getJSON( urlToGet, function( data ) {
         var userdata = data[0].data.children;
         $.each( userdata, function( ) {
             console.log($(this));
             console.log($(this)[0].name);
             console.log($(this)[0].permissions);
         });
            });
        ajaxLoadUsers.complete(function() {

        });
}

function getMessages(gettingOld) {
    loadHistoryMessageException = 1;

     var urlToGet = stripTrailingSlash(window.location.href) + "/.json";

    if (gettingOld) {
        var lastMessage = $(".rlc-message:last-child");
        if(lastMessage.length !== 1) { console.log("nolastmessage");}
        else {
            urlToGet += "?after="+$(".rlc-message:last-child").attr("name").split("rlc-id-")[1];
        }
    }

     var ajaxLoadOldMessages = $.getJSON( urlToGet, function( data ) {

                 // Ensure data has data
                 if(!data.hasOwnProperty('data'))
                 {
                     console.log("Help me Obi-Wan Kenobi. We got empty data!");
                     return;
                 }

                var oldmessages = data.data.children;  //navigate the data to the object containing the messages
                $.each( oldmessages, function( ) {
                    var msg = $(this).toArray()[0].data; //navigate to the message data level we want

                    // See messageFaker function for how messages from json are turned into rlc-messages
                    $(".rlc-message-listing").append(messageFaker(msg));
                });
            });
        ajaxLoadOldMessages.complete(function() {
            loadHistoryMessageException = 0;
               reAlternate();
        });
}

function messageFaker(msg) {
                    var msgID = msg.name;
                    var $msgbody = msg.body_html;

                    if (GM_getValue("rlc-DisableMarkdown")) {$msgbody + '<div class="md"><p>'+ msg.body +'</p></div>';}

                        // Unescaped html escaped string by way of crazy voodo magic.
                        $msgbody = $("<textarea/>").html($msgbody).val()

                    var usr = msg.author;
                    var utcSeconds = msg.created_utc;

                    // translate created_utc to a human readable version
                    var readAbleDate = new Date(0); // The 0 there is the key, which sets the date to the epoch
                    readAbleDate.setUTCSeconds(utcSeconds);

                    var hours = readAbleDate.getHours();
                    var minutes = ((readAbleDate.getMinutes() < 10)? '0' : '') + readAbleDate.getMinutes() ;
                    var seconds = readAbleDate.getSeconds().toString();

                    // if seconds is a single diget value, prefix it with a 0 (12:00:1 becomes 12:00:01)
                    if (seconds.length === 1) { seconds = "0" + seconds};

                    if (GM_getValue("rlc-12HourMode")) {
                            //it is pm if hours from 12 onwards
                            var suffix = (hours >= 12)? 'PM' : 'AM';

                            //only -12 from hours if it is greater than 12 (if not back at mid night)
                            hours = (hours > 12)? hours -12 : hours;

                            //if 00 then it is 12 am
                            hours = (hours === '00')? 12 : hours;
                    } else {
                        suffix = "";
                    }

                    if(GM_getValue("rlc-SecondsMode"))
                        {
                            finaltimestamp = hours.toString() + ":" + minutes.toString()+ ":" + seconds.toString() + " " + suffix;
                        }else var finaltimestamp = hours.toString() + ":" + minutes.toString() + " " + suffix;

                    var fakeMessage = `
                    <li class="rlc-message" name="rlc-id-${msgID}">
                        <div class="body">${$msgbody}
                            <div class="simpletime">${finaltimestamp}</div>
                            <a href="/user/${usr}" class="author">${usr}</a>
                        </div>
                    </li>`
                    return fakeMessage;
}


//  ███╗   ███╗███████╗███████╗███████╗ █████╗  ██████╗ ███████╗    ██╗  ██╗ █████╗ ███╗   ██╗██████╗ ██╗     ██╗███╗   ██╗ ██████╗
//  ████╗ ████║██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝ ██╔════╝    ██║  ██║██╔══██╗████╗  ██║██╔══██╗██║     ██║████╗  ██║██╔════╝
//  ██╔████╔██║█████╗  ███████╗███████╗███████║██║  ███╗█████╗      ███████║███████║██╔██╗ ██║██║  ██║██║     ██║██╔██╗ ██║██║  ███╗
//  ██║╚██╔╝██║██╔══╝  ╚════██║╚════██║██╔══██║██║   ██║██╔══╝      ██╔══██║██╔══██║██║╚██╗██║██║  ██║██║     ██║██║╚██╗██║██║   ██║
//  ██║ ╚═╝ ██║███████╗███████║███████║██║  ██║╚██████╔╝███████╗    ██║  ██║██║  ██║██║ ╚████║██████╔╝███████╗██║██║ ╚████║╚██████╔╝
//  ╚═╝     ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝


    // Notification sound in base64 encoding
    var base64sound ="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QECBtFxREzTNkMyfLLVlM9UgS6aQnkPEo3DJRYkUyVQacP6j+5rqMc4TaCiVCxzSEDIKUTvMec6D7tk0aS4CEYQqahfEu6jh/We1NrVrQzhbTKZBgYbi8YbecRuLTMpTvUoAIIlynCMCimNNtBMWwDOcZIMABFMmDZPSCQgzPrLBYvUyQFMUd6UR1kbzgIGfWKw/SrqKgg5coZaKgUBQzOtyEaucSrOTBlGOqpGMNYXtGwYFhwTdfZ/nmjb0QUrCKicsj8alcPp0y7KmpuOEVAQSvUg25SKDofWuZEBtKidNLZhQJ0oGpdfVeGhJgUUEjARAINH4cGP3olbJAcdDR4gdl/onWtSmuw1xa2WVPSOy6CJ4qHBgSoO8r9UmcZiT4P+YkAhcKf+BJTTY44/cYFV5vLKV2XeYQShgODRoQoL8Kv/7ksTXgBhp4TbVygAE2sIlAzuwAJ5JQRVudDXlr7DoQRA6LbSquF6tu7RZb5t9nGr1bOOvx+64QknJBvtR///////////////6R48LQFE////////////////2AwDFdBkACAVhVSstnYaa015ymstdiCPRbJK5R0zROkwvcAhgeoNiRyAwEGJhpENIsbJLJknUCBC5jw5QzRuQEc0uCEwauFwjqEFhBYXEVxjQyKGKSXFmigRmTxeLx0mUjEumrUkklJJLLpqogQ5x4mhziLGyJdRatHrRLrooskk6Jq6Jqj1o/qSSqS/60UZkXmUkk9FFGtFH/9aPRRZRkXmSLyT0W/0UaLKSSWYl1zFMQU1FMy45OC4yqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy45OC4yqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+5LEoQPVgaL0XYiAAAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
    var snd = new Audio("data:audio/wav;base64, " + base64sound);

    // Adjust notification volume
    snd.volume=0.2;

    // Chrome notice image in bass64
    var chromeNotificationImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAADgSURBVFhH7ZdRbsMwDENzgt7/Sj2VG0eEKxGUmgJOUKR5eMNgiRH3u6U5lgPA6Q08sHg+povL1mJNlJiu9Z1bdkKT2Zv+rAyL7/8OfFbcFKOID2QiGhEBMYr4QCaiERHgt2JkpAgpOMNvxchIEVJwht+KkZEipODMeL9HER/IRDQiAmIU8YFMRCMi4EcmFvtqvPisuEnTg7zLpniXTfGXyopVZn2tQ9Nhscqsr3VoOixWmfW1Dk299Zb8eKpDUxKhHdCH5K7QLK9ddt3/YtYf6zuoEpetxX4ZtpgLTq+09gIQTX1K/dS/IgAAAABJRU5ErkJggg==";

    // Used differentiate initial and subsequent messages
    var loadHistoryMessageException = 1;

    var maxmessages = 25;

    // note from stjern: no reason to set these for every message
    var hexArray    = GM_getValue("hexArrayStore", "") || []; //initialize hex and usr lookup list variables
    var usrArray    = GM_getValue("usrArrayStore", "") || [];
    var colorSet    = "error"; //this value should never end up getting used

    // Message display handling for new and old (rescan) messages
    // Add any proccessing for new messages in here
    var handleNewMessage = function($el, rescan){

        //variables used troughout the function, all relating to the currently proccessed message
        var $msg        = $el.find(".body .md");
        var $usr        = $el.find(".author");
        var line        = $msg.text().toLowerCase();
        var firstLine   = $msg.find("p").first();

        //handle giphy images
        if (line.trim().indexOf("rlc-image") === 0){
            if (!GM_getValue("rlc-HideGiphyImages")){
                var linksObj = $msg.find("a");
                var url = linksObj.attr("href");
                if (url) {
                    var url_2nd = linksObj.length > 1 ? $msg.find("a:eq(1)").attr("href").trim() : url; // I do think this could be made more nicer... not sure why linksObj[1] doesn't work. had to use $msg.find("a:eq(1)") instead
                    var splitByPipe = $msg.text().split("|");
                    var searchTerm = splitByPipe.length > 1 ? splitByPipe[1].trim() : " ";
                    var imgHeight = 0;
                    imgHeight = splitByPipe.length > 2 ? splitByPipe[2].trim() : " ";

                    url = url.replace(/^http:\/\//i, 'https://'); //force usage of https

                    $el.addClass("rlc-imageWithin");

                    firstLine.html(" <a href="+url_2nd+"><img height='"+imgHeight+"' class='rlc-image' src='"+url+"'"+"</img><span class='rlc-imgvia'>via /giphy "+decodeURI(searchTerm)+"</span></a>");
                }
            }
            else {
                $el.remove();
                return false; // if this is a Giphy and HideGiphyImages is on, remove this message and stop function
            }
        }

        // Track channels
        tabbedChannels.proccessLine(line, $el, rescan);

        // remove the oldest message if there are more than 25 if that option is on.
        if (GM_getValue("rlc-MaxMessages25")){
            var totalmessages = $(".rlc-message").length;
            if (totalmessages > maxmessages) {
                $(".rlc-message").last().remove();
            }
        }

        // /me support (if in channel see proccessline)
        if (line.indexOf("/me") === 0){
            $el.addClass("user-narration");
            firstLine.html(firstLine.html().replace("/me", " " + $usr.text()));
        }

        // Timestamp modification & user activity tracking
        timeAndUserTracking($el, $usr);

        // long message collapsing
        collapseLongMessage($msg,firstLine);

        // Target blank all message links
        $msg.find("a").attr("target", "_blank");

        // Alternating background color
        alternateMsgBackground($el);

        // Smiley Emotes
        emoteSupport(line, $msg, firstLine);

        // Twitch emotes
        twitchemoteSupport(line, $msg, firstLine);

        // Abbreviations
        abbrSupport(line, $msg, firstLine);

        // Easy (and hacky) multiline
        $msg.html($msg.html().split("\n").join("<br>"));
        $msg.html($msg.html().replace("<br><br>","<br>"));
        $msg.html($msg.html().replace("</p><br>", ""));

         if (line.indexOf(robinUser) !== -1){
            // Add bold highlighting
            $el.addClass("user-mention");
        }

        //finds iframes
        var embedFinder = $msg.find("iframe").length;
        if (embedFinder === 1) { $el.addClass("rlc-hasEmbed"); }

        // if theres a link in the message
        if ($msg.find("a").length === 1) {

            // aza is the result of splitting message text at space and picking the second piece.
            var aza = line.split(" ")[1];
           // console.log(aza);

            // if we had a link and splitting it at space results in an undefined aza, the only thing in the message was the link.
            if (typeof aza === "undefined") {
                $el.addClass("rlc-hasEmbed");
            }
        }

        // User color assignment:
        if (GM_getValue("rlc-RobinColors")) {
            colorSet = 2;
        }
        else {
            if (GM_getValue("rlc-DarkMode")) {
            colorSet = 0;
            }
            // default non dark colors
            else {
            colorSet = 1;
            }
        }

        // Tag message with user identifier for muting
        $el.addClass("u_"+$usr.text());

        //Check if user exists and add user to list if they don't.
        if (usrArray.indexOf($usr.text()) === -1) {
            usrArray.push($usr.text());
            colorGen($usr); //generate dark, light and Robin colorschemes for the user
            GM_setValue("usrArrayStore", usrArray); //Store usrArray into settings
            hexArray = GM_getValue("hexArrayStore", ""); //update hexArray to include new user's colors
        }

        //Apply color through CSS to message author
        $usr.css("color", "#"+(hexArray[usrArray.indexOf($usr.text())][colorSet]));

        //deal with muting
        if(mutedUsers.indexOf($usr.text())!=-1){
            $msg.parent().addClass('muted');
        }

        // Stuff that should not be done to messages loaded on init, like TTS handling
        if (loadHistoryMessageException === 0 && rescan != true) {

            scrollToBottom();

            // if all AllNotificationswhenunfocused option is enabled
            // check if document is focused. if so:
            // do both types of notifications if they are enabled
            if (GM_getValue("rlc-AllNotificationswhenunfocused")){
                if ( !document.hasFocus() ) {
                    if (GM_getValue("rlc-ChromeNotifications")){
                        new Notification("Robin Live Chat",{
                            icon: chromeNotificationImage,
                            body: $usr.text() + ": " + line
                        });
                    }
                    if (GM_getValue("rlc-NotificationSound")){
                        snd.play();
                    }
                }
            }
            // AllNotificationswhenunfocused is not enabled
            // Check if user was mentioned and if so:
            // do both types of notifications if they are enabled
            else {
                if (line.indexOf(robinUser) !== -1){
                    if (GM_getValue("rlc-ChromeNotifications")){
                        new Notification("Robin Live Chat",{
                            icon: chromeNotificationImage,
                            body: $usr.text() + ": " + line
                        });
                    }
                    if (GM_getValue("rlc-NotificationSound")){
                        snd.play();
                    }
                }
            }

            //if option is checked, check if message user is "robin" user and do not play if so
            if (GM_getValue("rlc-TTSDisableSelfnarration")){
                if ($usr.text().toLowerCase().indexOf(robinUser) != -1){
                    return false;  //end function before TTS is called.
                }
            }
            // todo: check if we are in another channel and dont play tts if so.
            if(!$msg.parent().hasClass('muted')){
                messageTextToSpeechHandler($msg, $usr);
            }
        }
    };


//  ██╗  ██╗███████╗██╗   ██╗██████╗ ██████╗ ███████╗███████╗███████╗    ██╗  ██╗ █████╗ ███╗   ██╗██████╗ ██╗     ██╗███╗   ██╗ ██████╗
//  ██║ ██╔╝██╔════╝╚██╗ ██╔╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝    ██║  ██║██╔══██╗████╗  ██║██╔══██╗██║     ██║████╗  ██║██╔════╝
//  █████╔╝ █████╗   ╚████╔╝ ██████╔╝██████╔╝█████╗  ███████╗███████╗    ███████║███████║██╔██╗ ██║██║  ██║██║     ██║██╔██╗ ██║██║  ███╗
//  ██╔═██╗ ██╔══╝    ╚██╔╝  ██╔═══╝ ██╔══██╗██╔══╝  ╚════██║╚════██║    ██╔══██║██╔══██║██║╚██╗██║██║  ██║██║     ██║██║╚██╗██║██║   ██║
//  ██║  ██╗███████╗   ██║   ██║     ██║  ██║███████╗███████║███████║    ██║  ██║██║  ██║██║ ╚████║██████╔╝███████╗██║██║ ╚████║╚██████╔╝
//  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝


    String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

    //browser info getter from http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
    navigator.sayswho= (function(){
        var ua= navigator.userAgent, tem,
        M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if(/trident/i.test(M[1])){
            tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
        }
        if(M[1]=== 'Chrome'){
            tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
            if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
        }
        M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
        if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    })();

    // Channel prefix removal
    var removeChannelKeyFromMessage = function(message){
       if ($("#rlc-chat").attr("data-channel-key")){
           var offset = $("#rlc-chat").attr("data-channel-key").length;
           if (offset === 0) return message;

           if (message.indexOf("/me") === 0) return "/me "+ message.slice(offset+5);
           return message.slice(offset+1);
       }
       return message;
    };

function refreshChat() {  $(".rlc-message").remove(); getMessages();}

    // Settings Keys (used in /sharesettings)
    var optionsArray = [];

    // Message history
    var messageHistory = [],
        messageHistoryIndex = -1,
        lastTyped = "";

    function keypressHandling() {

        var textArea = $(".usertext-edit.md-container textarea");

        // body keypress focuses textarea
        $(document).keydown(function(e) {
            var ctrlDown = e.ctrlKey||e.metaKey
            if (ctrlDown) {  return;  }
            if ($(e.target).is("textarea")) {   }
            else {
                textArea.focus();
            }
        });

        // On post message, add it to history
        $(".save-button .btn").click(function(){
            var userLastMessage = textArea.val();

            // If message history is to long, clear it out
            if (messageHistory.length === 25){
                messageHistory.shift();
            }
            messageHistory.push(removeChannelKeyFromMessage(userLastMessage));
            messageHistoryIndex = messageHistory.length;
        });

        // Handling of keypresses in messagebox textarea
        textArea.on("keydown", function(e) {
            // Tab autocomplete
            if (e.keyCode === 9) { // Stole my old code from Parrot
                processActiveUsersList();
                e.preventDefault();
                var sourceAlt= $(".usertext-edit textarea").val();
                var namePart = "";
                var space=sourceAlt.lastIndexOf(" ");
                namePart = sourceAlt.substring(space).trim();
                sourceAlt = sourceAlt.substring(0, sourceAlt.lastIndexOf(" "));
                var found=false;
                $.each(updateArray, function(ind,Lname){
                    if (Lname.indexOf(namePart) === 0){
                        namePart=Lname;
                        if (space !== -1) namePart = " "+namePart;
                        found = true;
                        return true;
                    } else if (Lname.toLowerCase().indexOf(namePart.toLowerCase()) === 0){ // This is in an else because it should give priority to case Sensitive tab completion
                        namePart = Lname;
                        if (space !== -1) namePart=" "+namePart;
                        found = true;
                        return true;
                    }
                });
                if (found){
                    $(".usertext-edit textarea").val(sourceAlt+namePart);
                }
            }
            // Enter message send
            if (e.keyCode === 13) {
                if (e.shiftKey) { /* Exit enter handling to allow shift+enter newline */  }
                else if (textArea.val() === "" ) {
                    // prevent sending empty messages
                    e.preventDefault();
                }
                // slash commands:
                else {
                    if (textArea.val().indexOf("/pusheen") === 0){
                        $(this).val(`/gif pusheen`);
                    }
                    if (textArea.val().indexOf("/version") === 0){
                        $(this).val(`||| RLC Version Info (via /version) RLC v.${GM_info.script.version}`);
                    }

                    if (textArea.val().indexOf("/afk") === 0){
                      var afktime = textArea.val().split("/afk ")[1];
                      var afkstring = `/me is going AFK`;

                      if (typeof afktime !== "undefined") {
                        afkstring = afkstring + " for the next " + afktime;
                      }
                      $(this).val(afkstring);

                    }

                    if(textArea.val().indexOf("/ggl") === 0)
                        {
                            var searchString = textArea.val().split("/ggl ")[1].replace(/ /g, "+");
                            var gglString = `https://www.google.com/#q=`;

                            if (typeof searchString !== "undefined")
                                {
                                    searchString = gglString + searchString;
                                }
                            $(this).val(searchString);
                        }

                    if (textArea.val().indexOf("/browser") === 0){
                        $(this).val(`||| Browser Details (via /browser ) : ${navigator.sayswho}`);
                    }
                    if (textArea.val().indexOf("/console.log") === 0) {
                        console.log(eval(textArea.val().substring(textArea.val().indexOf("g") + 2)));
                        $(".save-button .btn").click();
                    }
                    if (textArea.val().indexOf("/settings") === 0){
                        var str = "    {\n";
                        str += optionsArray.map(function(key){
                            return "    \""+key+"\": \""+GM_getValue(key)+"\"";
                        }).join(",\n");
                        str += "\n    }"
                        $(this).val( "||| RLC settings (via /settings ) : \n\n"+str +"\n Last Settings Reset: "+GM_getValue("rlc-lastReset"));
                    }
                    if (textArea.val().indexOf("/reset") === 0){
                        var keys = GM_listValues();
                        for (var i=0, key=null; key=keys[i]; i++) {
                            GM_deleteValue(key);
                        }
                        GM_setValue("rlc-lastReset",Date());
                        $(this).val( "||| Resetting RLC options (via /reset)");
                        location.reload();
                    }
                    if (textArea.val().indexOf("/clear") === 0){
                        $(".rlc-message").remove();
                        $("#new-update-form textarea").val("");
                        return false;
                    }
                    if (textArea.val().indexOf("/opt") === 0){
                        var afterOptSplit = textArea.val().split("/opt ")[1].capitalize();
                        if (afterOptSplit) {
                            $("#rlc-settings label:contains('"+afterOptSplit+"') input" ).click();
                        }
                        else {
                            alert("/opt must be followed by an option name");
                        }

                        $("#new-update-form textarea").val("");
                        return false;
                    }

                    if (textArea.val().indexOf("/giphy") === 0 || textArea.val().indexOf("/gif") === 0  ){
                        if (!GM_getValue("rlc-HideGiphyImages")){
                            var giphyQueryList = $(this).val().split(" ");
                            giphyQueryList.shift();
                            var giphyQuery = giphyQueryList.join(" ");
                            const GIPHY_API_KEY = "dc6zaTOxFJmzC";   // public test key, replace with production version.

                            jQuery.getJSON( `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${giphyQueryList.join("+")}` ,function( XHRObj ) {
                                thumbnail_url = XHRObj.data.image_url;
                                image_url = XHRObj.data.url;
                                var textArea = $(".usertext-edit.md-container textarea");
                                textArea.val("rlc-image "+thumbnail_url+" "+image_url+" | "+giphyQuery +"|"+ XHRObj.data.image_height);

                                $(".save-button .btn").click();
                            });
                        }
                        $("#new-update-form textarea").val("");
                        return false;
                    }
                    if (textArea.val().indexOf("/time") === 0){
                        $(this).val(`||| Time is (via /time): ${Date()}`);
                    }
                    e.preventDefault();
                    $(".save-button .btn").click();
                    $("#new-update-form textarea").val("");
                }
            }
            else if (e.keyCode === 38) {
                e.preventDefault();
                if (messageHistoryIndex > 0) messageHistoryIndex--;
                if (messageHistoryIndex === messageHistory.length-1) lastTyped = $(this).val();
                if (messageHistoryIndex > -1) $(this).val(messageHistory[messageHistoryIndex]);
            } else if (e.keyCode === 40){
                e.preventDefault();

                if (!(messageHistory.length > 0 && messageHistoryIndex < messageHistory.length)) {
                    return;
                }

                messageHistoryIndex++;

                $(this).val(messageHistoryIndex === messageHistory.length ?
                    lastTyped :
                    messageHistory[messageHistoryIndex]
                );

            } else {

                // reset history index when user types
                if (messageHistory.length > 0) {
                    messageHistoryIndex = messageHistory.length;
                }

            }
        });
    }


//   ██████╗██╗     ██╗ ██████╗██╗  ██╗    ██╗  ██╗ █████╗ ███╗   ██╗██████╗ ██╗     ██╗███╗   ██╗ ██████╗
//  ██╔════╝██║     ██║██╔════╝██║ ██╔╝    ██║  ██║██╔══██╗████╗  ██║██╔══██╗██║     ██║████╗  ██║██╔════╝
//  ██║     ██║     ██║██║     █████╔╝     ███████║███████║██╔██╗ ██║██║  ██║██║     ██║██╔██╗ ██║██║  ███╗
//  ██║     ██║     ██║██║     ██╔═██╗     ██╔══██║██╔══██║██║╚██╗██║██║  ██║██║     ██║██║╚██╗██║██║   ██║
//  ╚██████╗███████╗██║╚██████╗██║  ██╗    ██║  ██║██║  ██║██║ ╚████║██████╔╝███████╗██║██║ ╚████║╚██████╔╝
//   ╚═════╝╚══════╝╚═╝ ╚═════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝
//


$( window ).resize(function() {
  scrollToBottom();
});

    // show the linked content in the left panel
    // rewritten to find the original liveupdate and take the iframe from there
    function embedLinker($el){

        var selectorstring = "#embed" + $el.attr("name").split("rlc-id")[1]+"-0";

        var $liveupdateEl = $(selectorstring);

        $("#rlc-leftPanel").empty();
        $("#rlc-leftPanel").append("&nbsp;");
        $("#rlc-leftPanel").append($liveupdateEl.clone());

        // make sure left panel is activated
        if (!GM_getValue("rlc-LeftPanel")){
            $( "#rlc-settings label:contains('Left Panel') input" ).click();
        }
    }

    function OpenUserPM(name) {
        var $url = "https://www.reddit.com/message/compose/?to=";
        var win = window.open($url+name, "_blank");
        win.focus();
    }

     // uses the unique message id to delete the real message. need to do a writeup, basicaly the native reddit live messages are on the page but not shown.
     // instead we show our own structure with our own messages. this deletes the comment by matching the rlc-message with the liveupdate and pressing the delete and yes button on the liveupdate.
    function deleteComment($objComment){

            var selectorstring = $objComment.attr("name").split("rlc-id-LiveUpdate_")[1];

            var $liveupdateEl = $('a[href$="'+selectorstring+'"]').parent();

            if ($liveupdateEl.has(".buttonrow").length>0){

                var $button = $liveupdateEl.find(".delete").find("button");
                 $button.click();

                var $button2 = $liveupdateEl.find(".delete").find(".yes");
                $button2.click();
            }
    }

    function mouseClicksEventHandling() {
        // Right click author names in chat to copy to messagebox
        $("body").on("click", ".rlc-message .author", function (event) {
            event.preventDefault();
            let username = String($(this).text()).trim();
            let source = String($(".usertext-edit.md-container textarea").val());
            // Focus textarea and set the value of textarea
            $(".usertext-edit.md-container textarea").focus().val(source + " " + username + " ");
        });

        $("body").on("contextmenu", ".rlc-message.rlc-hasEmbed .body .md", function (event) {
            event.preventDefault();
            embedLinker($(this).parent().parent());
        });

        $("body").on("contextmenu", ".rlc-message .author", function (event) {
            event.preventDefault();
            $el = $(this).parent().parent();  //find the message that the author element is in
            var $menu = $("#myContextMenu");
            var $msg = $el.find(".body .md");
            var $usr = $el.find(".author");
            var thisPos = $el.position();
            var divPos = {
                left: thisPos.left,
                top: thisPos.top
            };

            // replacement for previous closing methods, only fires once.
            $( "body" ).one( "click", function() {
              $("#myContextMenu").hide();
            });
                // positioning, semi broken
                if (window.innerHeight-100 > divPos["top"]){
                    $menu.css({"left":divPos["left"], "top":divPos["top"], "display": "initial"}); //menu down
                } else {
                    $menu.css({"left":divPos["left"], "top":divPos["top"]-70, "display": "initial"}); //menu up
                }

                // code for detecting if the message has delete buttons.
                // obsolete since change to ajax messages, needs to check
                // the corrosponding liveupdate
                /*
                var $button = $(this).parent().siblings().find(".delete").find("button");
                if ($button.length>0){
                    $menu.find("#deleteCom").removeClass("disabled");
                } else {
                    $menu.find("#deleteCom").addClass("disabled");
                }
                */

                // click event handling, not sure why we unbind it,
                // maybe to avoid double binds?
                $menu.find("ul li").unbind("click");
                $menu.find("ul li").bind("click", function(){

                    var $id = $(this).attr("id");
                    // (try to) delete this message (requires perms or ownership of message)
                    if ($id === "deleteCom" && $(this).has(".disabled").length === 0){
                        deleteComment($el);
                    }
                    if ($id === "PMUser"){ // send a reddit PM to the author of this message
                        OpenUserPM($usr.text());
                    }
                    if ($id === "mute"){ // add the author to mute list
                        var banusername = String($usr.text()).trim();
                        mutedUsers.push(banusername);
                        updateMutedUsers();
                    }
                    if ($id === "copyMessage"){ // copy author name and message to messagebox
                        var copystring = String($usr.text()).trim() + " : " + String($msg.text()).trim();
                        $(".usertext-edit.md-container textarea").focus().val(copystring);
                    }
                    if ($id === "speakMessage"){ // read message aloud
                        messageTextToSpeechHandler($msg, $usr);
                    }
                });
        });
        // Load old messages
        $("#togglebarLoadHist").click(function(){
            getMessages(true);
        });
        // autoscroll option shortcut
        $("#togglebarAutoscroll").click(function(){
            $( "#rlc-settings label:contains('Auto Scroll') input" ).click();
        });
        // text to speech option shortcut
        $("#togglebarTTS").click(function(){
            $( "#rlc-settings label:contains('Text To Speech (TTS)') input" ).click();
        });
        //toggle sidebar via css classes
        $("#togglesidebar").click(function(){
            $("body").toggleClass("rlc-hidesidebar");
            $(this).toggleClass("selected");
            scrollToBottom();
        });
        // toggle options menu
        $("#rlc-toggleoptions").click(function(){
            $("body").removeClass("rlc-showreadmebar");
            $("body").toggleClass("rlc-showoptions");
        });
        // toggle readme
        $("#rlc-toggleguide").click(function(){
            $("body").removeClass("rlc-showoptions");
            $("body").toggleClass("rlc-showreadmebar");
        });
        // this makes the RLC send button click on the hidden native reddit live button
        $("#rlc-sendmessage").click(function(){
            $(".save-button .btn").click();
        });
    }


//  ██████╗ ██╗      ██████╗    ██╗  ██╗████████╗███╗   ███╗██╗
//  ██╔══██╗██║     ██╔════╝    ██║  ██║╚══██╔══╝████╗ ████║██║
//  ██████╔╝██║     ██║         ███████║   ██║   ██╔████╔██║██║
//  ██╔══██╗██║     ██║         ██╔══██║   ██║   ██║╚██╔╝██║██║
//  ██║  ██║███████╗╚██████╗    ██║  ██║   ██║   ██║ ╚═╝ ██║███████╗
//  ╚═╝  ╚═╝╚══════╝ ╚═════╝    ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚══════╝
//


    // RLC Containers & UI HTML for injection
    var htmlPayload = `
                <div id="rlc-wrapper">
                    <div id="rlc-header">
                        <div id="rlc-titlebar">
                            <div id="rlc-togglebar">
                                <div id="togglebarLoadHist">Load History</div>
                                <div id="togglebarTTS">TextToSpeech</div>
                                <div id="togglebarAutoscroll">Autoscroll</div>
                                <div class="selected" id="togglesidebar">Sidebar</div>
                            </div>
                        </div>
                        <div id="rlc-statusbar"></div>
                    </div>
                    <div id="rlc-leftPanel"> &nbsp; </div>
                    <div id="rlc-main">
                        <div id="rlc-chat">
                            <ol class="rlc-message-listing">

                            </ol>
                        </div>
                        <div id="rlc-messagebox">
                            <select id="rlc-channel-dropdown">
                                <option></option>
                                <option>%general</option>
                                <option>%offtopic</option>
                                <option>%dev</option>
                            </select>
                            <div id="rlc-sendmessage">Send Message</div>
                        </div>
                    </div>
                    <div id="rlc-sidebar">
                        <div id="rlc-settingsbar">
                            <div id="rlc-toggleoptions" title="Show Options" class="noselect">Options</div>
                            <div id="rlc-update" class="noselect"><a target="_blank" href="https://github.com/BNolet/RLC/raw/master/rlcs.user.js" rel="nofollow">Update</a></div>
                            <div id="rlc-toggleguide" title="Show Guide" class="noselect">Readme</div>
                        </div>
                        <div id="rlc-main-sidebar"></div>
                        <div id="rlc-readmebar">
                            <div class="md"></div>
                        </div>
                        <div id="rlc-guidebar">
                            <div class="md"></div>
                        </div>
                        <div id="rlc-settings"></div>
                    </div>
                    <div id="myContextMenu">
                        <ul>
                            <li><a>Close Menu</a></li>
                            <li id="mute"><a>Mute User</a></li>
                            <li id="PMUser"><a>PM User</a></li>
                            <li id="deleteCom"><a>Delete Comment</a></li>
                            <li id="copyMessage"><a>Copy Message</a></li>
                            <li id="speakMessage"><a>Speak Message</a></li>
                        </ul>
                    </div>
                </div>`;


//  ██╗███╗   ██╗██╗████████╗    ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
//  ██║████╗  ██║██║╚══██╔══╝    ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
//  ██║██╔██╗ ██║██║   ██║       █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
//  ██║██║╚██╗██║██║   ██║       ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
//  ██║██║ ╚████║██║   ██║       ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
//  ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝       ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝


    function rlcSetupContainers() {

      // insert the custom RLC HTML
      $("body").append(htmlPayload);

      // move various reddit live elements to RLCs custom HTML
      $("#new-update-form").insertBefore("#rlc-sendmessage");
      $("#liveupdate-header").appendTo("#rlc-header #rlc-titlebar");
      $("#liveupdate-statusbar").appendTo("#rlc-header #rlc-statusbar");
      $("#liveupdate-resources").appendTo("#rlc-sidebar #rlc-main-sidebar");

      // start up filter tabs by inserting them
      tabbedChannels.init($("<div id=\"filter_tabs\"></div>").insertBefore("#rlc-chat"));
    }

    function rlcParseSidebar() {

        // Put anything after -RLC-README- in the sidebar into the readme
        let str = $("#liveupdate-resources .md").html();
        if (typeof str !== "undefined") {
            let res = str.split("<p>--RLC-SIDEBAR-GUIDE--</p>");
            $("#liveupdate-resources .md").html(res[0]);
            $("#rlc-readmebar .md").append(res[1]);

            // Put anything before -RLC-MAIN- in the sidebar into the guide
            str = $("#liveupdate-resources .md").html();
            res = str.split("<p>--RLC-SIDEBAR-MAIN--</p>");
            $("#liveupdate-resources .md").html(res[1]);
            $("#rlc-guidebar .md").append(res[0]);
        }

        // append userlist and muted user list
        $("#rlc-main-sidebar").append("<div id='rlc-activeusers'><ul></ul></div>");
        $("#rlc-main-sidebar").append("<div id='banlistcontainer'><div id='bannedlist'></div></div>");

        // append version info to header
        $("#rlc-statusbar").append("<div id='versionnumber'>Reddit Live Chat (RLC) v." + GM_info.script.version + "</div>");

    }

    function rlcDocReadyModifications() {

        // Show hint about invites if there is no messagebox
        if ($(".usertext-edit textarea").length <= 0) {
             $("#rlc-main").append("<p style='width:100%;text-align:center;'>You do not have update permissions.</p>");
        }
        else
        {
            $("body").addClass("rlc-canUpdate");
        }

        // Add placeholder text and focus messagebox
        $(".usertext-edit textarea").attr("placeholder", "Type here to chat");
        $(".usertext-edit textarea").focus();

        // Make links external
        $("#rlc-main a").attr("target", "_blank");
        $("#rlc-sidebar a").attr("target", "_blank");
        $("#rlc-readmebar a").attr("target", "_blank");
        $("#rlc-guidebar a").attr("target", "_blank");
    }


//  ██╗    ██╗██╗███╗   ██╗██████╗  ██████╗ ██╗    ██╗   ██╗      ██████╗  █████╗ ██████╗
//  ██║    ██║██║████╗  ██║██╔══██╗██╔═══██╗██║    ██║   ██║     ██╔═══██╗██╔══██╗██╔══██╗
//  ██║ █╗ ██║██║██╔██╗ ██║██║  ██║██║   ██║██║ █╗ ██║   ██║     ██║   ██║███████║██║  ██║
//  ██║███╗██║██║██║╚██╗██║██║  ██║██║   ██║██║███╗██║   ██║     ██║   ██║██╔══██║██║  ██║
//  ╚███╔███╔╝██║██║ ╚████║██████╔╝╚██████╔╝╚███╔███╔╝██╗███████╗╚██████╔╝██║  ██║██████╔╝
//   ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝


    // Boot
    $(document).ready(function() {

        // Modify the html of reddit live, mainly by putting it in the new custom containers defined in htmlPayload
        rlcSetupContainers();

        // Setup sidebar based on content, dividing it into sections.
        rlcParseSidebar();

        // Tweak stuff
        rlcDocReadyModifications();

        // attempt to load a list of muted users from stored values
        updateMutedUsers();

        // run options setup
        createOptions();

        // add messagebox related event listeners
        keypressHandling();

        // add mouse click related event listeners
        mouseClicksEventHandling();

        // add event listener for new content being added, monitoring our own custom rlc-message-listing
        // rather than the native liveupdate-listing (since 3.16)
        $(".rlc-message-listing").on("DOMNodeInserted", function(e) {
            if ($(e.target).is("li.rlc-message")) {

                // Apply changes to line
                handleNewMessage($(e.target), false);
            }
        });

        // get the initial messages to display from reddit live api
        getMessages();

        // testing zone: disable to get contributors from live api reported into console
        //getContributors();

        // wait for initial load to be completed, and then scroll the chat window to the bottom.
        // TODO make a preloader, it looks better
        setTimeout(function(){
        //   $("#rlc-chat").show();
            scrollToBottom();
            loadHistoryMessageException = 0
        }, 500);

    });


//  ███████╗ ██████╗ ███╗   ██╗████████╗
//  ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝
//  █████╗  ██║   ██║██╔██╗ ██║   ██║
//  ██╔══╝  ██║   ██║██║╚██╗██║   ██║
//  ██║     ╚██████╔╝██║ ╚████║   ██║
//  ╚═╝      ╚═════╝ ╚═╝  ╚═══╝   ╚═╝


    // copypasted google fonts magic embed code, avert your eyes mortal!
    WebFontConfig = {
        google: { families: [ 'Open+Sans:400,400italic,600,600italic:latin' ] }
    };
    (function() {
        var wf = document.createElement('script');
        wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        wf.type = 'text/javascript';
        wf.async = 'true';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
    })();


//   ██████╗███████╗███████╗
//  ██╔════╝██╔════╝██╔════╝
//  ██║     ███████╗███████╗
//  ██║     ╚════██║╚════██║
//  ╚██████╗███████║███████║
//   ╚═════╝╚══════╝╚══════╝


    // RLC-CORE
    GM_addStyle(`
          .dark-background #rlc-messagebox textarea {
    background: #404040
}

#rlc-messagebox option {
    background-color: #FCFCFC
}

.dark-background .md code {
    background: #000
}

#rlc-header,#rlc-wrapper,body {
    overflow: hidden
}

img.rlc-image {
    max-height: 200px
}

#rlc-messagebox .md,#rlc-messagebox .usertext,header#liveupdate-header {
    max-width: none
}

#filter_tabs,#rlc-sendmessage,#rlc-toggleguide,#rlc-toggleoptions,#rlc-update,#rlc-wrapper,#togglebarAutoscroll,#togglebarLoadHist,#togglebarTTS {
    -webkit-box-shadow: 0 1px 2px 0 rgba(166,166,166,1);
    -moz-box-shadow: 0 1px 2px 0 rgba(166,166,166,1);
    border-top: 1px solid rgba(128,128,128,.35)
}

#rlc-messagebox,#rlc-sidebar {
    float: right;
    box-sizing: border-box;
    background-color: #EFEFED
}

div#rlc-settings label {
    display: block;
    font-size: 1.4em;
    margin-left: 10px
}

#new-update-form {
    margin: 0;
    width: 87%;
    float: left
}

#rlc-messagebox .usertext-edit.md-container {
    max-width: none;
    padding: 0;
    margin: 0
}

header#liveupdate-header {
    margin: 0!important;
    padding: 7px 15px;
}

h1#liveupdate-title:before {
    content: "chat in "
}

h1#liveupdate-title {
    font-size: 1.5em;
    float: left;
    padding: 0;
    width:100%;
}

#rlc-header #liveupdate-statusbar {
    margin: 0;
    padding: 0;
    border: none!important;
    background-color: transparent
}

#rlc-wrapper .rlc-message .body {
    max-width: none!important;
    margin: 0;
    font-size: 13px;
    font-family: "Open Sans",sans-serif
}

div#rlc-sidebar {
    max-height: 550px
}

#rlc-wrapper {
    height: calc(100vh - 63px);
    max-width: 1248px;
    max-height: 600px;
    margin: 0 auto;
    border-radius: 0 0 2px 2px;
    -moz-border-radius: 0 0 2px 2px;
    -webkit-border-radius: 0 0 2px 2px
}

#rlc-header {
    height: 50px;
    border-bottom: 1px solid rgba(227,227,224,.44);
    border-top: 0;
    box-sizing: border-box
}

#rlc-main,#rlc-titlebar {
    width: 76%;
    float: left;
    position: relative
}

#rlc-sidebar {
    width: 24%;
    overflow-y: auto;
    overflow-x: hidden;
    height: calc(100vh - 114px);
    border-left: 1px solid rgba(227,227,224,.44);
    padding: 5px 0
}

#rlc-chat {
    height: calc(100vh - 186px);
    overflow-y: scroll;
    max-height: 465px;
    margin-top: 30px
}

#rlc-main .rlc-message-listing {
    max-width: 100%;
    padding: 0 0 0 15px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column-reverse;
    min-height: 100%
}

#rlc-messagebox textarea {
    border: 1px solid rgba(227,227,224,.44);
    float: left;
    height: 34px;
    margin: 0;
    border-radius: 2px;
    padding: 6px;
    background: 0 0;
    resize: none
}

#rlc-messagebox textarea,#rlc-toggleguide,#rlc-toggleoptions,#rlc-update,.rlc-showChannelsUI select#rlc-channel-dropdown,body {
    background-color: #fcfcfc
}

#rlc-sendmessage,#rlc-toggleguide,#rlc-toggleoptions,#rlc-update {
    border-radius: 2px;
    width: calc(33.3% - 7px);
    float: left;
    text-align: center;
    box-sizing: border-box;
    cursor: pointer;
    -moz-border-radius: 2px;
    -webkit-border-radius: 2px;
    font-size: 1.2em
}

#rlc-messagebox {
    padding: 10px;
    width: 100%
}

#rlc-sendmessage {
    height: 32px;
    width: 13%;
    float: right;
    padding: 8px 0
}

#rlc-toggleguide,#rlc-toggleoptions,#rlc-update {
    padding: 4px 0 6px;
    box-shadow: 0 1px 2px 0 rgba(166,166,166,1);
    margin-right: 10px;
    letter-spacing: 1px;
    margin-bottom: 8px
}

#rlc-toggleguide {
    margin-bottom: 0;
    margin-right: 0
}

.rlc-message .simpletime {
    float: left;
    padding-left: 10px;
    box-sizing: border-box;
    width: 75px;
    text-transform: uppercase;
    line-height: 32px
}

.rlc-message a.author {
    float: left;
    padding-right: 10px;
    margin: 0;
    padding-top: 0;
    font-weight: 600;
    width: 130px
}

.rlc-message-listing li.rlc-message .body .md {
    float: right;
    width: calc(100% - 220px);
    max-width: none;
    box-sizing: border-box
}

li.rlc-message.in-channel .body .md {
    width: calc(100% - 320px)
}

#rlc-activeusers {
    padding: 15px 20px 20px 40px;
    font-size: 1.5em
}

#rlc-activeusers li {
    list-style: outside;
    padding: 0 0 8px
}

#rlc-settingsbar {
    width: 100%;
    height: auto;
    padding: 0 10px;
    box-sizing: border-box;
    margin: 5px 0;
    float: left
}

#rlc-main-sidebar {
    float: right;
    width: 100%
}

#rlc-sidebar hr {
    height: 2px;
    width: 100%;
    margin-left: 0
}

#rlc-sidebar h3 {
    padding: 0 10px
}

#rlc-statusbar {
    width: 24%;
    float: right;
    text-align: center;
    padding-top: 8px
}

#versionnumber {
    padding-top: 5px
}

#liveupdate-description {
    float: left;
width:100%;

}

.noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none
}

body {
    min-width: 0;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center
}

.rlc-channel-add button,body.dark-background #rlc-leftPanel,body.dark-background #rlc-messagebox,body.dark-background #rlc-sidebar,body.dark-background #rlc-toggleguide,body.dark-background #rlc-toggleoptions,body.dark-background #rlc-update,body.dark-background.rlc-showChannelsUI select#rlc-channel-dropdown,body.rlc-customBg #rlc-leftPanel {
    background-color: transparent
}

#rlc-wrapper .md pre {
    background-color: transparent!important
}

.rlc-message.user-narration .body .md {
    font-style: italic
}

.rlc-message.user-mention .body .md p {
    font-weight: 700
}

.rlc-message a.author,.rlc-message p {
    line-height: 32px;
    min-height: 32px
}

.rlc-message-listing li.rlc-message p {
    font-size: 13px!important
}

.rlc-message pre {
    margin: 0;
    padding: 0;
    max-width: 90%;
    border: #FCFCFC;
    box-sizing: border-box;
    border: 1px solid rgba(227,227,224,.44)
}

.channelname {
    display: block;
    float: left;
    width: 100px;
    line-height: 32px
}

.rlc-imageWithin span.rlc-imgvia {
    float: right;
    margin-left: 10px
}

div#rlc-settingsbar a {
    display: inline-block
}

div#rlc-togglebar {
    float: right;
    display: block;
    height: 100%;
    padding-right: 10px
}

#togglebarAutoscroll,#togglebarLoadHist,#togglebarTTS,#togglesidebar {
    float: right;
    box-sizing: border-box;
    text-align: center;
    padding: 5px;
    cursor: pointer;
    border-radius: 2px;
    -moz-border-radius: 2px;
    -webkit-border-radius: 2px;
    box-shadow: 0 1px 2px 0 rgba(166,166,166,1);
    width: auto;
    margin-left: 8px;
    margin-top: 15px
}

div#rlc-settings label {
    float: left;
    width: 100%;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(227,227,224,.44)
}

div#rlc-settings label span {
    padding-top: 3px;
    padding-bottom: 5px;
    font-size: .7em;
    text-align: right;
    display: block;
    float: right;
    padding-right: 20px
}

div#rlc-settings input {
    margin-right: 5px
}

.rlc-channel-add button {
    border: 0;
    margin: 0;
    padding: 4px 14px;
    border-top: 0;
    border-bottom: 0
}

.rlc-showChannelsUI #new-update-form {
    width: 77%;
    float: left
}

.rlc-showChannelsUI select#rlc-channel-dropdown {
    display: block;
    width: 10%;
    height: 34px;
    float: left;
    border: 1px solid rgba(227,227,224,.44)
}

.rlc-showChannelsUI #rlc-sendmessage {
    width: 13%;
    float: left
}

.rlc-showChannelsUI div#filter_tabs {
    display: block;
    z-index: 100
}

.rlc-showChannelsUI .rlc-channel-add {
    position: absolute;
    top: 27px;
    right: 17px;
    padding: 5px;
    box-sizing: border-box;
    -webkit-box-shadow: 0 1px 2px 0 rgba(166,166,166,1);
    -moz-box-shadow: 0 1px 2px 0 rgba(166,166,166,1)
}

#filter_tabs .rlc-filters>span:last-of-type {
    border-right: 0
}

div#filter_tabs {
    width: calc(100% - 17px)
}

#filter_tabs {
    table-layout: fixed;
    width: 100%;
    height: 26px;
    position: absolute
}

#filter_tabs>span {
    width: 90%;
    display: table-cell
}

#filter_tabs>span.all,#filter_tabs>span.more {
    width: 60px;
    text-align: center;
    vertical-align: middle;
    cursor: pointer
}

#filter_tabs .rlc-filters {
    display: table;
    width: 100%;
    table-layout: fixed;
    height: 24px
}

#filter_tabs .rlc-filters>span {
    padding: 7px 2px!important;
    text-align: center;
    display: table-cell;
    cursor: pointer;
    vertical-align: middle;
    font-size: 1.1em;
    border-right: 1px solid rgba(227,227,224,.44)
}

#filter_tabs .rlc-filters>span>span {
    pointer-events: none
}

#filter_tabs>span.all {
    padding: 0 30px;
    border-right: 1px solid rgba(227,227,224,.44)
}

#filter_tabs>span.more {
    padding: 0 30px;
    border-left: 1px solid rgba(227,227,224,.44)
}

.rlc-channel-add input {
    border: 1px solid rgba(227,227,224,.44);
    padding: 0;
    height: 24px;
    background-color: transparent
}

.longMessageClosed {
    max-height: 30px;
    overflow-y: hidden;
    overflow-x: hidden;
    position: relative;
    min-height: 32px
}

.longMessageClosed p {
    position: relative;
    left: 25px;
    top: -5px
}

.longMessageClosed .extendButton {
    position: absolute;
    top: 7px;
    margin-right: 5px
}

.longMessageClosed pre {
    position: absolute;
    left: 25px
}

#myContextMenu {
    position: absolute;
    box-shadow: 1px 1px 2px #888;
    background-color: grey;
    padding: 5px 0
}

#myContextMenu ul {
    list-style-type: none
}

#myContextMenu ul li a {
    padding: .5em 1em;
    display: block
}

.mrPumpkin,.mrTwitchEmotes {
    display: inline-block;
    position: relative
}

#myContextMenu ul li:not(.disabled) a:hover {
    cursor: pointer
}

.mrPumpkin {
    height: 24px;
    width: 24px;
    background-size: 144px;
    top: 6px
}

.mp_frown {
    background-position: -24px 0
}

.mp_confused {
    background-position: -48px 0
}

.mp_meh {
    background-position: 0 -24px
}

.mp_angry {
    background-position: -48px -24px
}

.mp_shocked {
    background-position: -24px -24px
}

.mp_happy {
    background-position: -72px 120px
}

.mp_sad {
    background-position: -72px 96px
}

.mp_crying {
    background-position: 0 72px
}

.mp_tongue {
    background-position: 0 24px
}

.mp_xhappy {
    background-position: -48px 48px
}

.mp_xsad {
    background-position: -24px 48px
}

.mp_xsmile {
    background-position: 0 48px
}

.mp_annoyed {
    background-position: -72px 72px
}

.mp_bored {
    background-position: -48px 72px
}

.mp_wink {
    background-position: -24px 72px
}

.mp_evilsmile {
    background-position: -72px 24px
}

.mp_disappointed {
    background-position: -96px 0
}

.mp_stjerneklar {
    background-position: -72px 48px
}

.mp_fatherderp {
    background-position: -24px 24px
}

.mp_s3cur1ty {
    background-position: -48px 24px
}

.mrTwitchEmotes {
    height: 28px;
    width: 25px;
    background-size: 100px;
    top: 0
}

.tw_ross {
    background-position: -50px -55px
}

.tw_claus {
    background-position: -75px -55px
}

.tw_kappa {
    background-position: -25px -28px
}

.tw_wutface {
    background-position: -25px -55px
}

.tw_elegiggle {
    background-position: -50px 0
}

.tw_4head {
    background-position: 0 0
}

.tw_notlikethis {
    background-position: -75px 0
}

.tw_dansgame {
    background-position: -25px 0
}

.tw_failfish {
    background-position: 0 -28px
}

.tw_kreygasm {
    background-position: -50px -28px
}

.tw_pogchamp {
    background-position: -75px -28px
}

.tw_smorc {
    background-position: 0 -55px
}

#filter_tabs,#hsts_pixel,#myContextMenu,#rlc-guidebar,#rlc-readmebar,#rlc-settings,.bottom-area,.content,.debuginfo,.footer-parent,.rlc-channel-add,.rlc-compact #header,.rlc-hideChannelsInGlobal .rlc-message.in-channel,.rlc-showChannelsUI .rlc-filter .rlc-message,.save-button,.user-narration a.author,select#rlc-channel-dropdown {
    display: none
}

#liveupdate-resources h2 {
    display: none!important
}

.rlc-showoptions #rlc-settings {
    display: block
}

.rlc-showoptions #rlc-main-sidebar {
    display: none
}

.rlc-showreadmebar #rlc-readmebar {
    display: block
}

.rlc-showreadmebar #rlc-main-sidebar {
    display: none
}

#option-rlc-ChromeNotifications,#option-rlc-ChromeScrollBars,#option-rlc-TTSDisableUserbasedVoices,#option-rlc-TTSUsernameNarration,#option-rlc-TTSLongMessages,#option-rlc-TTSDisableSelfnarration {
    display: none!important
}

.rlc-TextToSpeech #option-rlc-TTSDisableUserbasedVoices,.rlc-TextToSpeech #option-rlc-TTSUsernameNarration,.rlc-TextToSpeech #option-rlc-TTSDisableSelfnarration,.rlc-TextToSpeech #option-rlc-TTSLongMessages {
    display: block!important
}

@media screen and (-webkit-min-device-pixel-ratio: 0) {
    #option-rlc-ChromeNotifications,#option-rlc-ChromeScrollBars {
        display:block!important
    }
}

.rlc-hidesidebar #rlc-sidebar,div#rlc-leftPanel {
    display: none
}

#myContextMenu a,.dark-background #rlc-messagebox textarea,.dark-background p.state,.dark-background p.viewer-count,body.dark-background #rlc-wrapper,body.dark-background #rlc-wrapper .md,body.dark-background #rlc-wrapper .rlc-channel-add button {
    color: #fff
}

.rlc-customBg #rlc-messagebox,.rlc-customBg #rlc-messagebox select,.rlc-customBg #rlc-sidebar {
    background: 0 0
}

.rlc-compact #rlc-chat {
    height: calc(100vh - 252px);
    max-height: 466px
}

.rlc-fullwidth div#rlc-chat,.rlc-fullwidth div#rlc-sidebar {
    max-height: none
}

.rlc-fullwidth div#rlc-chat {
    height: calc(100vh - 198px)
}

.rlc-fullwidth #rlc-wrapper {
    max-height: none;
    max-width: none;
    height: calc(100vh - 0px)
}

.rlc-fullwidth div#rlc-wrapper {
    height: 100%
}

.rlc-compact.rlc-fullwidth #rlc-chat {
    height: calc(100vh - 134px)
}

.rlc-compact.rlc-fullwidth #rlc-leftPanel,.rlc-compact.rlc-fullwidth #rlc-sidebar {
    height: calc(100vh - 50px)
}

.rlc-compact #rlc-wrapper {
    margin-top: 75px
}

.rlc-compact #rlc-header {
    border-top: 1px solid rgba(227,227,224,.44)
}

.rlc-compact.rlc-fullwidth #rlc-wrapper {
    margin-top: 0
}

body.dark-background {
    background-color: #404040
}

body.rlc-customBg #rlc-wrapper {
    background-color: rgba(255,255,255,.1)!important
}

.rlc-customBg #rlc-main textarea{ background:transparent!important; }

body.dark-background.rlc-customBg #rlc-wrapper {
    background-color: rgba(0,0,0,.1)!important
}

body.dark-background.rlc-customBg #rlc-wrapper,body.dark-background.rlc-customBg #rlc-wrapper .md,body.dark-background.rlc-customBg #rlc-wrapper .rlc-channel-add button {
    text-shadow: 0 0 8px rgba(0,0,0,1)!important
}

.rlc-customBg #rlc-wrapper .rlc-channel-add button,body.rlc-customBg #rlc-wrapper,body.rlc-customBg #rlc-wrapper .md {
    text-shadow: 0 0 8px rgba(255,255,255,1)!important
}

.dark-background #rlc-sidebar a,.dark-background #rlc-wrapper .md a {
    color: #add8e6
}

.rlc-hidesidebar #rlc-main {
    width: 100%
}

.rlc-leftPanel #rlc-main {
    width: 60%;
    float: left
}

.rlc-leftPanel #rlc-sidebar {
    width: 20%
}

.rlc-leftPanel #rlc-leftPanel {
    width: 20%;
    float: left;
    display: block;
    background-color: #EFEFED;
    height: calc(100vh - 114px)
}

.rlc-customscrollbars div#filter_tabs {
    width: calc(100% - 12px)
}

.rlc-customscrollbars ::-webkit-scrollbar {
    width: 12px
}

.dark-background.rlc-customscrollbars ::-webkit-scrollbar-thumb {
    border: 1px solid rgba(227,227,224,.26)
}

.rlc-customscrollbars ::-webkit-scrollbar-thumb {
    border: 1px solid rgba(227,227,224,.85)
}

.dark-background #rlc-channel-dropdown {
    color: #fff
}

.dark-background #rlc-channel-dropdown option {
    color: #000
}
div#rlc-update a {
    color: inherit!important;
}
div#rlc-messagebox {
    display: none;
}

.rlc-canUpdate div#rlc-messagebox {
    display: block;
}

.rlc-secondsMode .simpletime {
    width: 90px;
}

.rlc-secondsMode .rlc-message-listing li.rlc-message .body .md {
    float: right;
    width: calc(100% - 230px);
    max-width: none;
    box-sizing: border-box;
}
.md {
    overflow: hidden;
    max-width: none!important
}

    `);

    // BG alternation - breaks minifier
    GM_addStyle('.dark-background .alt-bgcolor,.dark-background .selected {background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGM6YwwAAdQBAooJK6AAAAAASUVORK5CYII=)!important}.alt-bgcolor,.selected{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGM6Uw8AAiABTnvshQUAAAAASUVORK5CYII=)!important}');

    // base 64 encoded emote spritesheet - art by image author 741456963789852123/FlamingObsidian, added to by kreten
    GM_addStyle('.mrPumpkin{background-image:url(" data:image/png;base64,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")}');

    // Twitch emotions base 64 encoded - author kretenkobr2
    GM_addStyle('.mrTwitchEmotes{background-image:url(" data:image/png;base64,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")}');
