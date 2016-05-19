// ==UserScript==
// @name           RLC
// @version        3.18.8
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
        },false, "read messsges aloud");

        createOption("TTS Username Narration", function(checked){
        },false, "example: [message] said [name]");

        createOption("Disable User-based Voices", function(checked){
        },false, "do not modify TTS voices based on usernames");

        createOption("Disable Self-narration", function(checked){
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
                        if ( token.replace(/[^\x20-\x7E]/gmi, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g,"").toUpperCase() in replaceStrList ){return replaceStrList[token.replace(/[^\x20-\x7E]/gmi, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g,"").toUpperCase()];} else {return token;}
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
                    if (!GM_getValue("rlc-DisableUserbasedVoices")) {
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
                var replaceStrList_key = tokenStr.trim().replace(/[^\x20-\x7E]/gmi, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g,"").toUpperCase(); // Strip trailing space and newlines and punctuations with conversion to newline
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
            if (GM_getValue("rlc-DisableSelfnarration")){
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

#option-rlc-ChromeNotifications,#option-rlc-ChromeScrollBars,#option-rlc-DisableUserbasedVoices,#option-rlc-TTSUsernameNarration {
    display: none!important
}

.rlc-TextToSpeech #option-rlc-DisableUserbasedVoices,.rlc-TextToSpeech #option-rlc-TTSUsernameNarration {
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
.rlc-customBg #rlc-main textarea{background:0 0}
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
