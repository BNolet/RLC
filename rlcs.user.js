// ==UserScript==
// @name           RLC
// @version        3.13.6
// @description    Chat-like functionality for Reddit Live
// @author         FatherDerp & Stjerneklar
// @contributor    thybag, mofosyne, jhon, FlamingObsidian, MrSpicyWeiner, TheVarmari, Kretenkobr2
// @website        https://github.com/BNolet/RLC/
// @namespace      http://tampermonkey.net/
// @updateURL      https://github.com/BNolet/RLC/blob/master/rlcs.user.js
// @downloadURL    https://github.com/BNolet/RLC/blob/master/rlcs.user.js
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
// @run-at         document-idle
// @noframes
// ==/UserScript==

//   /$$$$$$$ /$$       /$$$$$$        /$$$$$$           /$$
//  | $$__  $| $$      /$$__  $$      |_  $$_/          | $$
//  | $$  \ $| $$     | $$  \__/        | $$  /$$$$$$$ /$$$$$$   /$$$$$$  /$$$$$$
//  | $$$$$$$| $$     | $$              | $$ | $$__  $|_  $$_/  /$$__  $$/$$__  $$
//  | $$__  $| $$     | $$              | $$ | $$  \ $$ | $$   | $$  \__| $$  \ $$
//  | $$  \ $| $$     | $$    $$        | $$ | $$  | $$ | $$ /$| $$     | $$  | $$
//  | $$  | $| $$$$$$$|  $$$$$$/       /$$$$$| $$  | $$ |  $$$$| $$     |  $$$$$$/
//  |__/  |__|________/\______/       |______|__/  |__/  \___/ |__/      \______/
//
//    Welcome to Reddit Live Chat source code, enjoy your visit.
//    Please group your variables with the relevant functions and follow existing structure.
//    (Unless you are willing to rewrite the structure into something more sane)
//    To get a good idea of whats going on, start from window.load near the bottom.
//    I recommend using Sublime Text when browsing this file as these comment blocks are readable from the minimap.
//      - Stjerneklar

//
//    /$$$$$$ /$$$$$$$ /$$$$$$$$/$$$$$$ /$$$$$$ /$$   /$$ /$$$$$$
//   /$$__  $| $$__  $|__  $$__|_  $$_//$$__  $| $$$ | $$/$$__  $$
//  | $$  \ $| $$  \ $$  | $$    | $$ | $$  \ $| $$$$| $| $$  \__/
//  | $$  | $| $$$$$$$/  | $$    | $$ | $$  | $| $$ $$ $|  $$$$$$
//  | $$  | $| $$____/   | $$    | $$ | $$  | $| $$  $$$$\____  $$
//  | $$  | $| $$        | $$    | $$ | $$  | $| $$\  $$$/$$  \ $$
//  |  $$$$$$| $$        | $$   /$$$$$|  $$$$$$| $$ \  $|  $$$$$$/
//   \______/|__/        |__/  |______/\______/|__/  \__/\______/
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
        var $option = $(`<label id='option-${key}'><input type='checkbox' ${checkedMarkup}>${name}<span>${description}</span></label>`).click(function(){
            let checked = $(this).find("input").is(":checked");

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
            if (checked){
                $("body").addClass("dark-background");
            } else {
                $("body").removeClass("dark-background");
            }
        },false);

        createOption("Robin Colors", function(checked){
        },false, "color usernames via robin algorithm (existing messages are not modified)");

        createOption("Compact Mode", function(checked){
            if (checked){
                $("body").addClass("rlc-compact");
            } else {
                $("body").removeClass("rlc-compact");
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

        createOption("24-hour Timestamps", function(checked){
        },false, "11 PM / 23:00 (existing messages are not modified)");

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

        createOption("Hide Channels in Global", function(checked){
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
            } else {
                $("body").removeClass("rlc-TextToSpeech");
                window.speechSynthesis && window.speechSynthesis.cancel && window.speechSynthesis.cancel();
            }
        },false, "read messsges aloud");

        createOption("TTS Username Narration", function(checked){
        },false, "example: [message] said [name]");

        createOption("Disable User-based Voices", function(checked){
        },false, "do not modify TTS voices based on usernames");

        createOption("Auto Scroll", function(checked){
        },false, "scroll chat on new message");

        createOption("No Emotes", function(checked){
        },false, "disable smileys");
        
        createOption("Hide Giphy Images", function(checked){
        },false, "disable giphy gifs (effective on reload or new messages)");
    }

//
//   /$$$$$$$$/$$$$$$ /$$$$$$$ /$$$$$$$ /$$$$$$$$/$$$$$$$         /$$$$$$ /$$   /$$ /$$$$$$ /$$   /$$/$$   /$$/$$$$$$$$/$$       /$$$$$$
//  |__  $$__/$$__  $| $$__  $| $$__  $| $$_____| $$__  $$       /$$__  $| $$  | $$/$$__  $| $$$ | $| $$$ | $| $$_____| $$      /$$__  $$
//     | $$ | $$  \ $| $$  \ $| $$  \ $| $$     | $$  \ $$      | $$  \__| $$  | $| $$  \ $| $$$$| $| $$$$| $| $$     | $$     | $$  \__/
//     | $$ | $$$$$$$| $$$$$$$| $$$$$$$| $$$$$  | $$  | $$      | $$     | $$$$$$$| $$$$$$$| $$ $$ $| $$ $$ $| $$$$$  | $$     |  $$$$$$
//     | $$ | $$__  $| $$__  $| $$__  $| $$__/  | $$  | $$      | $$     | $$__  $| $$__  $| $$  $$$| $$  $$$| $$__/  | $$      \____  $$
//     | $$ | $$  | $| $$  \ $| $$  \ $| $$     | $$  | $$      | $$    $| $$  | $| $$  | $| $$\  $$| $$\  $$| $$     | $$      /$$  \ $$
//     | $$ | $$  | $| $$$$$$$| $$$$$$$| $$$$$$$| $$$$$$$/      |  $$$$$$| $$  | $| $$  | $| $$ \  $| $$ \  $| $$$$$$$| $$$$$$$|  $$$$$$/
//     |__/ |__/  |__|_______/|_______/|________|_______/        \______/|__/  |__|__/  |__|__/  \__|__/  \__|________|________/\______/
//
//
//

    // channel tabs megafunction
    var tabbedChannels = new function(){
        /* Basic usage - tabbedChannels.init( dom_node_to_add_tabs_to );
         * and hook up tabbedChannels.proccessLine(lower_case_text, jquery_of_line_container); to each line detected by the system */
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
            $("#rlc-chat").find("li.liveupdate").each(function(idx,item){
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

//
//   /$$    /$$ /$$$$$$ /$$$$$$$ /$$$$$$ /$$$$$$ /$$   /$$ /$$$$$$        /$$$$$$$$/$$   /$$/$$   /$$ /$$$$$$ /$$$$$$$$/$$$$$$
//  | $$   | $$/$$__  $| $$__  $|_  $$_//$$__  $| $$  | $$/$$__  $$      | $$_____| $$  | $| $$$ | $$/$$__  $|__  $$__/$$__  $$
//  | $$   | $| $$  \ $| $$  \ $$ | $$ | $$  \ $| $$  | $| $$  \__/      | $$     | $$  | $| $$$$| $| $$  \__/  | $$ | $$  \__/
//  |  $$ / $$| $$$$$$$| $$$$$$$/ | $$ | $$  | $| $$  | $|  $$$$$$       | $$$$$  | $$  | $| $$ $$ $| $$        | $$ |  $$$$$$
//   \  $$ $$/| $$__  $| $$__  $$ | $$ | $$  | $| $$  | $$\____  $$      | $$__/  | $$  | $| $$  $$$| $$        | $$  \____  $$
//    \  $$$/ | $$  | $| $$  \ $$ | $$ | $$  | $| $$  | $$/$$  \ $$      | $$     | $$  | $| $$\  $$| $$    $$  | $$  /$$  \ $$
//     \  $/  | $$  | $| $$  | $$/$$$$$|  $$$$$$|  $$$$$$|  $$$$$$/      | $$     |  $$$$$$| $$ \  $|  $$$$$$/  | $$ |  $$$$$$/
//      \_/   |__/  |__|__/  |__|______/\______/ \______/ \______/       |__/      \______/|__/  \__/\______/   |__/  \______/
//
//  Code status: needs some love
//

    // Scroll chat back to bottom
    var scrollToBottom = function(){
         if (GM_getValue("rlc-AutoScroll")){
             $("#rlc-chat").scrollTop($("#rlc-chat")[0].scrollHeight);
                }
    };

    // Manipulate native reddit live into loading old messages
    function loadHistory() {
        if (GM_getValue("rlc-TextToSpeechTTS")) {
            // TODO: Switch to something more user-friendly. Message in the chat?
            alert("You have TextToSpeech enabled, please disable to load old messages.");
        } else {
            loadingInitialMessages = 1;     //prevent tts/notifications
            $("body").addClass("allowHistoryScroll");
            $("body").scrollTop($("body")[0].scrollHeight);
            scrollToBottom();
            $("body").removeClass("allowHistoryScroll");
        }
    }

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

//
//   /$$$$$$$$/$$$$$$$$/$$   /$$/$$$$$$$$       /$$$$$$$$/$$$$$$         /$$$$$$ /$$$$$$$ /$$$$$$$$/$$$$$$$$ /$$$$$$ /$$   /$$
//  |__  $$__| $$_____| $$  / $|__  $$__/      |__  $$__/$$__  $$       /$$__  $| $$__  $| $$_____| $$_____//$$__  $| $$  | $$
//     | $$  | $$     |  $$/ $$/  | $$            | $$ | $$  \ $$      | $$  \__| $$  \ $| $$     | $$     | $$  \__| $$  | $$
//     | $$  | $$$$$   \  $$$$/   | $$            | $$ | $$  | $$      |  $$$$$$| $$$$$$$| $$$$$  | $$$$$  | $$     | $$$$$$$$
//     | $$  | $$__/    >$$  $$   | $$            | $$ | $$  | $$       \____  $| $$____/| $$__/  | $$__/  | $$     | $$__  $$
//     | $$  | $$      /$$/\  $$  | $$            | $$ | $$  | $$       /$$  \ $| $$     | $$     | $$     | $$    $| $$  | $$
//     | $$  | $$$$$$$| $$  \ $$  | $$            | $$ |  $$$$$$/      |  $$$$$$| $$     | $$$$$$$| $$$$$$$|  $$$$$$| $$  | $$
//     |__/  |________|__/  |__/  |__/            |__/  \______/        \______/|__/     |________|________/\______/|__/  |__/
//
//     Code status: could be better organized but pretty good, the spoiled brat section of RLC.
//

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

    function getNumbers(input) {
        return input.match(/[0-9]+/g);
    }

    // Select Emoji to narration tone
    var toneList = {
        "smile":   "smiling",
        "evilsmile": "with an evil smile",
        "angry":   "angrily",
        "frown":   "while frowning",
        "confused":"confusedly",
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
        "BRB":     "Be right back",
        "B8":      "Bait",
        "BTW":     "By The Way",
        "CYA":     "See Ya",
        "DEF":     "Definitely",
        "DIY":     "Do it yourself",
        "FTW":     "For The Win",
        "FK":      "Fuck",
        "FTFY":    "Fixed that for you",
        "FFS":     "For Fucks Sake",
        "G2G":     "got to go",
        "GR8":     "Great",
        "GL":      "Good luck",
        "GTFO":    "Get The Fuck Out",
        "HF":      "Have fun",
        "IRL":     "In real life",
        "IIRC":    "If I recall correctly",
        "IKR":     "I Know Right",
        "IMO":     "In My Opinion",
        "IDK":     "I don't know",
        "JK":      "Just Kidding",
        "MATE":    "M8",
        "NVM":     "Nevermind",
        "N1":      "Nice One",
        "NP":      "No problem",
        "OFC":     "Of Course",
        "OMG":     "Oh My God",
        "PLZ":     "Please",
        "PLS":     "Please",
        "RLY":     "Really",
        "RTFM":    "Read The Fucking Manual",
        "R8":      "Rate",
        "RLC":     "Reddit Live Chat",
        "STFU":    "Shut The Fuck Up",
        "TLDR":    "Too Long, Didn't Read",
        "TTS":     "Text to speech",
        "TIL":     "Today I learned",
        "TY":      "Thanks",
        "TBH":     "To be honest",
        "WTF":     "What The Fuck",
        "WP":      "Well played",
        "YW":      "You're welcome",
        "KRETENKOBR2": "KretenkobrTwo",
        "<":    "Kleinerdong"
    };

    // used for TTS voice username-based randomization
    function strSeededRandInt (str, min = 0, max = 256, code = 0){
        for(let i = 0; i < str.length; i++){
            code += str.charCodeAt(i);
        }
        return code % (1 + max - min) + min;
    }

    var langSupport = ["el","fr","da","en","en-GB", "en-US", "sv", "es-US", "hi-IN", "it-IT", "nl-NL", "pl-PL", "ru-RU"];

    function messageTextToSpeechHandler($msg, $usr) {

        if (GM_getValue("rlc-TextToSpeechTTS")) {

            if($msg.text().length<250){

                // Load in message string
                var linetoread = $msg.text();

                var hasTripple = /([^. ])\1\1/.test(linetoread);
                // Check for single character spamming
                if (!hasTripple) {

                    // Abbrev Conversion (Btw: http://www.regexpal.com/ is useful for regex testing)
                    var checkingStr = linetoread.trim(); // Trim spaces to make recognition easier

                    linetoread = linetoread.split(" ").map(function(token){
                        if ( token.toUpperCase() in replaceStrList ){return replaceStrList[token.toUpperCase()];} else {return token;}
                    }).join(" ");

                    // Number To Words Conversion (Moved under abbrev conversion to avoid interfering with Abbrev detection )
                    var numbermatches = getNumbers(linetoread);

                    $.each(numbermatches, function(i) {
                        linetoread = linetoread.split(numbermatches[i]).join(numberToEnglish(numbermatches[i]));
                    });

                    // Emoji Detection (Btw: I am a little unconfortable with this function, since its relying on the second class of that span to always be the same )
                    var msgemotes = $msg.find(".mrPumpkin"); // find all emotes in message
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
                    var toneStr="";
                    if ( domEmoji in toneList ){
                        toneStr = " " + toneList[domEmoji];
                    }
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

                    if (!GM_getValue("rlc-TTSUsernameNarration")) {
                        msg = new SpeechSynthesisUtterance(linetoread + toneStr);
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
                        console.log(msg.voice);
                        // pitch alteration is known to break firefox TTS, rate is reset for suspicion of the same behavior
                        if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1)
                        {
                            msg.pitch = 1;
                            msg.rate = 1;
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

//
//   /$$      /$$/$$$$$$$$ /$$$$$$  /$$$$$$  /$$$$$$  /$$$$$$ /$$$$$$$$       /$$$$$$$$/$$   /$$/$$   /$$ /$$$$$$ /$$$$$$$$/$$$$$$
//  | $$$    /$$| $$_____//$$__  $$/$$__  $$/$$__  $$/$$__  $| $$_____/      | $$_____| $$  | $| $$$ | $$/$$__  $|__  $$__/$$__  $$
//  | $$$$  /$$$| $$     | $$  \__| $$  \__| $$  \ $| $$  \__| $$            | $$     | $$  | $| $$$$| $| $$  \__/  | $$ | $$  \__/
//  | $$ $$/$$ $| $$$$$  |  $$$$$$|  $$$$$$| $$$$$$$| $$ /$$$| $$$$$         | $$$$$  | $$  | $| $$ $$ $| $$        | $$ |  $$$$$$
//  | $$  $$$| $| $$__/   \____  $$\____  $| $$__  $| $$|_  $| $$__/         | $$__/  | $$  | $| $$  $$$| $$        | $$  \____  $$
//  | $$\  $ | $| $$      /$$  \ $$/$$  \ $| $$  | $| $$  \ $| $$            | $$     | $$  | $| $$\  $$| $$    $$  | $$  /$$  \ $$
//  | $$ \/  | $| $$$$$$$|  $$$$$$|  $$$$$$| $$  | $|  $$$$$$| $$$$$$$$      | $$     |  $$$$$$| $$ \  $|  $$$$$$/  | $$ |  $$$$$$/
//  |__/     |__|________/\______/ \______/|__/  |__/\______/|________/      |__/      \______/|__/  \__/\______/   |__/  \______/
//
//  Code status: needs some love
//

    // Grab users username + play nice with RES
    var robinUser = $("#header-bottom-right .user a").first().text().toLowerCase();

    // Time converter for active user list
    function convertTo24Hour(time) {
        var hours = parseInt(time.substr(0, 2));
        if (time.indexOf("am") !== -1 && hours === 12) time = time.replace("12", "0");
        if (time.indexOf("pm") !== -1 && hours < 12) time = time.replace(hours, (hours + 12));
        return time.replace(/(am|pm)/, "");
    }

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

    // Convert string to hex (for user colors)
    function toHex(str) {
        var result = "";
        for (var i=0; i<str.length; i++) {
            result += str.charCodeAt(i).toString(16);
        }
        return result;
    }

    // Generate random value based on seed, max and minimum (for user colors)
    Math.seededRandom = function(seed, max = 1, min = 0) {
        // In order to work 'seed' must NOT be undefined,
        // So in any case, you HAVE to provide a Math.seed

        seed = (seed * 9301 + 49297) % 233280;
        var rnd = seed / 233280;

        return parseInt(min + rnd * (max - min));
    };

    // Message background alternation via js
    var rowAlternator = false;
    // Modify color by amount
    function LightenDarkenColor(col, amt) {
        var r = col.slice(0,2);
        var g = col.slice(2,4);
        var b = col.slice(4,6);
        if (rowAlternator) amt+=10;   // TODO: Might want to rethink this
        var randR = (Math.seededRandom(r*100,120,175));
        var randG = (Math.seededRandom(g*100,120,175));
        var randB = (Math.seededRandom(b*100,120,175));

        // TODO-SUGGESTION: Code readability
        var suppress = (Math.seededRandom(col*r*10,0,6));
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
                //console.log("This shouldn't happen! (LightenDarkenColor switch case)");
                break;
        }

        var hexR = (parseInt(randR) + parseInt(amt)).toString(16);
        var hexG = (parseInt(randG) + parseInt(amt)).toString(16);
        var hexB = (parseInt(randB) + parseInt(amt)).toString(16);

        return hexR + hexG + hexB;
    }

    function alternateMsgBackground($el) {
        if (!GM_getValue("rlc-CSSBackgroundAlternation")) {
            if (loadingInitialMessages === 0) {
                var $child = $('.liveupdate-listing:not(.muted)').children()[1];
                rowAlternator=($($child).hasClass('alt-bgcolor'));
            }else{
                rowAlternator=!rowAlternator;
            }
            if(rowAlternator === false){
                $el.addClass("alt-bgcolor");
            }
        }
    }

    // emoji trigger list. supports multiple triggers for one emote(eg meh) and automaticly matches both upper and lower case letters(eg :o/:O)
    var emojiList={ ":)": "smile",
                   "3:D": "evilsmile",
                   ":((": "angry",
                   ":(": "frown",
                   ":s": "confused",
                   ":I": "meh",
                   ":|": "meh",
                   ":/": "meh",
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
                   ":P": "tongue"
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

    // User color
    function messageUserColor($usr) {
        if (!GM_getValue("rlc-RobinColors")) {
            var hexName = toHex($usr.text()).split("");
            var adder = 1;
            $.each(hexName, function(ind,num){
                num = (parseInt(num) + 1);
                if (num !== 0 && !isNaN(num)){
                    adder = adder * num;
                }
            });
            adder = adder.toString().replace(".", "").split("0").join("");
            let start = adder.length-10;
            let end = adder.length-4;
            var firstThree = adder.toString().substring(start, end);

            // Variable brigtening of colors based on dark mode setting
            if (GM_getValue("rlc-DarkMode")){
                var lighterColor = LightenDarkenColor(firstThree, 60);
                $usr.css("color", "#"+lighterColor);
            }
            else {
                var darkerColor = LightenDarkenColor(firstThree, -40);
                $usr.css("color", "#"+darkerColor);
            }
        } else {
            $usr.css("color", getColor($usr.text())); //ROBIN COLORS!!!!!
        }
    }

    // Timestamp modification & user activity tracking
    function timeAndUserTracking($el, $usr) {
        var shortTime = $el.find(".body time").attr("title").split(" ");
        var amPm = shortTime[4].toLowerCase();

        if (!(amPm === "am" || amPm === "pm")) { amPm = " "; }

        var militarytime = convertTo24Hour(shortTime[3] + " " + amPm);
        if (GM_getValue("rlc-24hourTimestamps")){
            shortTime = convertTo24Hour(shortTime[3] + " " + amPm);
        } else {
            shortTime = shortTime[3]+" "+amPm;
        }

        // Add simplified timestamps
        if ($el.find(".body .simpletime").length <= 0) {
            $el.find(".body time").before(`<div class='simpletime'>${shortTime}</div>`);
        }

        // Add info to activeuserarray
        activeUserArray.push($usr.text());
        activeUserTimes.push(militarytime);

        // Moved here to add user activity from any time rather than only once each 10 secs. (Was in tab tick function, place it back there if performance suffers)
        processActiveUsersList();
    }

    function getColor(username) {
        var colors = ["#e50000", "#db8e00", "#ccc100", "#02be01", "#0083c7", "#820080"];
        var e = username.toLowerCase(),
            t = e.replace(/[^a-z0-9]/g, ""),
            n = parseInt(t, 36) % 6;
        return colors[n];
    }

    function reAlternate($objComment){
        if($objComment===undefined){
            var alt=false;
            for(i=$('.liveupdate-listing').children().length;i>=0;i--){
                var obj=$('.liveupdate-listing').children()[i];
                if(!$(obj).hasClass('muted')){
                    $(obj).removeClass('alt-bgcolor');
                    if(alt){
                        $(obj).addClass('alt-bgcolor');
                    }
                    alt=!alt;
                }
            }
        }else{
            var found;
            var alt;
            for(i=$('.liveupdate-listing').children().length;i>=0;i--){
                var obj=$('.liveupdate-listing').children()[i];
                if(obj == $objComment.context) {
                    found=true;
                    alt = $($('.liveupdate-listing').children()[i+1]).hasClass("alt-bgcolor");
                }
                if(found){
                    $($('.liveupdate-listing').children()[i]).removeClass('alt-bgcolor');
                    if(alt){
                        $($('.liveupdate-listing').children()[i]).addClass('alt-bgcolor');
                    }
                    alt=!alt;
                }
            }
        }
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

//
//   /$$      /$$/$$$$$$$$ /$$$$$$  /$$$$$$  /$$$$$$  /$$$$$$ /$$$$$$$$        /$$$$$$ /$$      /$$$$$$ /$$$$$$ /$$   /$$
//  | $$$    /$$| $$_____//$$__  $$/$$__  $$/$$__  $$/$$__  $| $$_____/       /$$__  $| $$     |_  $$_//$$__  $| $$  /$$/
//  | $$$$  /$$$| $$     | $$  \__| $$  \__| $$  \ $| $$  \__| $$            | $$  \__| $$       | $$ | $$  \__| $$ /$$/
//  | $$ $$/$$ $| $$$$$  |  $$$$$$|  $$$$$$| $$$$$$$| $$ /$$$| $$$$$         | $$     | $$       | $$ | $$     | $$$$$/
//  | $$  $$$| $| $$__/   \____  $$\____  $| $$__  $| $$|_  $| $$__/         | $$     | $$       | $$ | $$     | $$  $$
//  | $$\  $ | $| $$      /$$  \ $$/$$  \ $| $$  | $| $$  \ $| $$            | $$    $| $$       | $$ | $$    $| $$\  $$
//  | $$ \/  | $| $$$$$$$|  $$$$$$|  $$$$$$| $$  | $|  $$$$$$| $$$$$$$$      |  $$$$$$| $$$$$$$$/$$$$$|  $$$$$$| $$ \  $$
//  |__/     |__|________/\______/ \______/|__/  |__/\______/|________/       \______/|________|______/\______/|__/  \__/
//
//  
//

    function OpenUserPM(name) {
        var $url = "https://www.reddit.com/message/compose/?to=";
        var win = window.open($url+name, "_blank");
        win.focus();
    }

    function deleteComment($objComment){
        if ($objComment.has(".buttonrow").length>0){
            reAlternate($objComment);
            var $button = $objComment.find(".delete").find("button");
            $button.click();
            $button = $objComment.find(".delete").find(".yes");
            $button.click();
        }
    }
    var divPos = {};
    $(document).mousemove(function(e){
        divPos = {
            left: e.pageX,
            top: e.pageY
        };
    });

    // I'm not even going to try to clear this up.
    // sigh. TODO: move this out of messagehandling and do like in event handling.
    function messageClickHandler($el) {

        var $menu = $("#myContextMenu");
        var $msg = $el.find(".body .md");
        var $usr = $el.find(".body .author");

        $usr.click(function(event){
            event.preventDefault();
            if ($menu.css("display") === "none" && !isNaN(divPos["left"]) && !isNaN(divPos["top"]) ) {
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
                    $menu.css({"left":0, "top":0, "display": "none"}); //close menu
                });
                $("body").unbind("click");
                $("body").bind("click", function(e) {
                    if ($(e.target).closest($usr).length === 0) {
                        $menu.css({"left":0, "top":0, "display": "none"});
                    }
                });
            } else {
                $menu.css({"left":0, "top":0, "display": "none"}); //close menu
            }
        });
    }

//
//   /$$   /$$/$$$$$$$$/$$      /$$       /$$      /$$/$$$$$$$$ /$$$$$$  /$$$$$$  /$$$$$$  /$$$$$$ /$$$$$$$$
//  | $$$ | $| $$_____| $$  /$ | $$      | $$$    /$$| $$_____//$$__  $$/$$__  $$/$$__  $$/$$__  $| $$_____/
//  | $$$$| $| $$     | $$ /$$$| $$      | $$$$  /$$$| $$     | $$  \__| $$  \__| $$  \ $| $$  \__| $$
//  | $$ $$ $| $$$$$  | $$/$$ $$ $$      | $$ $$/$$ $| $$$$$  |  $$$$$$|  $$$$$$| $$$$$$$| $$ /$$$| $$$$$
//  | $$  $$$| $$__/  | $$$$_  $$$$      | $$  $$$| $| $$__/   \____  $$\____  $| $$__  $| $$|_  $| $$__/
//  | $$\  $$| $$     | $$$/ \  $$$      | $$\  $ | $| $$      /$$  \ $$/$$  \ $| $$  | $| $$  \ $| $$
//  | $$ \  $| $$$$$$$| $$/   \  $$      | $$ \/  | $| $$$$$$$|  $$$$$$|  $$$$$$| $$  | $|  $$$$$$| $$$$$$$$
//  |__/  \__|________|__/     \__/      |__/     |__|________/\______/ \______/|__/  |__/\______/|________/
//
//  Code status: needs some love
//

    // Notification sound in base64 encoding
    var base64sound ="//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAATAAAgpgANDQ0NDRoaGhoaKCgoKCg1NTU1NTVDQ0NDQ1BQUFBQXl5eXl5ra2tra2t5eXl5eYaGhoaGlJSUlJShoaGhoaGvr6+vr7y8vLy8ysrKysrX19fX19fl5eXl5fLy8vLy//////8AAAA5TEFNRTMuOThyAc0AAAAAAAAAABSAJAUsQgAAgAAAIKZSczWiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAAAFF3tUFWFgANVNLE3P2YCQgGl3rvXeu9d7E2vuWztUipHEbuDQmdZveazl0wMDYA8AeAiDoHYaHHve83Nzc3PnGcIEgbA8B4AfgjjrJ59//fDGMYw3Nzc3v0x3h4DwOw0Z8vYyv/2MYxjGMY96Zuffwx733//ve9773v2MYzegcYxjP/YxjGfwxjGew3Pve973//L//3m5ubm7/hjGMZV////wxjGPe+///////l5uOwmLUDAYDAYDAYDAUCAMBAGBBgdBgg4Ip//5hQYaIYOAG8//+Ylkk4mX1iCmNHHL4GRwqYGbYi/gZBh0gYPwgAYUQHfg4G4GBQKwGCQLwG6VOvbpBAgoDFKKADDuG4JAfAwGAF/8LAkIAKBgDF+WkDCQbkDD8JP3/gYJgRhagNSFmBYWAkDYBILf/8DBME0DDSAAAIHQe4J8HALLG2BgFAZ//+CIDgGA8BIBwARlC8ibF0ORCxIDAKAv///w/hAzrmhgOoU0EgChcYQMV00G/////RSLwzZkyqikAAAkBCsvr43M5FjSvQyoAhB//uSxAmAVe3xT326AAM6PWhB2kp4hIgevkBzyps1ockipSKpslN1ziOz1FBTlgW01IaALBDAInYcoaKKJw/mTZpnGpG6KJGjqIcYjSBQqRU1IxTqPZ3pajesoupxS6RdDRRHxPJG5rUvvndRrmBtikjQyIcHT5081DV3bQ1Ft4hGTqKApVGZntXT198yM5iOSJMbOM+iis/r6PfVzRReD/DpNj54219tXbtqeXgRB0lGVH/yzv1YcxqlQAHDS0BodmmVzmEoKqAO2jHFIfYvJ/+WZwr4+ErjVQTD+B9SCCUwOA5AY/g3nEtEDpqJQl6iPaoxyUPXGVeaA4aLQRQBdOCl0nkRN7SwY3I18ndZL5OEueOg2cM1BI2IAIrFCm9ZEnrLeaNUSeNwl2OhBZmYB/wGSL7GJCZX1FvKbZTyMJKZgLKJOaHwdxumYkJlNqjmdfJl6Y0rikAqzIhkRJZ0uZZfMtZ/c9jvrCGAU8skSEqVl7Ue35/Onsh5IERCJgYlzAAAAIP/6axu5DuUqYw8CdpCGRhxWAJBBjLMGuT8mXoVsv/7ksQRAdi960UO1pDDCr1okdpOML7kvlI9YcrEqWSoZMBgBOAHAInRyRXDVzhL558rZYPVDWUsawpMhwyAIXYIiptFaPUQuify9nTaobikTgXzZIIBoKGEUhyC3ks1ZbzJ6zLH5bmQDgRsoUKBIgauRhI5a1lvKL5YyUNETICAQW5kQscaYkJmr5rnXyhmJOMkDQADgTOI/ZcltE/o6+WWyKWD8gcjKJsT5ayrqbX1Z1smFl0WaBaIxwBB//HafDT540qizBVVgIE5qbJJhgBKxsVGJbGljNlTOpZmeuObYUMKmT4sgDapAGsgbIJcKapZwl8pNWVMsFpSx1rQL4LAifFgCMEUGpYuNp0nsoH8u500y8WmOhuqgwaD6GqhjjSov6y3lnktjcOLRBvGWkxPAEmmjjURytnVbH8o5SHhZgBEQtiZYC/6U2JbLHP518vtOERZQQKEmXElPrOGOp8y1nsxfJuxFweooxTU8r6m0OjnWzYrkSC8AbAVnr1PELMvjFeTuWooumRiMEHmpMY9AiDqsagbcHhhiQxeMRujl9T/+5LEEwOagfFGDiJ+Aty9qsWnrjmdt0kG38MZdbqVk830SfBKBLevw37donKqJ56TGrvXK+G605huWa+C12QXFCAUkQb5p8rdSZwPMKSbFvkROQPXIDEJmkVAZY8mOs1rMnZM+mo0aov5HF3DjSsYihgsfNkB9G+XeWncoPl7ceVGIW7FtSMQ9rLhLabVKZ1p6NkiTTUETHGTE7IUivnOjoIqYuG6Cyxh1wWUTrEAP6Gg29rugdUifJ1MnhcwKzJc0JUVNQ0kujMxRwzHpY7zMXcApI1ro1J84khDiv5SDXIPULczuLFJHewrxX0OIwyR4qmfnKdOTlWDqAVC9ql9HdRcWi23W2d1hXr2FxfQFVvtzJGYSgEvFtibdfj/+v9iUseMR2rOb3BFPIsA+XNhN3EcfBKXOmBOub99+SFYYXjsftf83I2lqRiO2u66rk/WUgnstEzr3cGy7VDVv///x04RxodKFcosNWHuOv/6j7iWqFYYI06zY9MqgAAEH/9BRf8lnL1t+VWp0AIEzFAhDxIczEYDDAhAwkCGQF9K/Ixz//uSxBOB2JXhQq7uj1NYPCfBnlGw9wJz/l3/ySf/uXrvqhisrS0M1jAwch+wk/jpMh5VzEt5KvkoW11DFrDqBmUCbBAmAKHF1IfQn97DeeondZc2Hji4jSoEIZSykBgDhPIxkD9iabJVszPZiW1xdm+EhQgbERChDMxv2Om2cN9Zb1E7rIZmIBRw1eFrLTMgPKHNOZNkpyPKqkxKAOKmzCnDYyz1ntZ/W+o349qMxPAGiByf/gyz/Yi3kqglOwFEkghJaBfQbnw46IhYADSPJkE0GRSx3cO5P/3/gX/69f/7aVsZoKgSLvsMAUxi1QMHXamW8e+uYimm+RhbyNLeNw+usTWsJBg+qCwaugAtg4S8Uw0p5YKN1D29RFdIc/icT9YNCa0iZAzpUaKSxCx6sa6OaGuPlPIwtrjVG3UETAqWJCDCjR/G1YolTWSWcMtQ9pTAXK6x9AYsibIwcOecGO5F2y82U2zY9WKabzICiIEQUnkRnhFnkr1lrWf1mmsrWOlBzUR0BvwNIpAAAEn/5JL/y49lNOsif1b5EBgYUQPjYP/7ksQMgdcd6UKO4o5DS7wnwZ5RsBEWBWjBRkUEzW2z7ZZS5L7EZxtGKiyEIMwKowgLqApCGyVg4SqjQt5Kdi3ko66xv1heBPplwCoQFyBEUhuk0u432nTLkvrKHGEeqCAMpj4LKCFZIU3lQ/ko+x/JTokLUERhWyiDBWP6Wsls6rUWtZhuMJlEqDQQvDMNOj55o+Wez5Z5qW1mAQnBS6TG4qssvz2vz2tDYhETgcMIBhZUsb8n/5JP/8GN7VkkjDihUMLWGD+ybtvxhMUmBwCTI0mPjU5NTuRn+od5/wJ/9gv/9ruWdQGAKliYwAjG7KAwcf+WLreyoZCmJZSLWUC3jcZc6KuiEIINLNyAALkQFVpUcdIdhGWSatHlqyKaBAeKgbVgRIs5cAz4wbCaIfobVDPIZubZGJZHFRUjBtVBMwSGQwGFGjdJDOEjrJDOndQ7dEUo6yMAwRE0WoEQt5kNTk82XHyxzU/ULw2TJgCJYHI8WsTHJV9RazrajXlq5wm0C+I4A3QNo/+go/3BlWllzcR4AmShADGJBDncgtDQ8Bb/+5LEDQPX9eFCDu6PQxO8KAHM0cAIBAEFAF2pTNP7r/kXf+X//I5/+4WGOlv2oknqZXEhgzD1VVGnzk0WszPZKPkoeXOjfxIgoDTJgE0oBQEvIkYJK1EhHqL+ox3IlxpmtQEAjqKYGELk+g5CnnWQ9slWyke0y1jUJKoJihgYvAoRyiPFzi9RrrLeon1VErmYAxY3wvZojr5R5t02yhqH0aJoCC4OJGsU8ecsvqPaz2p9SO5JJIiegAodH/3IP/cGPfqVujH0JgFDpiq2H0pWYoDxiDC8w+u8hXQFT1kQ5FNyH6xaTpgUwbklUqCxgd4uC08bBbEKEKZojPmuP68lGyULS2LIxchwMEuoGisA62OIujWIGkssEV1kS1klyE4uAvVgJDsslAIpjBNQpE3sTp/ND2Znsjz1QukqgmMDwYdwKFdEYlzIk84b6jmsvLrFxITQCzEtPCxfMhyOWOUeYvmR7L5LUQQmw2I1cRU1yyf1Hue5/Ub2Ok4s4GvASQUQQEAAD8wbIaFZUtOni5RcExKpj8Z7Fh0ouDgWitDpeMSY//uSxBEAVWXpRoLyhwKBvCkgflEY5f5nyhx8KTMA3RsUw/gGH3BlgmzAV40QkafzE/nD2cPLlkl8jwyqjMMgg62VkTIYb0iT1lTmnJ/kHRwv46joER5rWNTkpyw+WeWXx+PYa4TDEQDgc4S2st8/z3LXIR6QFhZ/D1NEm+Z8w5zmbZKoqMwkNGQRi7N86+ptTa31vqKrJkUAktJB1EtACAUBnUZx8NLUlS/GVhYAGG1CdxQhhcCl1xoKkQIl6CRO6ya5Y5T5D1YfuxkK6Bm4YIgJPIjllpSjA/oH+e1Hs6S+NcTJRmGLARNk5TIlrNtSOo7zDkUSwyO0yAIAG2Rdsvtpvs+ifykWsRITTEQExywVc6lrVrXqT1E/mIN4EcSnpFzod+7aL5RPqTDFocBj5JfOvqbV19bajdSIzwCg9YACAABAAdyo7jO/S1oIgZpIhARhRonalADgy3IODiOL9WbUn7k7yjsQzkUWpMT4XTQZsDYHwWNkgbizSunJRssPnT3LWWSXxKxtTMGhIMtF1IjSIayQ5b5tqMeQ9HC5x6IDQv/7ksQxgdUJ4UdlcodCfTwo4H5Q4MtPIi+TL5ZbOPmB/SJbEuDzYcITHJRHOmms9z+s21lKssBbtLEFNEn+bdHneYPmB+mK0DMpSiQudP6up+3PaystQp4BoDAQPypfE85hnEEz2cFyzFR4P1GcxIAgYABIFJnyhNicbLfJrkP5J3QEFieLIlgCdQpApnBnDas+eyk2WW1lqxZLdQiphhCOAkkJ1JhiNUa60OWuXuRhlhidqYEhJXZY6myh0GzJssPmZaxfBlMMMMHLBvrLWo11K5U1ERyyF6k8QH0ipzHnOg+ZNkoqoGgYWFKgQudP6vftqXrKjOVAYWXMEAYAD8qSx2QVpTK2bs+HAcA8h6NmFQB7RonSCgW1YpeVk5yd5MckVMmGolUvCzQNK7BERIkeGWKipHtueyy+dPWLJbqEtFsWYB+wUoFVyMJ3UV9RrzPlXkqY4YweYAAgCo6h1tn2zj6bZxslT2RwZTDDEjnCX1HtSfPal8k8wCw1DEcbFvnOnzLmbZkemAQihppSMIXOn9T99Xn9RqpEWoAoOhmAH/L/+5LEVAHUdeFHA+6HQm28KNBuUODCJiJN2w8biOOkgYtEZ/8TAolhcAqCvpNnFkk9RT5W5N8iy8OgOmAy4GoXgoPJwvi/RzE/lls6fzp6xZLeL0QIswBvcCzVCUh3vWVtRv0uV+Q4yw39lHQHC08ij3KPTfO9z2P/SDKYYZHkvnF8/rXytrJjTAsCP4nvcq8z6PM+YvlM9QDFwcHj8W9Z/U+t++t9RboC1g2awAAEAA7+dd+cHYrA6moxskBhDBzADQFQSrsrDRQBHzLSZELSa5a5McgN2E5kWKIiQQdBPRRSHNLa5GH8svrP5ZPWJUt5RDTFmANSoZdLyJmMJ6yprMuWuXOQE7hoDrLANCCWQZsoPlltF8stj+fyPC62F4FfOkvqP60uf1mmombog4YexINie5hznRfMHyNewjsM0ioXRtnT+p9fvrPay9cqgw1AAQHcqOdySvZvvo6rZkmjDAKzjACg4UBAAC+FLZoxOEzyI8r8m+PpSLh8pES8LlA160FDJJGgrCWRzaJ/OH8stYlS3lAOBaDQiBJmTzEec1FX//uSxHsB1IXhRQTyioKJPCiQrtColrm+o7xzjmHBtMQDRZq6hq8vNoNnHyzyiW8a4XWwvAbeWSty3rPakNRrx3ZkAwDNsSvcmef6fOcybY/WDUSLEioXRprP6n1tr89y0pYpwNlqhAAAAMAB3KjmLhSldojK18CoWYJ3HjYJggUg4NGQ0Bwg+w9ck+TnIpx9rqDUjcwFJgaaOCIeTiZPFpSi+ezA/lh8s7EqfxeCGoGYfqDFZWY6MBqivqT1nOXuQU7htL0gBghWZY6HyzzJ8ybMT+xL4p4ZTDXCp5KqzptqPc9y3rIhnQbqI4kWxNc17dNszbIx5mEAsWxGPokNZ/n+2ttSepGgLWAMSdCAD9hiiwrKzGmbuMiiYnPB+0nlA+S3Q3FgNKa1WWY1k42X+X+Qx3RD2zIoiRAGaA+YxisryN5Y5Y5ZexKn6xLBooGYIAAFnScoDRasraytzXlXkSOYbE1gYFLTyTbNH03020D+UC3iJiLYd4QPlkqZ1DUnrT1oainlgMOrEY7lHmXMud518pNTDFoaY8pEJrP9+3bn+f/7ksSeAVS54UVlbojCbDwokH5Q6G7kVBhSgAAGEBnQYx8NLUeNnTAwsBDCrFOkqIwmBy74cIS9EXsZUvaizyY5FORdS0hOhdNhwga0iDipJHioW1rRP5kezjZZexKvWJUZqMwgIB0RdcfiL50nNZU1Fflvkidwxi9MAoCV8gL5SbMWzvLD5KH8PKJjiJB586S2stc/z+o11kWzMLPJ4m7Ypc7zvQ6D6Z64mwNJSZyE1n9b6m1NrVrQrFOCwcAgAAM/UW8rs1SBWAHBL3GGFSeEPAcIWMCQMFgrGrOUi7l7lnkX5UXidisYCvgZiWFmyccU7USj5me1Hs6fsSr4pw28IRQFlBVSUMXUVdSOtDmnJc5ht2YAGhjTH7lNtBtF842SnDhjBxTg8/JbUe1pakOb8kdALFT2I50yzzDt0uc5KtUEAQZFJimQnP631dT89y1QHWAoWoAABJ/+SUX7jsgwp4ESRRUMBQPMRj4OtDbMPgYMEDjIQIwkBdynvQJzP4Tz/mv/4x/+828pkUAaSIocjGqYHB0M1mtwdgohxUx/5mX/+5LExACUZeFFA/KJAmK8KKC+UVisskvYbuwdYKAzcmAvkFTpIpD+LFnCfvJfUTuom+LYZ1gDAVqJUCiU6pIUma3Kp/I58oPpFpUaxUrCI0THESBgvLA2blhHWVOVdZlqGTz4IlxbZYN1nmg6ObtmXLPMz2Q0trKANTwcekiKeNnltc6+p+f1GucL7JCkQFLCQEn/5JZ/sy9kqlKjyCqhwWC5h+pHw4CYVBDDQ4nhxSdWXWI7zJN8meRfi5TJZYBIEUSsLaAOrCkEbRVDqm9ZDyrlE/kqezpL2G61h1AwKbkwBEiAppNI+RYGpj006Ycl9ZNcZMwqBspSykAZ4nlxsn6A+uZvlJspnsjiErCLRs41gYvJQkc4V9RV1p8kV1kpmIDICq8LRWm5D+avlns+WeQwrLMAIiCk2iVlXltc6+o/rfUb7kkkdDhAhfUwAASf/gy3+VRq1qcWlRobmBwDGNJVn3JZGLoMmEjJjAaYMEOnMV2bZ4Ywxz/h7/4/n/ppWOGy5cuiAyAmeYIKG38p05HvrmIvTfMC3j+nyFsKyeoD//uSxOyB2PXhPK7uj0LvPCehyk5wrBxo3JgE3YQASLImAaS0skxZQ8tWRTYgvE6F+sDACVpEyBlTo7UkQ/Y9kDPZGnsvnsf17jErCRc1y8FFTxuL3IXOJ7ElnCfVQFKusjgMeJNmg2eeXBlOTXLj5S5ofqF8gmgA8GCiI1cMlK+ol1zvn86hrK1jpBFlwR2BtwkAZP/ySj/4KeWrHomHHFUEhkMAbc4BWAoG0zxo8BxtZtIbbad/UA//xX/+H//bPbuV1GmiiKDRjJYA4XO7KlDopgkThL4/PkaW84QthdlqoOuDhTuCBaAqDHEXRfDmqoDBecJ/UTO49PUK3LlQAohJjYApwN9kg/6NZAT+TCOSq8oltax9jZrCRUk8dYURPH0PdiyVuS+cLmsntxVsofwFhyKoDAFpmOfyN5s2ZtkpyaJadBNKHTGrh/Rt6iXXOtrP6z2dQ0B2ol4PZA2ABZP/0EH/i2SV2ZEvEiApMwWCMxuAM/6D8xgAoyYArASl4o7JHpwWmQZ8euODUKEKR0oAJDFslxGgH1KApgFTJEMDjf/7ksTxANo94Tiu7o9DNrwnFZ5RsOMEhWEqiOPaJL5YIWwrJLVBMGG1IE2FjIKyh6NR1B90llgp3OkS1j0+OxqxSBfrAMHs5cA0IAbCaIhQtsoaiVRHH8un8wJdaxTyRrCAqJnUImFEzyOFXYsmmdNtyR0R4zouSsfABBMuLgMBnmA4ORnKPLr5uerGuVVFMECsLWEXFpE1acJdc6ezr6jXlq5kRM4WQkAAWMmfqEfyIHXFYfWWo6CofMBXo0RNTAAaLWERqGic5s9Zbb/+E8/5B//F//3DxwrlUC3o4kuYgU6AeIStgMXzRLxa0y1mBbywW7DdJaoM9MkCbAgSAOzGaimIc9xtNWSDVk5qIvqGfNKgIiHUUwMYVJ9BMZI88rnsppZQP5KH8Xa8IBIgeoO+FB24xdEltZU1m+ozVODpymBiQhvhaS1Mk+X+YPljkrrGqboF8CAEGCnsKvOFvOntbaupHWTzoDngFWkhEAAAo//sn/WbnZTsvJgJZsHAKYjkodshGHD2FQJQRp3OzKqr8cqInyf5OcZhNKF/ESZDogP/+5LE54PbFeE2DuKOQwC8JwC+UXhd2AkqHCXg/ArLWPs1yVPZYP5KH7D+S1Qa0URjMIEgZAJ1IapQWo6c1HdR3WWONY3rBAVllgAnhxahXU7ENfKLZSbI5sapXwgGHnqDhg4WWR61FXUVeVtZWXcZJrAMdPPDQtRLc9z7bts+aFtnCywFkm0fAxc4W9Z7We1H9R+xiSCJkIxADpJ/+6936gNvpmIQELCCEUwLDD1zzi9qDCsMTA0DQETpEMLF5NTQD/Nwx/7fz/2/f/7U5ivKB4Bn6l6mhkGKQcNDN4omM8lIkMaV6xqm+PrjcLamFNG9SCAGDiiJgBF0AysFhJ4ckNMPOiKi9xpPTHE9Ac3UJtLVIEyx9RGgm7HCkYhqBtSGcNshhrm5ay8SynHSMVnBoLBgllBIaCxJahujuuShjnDPOFzOjsQmIkjokOBaeVmWCxFp0ZLkW5M8jdY/JVCsFZZYCBkF7TZg8gqWWCXXWWuWtZb1lZ5wgqBTBoAAxh8gEAABf/7s9+c3Ur2mYOs2ZPsRQk/wPDIAEBoED3A3kpFk//uSxOGB143hOQ7Sc0OSvCYBntGw3HcqgTOoh9NQ7KmIKZqMAwCXTIdIGY6hZ0WMi4p5VUooFvY/mTZYegR5IMmL8LrGhMBfoBqyOYXCYGRzAx1mmstbk9pjLJTANFNVQECBtFxREzTNkMyfLLVlM9UgS6aQnkPEo3DJRYkUyVQacP6j+5rqMc4TaCiVCxzSEDIKUTvMec6D7tk0aS4CEYQqahfEu6jh/We1NrVrQzhbTKZBgYbi8YbecRuLTMpTvUoAIIlynCMCimNNtBMWwDOcZIMABFMmDZPSCQgzPrLBYvUyQFMUd6UR1kbzgIGfWKw/SrqKgg5coZaKgUBQzOtyEaucSrOTBlGOqpGMNYXtGwYFhwTdfZ/nmjb0QUrCKicsj8alcPp0y7KmpuOEVAQSvUg25SKDofWuZEBtKidNLZhQJ0oGpdfVeGhJgUUEjARAINH4cGP3olbJAcdDR4gdl/onWtSmuw1xa2WVPSOy6CJ4qHBgSoO8r9UmcZiT4P+YkAhcKf+BJTTY44/cYFV5vLKV2XeYQShgODRoQoL8Kv/7ksTXgBhp4TbVygAE2sIlAzuwAJ5JQRVudDXlr7DoQRA6LbSquF6tu7RZb5t9nGr1bOOvx+64QknJBvtR///////////////6R48LQFE////////////////2AwDFdBkACAVhVSstnYaa015ymstdiCPRbJK5R0zROkwvcAhgeoNiRyAwEGJhpENIsbJLJknUCBC5jw5QzRuQEc0uCEwauFwjqEFhBYXEVxjQyKGKSXFmigRmTxeLx0mUjEumrUkklJJLLpqogQ5x4mhziLGyJdRatHrRLrooskk6Jq6Jqj1o/qSSqS/60UZkXmUkk9FFGtFH/9aPRRZRkXmSLyT0W/0UaLKSSWYl1zFMQU1FMy45OC4yqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy45OC4yqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+5LEoQPVgaL0XYiAAAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
    var snd = new Audio("data:audio/wav;base64, " + base64sound);

    // Adjust notification volume
    snd.volume=0.2;

    // Chrome notice image in bass64
    var chromeNotificationImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAADgSURBVFhH7ZdRbsMwDENzgt7/Sj2VG0eEKxGUmgJOUKR5eMNgiRH3u6U5lgPA6Q08sHg+povL1mJNlJiu9Z1bdkKT2Zv+rAyL7/8OfFbcFKOID2QiGhEBMYr4QCaiERHgt2JkpAgpOMNvxchIEVJwht+KkZEipODMeL9HER/IRDQiAmIU8YFMRCMi4EcmFvtqvPisuEnTg7zLpniXTfGXyopVZn2tQ9Nhscqsr3VoOixWmfW1Dk299Zb8eKpDUxKhHdCH5K7QLK9ddt3/YtYf6zuoEpetxX4ZtpgLTq+09gIQTX1K/dS/IgAAAABJRU5ErkJggg==";

    // Used differentiate initial and subsequent messages
    var loadingInitialMessages = 1;

    // Message display handling for new and old (rescan) messages
    // Add any proccessing for new messages in here
    var handleNewMessage = function($el, rescan){

        var $msg = $el.find(".body .md");
        var $usr = $el.find(".body .author");
        var line = $msg.text().toLowerCase();
        var firstLine = $msg.find("p").first();
        if (!GM_getValue("rlc-HideGiphyImages")){        
            if (line.indexOf("rlc-image") === 0){
                var linksObj = $msg.find("a");
                var url = linksObj.attr("href");
                var url_2nd = linksObj.length > 1 ? $msg.find("a:eq(1)").attr("href").trim() : url; // I do think this could be made more nicer... not sure why linksObj[1] doesn't work. had to use $msg.find("a:eq(1)") instead
                var splitByPipe = $msg.text().split("|");
                var searchTerm = splitByPipe.length > 1 ? splitByPipe[1].trim() : " ";
                //TODO: handle following cases: http or https in link, undefined link(maybe handle on send side)
                
                if (url) {
                    $el.addClass("rlc-imageWithin");
                    firstLine.html("via <a href="+url_2nd+">/giphy "+decodeURI(searchTerm)+": <br> <img class='rlc-image' src='"+"http"+url.split("http")[1]+"'"+"</img></a>");
                }
            }
        }
        
        

        //temporary: disable the fucking links again for master branch.
        firstLine.html(firstLine.html()+" ");

        // /me support (if in channel see proccessline)
        if (line.indexOf("/me") === 0){
            $el.addClass("user-narration");
            firstLine.html(firstLine.html().replace("/me", " " + $usr.text().replace("/u/", "")));
        }
        else { 
        // Remove the /u/ in author name
        $usr.text($usr.text().replace("/u/", ""));
        }      
        
        // long message collapsing
        collapseLongMessage($msg,firstLine);

        // Target blank all message links
        $msg.find("a").attr("target", "_blank");

        // Insert time
        $usr.before($el.find("time"));

        // Tag message with user identifier for muting
        $el.addClass("u_"+$usr.text());

        // Alternating background color
        alternateMsgBackground($el);

        // Emote support
        emoteSupport(line, $msg, firstLine);

        // Easy (and hacky) multiline
        $msg.html($msg.html().split("\n").join("<br>"));
        $msg.html($msg.html().replace("<br><br>","<br>"));
        $msg.html($msg.html().replace("</p><br>", ""));

        // Track channels
        tabbedChannels.proccessLine(line, $el, rescan);

        // Timestamp modification & user activity tracking
        timeAndUserTracking($el, $usr);

        // User color
        messageUserColor($usr);

        // Message click handling
        messageClickHandler($el);

        //deal with muting
        if(mutedUsers.indexOf($usr.text())!=-1){
            $msg.parent().addClass('muted');
        }

        if (line.indexOf(robinUser) !== -1){
            // Add bold highlighting
            $el.addClass("user-mention");
        }

        // Stuff that should not be done to messages loaded on init, like TTS handling
        if (loadingInitialMessages === 0) {
            //reAlternate();
            if (rescan) {
                // This is rescan, do nothing.
            }
            else {
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
                // todo: check if we are in another channel and dont play tts if so.
                if(!$msg.parent().hasClass('muted')){
                    messageTextToSpeechHandler($msg, $usr);
                }
            }
        }
    };

//
//   /$$$$$$$ /$$$$$$$  /$$$$$$ /$$      /$$ /$$$$$$ /$$$$$$$$/$$$$$$$        /$$$$$$/$$   /$$/$$$$$$$$/$$$$$$
//  | $$__  $| $$__  $$/$$__  $| $$  /$ | $$/$$__  $| $$_____| $$__  $$      |_  $$_| $$$ | $| $$_____/$$__  $$
//  | $$  \ $| $$  \ $| $$  \ $| $$ /$$$| $| $$  \__| $$     | $$  \ $$        | $$ | $$$$| $| $$    | $$  \ $$
//  | $$$$$$$| $$$$$$$| $$  | $| $$/$$ $$ $|  $$$$$$| $$$$$  | $$$$$$$/        | $$ | $$ $$ $| $$$$$ | $$  | $$
//  | $$__  $| $$__  $| $$  | $| $$$$_  $$$$\____  $| $$__/  | $$__  $$        | $$ | $$  $$$| $$__/ | $$  | $$
//  | $$  \ $| $$  \ $| $$  | $| $$$/ \  $$$/$$  \ $| $$     | $$  \ $$        | $$ | $$\  $$| $$    | $$  | $$
//  | $$$$$$$| $$  | $|  $$$$$$| $$/   \  $|  $$$$$$| $$$$$$$| $$  | $$       /$$$$$| $$ \  $| $$    |  $$$$$$/
//  |_______/|__/  |__/\______/|__/     \__/\______/|________|__/  |__/      |______|__/  \__|__/     \______/
//
//
//

    // Settings Keys (used in /sharesettings)
    var optionsArray = [];

    //Check and store browser details
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browserName  = navigator.appName;
    var fullVersion  = ''+parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion,10);
    var nameOffset,verOffset,ix;

    var browser = {
        chrome: false,
        mozilla: false,
        opera: false,
        msie: false,
        safari: false
    };

    // In Opera 15+, the true version is after "OPR/"
    if ((verOffset=nAgt.indexOf("OPR/"))!=-1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset+4);
    }
    // In older Opera, the true version is after "Opera" or after "Version"
    else if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset+6);
        if ((verOffset=nAgt.indexOf("Version"))!=-1)
            fullVersion = nAgt.substring(verOffset+8);
    }
    // In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
        browserName = "Microsoft Internet Explorer";
        fullVersion = nAgt.substring(verOffset+5);
    }
    // In Chrome, the true version is after "Chrome"
    else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
        browserName = "Chrome";
        fullVersion = nAgt.substring(verOffset+7);
    }
    // In Safari, the true version is after "Safari" or after "Version"
    else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
        browserName = "Safari";
        fullVersion = nAgt.substring(verOffset+7);
        if ((verOffset=nAgt.indexOf("Version"))!=-1)
            fullVersion = nAgt.substring(verOffset+8);
    }
    // In Firefox, the true version is after "Firefox"
    else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
        browserName = "Firefox";
        fullVersion = nAgt.substring(verOffset+8);
    }
    // In most other browsers, "name/version" is at the end of userAgent
    else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) <
             (verOffset=nAgt.lastIndexOf('/')) )
    {
        browserName = nAgt.substring(nameOffset,verOffset);
        fullVersion = nAgt.substring(verOffset+1);
        if (browserName.toLowerCase()==browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }
    // trim the fullVersion string at semicolon/space if present
    if ((ix=fullVersion.indexOf(";"))!=-1)
        fullVersion=fullVersion.substring(0,ix);
    if ((ix=fullVersion.indexOf(" "))!=-1)
        fullVersion=fullVersion.substring(0,ix);

    majorVersion = parseInt(''+fullVersion,10);
    if (isNaN(majorVersion)) {
        fullVersion  = ''+parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion,10);
    }

//
//   /$$$$$$$$/$$    /$$/$$$$$$$$/$$   /$$/$$$$$$$$       /$$   /$$ /$$$$$$ /$$   /$$/$$$$$$$ /$$      /$$$$$$/$$   /$$ /$$$$$$
//  | $$_____| $$   | $| $$_____| $$$ | $|__  $$__/      | $$  | $$/$$__  $| $$$ | $| $$__  $| $$     |_  $$_| $$$ | $$/$$__  $$
//  | $$     | $$   | $| $$     | $$$$| $$  | $$         | $$  | $| $$  \ $| $$$$| $| $$  \ $| $$       | $$ | $$$$| $| $$  \__/
//  | $$$$$  |  $$ / $$| $$$$$  | $$ $$ $$  | $$         | $$$$$$$| $$$$$$$| $$ $$ $| $$  | $| $$       | $$ | $$ $$ $| $$ /$$$$
//  | $$__/   \  $$ $$/| $$__/  | $$  $$$$  | $$         | $$__  $| $$__  $| $$  $$$| $$  | $| $$       | $$ | $$  $$$| $$|_  $$
//  | $$       \  $$$/ | $$     | $$\  $$$  | $$         | $$  | $| $$  | $| $$\  $$| $$  | $| $$       | $$ | $$\  $$| $$  \ $$
//  | $$$$$$$$  \  $/  | $$$$$$$| $$ \  $$  | $$         | $$  | $| $$  | $| $$ \  $| $$$$$$$| $$$$$$$$/$$$$$| $$ \  $|  $$$$$$/
//  |________/   \_/   |________|__/  \__/  |__/         |__/  |__|__/  |__|__/  \__|_______/|________|______|__/  \__/\______/
//
//  Code status: not bad, old but it works.
//

    // Message history
    var messageHistory = [],
        messageHistoryIndex = -1,
        lastTyped = "";

    // Messagebox event handling
    function messageboxEventHandling() {
        var textArea = $(".usertext-edit.md-container textarea");

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
                    if (textArea.val().indexOf("/version") === 0){
                        $(this).val(`||| RLC Version Info (via /version) RLC v.${GM_info.script.version}`);
                    }
                    if (textArea.val().indexOf("/browser") === 0){
                        $(this).val( "||| Browser Details (via /browser ) : \n\n"+nVer+ "\n" +browserName+ "\n" );
                    }
                    if (textArea.val().indexOf("/settings") === 0){
                        var str = "    {\n";
                        str += optionsArray.map(function(key){
                            return "    "+key+": "+GM_getValue(key);
                        }).join(",\n");
                        str += "\n    }"
                        $(this).val( "||| RLC settings (via /settings ) : \n\n"+str );
                    }
                    if (textArea.val().indexOf("/giphy") === 0 || textArea.val().indexOf("/gif") === 0  ){
                        var giphyQueryList = $(this).val().split(" ");
                        giphyQueryList.shift();
                        var giphyQuery = giphyQueryList.join(" ");
                        const GIPHY_API_KEY = "dc6zaTOxFJmzC";   // public test key, replace with production version.
                        jQuery.getJSON( `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${giphyQueryList.join("+")}` ,function( XHRObj ) {
                            thumbnail_url = XHRObj.data.fixed_width_small_url;
                            image_url = XHRObj.data.url;
                            console.log(XHRObj.data);
                            var textArea = $(".usertext-edit.md-container textarea");
                            textArea.val("rlc-image "+thumbnail_url+" "+image_url+" | "+giphyQuery);
                            $(".save-button .btn").click();
                        });
                        return false;
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
            }
            else if (e.keyCode === 40){
                e.preventDefault();
                if (messageHistoryIndex < messageHistory.length){
                    messageHistoryIndex++;
                    $(this).val(messageHistory[messageHistoryIndex]);
                }
                if (messageHistoryIndex === messageHistory.length) $(this).val(lastTyped);
            }
        });
    }

    function mouseClicksEventHandling() {
        // Right click author names in chat to copy to messagebox
        $("body").on("contextmenu", ".liveupdate .author", function (event) {
            event.preventDefault();
            let username = String($(this).text()).trim();
            let source = String($(".usertext-edit.md-container textarea").val());
            // Focus textarea and set the value of textarea
            $(".usertext-edit.md-container textarea").focus().val(source + " " + username + " ");
        });

        // Load old messages
        $("#togglebarLoadHist").click(function(){
            loadHistory();
        });

        // Easy access options
        $("#togglebarAutoscroll").click(function(){
            $( "#rlc-settings label:contains('Auto Scroll') input" ).click();
        });
        $("#togglebarTTS").click(function(){
            $( "#rlc-settings label:contains('Text To Speech (TTS)') input" ).click();
        });

        //$("#rlc-togglesidebar").click(function(){   $("body").toggleClass("rlc-hidesidebar");   scrollToBottom();  });
        $("#rlc-toggleoptions").click(function(){   $("body").removeClass("rlc-showreadmebar"); $("body").toggleClass("rlc-showoptions");});
        $("#rlc-toggleguide").click(function(){     $("body").removeClass("rlc-showoptions");   $("body").toggleClass("rlc-showreadmebar");});
        $("#rlc-sendmessage").click(function(){     $(".save-button .btn").click();});
    }

//
//   /$$$$$$/$$   /$$/$$$$$$/$$$$$$$$       /$$$$$$$$/$$   /$$/$$   /$$ /$$$$$$ /$$$$$$$$/$$$$$$
//  |_  $$_| $$$ | $|_  $$_|__  $$__/      | $$_____| $$  | $| $$$ | $$/$$__  $|__  $$__/$$__  $$
//    | $$ | $$$$| $$ | $$    | $$         | $$     | $$  | $| $$$$| $| $$  \__/  | $$ | $$  \__/
//    | $$ | $$ $$ $$ | $$    | $$         | $$$$$  | $$  | $| $$ $$ $| $$        | $$ |  $$$$$$
//    | $$ | $$  $$$$ | $$    | $$         | $$__/  | $$  | $| $$  $$$| $$        | $$  \____  $$
//    | $$ | $$\  $$$ | $$    | $$         | $$     | $$  | $| $$\  $$| $$    $$  | $$  /$$  \ $$
//   /$$$$$| $$ \  $$/$$$$$$  | $$         | $$     |  $$$$$$| $$ \  $|  $$$$$$/  | $$ |  $$$$$$/$$
//  |______|__/  \__|______/  |__/         |__/      \______/|__/  \__/\______/   |__/  \______|__/
//
//  Code status: Good.
//

    // RLC Containers & UI HTML for injection
    var htmlPayload = `
                <div id="rlc-wrapper">
                    <div id="rlc-header">
                        <div id="rlc-titlebar">
                            <div id="rlc-togglebar">
                                <div id="togglebarTTS">TextToSpeech</div>
                                <div id="togglebarLoadHist">Load History</div>
                                <div id="togglebarAutoscroll">Autoscroll</div>
                            </div>
                        </div>
                        <div id="rlc-statusbar"></div>
                    </div>
                    <div id="rlc-leftpanel">&nbsp;</div>
                    <div id="rlc-main">
                        <div id="rlc-preloader">Loading Messages</div>
                        <div id="rlc-chat"></div>
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
                            <div id="rlc-update" class="noselect"><a target="_blank" href="https://github.com/BNolet/RLC/raw/master/rlcs.user.js" rel="nofollow">Update RLC</a></div>
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
                            <li id="mute"><a>Mute User</a></li>
                            <li id="PMUser"><a>PM User</a></li>
                            <li id="deleteCom"><a>Delete Comment</a></li>
                            <li id="copyMessage"><a>Copy Message</a></li>
                            <li id="speakMessage"><a>Speak Message</a></li>
                        </ul>
                    </div>
                </div>`;

    function rlcSetupContainers() {
        $("body").append(htmlPayload);

        $(".liveupdate-listing").prependTo("#rlc-chat");
        $("#new-update-form").insertBefore("#rlc-sendmessage");
        $("#liveupdate-header").appendTo("#rlc-header #rlc-titlebar");
        $("#liveupdate-statusbar").appendTo("#rlc-header #rlc-statusbar");
        $("#liveupdate-resources").appendTo("#rlc-sidebar #rlc-main-sidebar");

        tabbedChannels.init($("<div id=\"filter_tabs\"></div>").insertBefore("#rlc-chat"));
    }

    function rlcParseSidebar() {

        // Put anything after -RLC-README- in the sidebar into the readme
        let str = $("#liveupdate-resources .md").html();
        let res = str.split("<p>--RLC-SIDEBAR-GUIDE--</p>");
        $("#liveupdate-resources .md").html(res[0]);
        $("#rlc-readmebar .md").append(res[1]);

        // Put anything before -RLC-MAIN- in the sidebar into the guide
        str = $("#liveupdate-resources .md").html();
        res = str.split("<p>--RLC-SIDEBAR-MAIN--</p>");
        $("#liveupdate-resources .md").html(res[1]);
        $("#rlc-guidebar .md").append(res[0]);

        $("#rlc-main-sidebar").append("<div id='rlc-activeusers'><ul></ul></div>");
        $("#rlc-main-sidebar").append("<div id='banlistcontainer'><div id='bannedlist'></div></div>");

        $("#rlc-statusbar").append("<div id='versionnumber'>Reddit Live Chat (RLC) v." + GM_info.script.version + "</div>");

    }

    function rlcDocReadyModifications() {

        // Show hint about invites if there is no messagebox
        if ($(".usertext-edit textarea").length <= 0) {
            $("#rlc-main").append("<p style='width:100%;text-align:center;'>If you can see this you need an invite to send messages, check the sidebar.</p>");
        }

        // Add placeholder text and focus messagebox
        $(".usertext-edit textarea").attr("placeholder", "Type here to chat");
        $(".usertext-edit textarea").focus();

        // Make links external
        $("#rlc-main a").attr("target", "_blank");
        $("#rlc-sidebar a").attr("target", "_blank");
        $("#rlc-readmebar a").attr("target", "_blank");
        $("#rlc-guidebar a").attr("target", "_blank");

        // Remove initial iframes TODO: handle them better
        $("#rlc-main iframe").remove();
        $("#rlc-main .separator").remove();
    }

    function rlcInitEventListeners() {

        // Detect new content being added
        $(".liveupdate-listing").on("DOMNodeInserted", function(e) {
            if ($(e.target).is("li.liveupdate")) {

                // Apply changes to line
                handleNewMessage($(e.target), false);
                scrollToBottom();

            }
            // Remove separators
            else if ($(e.target).is(".separator")) {
                $(e.target).remove();
            }
        });

        messageboxEventHandling();
        mouseClicksEventHandling();
    }
    function handleInitialMessages() {

        // handle existing chat messages
        $("#rlc-chat").find("li.liveupdate").each(function(idx,item){
            handleNewMessage($(item), true);
        });

        // wait for iframes, then remove preloader and scroll to bottom
        setTimeout($("#rlc-preloader").fadeOut(), 250);
        setTimeout(scrollToBottom, 250);
        loadingInitialMessages = 0;
    }

//
//   /$$      /$$/$$$$$$/$$   /$$/$$$$$$$  /$$$$$$ /$$      /$$                 /$$       /$$$$$$  /$$$$$$ /$$$$$$$
//  | $$  /$ | $|_  $$_| $$$ | $| $$__  $$/$$__  $| $$  /$ | $$                | $$      /$$__  $$/$$__  $| $$__  $$
//  | $$ /$$$| $$ | $$ | $$$$| $| $$  \ $| $$  \ $| $$ /$$$| $$                | $$     | $$  \ $| $$  \ $| $$  \ $$
//  | $$/$$ $$ $$ | $$ | $$ $$ $| $$  | $| $$  | $| $$/$$ $$ $$                | $$     | $$  | $| $$$$$$$| $$  | $$
//  | $$$$_  $$$$ | $$ | $$  $$$| $$  | $| $$  | $| $$$$_  $$$$                | $$     | $$  | $| $$__  $| $$  | $$
//  | $$$/ \  $$$ | $$ | $$\  $$| $$  | $| $$  | $| $$$/ \  $$$                | $$     | $$  | $| $$  | $| $$  | $$
//  | $$/   \  $$/$$$$$| $$ \  $| $$$$$$$|  $$$$$$| $$/   \  $$       /$$      | $$$$$$$|  $$$$$$| $$  | $| $$$$$$$/
//  |__/     \__|______|__/  \__|_______/ \______/|__/     \__/      |__/      |________/\______/|__/  |__|_______/
//
//  Code status: good.
//

    // Boot
    $(window).load(function() {

        // Move default elements into custom containers defined in htmlPayload
        rlcSetupContainers();

        // Setup sidebar based on content
        rlcParseSidebar();

        // Modify initial elements
        rlcDocReadyModifications();

        // Attach event listeners
        rlcInitEventListeners();

        // Persistant user muting
        updateMutedUsers();

        // not really sure, but related to message background alternation
        rowAlternator=!rowAlternator;

        // run options setup
        createOptions();

        // handle initial messages
        setTimeout(handleInitialMessages, 1000);

    });

//
//   /$$$$$$$$/$$$$$$ /$$   /$$/$$$$$$$$
//  | $$_____/$$__  $| $$$ | $|__  $$__/
//  | $$    | $$  \ $| $$$$| $$  | $$
//  | $$$$$ | $$  | $| $$ $$ $$  | $$
//  | $$__/ | $$  | $| $$  $$$$  | $$
//  | $$    | $$  | $| $$\  $$$  | $$
//  | $$    |  $$$$$$| $$ \  $$  | $$
//  |__/     \______/|__/  \__/  |__/
//
//  Open Sans Google font
//

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

//
//    /$$$$$$ /$$   /$$ /$$$$$$ /$$   /$$/$$   /$$/$$$$$$$$/$$              /$$$$$$ /$$$$$$$$/$$     /$$/$$      /$$$$$$$$ /$$$$$$
//   /$$__  $| $$  | $$/$$__  $| $$$ | $| $$$ | $| $$_____| $$             /$$__  $|__  $$__|  $$   /$$| $$     | $$_____//$$__  $$
//  | $$  \__| $$  | $| $$  \ $| $$$$| $| $$$$| $| $$     | $$            | $$  \__/  | $$   \  $$ /$$/| $$     | $$     | $$  \__/
//  | $$     | $$$$$$$| $$$$$$$| $$ $$ $| $$ $$ $| $$$$$  | $$            |  $$$$$$   | $$    \  $$$$/ | $$     | $$$$$  |  $$$$$$
//  | $$     | $$__  $| $$__  $| $$  $$$| $$  $$$| $$__/  | $$             \____  $$  | $$     \  $$/  | $$     | $$__/   \____  $$
//  | $$    $| $$  | $| $$  | $| $$\  $$| $$\  $$| $$     | $$             /$$  \ $$  | $$      | $$   | $$     | $$      /$$  \ $$
//  |  $$$$$$| $$  | $| $$  | $| $$ \  $| $$ \  $| $$$$$$$| $$$$$$$$      |  $$$$$$/  | $$      | $$   | $$$$$$$| $$$$$$$|  $$$$$$/
//   \______/|__/  |__|__/  |__|__/  \__|__/  \__|________|________/       \______/   |__/      |__/   |________|________/\______/
//
//  Generate colors and identifiers for 35 channels. Channel Tabs uses these to filter messages.
//  Code status: good.
//

    // Channel Colours
    var colors = ["rgba(255,0,0,0.1)", "rgba(0,255,0,0.1)", "rgba(0,0,255,0.1)", "rgba(0,255,255,0.1)", "rgba(255,0,255,0.1)", "rgba(255,255,0,0.1)", "rgba(211,211,211, .1)", "rgba(0,100,0, .1)", "rgba(255,20,147, .1)", "rgba(184,134,11, .1)"];

    var color;
    for(var c = 0; c < 10; c++){  // c reduced from 35
        color = colors[(c % (colors.length))];

        GM_addStyle(`#rlc-main.show-colors #rlc-chat li.liveupdate.rlc-filter-${c} { background: ${color};}`, 0);
        GM_addStyle(`#rlc-chat.rlc-filter.rlc-filter-${c} li.liveupdate.rlc-filter-${c} { display:block;}`, 0);
    }

//
//    /$$$$$$  /$$$$$$  /$$$$$$
//   /$$__  $$/$$__  $$/$$__  $$
//  | $$  \__| $$  \__| $$  \__/
//  | $$     |  $$$$$$|  $$$$$$
//  | $$      \____  $$\____  $$
//  | $$    $$/$$  \ $$/$$  \ $$
//  |  $$$$$$|  $$$$$$|  $$$$$$/
//   \______/ \______/ \______/
//
//  Minified - tip: to edit, cut the contents of the RLC-CORE, leaving it empty as so: GM_addstyle('').
//  Save the script in your userscript editor and reload RLC sans CSS, use dev tools and insert the copied CSS via inspector stylesheet.
//  Use the buildt in {} formatting button to format the minified CSS into a readable structure.
//
//  To save your changes, use cssminifier.com to re-minify your resulting CSS and insert it in the GM_addstyle that you left empty.
//

    // RLC-CORE
    GM_addStyle('.rlc-imageWithin .md{min-height:150px!important}.rlc-imageWithin .rlc-image{height:150px}.longMessageClosed{position:relative;min-height:32px}.longMessageClosed p{position:relative;left:25px;top:-5px}.longMessageClosed .extendButton{position:absolute;top:7px}.longMessageClosed pre{position:absolute;left:25px}body{min-width:0}#rlc-leftpanel .embedFrame{border:0;width:100%;max-width:100%;padding-top:20px!important;background:grey!important}#rlc-leftpanel:before{content:"right click above a frame to remove it";padding-left:30px}div#rlc-leftpanel{overflow-x:scroll}.rlc-hasEmbed .md{position:relative}.rlc-hasEmbed .md:after{content:" ";position:absolute;left:0;width:100%;height:100%;top:0}.rlc-hasEmbedExpanded .md:after{display:none}.rlc-hasEmbed iframe{height:28px!important}.rlc-hasEmbed.rlc-hasEmbedExpanded iframe{height:auto!important;min-height:270px!important}#filter_tabs,#rlc-sendmessage,#rlc-toggleguide,#rlc-toggleoptions,#rlc-update,#rlc-wrapper,#togglebarAutoscroll,#togglebarLoadHist,#togglebarTTS{-webkit-box-shadow:0 1px 2px 0 rgba(166,166,166,1);-moz-box-shadow:0 1px 2px 0 rgba(166,166,166,1)}.rlc-customscrollbars div#filter_tabs{width:calc(100% - 12px)}.dark-background #rlc-preloader{background:#404040}#rlc-preloader{background:#fff;left:0;right:0;bottom:96px;top:0;position:absolute;z-index:10000;padding-top:14%;font-size:3em;TEXT-ALIGN:CENTER;box-sizing:border-box}.extendButton{margin-right:5px}.longMessageClosed{max-height:30px;overflow-y:hidden;overflow-x:hidden}#rlc-messagebox,#rlc-sidebar{float:right;box-sizing:border-box}div#rlc-settings label{display:block;font-size:1.4em;margin-left:10px}#hsts_pixel,.bottom-area,.content,.debuginfo,.footer-parent,.save-button{display:none}#rlc-messagebox .md,#rlc-messagebox .usertext,header#liveupdate-header{max-width:none}#rlc-sendmessage,#rlc-wrapper{box-shadow:0 1px 2px 0 rgba(166,166,166,1)}#rlc-header,#rlc-wrapper,body{overflow:hidden}#new-update-form{margin:0}.liveupdate time.live-timestamp,.liveupdate ul.buttonrow{display:none!important}#filter_tabs,#liveupdate-resources h2,#myContextMenu,#rlc-guidebar,#rlc-readmebar,#rlc-settings,select#rlc-channel-dropdown{display:none}#rlc-messagebox .usertext-edit.md-container{max-width:none;padding:0;margin:0}header#liveupdate-header{margin:0!important;padding:15px}h1#liveupdate-title:before{content:"chat in ";color:#000}h1#liveupdate-title{font-size:1.5em;color:#9c9c9c;float:left;padding:0}#rlc-header #liveupdate-statusbar{margin:0;padding:0;border:none!important;background:0 0!important}#rlc-wrapper .liveupdate .body{max-width:none!important;margin:0;font-size:13px;font-family:"Open Sans",sans-serif}div#rlc-sidebar{max-height:550px;background-color:#EFEFED}#rlc-wrapper{height:calc(100vh - 63px);max-width:1248px;max-height:600px;margin:0 auto;border-radius:0 0 2px 2px;-moz-border-radius:0 0 2px 2px;-webkit-border-radius:0 0 2px 2px}#rlc-header{height:50px;border-bottom:1px solid #e3e3e0;border-top:0;box-sizing:border-box}#rlc-main,#rlc-titlebar{width:76%;float:left;position:relative}#rlc-sidebar{width:24%;overflow-y:auto;overflow-x:hidden;height:calc(100vh - 114px);border-left:2px solid #FCFCFC;padding:5px 0}#rlc-chat{height:calc(100vh - 202px);overflow-y:scroll;max-height:461px}#rlc-main .liveupdate-listing{max-width:100%;padding:0 0 0 15px;box-sizing:border-box;display:flex;flex-direction:column-reverse;min-height:100%}#rlc-messagebox textarea{border:1px solid rgba(128,128,128,.26);float:left;height:34px;margin:0;border-radius:2px;padding:6px}#rlc-sendmessage,#rlc-toggleguide,#rlc-toggleoptions,#rlc-update{border-radius:2px;width:100%;float:left;text-align:center;box-sizing:border-box;cursor:pointer}#rlc-messagebox{padding:10px;background-color:#EFEFED;width:100%}#rlc-sendmessage{background-color:#FCFCFC;height:32px;margin:10px 0 0;-moz-border-radius:2px;-webkit-border-radius:2px;padding:6px;font-size:1.5em}#rlc-toggleguide,#rlc-toggleoptions,#rlc-update{padding:4px 0 8px;-moz-border-radius:2px;-webkit-border-radius:2px;box-shadow:0 1px 2px 0 rgba(166,166,166,1);background:#FCFCFC;margin-bottom:8px}#rlc-toggleguide{margin-bottom:0}.liveupdate .simpletime{float:left;padding-left:10px;box-sizing:border-box;width:75px;text-transform:uppercase;color:#A7A6B8;line-height:32px}.liveupdate a.author{float:left;padding-right:10px;margin:0;padding-top:0;font-weight:600;width:130px}.liveupdate-listing li.liveupdate .body .md{float:right;width:calc(100% - 220px);max-width:none;box-sizing:border-box}li.liveupdate.in-channel .body .md{width:calc(100% - 320px)}#rlc-activeusers{padding:15px 20px 20px 40px;font-size:1.5em}#rlc-activeusers li{list-style:outside;padding:0 0 8px}#rlc-settingsbar{width:100%;height:auto;padding:0 10px;box-sizing:border-box;margin:10px 0 20px;float:left}#rlc-main-sidebar{float:right;width:100%}#rlc-sidebar hr{height:2px;width:100%;margin-left:0;color:#FCFCFC}#rlc-sidebar h3{padding:0 10px}#rlc-statusbar{width:24%;float:right;text-align:center;padding-top:8px}#versionnumber{padding-top:5px}.liveupdate.user-narration .body .md{font-style:italic}.liveupdate.user-mention .body .md p{font-weight:700}.liveupdate pre{margin:0;padding:0;background:rgba(128,128,128,.5);border:#FCFCFC;box-sizing:border-box}.liveupdate a.author,.liveupdate p{line-height:32px;min-height:32px}#liveupdate-description{margin-left:10px;float:left}.md{max-width:none!important}.liveupdate-listing li.liveupdate p{font-size:13px!important}div#rlc-settingsbar a{display:inline-block}div#rlc-togglebar{float:right;display:block;height:100%;padding-right:30px}.AutoScroll #togglebarAutoscroll,.rlc-TextToSpeech #togglebarTTS{background:rgba(0,0,0,.15)}#togglebarAutoscroll,#togglebarLoadHist,#togglebarTTS{float:right;box-sizing:border-box;text-align:center;padding:5px 10px;cursor:pointer;border-radius:2px;-moz-border-radius:2px;-webkit-border-radius:2px;box-shadow:0 1px 2px 0 rgba(166,166,166,1);width:90px;margin-left:10px;margin-top:15px}div#rlc-settings label{float:left;width:100%;margin-bottom:10px;padding-bottom:10px;border-bottom:2px solid #fff}div#rlc-settings label span{padding-top:3px;padding-bottom:5px;font-size:.7em;text-align:right;display:block;float:right;padding-right:20px}div#rlc-settings input{margin-right:5px}.rlc-channel-add button{background:0 0;border:0;margin:0;padding:4px 14px;border-top:0;border-bottom:0}.channelname{color:#A9A9A9!important;display:block;float:left;width:100px;line-height:32px}.rlc-showChannelsUI #new-update-form{width:85%;float:left}.rlc-showChannelsUI select#rlc-channel-dropdown{display:block;width:15%;height:34px;float:left;background-color:#FCFCFC;border:1px solid rgba(128,128,128,.26)}.rlc-showChannelsUI #rlc-sendmessage{width:100%;float:left}.rlc-showChannelsUI div#filter_tabs{display:block;z-index:100;background:#EFEFED}#filter_tabs,.rlc-channel-add,.rlc-hideChannelsInGlobal .liveupdate.in-channel,.rlc-showChannelsUI .rlc-filter .liveupdate,.user-narration a.author{display:none}.rlc-showChannelsUI .rlc-channel-add{position:absolute;top:27px;right:17px;padding:5px;box-sizing:border-box;background:#EFEFED;-webkit-box-shadow:0 1px 2px 0 rgba(166,166,166,1);-moz-box-shadow:0 1px 2px 0 rgba(166,166,166,1)}#filter_tabs .rlc-filters>span:last-of-type{border-right:0}div#filter_tabs{width:calc(100% - 17px)}#filter_tabs{table-layout:fixed;width:100%;height:26px;position:absolute}#filter_tabs>span{width:90%;display:table-cell}#filter_tabs>span.all,#filter_tabs>span.more{width:60px;text-align:center;vertical-align:middle;cursor:pointer}#filter_tabs .rlc-filters{display:table;width:100%;table-layout:fixed;height:24px}#filter_tabs .rlc-filters>span{padding:7px 2px!important;text-align:center;display:table-cell;cursor:pointer;vertical-align:middle;font-size:1.1em;border-right:1px solid grey}#filter_tabs .rlc-filters>span>span{pointer-events:none}#filter_tabs>span.all{padding:0 30px;border-right:1px solid grey}#filter_tabs>span.more{padding:0 30px;border-left:1px solid grey}.rlc-channel-add input{border:1px solid rgba(128,128,128,.32);padding:0;height:24px}#rlc-leftpanel{display:none}.left-panel #rlc-leftpanel{width:14%;float:left;display:block;background-color:#EFEFED;height:calc(100vh - 114px)}.left-panel #rlc-sidebar,.left-panel #rlc-statusbar{width:18%}.left-panel #rlc-main{width:68%}.mrPumpkin{height:24px;width:24px;display:inline-block;border-radius:3px;background-size:144px;position:relative;top:6px}.dark-background .mrPumpkin{border-radius:5px}.mp_frown{background-position:-24px 0}.mp_confused{background-position:-48px 0}.mp_meh{background-position:0 -24px}.mp_angry{background-position:-48px -24px}.mp_shocked{background-position:-24px -24px}.mp_happy{background-position:-72px 120px}.mp_sad{background-position:-72px 96px}.mp_crying{background-position:0 72px}.mp_tongue{background-position:0 24px}.mp_xhappy{background-position:-48px 48px}.mp_xsad{background-position:-24px 48px}.mp_xsmile{background-position:0 48px}.mp_annoyed{background-position:-72px 72px}.mp_bored{background-position:-48px 72px}.mp_wink{background-position:-24px 72px}.mp_evilsmile{background-position:-72px 24px}.mp_stjerneklar{background-position:-72px 48px}.mp_fatherderp{background-position:-24px 24px}.mp_s3cur1ty{background-position:-48px 24px}.dark-background .alt-bgcolor{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGM6YwwAAdQBAooJK6AAAAAASUVORK5CYII=)!important}.alt-bgcolor{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGM6Uw8AAiABTnvshQUAAAAASUVORK5CYII=)!important}#option-rlc-ChromeNotifications,#option-rlc-ChromeScrollBars,#option-rlc-DisableUserbasedVoices,#option-rlc-TTSUsernameNarration{display:none!important}.rlc-TextToSpeech #option-rlc-DisableUserbasedVoices,.rlc-TextToSpeech #option-rlc-TTSUsernameNarration{display:block!important}@media screen and (-webkit-min-device-pixel-ratio:0){#option-rlc-ChromeNotifications,#option-rlc-ChromeScrollBars{display:block!important}}.rlc-compact #header{display:none}.rlc-compact #rlc-chat{height:calc(100vh - 263px);max-height:451px}.rlc-fullwidth div#rlc-chat,.rlc-fullwidth div#rlc-sidebar{max-height:none}.rlc-fullwidth div#rlc-chat{height:calc(100vh - 215px)}.rlc-fullwidth #rlc-wrapper{max-height:none;max-width:none;height:calc(100vh - 0px)}.rlc-fullwidth.left-panel #rlc-statusbar{width:18%}.rlc-fullwidth.left-panel #rlc-titlebar{width:81%}.rlc-fullwidth div#rlc-wrapper{height:100%}.rlc-compact.rlc-fullwidth #rlc-chat{height:calc(100vh - 145px)}.rlc-compact.rlc-fullwidth #rlc-sidebar{height:calc(100vh - 50px)}.dark-background.AutoScroll #togglebarAutoscroll,.dark-background.rlc-TextToSpeech #togglebarTTS{background:rgba(239,247,255,.25)}.dark-background,.dark-background #rlc-leftpanel,.dark-background #rlc-messagebox,.dark-background #rlc-messagebox textarea,.dark-background #rlc-sendmessage,.dark-background #rlc-sidebar,.dark-background #rlc-toggleguide,.dark-background #rlc-toggleoptions,.dark-background #rlc-update,.dark-background .rlc-channel-add,.dark-background option{background:#404040}.dark-background.rlc-showChannelsUI div#filter_tabs{background-color:#5C5C5C}.dark-background #rlc-sidebar{border:transparent}.dark-background.rlc-showChannelsUI select#rlc-channel-dropdown{background:0 0}.dark-background .liveupdate code{color:#000}.dark-background #rlc-sidebar h2,.dark-background #rlc-sidebar h3,.dark-background #rlc-sidebar h4,.dark-background h1#liveupdate-title:before{color:#ccc}.dark-background #rlc-wrapper a{color:#7878ff}.dark-background #rlc-messagebox textarea,.dark-background #rlc-sidebar li,.dark-background #rlc-wrapper,.dark-background #rlc-wrapper h1,.dark-background #rlc-wrapper h1#liveupdate-title,.dark-background #rlc-wrapper li,.dark-background #rlc-wrapper p,.dark-background .longMessageClosed:after,.dark-background .rlc-channel-add button,.dark-background.rlc-showChannelsUI select#rlc-channel-dropdown{color:#f5f5f5}.rlc-compact #rlc-wrapper{margin-top:75px}.rlc-compact #rlc-header{border-top:1px solid rgba(227,227,224,.44)}.rlc-compact.rlc-fullwidth #rlc-wrapper{margin-top:0}body.allowHistoryScroll{height:105%;overflow:auto}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none}.rlc-customscrollbars ::-webkit-scrollbar{width:12px}.rlc-customscrollbars ::-webkit-scrollbar-track{background-color:#FCFCFC}.dark-background.rlc-customscrollbars ::-webkit-scrollbar-track{background-color:#5C5C5C}.dark-background.rlc-customscrollbars ::-webkit-scrollbar-thumb{background-color:#404040;border:2px solid #5C5C5C}.rlc-customscrollbars ::-webkit-scrollbar-thumb{background-color:#E4E4E4;border:2px solid #FCFCFC}#myContextMenu{display:none;position:absolute;background:#bbb;box-shadow:1px 1px 2px #888}#myContextMenu ul{list-style-type:none}#myContextMenu ul li a{padding:.5em 1em;color:#000;display:block}#myContextMenu ul li:not(.disabled) a:hover{background:#ccc;color:#333;cursor:pointer}#myContextMenu ul li.disabled a{background:#ddd;color:#666}.rlc-showoptions #rlc-settings{display:block}.rlc-showoptions #rlc-main-sidebar{display:none}.rlc-showreadmebar #rlc-readmebar{display:block}.rlc-showreadmebar #rlc-main-sidebar{display:none}');

    // base 64 encoded emote spritesheet - art by image author 741456963789852123/FlamingObsidian, added to by kreten
    GM_addStyle('.mrPumpkin{background-image:url("data:image/png;base64,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")}');
