// ==UserScript==
// @name           RLC
// @version        3.18.12
// @description    Chat-like functionality for Reddit Live
// @author         FatherDerp & Stjerneklar
// @contributor    thybag, mofosyne, jhon, FlamingObsidian, MrSpicyWeiner, TheVarmari, Kretenkobr2, dashed
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
            // Correct scroll after spam filter change
        },false, "give channels background colors");

        createOption("Show Channels UI", function(checked){
            if (checked){
                $("body").addClass("rlc-showChannelsUI");
            } else {
                $("body").removeClass("rlc-showChannelsUI");
            }
        },false,"show channel tabs and message channel selector");

        // TODO: conditioned on this, dont init tabbedchannels.tick
        createOption("Channel Message Counters", function(checked){
        },false,"show counters for messages in tabs");

        createOption("12 Hour Mode", function(checked){
        },false,"12 Hour Time Stamps");

        createOption("Hide Channels in Global", function(checked){
           if (loadHistoryMessageException != 1) {  refreshChat(); }
            if (checked){
                $("body").addClass("rlc-hideChannelsInGlobal");
            } else {
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
        },false, "disable giphy gifs (effective on reload or new messages)");

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

            // Start ticker
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
                 TODO: Add things.

                       Add message counter value
                       Check if timestamp is recent enough?
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
        "Kappa": "kappa",
        "PogChamp": "pogchamp",
        "SMOrc": "smorc",
        "NotLikeThis": "notlikethis",
        "FailFish": "failfish",
        "4Head": "4head",
        "EleGiggle": "elegiggle",
        "Kreygasm": "kreygasm",
        "DansGame": "dansgame",
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

function stripTrailingSlash(str) {
    if(str.substr(-1) === '/') {
        return str.substr(0, str.length - 1);
    }
    return str;
}
var connectionTimer = 0;
function incConTimer() {
   connectionTimer = connectionTimer + 1;
    if (connectionTimer > 2) { 
    alert("its been "+connectionTimer+" minutes since last websocket activity. /n disconnect assumed, please refresh to reconnect.");
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
            connectionTimer = 0;
            switch(msg.type) {
            case 'update':

                var payload = msg.payload.data;

                var usr = payload.author;
                var msgbody = payload.body_html;

                if (GM_getValue("rlc-DisableMarkdown")) { msgbody = '<div class="md"><p>'+ payload.body +'</p></div>' ;}

                var msgID = payload.name;

                var created = payload.created_utc;
                var utcSeconds = created;
                var readAbleDate = new Date(0); // The 0 there is the key, which sets the date to the epoch (wat?)
                readAbleDate.setUTCSeconds(utcSeconds);

                var hours = readAbleDate.getHours();

                //Getting minutes and seconds numbers from readAbleDate and prepends a 0 if the number is less than
                var minutes = ((readAbleDate.getMinutes() < 10)? '0' : '') + readAbleDate.getMinutes() ;
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


                var finaltimestamp = hours.toString() + ":" + minutes.toString() + " " + suffix;

                var fakeMessage = `
                <li class="rlc-message" name="rlc-id-${msgID}">
                    <div class="body">${msgbody}
                        <div class="simpletime">${finaltimestamp}</div>
                        <a href="/user/${usr}" class="author">${usr}</a>
                    </div>
                </li>`
                $(".rlc-message-listing").prepend(fakeMessage);
                break;

             /*  disabled, liveupdate header already tracks this
            case 'activity':

                var payload = msg.payload;
                console.log('user count from websocket:', payload.count);

                break;
            */

            case 'delete':
                console.log("message deleted:"+msg.payload);
                var messageToDelete = "rlc-id-"+msg.payload;
                $( "li[name='"+messageToDelete+"']" ).remove();
                reAlternate();

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


function getMessages(gettingOld) {
    loadHistoryMessageException = 1;

     var urlToGet = stripTrailingSlash(window.location.href) + "/.json";

     if (gettingOld) {
        var lastMessageName = $(".rlc-message:last-child").attr("name").split("rlc-id-")[1];
         urlToGet += "?after="+lastMessageName;
     }

     var ajaxLoadOldMessages =     $.getJSON( urlToGet, function( data ) {
       
                 // Ensure data has data
                 if(!data.hasOwnProperty('data'))
                 {
                     console.log("Help me Obi-Wan Kenobi. We got empty data!");
                     return;
                 }
 
       
                var oldmessages = data.data.children;  //navigate the data to the object containing the messages
                $.each( oldmessages, function( ) {
                    var msg = $(this).toArray()[0].data; //navigate to the message data level we want

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


                    var finaltimestamp = hours.toString() + ":" + minutes.toString() + " " + suffix;

                    var fakeMessage = `
                    <li class="rlc-message" name="rlc-id-${msgID}">
                        <div class="body">${$msgbody}
                            <div class="simpletime">${finaltimestamp}</div>
                            <a href="/user/${usr}" class="author">${usr}</a>
                        </div>
                    </li>`
                    $(".rlc-message-listing").append(fakeMessage);
                });
            });
        ajaxLoadOldMessages.complete(function() {
            loadHistoryMessageException = 0;
               reAlternate();
        });
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

        // Emote support
        emoteSupport(line, $msg, firstLine);

        twitchemoteSupport(line, $msg, firstLine);

        // Abbrev Support
        abbrSupport(line, $msg, firstLine);

        // Easy (and hacky) multiline
        $msg.html($msg.html().split("\n").join("<br>"));
        $msg.html($msg.html().replace("<br><br>","<br>"));
        $msg.html($msg.html().replace("</p><br>", ""));

        // Track channels
        tabbedChannels.proccessLine(line, $el, rescan);

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

            if (line.indexOf(robinUser) !== -1){
                if (GM_getValue("rlc-NotificationSound")){
                    snd.play();
                }
                if (GM_getValue("rlc-ChromeNotifications")){
                    new Notification("Robin Live Chat",{
                        icon: chromeNotificationImage,
                        body: $usr.text() + ": " + line
                    });
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
                else if (textArea.val() === "" ) { e.preventDefault();  }
                else {
                    if (textArea.val().indexOf("/pusheen") === 0){
                        $(this).val(`/gif pusheen`);
                    }
                    if (textArea.val().indexOf("/version") === 0){
                        $(this).val(`||| RLC Version Info (via /version) RLC v.${GM_info.script.version}`);
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
            $el = $(this).parent().parent();
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

                    if (window.innerHeight-100 > divPos["top"]){
                        $menu.css({"left":divPos["left"], "top":divPos["top"], "display": "initial"}); //menu down
                    } else {
                        $menu.css({"left":divPos["left"], "top":divPos["top"]-70, "display": "initial"}); //menu up
                    }

                    var $button = $(this).parent().siblings().find(".delete").find("button");
                    if ($button.length>0){
                        $menu.find("#deleteCom").removeClass("disabled");
                    } else {
                        $menu.find("#deleteCom").addClass("disabled");
                    }

                    $menu.find("ul li").unbind("click");
                    $menu.find("ul li").bind("click", function(){

                        var $id = $(this).attr("id");
                        if ($id === "deleteCom" && $(this).has(".disabled").length === 0){
                            deleteComment($el);
                        }
                        if ($id === "PMUser"){
                            OpenUserPM($usr.text());
                        }
                        if ($id === "mute"){
                            var banusername = String($usr.text()).trim();
                            mutedUsers.push(banusername);
                            updateMutedUsers();
                        }
                        if ($id === "copyMessage"){
                            var copystring = String($usr.text()).trim() + " : " + String($msg.text()).trim();
                            $(".usertext-edit.md-container textarea").focus().val(copystring);
                        }
                        if ($id === "speakMessage"){
                            messageTextToSpeechHandler($msg, $usr);
                        }
                    });
        });

        // Load old messages
        $("#togglebarLoadHist").click(function(){
            getMessages(true);
        });

        // Easy access options
        $("#togglebarAutoscroll").click(function(){
            $( "#rlc-settings label:contains('Auto Scroll') input" ).click();
        });

        $("#togglebarTTS").click(function(){
            $( "#rlc-settings label:contains('Text To Speech (TTS)') input" ).click();
        });

        //toggle sidebar via css classes
        $("#togglesidebar").click(function(){
            $("body").toggleClass("rlc-hidesidebar");
            $(this).toggleClass("selected");
            scrollToBottom();
        });

        $("#rlc-toggleoptions").click(function(){
            $("body").removeClass("rlc-showreadmebar");
            $("body").toggleClass("rlc-showoptions");
        });

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
        $("#rlc-main-sidebar").append("<div id='rlc-activeusers'><ul></ul></div>");
        $("#rlc-main-sidebar").append("<div id='banlistcontainer'><div id='bannedlist'></div></div>");

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

        // wait for initial load to be completed, and then scroll the chat window to the bottom.
        // TODO make a preloader, it looks better
        setTimeout(function(){
        //   $("#rlc-chat").show();
            scrollToBottom();
            loadHistoryMessageException = 0
        }, 500);

    });


//   ██████╗  ██████╗  ██████╗  ██████╗ ██╗     ███████╗    ███████╗ ██████╗ ███╗   ██╗████████╗
//  ██╔════╝ ██╔═══██╗██╔═══██╗██╔════╝ ██║     ██╔════╝    ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝
//  ██║  ███╗██║   ██║██║   ██║██║  ███╗██║     █████╗      █████╗  ██║   ██║██╔██╗ ██║   ██║   
//  ██║   ██║██║   ██║██║   ██║██║   ██║██║     ██╔══╝      ██╔══╝  ██║   ██║██║╚██╗██║   ██║   
//  ╚██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗    ██║     ╚██████╔╝██║ ╚████║   ██║   
//   ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝    ╚═╝      ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   


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


//   ██████╗███████╗███████╗    ██████╗ ███████╗███████╗ ██████╗ ██╗   ██╗██████╗  ██████╗███████╗███████╗
//  ██╔════╝██╔════╝██╔════╝    ██╔══██╗██╔════╝██╔════╝██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔════╝██╔════╝
//  ██║     ███████╗███████╗    ██████╔╝█████╗  ███████╗██║   ██║██║   ██║██████╔╝██║     █████╗  ███████╗
//  ██║     ╚════██║╚════██║    ██╔══██╗██╔══╝  ╚════██║██║   ██║██║   ██║██╔══██╗██║     ██╔══╝  ╚════██║
//  ╚██████╗███████║███████║    ██║  ██║███████╗███████║╚██████╔╝╚██████╔╝██║  ██║╚██████╗███████╗███████║
//   ╚═════╝╚══════╝╚══════╝    ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝


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

.md {
    max-width: none!important
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
    border-radius: 3px;
    background-size: 144px;
    top: 6px
}

.dark-background .mrPumpkin {
    border-radius: 5px
}

.dark-background .mrTwitchEmotes,.mrTwitchEmotes {
    border-radius: 0
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

.tw_kappa {
    background-position: -25px -28px
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
    `);

    // BG alternation - breaks minifier
    GM_addStyle('.dark-background .alt-bgcolor,.dark-background .selected {background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGM6YwwAAdQBAooJK6AAAAAASUVORK5CYII=)!important}.alt-bgcolor,.selected{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGM6Uw8AAiABTnvshQUAAAAASUVORK5CYII=)!important}');

    // base 64 encoded emote spritesheet - art by image author 741456963789852123/FlamingObsidian, added to by kreten
    GM_addStyle('.mrPumpkin{background-image:url("data:image/png;base64,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")}');

    // Twitch emotions base 64 encoded - author kretenkobr2
    GM_addStyle('.mrTwitchEmotes{background-image:url("data:image/png;base64,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")}');
