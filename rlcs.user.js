// ==UserScript==
// @name         RLC
// @namespace    http://tampermonkey.net/
// @version      2.6.1
// @description  Chat-like functionality for Reddit Live
// @author       FatherDerp, Stjerneklar, thybag, mofosyne, jhon
// @include      https://www.reddit.com/live/*
// @exclude      https://www.reddit.com/live/
// @exclude      https://www.reddit.com/live
// @exclude      https://www.reddit.com/live/*/edit*
// @exclude      https://www.reddit.com/live/*/contributors*
// @exclude      https://*.reddit.com/live/create*
// @require      https://code.jquery.com/jquery-2.2.3.min.js
// @require      https://code.jquery.com/ui/1.10.4/jquery-ui.min.js
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==
(function() {
    // Grab users username + play nice with RES
    var robin_user = $("#header-bottom-right .user a").first().text().toLowerCase();
    // Channel Colours
    var colors = [
        'rgba(255,0,0,0.1)','rgba(0,255,0,0.1)','rgba(0,0,255,0.1)','rgba(0,255,255,0.1)','rgba(255,0,255,0.1)','rgba(255,255,0,0.1)','rgba(211,211,211, .1)','rgba(0,100,0, .1)','rgba(255,20,147, .1)','rgba(184,134,11, .1)'
    ];

    var player = document.createElement('audio');
    player.src = 'https://dl.dropbox.com/u/7079101/coin.mp3';
    player.preload = "auto";

    function convertTo24Hour(time) {
        var hours = parseInt(time.substr(0, 2));
        if(time.indexOf('am') != -1 && hours == 12) {
            time = time.replace('12', '0');
        }
        if(time.indexOf('pm')  != -1 && hours < 12) {
            time = time.replace(hours, (hours + 12));
        }
        return time.replace(/(am|pm)/, '');
    }  

    // msg history
    var messageHistory = [];
    var messageHistoryIndex = -1;
    
    // Active user array
    var activeUserArray = [];
    var activeUserTimes = [];
    
    var updateArray = [];
    
    function processActiveUsersList() { 
        $("#rlc-activeusers ul").empty();
        updateArray = [];
        for(i=0; i <= activeUserArray.length; i++){
              if (updateArray.indexOf(activeUserArray[i]) === -1 && activeUserArray[i] !== undefined) {
                updateArray.push(activeUserArray[i]);
                $("#rlc-activeusers ul").append("<li><span class='activeusersUser'>"+activeUserArray[i] + "</span> @ <span class='activeusersTime'>" + activeUserTimes[i]+"</span></li>"); 
            } else if (updateArray.indexOf(activeUserArray[i]) > -1) {
                //add message counter value
                //check if timestamp is recent enough?
            }
        }
        $( ".usertext-edit textarea" ).autocomplete( "option", "source", updateArray );
        
    }
    /* Basic usage - tabbedChannels.init( dom_node_to_add_tabs_to );
     * and hook up tabbedChannels.proccessLine(lower_case_text, jquery_of_line_container); to each line detected by the system */
    var tabbedChannels = new function(){
        var _self = this;

        // Default options
        this.channels = [":general", ":offtopic"];
        this.mode = 'single';

        // internals
        this.unread_counts = {};
        this.$el = null;
        this.$opt = null;
        this.defaultRoomClasses = '';
        this.channelMatchingCache = [];

        //channels user is in currently
        this.currentRooms = 0;

        // When channel is clicked, toggle it on or off
        this.toggle_channel = function(e){
            var channel = $(e.target).data("filter");
            if(channel===null)return; // no a channel

            if(!$("#rlc-chat").hasClass("rlc-filter-" + channel)){
                _self.enable_channel(channel);
                $(e.target).addClass("selected");
                // clear unread counter
                $(e.target).find("span").text(0);
                _self.unread_counts[channel] = 0;
            }else{
                _self.disable_channel(channel);
                $(e.target).removeClass("selected");
            }

            // scroll everything correctly
            _scroll_to_bottom();
        };

        // Enable a channel
        this.enable_channel = function(channel_id){

            // if using room type "single", deslect other rooms on change
            if(this.mode == "single"){
                this.disable_all_channels();
            }

            $("#rlc-chat").addClass("rlc-filter rlc-filter-" + channel_id);
            $("#rlc-chat").attr("data-channel-key", this.channels[channel_id]);
            this.currentRooms++;
            // unselect show all
            _self.$el.find("span.all").removeClass("selected");
        };

        // disable a channel
        this.disable_channel = function(channel_id){
            $("#rlc-chat").removeClass("rlc-filter-" + channel_id);
            this.currentRooms--;

            // no rooms selcted, run "show all"
            if(this.currentRooms === 0){
                this.disable_all_channels();
            }else{
                // Grab next channel name if u leave a room in multi mode
                $("#rlc-chat").attr("data-channel-key", $(".rlc-filters span.selected").first().data("filter-name"));
            }
        };

        // turn all channels off
        this.disable_all_channels = function(e){
            $("#rlc-chat").attr("class", _self.defaultRoomClasses).attr("data-channel-key","");
            _self.$el.find(".rlc-filters > span").removeClass("selected");
            this.currentRooms = 0;

            _self.$el.find("span.all").addClass("selected");
            _scroll_to_bottom();
        };

        // render tabs
        this.drawTabs = function(){
            html = '';
            for(var i in this.channels){
                if(typeof this.channels[i] === 'undefined') continue;
                html += '<span data-filter="' + i + '" data-filter-name="'+ this.channels[i] +'">' + this.channels[i] + ' (<span>0</span>)</span> ';
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
        this.addChannel = function(new_channel){
            if(this.channels.indexOf(new_channel) === -1){
                this.channels.push(new_channel);
                this.unread_counts[this.channels.length-1] = 0;
                this.updateChannelMatchCache();
                this.saveChannelList();
                this.drawTabs();

                // Populate content for channel
                this.reScanChannels();

                // refresh everything after redraw
                this.disable_all_channels();
            }
        };

        // remove existing channel
        this.removeChannel = function(channel){
            if(confirm("are you sure you wish to remove the " + channel + " channel?")){
                var idx = this.channels.indexOf(channel);
                delete this.channels[idx];
                this.updateChannelMatchCache();
                this.saveChannelList();
                this.drawTabs();

                // sub channels, will fall back to existing channels
                this.reScanChannels();

                // refresh everything after redraw
                this.disable_all_channels();
            }
        };


        // save channel list
        this.saveChannelList = function(){
            // clean array before save
            var channels = this.channels.filter(function (item) { return item !== undefined; });
            GM_setValue("rlc-enhance-channels", channels);
        };

        // Change chat mode
        this.changeChannelMode = function(e){
            _self.mode = $(this).data("type");

            // swicth bolding
            $(this).parent().find("span").css("font-weight","normal");
            $(this).css("font-weight","bold");
            _self.disable_all_channels();

            // Update mode setting
            GM_setValue("rlc-enhance-mode", _self.mode);
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
        this.proccessLine = function(text, $element, rescan){
            var i, idx, channel;
            var  shorttime = $element.find(".body time").attr( "title" ).split(" ");
            var amPm = shorttime[4].toLowerCase();
            if (amPm === "am" || amPm === "pm" ) {
                var shortimefull = shorttime[3] + " " + amPm;
              }
            else {
                amPm = " ";
            }

            var militarytime = convertTo24Hour(shorttime[3] + " " + amPm);

            //add simplified timestamps
                if($element.find(".body .simpletime").length) { }
                else  {
                    $element.find(".body time").before("<div class='simpletime'>"+shorttime[3]+ " "+amPm+"</div>");
                }
            
            // If rescanning, clear any existing "channel" classes
            if(typeof rescan !== 'undefined' && rescan === true){
                $element.removeClass("in-channel");

                for(i=0; i <= this.channels.length; i++){
                    $element.removeClass("rlc-filter-" + i);
                }
            }
            // if we are handling new messages
            else {
                //add info to activeuserarray
                var $usr = $element.find(".body .author");
                activeUserArray.push($usr.text());
                activeUserTimes.push(militarytime);
                
                 //mention sound effect player
                 if(text.indexOf(robin_user) !== -1){
                     console.log("soundeffect!");
                     if ($("body").hasClass("rlc-notificationsound")) {
                         player.play();
                     }
                     if ($("body").hasClass("rlc-notificationchrome")) {
                         var n = new Notification('Robin Live Chat',{
                             icon: "https://i.imgur.com/3t4bSRD.png",
                             body: $usr.text() + ": " + text,
                         });
                     }
                }

            }

            // Scann for channel identifiers
            for(i=0; i< this.channelMatchingCache.length; i++){ // sorted so longer get picked out before shorter ones (sub channel matching)
                idx = this.channelMatchingCache[i];
                channel = this.channels[idx];

                if(typeof channel === 'undefined') continue;

                if(text.indexOf(channel) === 0){
                    $element.find(".body").append("<a class='channelname'>&nbsp;in&nbsp;"+channel+"</a>");
                    $element.addClass("rlc-filter-" + idx +" in-channel");
                    this.unread_counts[idx]++;

                    // remove channel name in messages
                    var newele = $element.find(".body .md p").html().replace(channel,'');
                    $element.find(".body .md p").html(newele);

                    return;
                }
            }
        };

        // If in one channel, auto add channel keys
        this.submit_helper = function(){
            if($("#rlc-chat").hasClass("rlc-filter")){
                // auto add channel key
                var channel_key = $("#rlc-chat").attr("data-channel-key");

                if($("#new-update-form textarea").val().indexOf("/me") === 0){
                    $("#new-update-form textarea").val("/me " + channel_key + " " + $("#new-update-form textarea").val().substr(3));
                }else if($("#new-update-form textarea").val().indexOf("/") !== 0){
                    // if its not a "/" command, add channel
                    $("#new-update-form textarea").val(channel_key + " " + $("#new-update-form textarea").val());
                }
            }
        };

        // Update everuything
        this.tick = function(){
            _self.$el.find(".rlc-filters span").each(function(){
                if($(this).hasClass("selected")) return;
                $(this).find("span").text(_self.unread_counts[$(this).data("filter")]);
            });
            //update the active user list
            processActiveUsersList();
        };

        // Init tab zone
        this.init = function($el){
            // Load channels
            if(GM_getValue("rlc-enhance-channels")){
                this.channels = GM_getValue("rlc-enhance-channels");
            }
            if(GM_getValue("rlc-enhance-mode")){
                this.mode = GM_getValue("rlc-enhance-mode");
            }

            // init counters
            for(var i in this.channels){
                this.unread_counts[i] = 0;
            }

            // update channel cache
            this.updateChannelMatchCache();

            // set up el
            this.$el = $el;

            // Create inital markup
            this.$el.html("<span class='all selected'>Global</span><span><div class='rlc-filters'></div></span><span class='more'>[Channels]</span>");
            this.$opt = $("<div class='rlc-channel-add' style='display:none'><input name='add-channel'><button>Add channel</button> <span class='channel-mode'>Channel Mode: <span title='View one channel at a time' data-type='single'>Single</span> | <span title='View many channels at once' data-type='multi'>Multi</span></span></div>").insertAfter(this.$el);

            // Attach events
            this.$el.find(".rlc-filters").click(this.toggle_channel);
            this.$el.find("span.all").click(this.disable_all_channels);
            this.$el.find("span.more").click(function(){ $(".rlc-channel-add").toggle(); $("body").toggleClass("rlc-addchanmenu"); });
            this.$el.find(".rlc-filters").bind("contextmenu", function(e){
                e.preventDefault();
                e.stopPropagation();
                var chan_id = $(e.target).data("filter");
                if(chan_id===null)return; // no a channel
                _self.removeChannel(_self.channels[chan_id]);
            });
            // Form events
            this.$opt.find(".channel-mode span").click(this.changeChannelMode);
            this.$opt.find("button").click(function(){
                var new_chan = _self.$opt.find("input[name='add-channel']").val();
                if(new_chan !== '') _self.addChannel(new_chan);
                _self.$opt.find("input[name='add-channel']").val('');
            });


            $(".save-button .btn").click(this.submit_helper);

            // store default room class
            this.defaultRoomClasses = $("#rlc-chat").attr("class") ? $("#rlc-chat").attr("class") : '';

            // redraw tabs
            this.drawTabs();

            // start ticker
            setInterval(this.tick, 10000);
        };
    };
    // create persistant option
    function createOption(name, click_action, default_state){
        var checked_markup;
        var key = "rlc-enhance-" + name.replace(/\W/g, '');
        var state = (typeof default_state !== "undefined") ? default_state : false;

        // try and state if setting is defined
        if(GM_getValue(key)){
            state = (GM_getValue(key) === 'true') ? true : false;
        }
        // markup for state
        checked_markup = (state === true) ? "checked='checked'" : "";
        // render option
        var $option = $("<label><input type='checkbox' "+checked_markup+">"+name+"</label>").click(function(){
            var checked = $(this).find("input").is(':checked');

            // persist state
            if(checked != state){
                GM_setValue(key, checked ? 'true' : 'false'); // true/false stored as strings, to avoid unset matching
                state = checked;
            }

            click_action(checked, $(this));
        });
        // add to dom
        $("#rlc-settings").append($option);
        // init
        click_action(state, $option);
    }


    // Scroll chat back to bottom
    var _scroll_to_bottom = function(){
        if ($(document.body).hasClass("allowHistoryScroll")) {
            return false;
        }
        else {
            $("#rlc-chat").scrollTop($("#rlc-chat")[0].scrollHeight);
        }
    };

    var handle_new_message = function($ele, rescan){
        // add any proccessing for new messages in here
        var $msg = $ele.find(".body .md");
        // target blank all messages
        $msg.find("a").attr("target","_blank");

        var $usr = $ele.find(".body .author");
        var line = $msg.text().toLowerCase();
        var first_line = $msg.find("p").first();

        // Highlight mentions
        if(line.indexOf(robin_user) !== -1){
            $ele.addClass("user-mention");
        }

        // /me support
        if(line.indexOf("/me") === 0){
            $ele.addClass("user-narration");
            first_line.html(first_line.html().replace("/me", " " + $usr.text().replace("/u/", "")));
        }

        // emote support
        if (!$("body").hasClass("rlc-noemotes")) {
            if(line.indexOf(":)") !== -1){
                first_line.html(first_line.html().replace(":)", "<span class='mrPumpkin mp_smile'></span>")); 
            }
            if(line.indexOf(":(") !== -1){
                if(line.indexOf(":((") !== -1){
                    first_line.html(first_line.html().replace(":((", "<span class='mrPumpkin mp_angry'></span>")); 
                }
                else { 
                    first_line.html(first_line.html().replace(":(", "<span class='mrPumpkin mp_frown'></span>")); 
                }
            }
            if(line.indexOf(":s") !== -1){
                first_line.html(first_line.html().replace(":s", "<span class='mrPumpkin mp_silly'></span>")); 
            }
            if(line.indexOf(":|") !== -1){
                first_line.html(first_line.html().replace(":|", "<span class='mrPumpkin mp_meh'></span>")); 
            }
            if(line.indexOf(":o") !== -1){
                first_line.html(first_line.html().replace(":o", "<span class='mrPumpkin mp_shocked'></span>")); 
            }
        }
        // insert time
        $usr.before($ele.find("time"));

        //remove the /u/
        $usr.text($usr.text().replace("/u/", ""));

        // Track channels
        tabbedChannels.proccessLine(line, $ele, rescan);

        //remove seperator 
        $(".liveupdate-listing .separator").remove();

        // Active Channels Monitoring
        updateMostActiveChannels(line);
        
    };
 
    
    /*
     START OF ACTIVE CHANNEL DISCOVERY SECTION
     (Transplanted from https://github.com/5a1t/parrot repo to which the section was originally contributed to by LTAcosta )
    */

    // Monitor the most active channels.
    var activeChannelsQueue = [];
    var activeChannelsCounts = {};
    function updateMostActiveChannels(messageText)
    {
        var chanName = messageText;

        if (!chanName)
            return;

        // To simplify things, we're going to start by only handling channels that start with punctuation.
        //if (!chanName.match(/^[!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\]\^_`{|}~]/)) return;
        if (!chanName.match(/^[:]/)) return;

        // possible channels is the first word of each line
        index = chanName.indexOf(" ");
        if (index >= 0)
            chanName = chanName.substring(0, index);

        // Guards against empty lines, or channames not being processed
        if (!chanName || chanName == messageText)
            return;

        chanName = chanName.toLowerCase();
        activeChannelsQueue.unshift(chanName);

        if (!activeChannelsCounts[chanName]) {
            activeChannelsCounts[chanName] = 0;
        }
        activeChannelsCounts[chanName]++;

        if (activeChannelsQueue.length > 2000){
            var oldChanName = activeChannelsQueue.pop(); // should this be shift() instead to ensure FIFO movement?
            activeChannelsCounts[oldChanName]--;
        }

        //console.log("activeChannelsQueue "+activeChannelsQueue);
        //console.log("activeChannelsCounts" + activeChannelsCounts);
    }

    function updateChannels()
    {
        // Sort the channels
        var channels = [];
        for(var channel in activeChannelsCounts){
            if (activeChannelsCounts[channel] >= 1){ // Sort only those with equal or more than 1 sighting
                channels.push(channel);
            }
        }

        channels.sort(function(a,b) {return activeChannelsCounts[b] - activeChannelsCounts[a];});

        /* Build the html table for display in #activeChannelsTable div. */
        var html = "<table>\r\n" +
            "<thead>\r\n" +
            "<tr><th>#</th><th>Channel Name</th><th>Join Channel</th></tr>\r\n" +
            "</thead>\r\n" +
            "<tbody>\r\n";

        var limit = 50;
        if (channels.length < limit)
            limit = channels.length;

        for (var i = 0; i < limit; i++) {
            html += "<tr><td>" + (i+1) + "</td><td>" + channels[i] + "</td><td><div class=\"channelBtn robin-chat--vote\">Join Channel</div></td></tr>\r\n";
        }

        html += "</tbody>\r\n" +
            "</table>\r\n" +
            '<br/>';

        $("#activeChannelsTable").html(html);

        $(".channelBtn").on("click", function joinChannel() {
            /* // Originally for parrot, please modify to work with rlc
            var channel = $(this).parent().prev().contents().text();
            var channels = getChannelList();

            if (channel && $.inArray(channel, channels) < 0) {
                settings.channel += "," + channel;
                Settings.save(settings);
                buildDropdown();
                resetChannels();
            }
            */
        });
    }

    var channelsInterval = 0;
    function startChannels() {
        stopChannels();
        channelsInterval = setInterval(updateChannels, 10000);
        updateChannels();
    }

    function stopChannels() {
        if (channelsInterval){
            clearInterval(channelsInterval);
            channelsInterval = 0;
        }
    }

    /*     END OF ACTIVE CHANNEL DISCOVERY SECTION     */

    // remove channel key from message
    var remove_channel_key_from_message = function(message){
        if($("#rlc-chat").attr("data-channel-key")){
            var offset = $("#rlc-chat").attr("data-channel-key").length;
            if(offset === 0) return message;

            if(message.indexOf("/me") === 0){
                return "/me "+ message.slice(offset+5);
            }else{
                return message.slice(offset+1);
            }
        }
        return message;
    };

    // boot
    $(document).ready(function() {
        $("body").append('  \
            <div id="rlc-topmenu"> \
            <div id="rlc-settingsbar"> \
            <div id="versionnumber" title="Toggle Reddit Live Chat Readme">[?] v.' + GM_info.script.version + ' [?]</div> \
            <div id="rlc-togglesidebar" title="Toggle Sidebar" class="noselect">[Sidebar]</div> \
            <div id="rlc-toggleoptions" title="Toggle Options" class="noselect">[Options]</div> \
            </div> \
            <div id="rlc-settings"></div> \
            </div>  \
            <div id="rlc-main">   \
            <div id="rlc-chat"></div> \
            <div id="rlc-messagebox"> </div> \
            </div> \
            <div id="rlc-sidebar"> \
            </div> \
            <div id="rlc-readmebar"> \
            <div class="md"> \
                <strong style="font-size:1.2em">RLC Readme</strong><br> \
                <small>click version number restore sidebar</small> \
                <p> \
                <strong>Primary devs: <br> \
                <a target="_blank" href="/u/Stjerneklar" rel="nofollow">/u/Stjerneklar</a>&nbsp;(EU)  \
                <br> <a target="_blank" href="/u/FatherDerp" rel="nofollow">/u/FatherDerp</a>&nbsp;(NA) \
                </strong> \
                </p> \
                <p>Full credits available in Github commit log</p> \
                <hr> \
                <p>Check the sidebar for invite info, which is required to post</p> \
                <hr> \
                <h4><a target="_blank" href="https://github.com/BNolet/RLC/raw/master/rlcs.user.js" rel="nofollow">Update RLC to latest version</a></h4> \
                <hr> \
                <h3><a target="_blank" href="https://github.com/BNolet/RLC/" rel="nofollow">RLC Github: Project home, Issue tracking, Readme</a></h3> \
                <hr> \
                <h3><a target="_blank" href="https://www.reddit.com/r/fukbird/" rel="nofollow">RLC subreddit</a></h3> \
                <hr> \
                <p><strong>Feature highlights:</strong></p> \
                <ul> \
                    <li>Chat room layout &amp; message flow</li> \
                    <li>Send message with <strong>Enter</strong> key</li> \
                    <li>Press <strong>Up</strong> for message history</li> \
                    <li><strong>Right click</strong> names to copy to textbox</li> \
                    <li>Channels(including tabs, creation, deletion, single/multi views)</li> \
                    <li>Much more (mentions, markdown, /me, embeds turned to links)</li> \
                </ul> \
                <hr> \
                <p><strong>Known issues:</strong></p> \
                <ul> \
                    <li>Developed in Chrome, sometimes tested on firefox(please report problems with screenshots)</li> \
                    <li>Post history loading is experimental and not implemented in a very user friendly way, but does work.</li> \
                </ul> \
            </div> \
            </div> \
        '); 
        
        $('.liveupdate-listing').appendTo('#rlc-chat');
        $('#new-update-form').appendTo('#rlc-messagebox');
        $('#new-update-form').append('<div id="rlc-sendmessage">Send Message</div>');

        $(".usertext-edit textarea").attr("placeholder", "Type here to chat");
        $(".usertext-edit textarea").focus();

        $('#liveupdate-header').appendTo('#rlc-sidebar');
        $('.main-content aside.sidebar').appendTo('#rlc-sidebar');

        $("#rlc-main iframe").remove();
        $("#rlc-main a").attr("target","_blank");
        $("#rlc-sidebar a").attr("target","_blank");
        $("#rlc-readmebar a").attr("target","_blank");
        
        if($(".usertext-edit textarea").length) { }
        else { $("#rlc-main").append("<p style='width:100%;text-align:center;'>If you can see this you need an invite to send messages, check the sidebar.</p>"); }
        
        $("<div id='channelsTable'> \
            <div>Most Active Channels</div><br/> \
            <div id='activeChannelsTable'></div><br/> \
            </div>").appendTo("#rlc-sidebar"); // Active Channel Discovery Table

        tabbedChannels.init($('<div id="filter_tabs"></div>').insertAfter("#rlc-settingsbar"));

        $("#rlc-sidebar").append("<div id='rlc-activeusers'><strong>Recent User Activity</strong><br><ul></ul></div>");

        // rescan existing chat for messages
        $("#rlc-chat").find("li.liveupdate").each(function(idx,item){
            handle_new_message($(item), true);
        });

        _scroll_to_bottom();    //done adding content, scroll to bottom

        // Detect new content being added
        $(".liveupdate-listing").on('DOMNodeInserted', function(e) {
            if ($(e.target).is('li.liveupdate')) {
                // Apply changes to line
                handle_new_message($(e.target), false);
                _scroll_to_bottom();
            }
        });

        $(".usertext-edit.md-container textarea").attr("tabindex","0"); //fixes autocomplete
        var text_area = $(".usertext-edit.md-container textarea");

        //right click author names in chat to copy to messagebox
        $('body').on('contextmenu', ".liveupdate .author", function (event) {
            event.preventDefault();
            var username = String($(this).text()).trim();
            var source = String($(".usertext-edit.md-container textarea").val());
            // Focus textarea and set the value of textarea
            $(".usertext-edit.md-container textarea").focus().val("").val(source + " " + username + " ");
        });


        // On post message, add it to history
        $(".save-button .btn").click(function(){
            var user_last_message = text_area.val();

            // if message history is to long, clear it out
            if(messageHistory.length === 25){
                messageHistory.shift();
            }
            messageHistory.push(remove_channel_key_from_message(user_last_message));
            messageHistoryIndex = messageHistory.length;
        });

        $("#rlc-togglesidebar").click(function(){       $("body").toggleClass("rlc-hidesidebar");});

        $("#rlc-chatsidebartoggle").click(function(){   $("body").toggleClass("rlc-hidesidebar");});

        $("#rlc-toggleoptions").click(function(){       $("body").toggleClass("rlc-showoptions");});

        $("#versionnumber").click(function(){           $("body").toggleClass("rlc-showreadmebar");});

        $("#rlc-sendmessage").click(function(){         (".save-button .btn").click();});
        
        $('.usertext-edit textarea').autocomplete({
            source: updateArray,
            autoFocus: true,
            delay: 0,
            minLength: 2
        });
        
        processActiveUsersList();
        
        // up for last message send, down for prev (if moving between em)
        text_area.on('keydown', function(e) {
            if (e.keyCode == 9) {e.preventDefault();}
            if (e.keyCode == 13) {
                if (e.shiftKey) {  }
                else if (text_area.val() === "" ) { e.preventDefault();  }
                else {
                    if(text_area.val().indexOf("/edit") === 0 ){   //navigate via slash command to the edit page
                        $(this).val(''); //prevents message from being sent, e.preventDefault does not seem to in case of redirects
                        window.location.href = "edit";  
                    }
                    // prevent default embed behavior when links are posted 
                    if(text_area.val().indexOf("http") === 0 || text_area.val().indexOf("www") === 0 ){
                        $(this).val($(".usertext-edit textarea").val() + ' ');
                    }
                    if(text_area.val().indexOf("/version") === 0){ 
                        $(this).val("RLC v."+GM_info.script.version+" has been released. Use the link in the sidebar to update.");
                    }
                    e.preventDefault();
                    $(".save-button .btn").click();
                }
            }
            else if(e.keyCode == 38) {
                e.preventDefault();
                messageHistoryIndex--;
                if(messageHistoryIndex > -1){
                    $(this).val(messageHistory[messageHistoryIndex]);
                }
            }
            else if(e.keyCode == 40){
                e.preventDefault();
                if(messageHistoryIndex <= messageHistory.length){
                    messageHistoryIndex++;
                    $(this).val(messageHistory[messageHistoryIndex]);
                }else{
                    $(this).val('');
                }
            }
        });

        // Options 
        createOption("Active Channel Discovery [BETA]", function(checked, ele){
            if(checked){
                startChannels();
                $("#channelsTable").show();
                //console.log("Starting Channel Discovery Display Update");
            }else{
                stopChannels();
                $("#channelsTable").hide();
                //console.log("Stopping Channel Discovery Display Update");
            }
            _scroll_to_bottom();
        },false);

        createOption("History Mode[Experimental]", function(checked, ele){
            if(checked){
                $("body").addClass("allowHistoryScroll");
            }else{
                $("body").removeClass("allowHistoryScroll");
            }
        },false);
        createOption("Channel colors", function(checked, ele){
            if(checked){
                $("#rlc-main").addClass("show-colors");
            }else{
                $("#rlc-main").removeClass("show-colors");
            }
            // correct scroll after spam filter change
            _scroll_to_bottom();
        },false);

        createOption("Dark Mode", function(checked, ele){
            if(checked){
                $("body").addClass("dark-background");
            }else{
                $("body").removeClass("dark-background");
            }
        },false);

        createOption("Simple Timestamps", function(checked, ele){
            if(checked){
                $("body").addClass("simpleTimestamps");
            }else{
                $("body").removeClass("simpleTimestamps");
            }
            _scroll_to_bottom();
        },false);

        createOption("Compact Mode", function(checked, ele){
            if(checked){
                $("body").addClass("rlc-compact");
            }else{
                $("body").removeClass("rlc-compact");
            }
            _scroll_to_bottom();
        },false);
        

        createOption("Notification Sound", function(checked, ele){
            if(checked){
                $("body").addClass("rlc-notificationsound");
            }else{
                $("body").removeClass("rlc-notificationsound");
            }
            _scroll_to_bottom();
        },false);

        createOption("Chrome Notifications", function(checked, ele){
            if(checked && Notification && !Notification.permission !== "granted"){
                Notification.requestPermission();
                if(checked){
                    $("body").addClass("rlc-notificationchrome");
                }else{
                    $("body").removeClass("rlc-notificationchrome");
                }
	        }
        },false);

        createOption("Custom Scroll Bars", function(checked, ele){
            if(checked){
                $("body").addClass("rlc-customscrollbars");
            }else{
                $("body").removeClass("rlc-customscrollbars");
            }
            _scroll_to_bottom();
        },false);
        
        createOption("No Smileys", function(checked, ele){
            if(checked){
                $("body").addClass("rlc-noemotes");
            }else{
                $("body").removeClass("rlc-noemotes");
            }
            _scroll_to_bottom();
        },false);
        
        
        
        
    });

    var color;
    for(var c=0;c<35;c++){
        color = colors[(c % (colors.length))];

        GM_addStyle("#rlc-main.show-colors #rlc-chat li.liveupdate.rlc-filter-"+c+" { background: "+color+";}", 0);
        GM_addStyle("#rlc-chat.rlc-filter.rlc-filter-"+c+" li.liveupdate.rlc-filter-"+c+" { display:block;}", 0);
    }
})();

GM_addStyle("/*-------------------------------- Custom Containers ------------------------------------- */ \
body { \
    min-width: 0; \
} \
 \
#rlc-main { \
    width: 80%; \
    height: 100%; \
    box-sizing: border-box; \
    float: left; \
    position: relative; \
} \
 \
#rlc-sidebar, #rlc-readmebar { \
    width: 20%; \
    float: right; \
    height: calc(100vh - 87px); \
    box-sizing: border-box; \
    overflow-y: auto; \
    overflow-x: hidden; \
} \
 \
#rlc-topmenu { \
    width: 100%; \
    box-sizing: border-box; \
    border-bottom: 1px solid grey; \
    position: relative; \
} \
 \
/*  /*------------------------------------ Main Chat -----------------------------------------------------*/ \
#rlc-chat.rlc-filter li.liveupdate { \
    display: none; \
} \
 \
/*chat window*/ \
#rlc-main iframe { \
    display: none!important; \
} \
 \
#rlc-main .liveupdate-listing { \
    max-width: 100%; \
    padding: 0px; \
    box-sizing: border-box; \
    display: flex; \
    flex-direction: column-reverse; \
    min-height: 100%; \
} \
 \
div#rlc-chat { \
    overflow-y: auto; \
    height: calc(100vh - 131px); \
} \
 \
#rlc-main .liveupdate-listing .liveupdate .body a { \
    font-size: 12px; \
    padding-top: 1px; \
} \
 \
#rlc-main .liveupdate-listing .liveupdate .body { \
    max-width: none; \
    margin-bottom: 0; \
    padding: 0px; \
    font-size: 12px; \
    overflow: visible; \
    display: block; \
    box-sizing: border-box; \
} \
 \
#rlc-main .liveupdate-listing .liveupdate { \
    height: auto!important; \
    overflow: visible!important; \
    padding: 4px; \
} \
 \
#rlc-main .liveupdate-listing a.author { \
    width: 180px; \
    display: block; \
    float: left; \
    text-align: right; \
} \
 \
#rlc-main .liveupdate-listing .liveupdate .body div.md { \
    float: right; \
    width: calc(100% - 320px); \
    max-width: none; \
    min-height: 24px; \
} \
 \
#rlc-main #rlc-chat li.liveupdate.user-mention .body .md { \
    font-weight: bold; \
} \
 \
/* narration */ \
#rlc-main #rlc-chat li.liveupdate.user-narration > a { \
    display: none; \
} \
 \
#rlc-main #rlc-chat li.liveupdate.user-narration .body a { \
    display: none; \
} \
 \
#rlc-main #rlc-chat li.liveupdate.user-narration .body .md { \
    font-style: italic; \
} \
 \
#rlc-main .liveupdate-listing .liveupdate:nth-child(odd) { \
    background: rgba(128,128,128,0.2); \
} \
 \
/* channel name */ \
.channelname { \
    color: grey!important; \
    width: 290px; \
    display: block; \
    float: left; \
    text-align: right; \
} \
 \
.simpleTimestamps .channelname { \
    width: 260px; \
} \
 \
.rlc-filter .channelname { \
    display: none; \
} \
 \
/* message input and send button */ \
div#rlc-messagebox { \
    position: relative; \
} \
 \
#new-update-form .usertext { \
    max-width: 85%; \
    float: left; \
    width: 85%; \
} \
 \
.usertext-edit .md { \
    min-width: 100%!important; \
} \
 \
div#new-update-form textarea { \
    height: 45px; \
    overflow: auto; \
    resize: none; \
} \
 \
div#new-update-form { \
    width: 100%; \
    margin: 0; \
} \
 \
.usertext-edit.md-container { \
    max-width: 100%; \
    margin: 0; \
} \
 \
.usertext-edit.md-container { \
    position: relative; \
} \
 \
#new-update-form .bottom-area { \
    position: absolute; \
    top: 4px; \
    right: 15px; \
    left: 15px; \
    text-align: center; \
    letter-spacing: 1px; \
} \
 \
#new-update-form .save-button .btn { \
    width: 100%; \
    text-transform: capitalize; \
} \
 \
div#rlc-sendmessage { \
    width: 15%; \
    height: 45px; \
    text-align: center; \
    float: right; \
    display: inline-block; \
    padding-top: 15px; \
    box-sizing: border-box; \
    margin-top: 0px; \
    font-size: 1.3em; \
    cursor: pointer; \
    border: 1px solid #A9A9A9; \
    ; border-left: 0; \
} \
 \
.res-nightmode div#rlc-sendmessage { \
    border: 1px solid #4C4C4C; \
} \
 \
.res-nightmode .channelname, .res-nightmode #rlc-main .liveupdate-listing a.author { \
    color: #ccc; \
} \
 \
.save-button { \
    display: none; \
} \
 \
/*filter tabs*/ \
#filter_tabs { \
    width: 80%; \
    display: table; \
    table-layout: fixed; \
} \
 \
#filter_tabs > span { \
    width: 90%; \
    display: table-cell; \
} \
 \
#filter_tabs > span.all, #filter_tabs > span.more { \
    width: 60px; \
    text-align: center; \
    vertical-align: middle; \
    cursor: pointer; \
} \
 \
#filter_tabs .rlc-filters { \
    display: table; \
    width: 100%; \
    table-layout: fixed; \
} \
 \
#filter_tabs .rlc-filters > span { \
    padding: 5px 2px; \
    text-align: center; \
    display: table-cell; \
    cursor: pointer; \
    width: 2%; \
    vertical-align: middle; \
    font-size: 1.1em; \
} \
 \
#filter_tabs .rlc-filters > span > span { \
    pointer-events: none; \
} \
 \
#filter_tabs > span.all { \
    padding: 0px 30px; \
} \
 \
#filter_tabs > span.more { \
    padding: 0px 30px 0px 30px; \
} \
 \
/* add channels interface */ \
.rlc-channel-add input { \
    padding: 2.5px; \
} \
 \
.rlc-channel-add .channel-mode { \
    float: right; \
    font-size: 1.2em; \
    padding: 5px; \
} \
 \
.rlc-channel-add .channel-mode span { \
    cursor: pointer \
} \
 \
.rlc-channel-add { \
    padding: 5px; \
    display: none; \
    position: absolute; \
    top: 24px; \
    background: #FCFCFC; \
    left: 0px; \
    right: 20%; \
    z-index: 1000; \
} \
 \
#rlc-main time.live-timestamp { \
    text-indent: 0; \
    width: 100px; \
    margin: 0; \
    padding-top: 2px; \
    padding-bottom: 0; \
    color: inherit; \
    padding-left: 10px; \
} \
 \
.liveupdate-listing li.liveupdate a.author { \
    color: initial; \
} \
 \
/*------------------------------------ Sidebar -----------------------------------------------------*/ \
aside.sidebar.side.md-container { \
    width: 100%; \
    opacity: 1; \
    margin: 0; \
    padding: 0px 10px; \
    box-sizing: border-box; \
} \
 \
#liveupdate-header { \
    width: 100%; \
    margin: 0!important; \
    padding: 0!important; \
    text-align: center; \
    max-width: none; \
    overflow: hidden; \
} \
 \
#discussions { \
    display: none; \
} \
 \
.reddiquette { \
    display: none!important; \
} \
 \
#contributors { \
    display: none!important; \
} \
 \
#liveupdate-resources > h2 { \
    display: none; \
} \
 \
/*togglesidebar*/ \
.rlc-hidesidebar #rlc-sidebar { \
    display: none!important; \
} \
 \
/*hide sidebar toggle class*/ \
.rlc-hidesidebar #rlc-main { \
    width: 100%!important; \
} \
 \
#rlc-togglesidebar { \
    display: table-cell; \
    cursor: pointer; \
} \
 \
div#versionnumber { \
    display: table-cell; \
    cursor: help; \
} \
 \
/*settings*/ \
#rlc-settings { \
    right: 0; \
    height: auto; \
    z-index: 100; \
    /* padding: 6px; */ \
    width: 100%; \
    box-sizing: border-box; \
} \
 \
.res-nightmode #rlc-settings { \
} \
 \
#rlc-settings label { \
    padding: 6px; \
    box-sizing: border-box; \
    cursor: pointer; \
    display: table-cell; \
    text-align: center; \
    border-right: 1px solid grey; \
} \
 \
#rlc-settings label:last-of-type { \
    border-right: 0px; \
} \
 \
#rlc-settings label input { \
    vertical-align: sub; \
    margin-right: 1px; \
} \
 \
body:not(.res) div#header-bottom-right { \
    bottom: initial; \
    top: 21px; \
    border-radius: 7px; \
    right: 1px; \
} \
 \
.rlc-showoptions #rlc-settings { \
    display: table; \
    table-layout: fixed; \
    border: 1px solid grey; \
    position: absolute; \
    background: #FFFFFF; \
} \
 \
#rlc-settings { \
    display: none; \
} \
 \
#rlc-settingsbar { \
    width: 20%; \
    height: 24px; \
    box-sizing: border-box; \
    float: right; \
    display: table; \
    table-layout: fixed; \
} \
 \
div#rlc-toggleoptions { \
    display: table-cell; \
    cursor: pointer; \
} \
 \
#hsts_pixel, .debuginfo { \
    display: none; \
} \
 \
div#rlc-settingsbar div { \
    padding-top: 6px; \
    text-align: center; \
} \
 \
.mrPumpkin { \
    height: 24px; \
    width: 24px; \
    display: inline-block; \
    background-size: 72px; \
    margin-bottom: -6px!important; \
    margin-top: -4px!important; \
} \
 \
.mp_smile { //default  } \
 \
.mp_frown { \
    background-position-x: -24px; \
} \
.mp_silly { \
    background-position-x: -48px; \
} \
.mp_angry {  \
    background-position-x: -48px; \
    background-position-y: -24px; \
} \
.mp_shocked { \
    background-position-x: -24px; \
    background-position-y: -24px; \
} \
.mp_meh { \
    background-position-y: -24px; \
} \
.dark-background .liveupdate-listing li.liveupdate .body div.md p { \
    vertical-align: -webkit-baseline-middle; \
} \
");

GM_addStyle("/* ------------------------------------ meta -----------------------------------------------------*/ \
/* class to prevent selection for divs acting as buttons */ \
.noselect { \
    -webkit-touch-callout: none; \
    /* iOS Safari */ \
    -webkit-user-select: none; \
    /* Chrome/Safari/Opera */ \
    -khtml-user-select: none; \
    /* Konqueror */ \
    -moz-user-select: none; \
    /* Firefox */ \
    -ms-user-select: none; \
    /* IE/Edge */ \
} \
 \
/* dark background */ \
.dark-background { \
    background: #404040; \
    color: white; \
} \
 \
.dark-background textarea, .dark-background #rlc-main .liveupdate-listing a.author { \
    background: transparent; \
    color: white; \
} \
 \
.dark-background .side { \
    background: transparent; \
} \
 \
/* misc fixes */ \
/*prevent body scroll to avoid loading history*/ \
body { \
    overflow: hidden; \
} \
 \
.simpleTimestamps #rlc-main .liveupdate-listing .liveupdate time { \
    display: none; \
} \
 \
.simpleTimestamps #rlc-main .liveupdate-listing .liveupdate .simpletime { \
    display: block; \
    float: left; \
    width: 70px; \
    padding-left: 10px; \
    padding-top: 2px; \
} \
 \
#rlc-main .liveupdate-listing .liveupdate .simpletime { \
    display: none; \
} \
 \
/* option classes */ \
.allowHistoryScroll { \
    height: 102%; \
    overflow-y: scroll; \
} \
 \
/* hard removal */ \
.rlc-compact div#header, .help-toggle, #rlc-main .liveupdate-listing li.liveupdate time:before, #rlc-main .liveupdate-listing li.liveupdate ul.buttonrow, #rlc-main .liveupdate-listing .separator, #liveupdate-options, .footer-parent, body > .content { \
    display: none!important; \
} \
 \
.rlc-compact div#rlc-main { \
    top: 0; \
} \
 \
.rlc-compact div#rlc-sidebar,.rlc-compact #rlc-readmebar { \
    top: 0px; \
    height: calc(100vh - 24px); \
    padding-top: 0; \
} \
 \
.rlc-compact div#new-update-form textarea { \
    height: 26px; \
} \
 \
.rlc-compact div#rlc-sendmessage { \
    height: 26px; \
    padding-top: 4px; \
} \
 \
.rlc-compact div#rlc-chat { \
    height: calc(100vh - 49px); \
} \
 \
.dark-background aside.sidebar .md, .dark-background #liveupdate-description .md, .dark-background .md blockquote p { \
    color: white!important; \
} \
 \
.dark-background div#header-bottom-left { \
    background: grey; \
} \
 \
.dark-background .liveupdate-listing li.liveupdate .body div.md { \
    color: white; \
} \
 \
/* Let's get this party started */ \
.rlc-customscrollbars ::-webkit-scrollbar { \
    width: 10px; \
} \
 \
/* Track */ \
.rlc-customscrollbars ::-webkit-scrollbar-track { \
    background-color: #262626; \
} \
 \
/* Handle */ \
.rlc-customscrollbars ::-webkit-scrollbar-thumb { \
    background-color: #4C4C4C; \
    border: 1px solid #262626; \
} \
 \
.dark-background div#rlc-settings { \
    background: #404040; \
} \
 \
.dark-background .rlc-channel-add { \
    background: grey; \
} \
 \
.dark-background .rlc-channel-add input { \
    background: #404040; \
    border: 0; \
    padding: 3px 4px 4px 4px; \
    color: white; \
} \
 \
#liveupdate-statusbar.live .state:before { \
    border-radius: 2px; \
    height: 36px; \
    width: 36px; \
    margin-top: -8px; \
    margin-bottom: -11px; \
    margin-right: 10px; \
    transform: scale(0.77); \
} \
#liveupdate-statusbar.reconnecting .state:before { \
    border-radius: 2px; \
    height: 36px; \
    width: 36px; \
    margin-top: -8px; \
    margin-bottom: -11px; \
    margin-right: 10px; \
    transform: scale(0.77); \
} \
 \
.rlc-showreadmebar #rlc-sidebar { \
    display: none; \
} \
 \
.rlc-showreadmebar #rlc-readmebar { \
    display: block; \
} \
 \
.rlc-showreadmebar #rlc-readmebar { \
    display: block; \
    padding: 10px; \
    box-sizing: border-box; \
    font-size: 1.18em; \
} \
 \
.dark-background.rlc-showreadmebar #rlc-readmebar .md { \
    color: white; \
} \
 \
#rlc-activeusers { \
    display: inline-block; \
    width: 100%; \
    padding: 10px; \
    font-size: 1.2em; \
} \
 \
#rlc-activeusers li { \
    width: 100%; \
    font-size: 1.2em; \
} \
 \
.dark-background pre { \
    background: transparent; \
} \
 \
#rlc-readmebar, .ui-helper-hidden-accessible { \
    display: none; \
} \
 \
ul.ui-autocomplete { \
    position: fixed!important; \
    bottom: 30px; \
    border-radius: 0px; \
    left: 0px!important; \
    background: grey; \
    width: 300px!important; \
    opacity: 0.8; \
    z-index: 1000; \
    top: initial!important; \
    font-size: 1.2em; \
} \
 \
ul.ui-autocomplete a { \
    color: black!important; \
} \
 \
.dark-background ul.ui-autocomplete a { \
    color: white!important; \
} \
 \
#liveupdate-statusbar.reconnecting .state:before, #liveupdate-statusbar.live .state:before, .mrPumpkin { \
    background-image: url('data:image/gif;base64,R0lGODlhbABIAPEAAAAAAP/JDgAAAAAAACH5BAEAAAIALAAAAABsAEgAAAL+lAWpy+0HkZtUxVPziyn4D4bimEDdiKZfiQHqSwIYTJOGW+eejOg6j/PRgMIasQiTBZGvE7O5fKKc0mm0GqJis9ftruvVer8ixU+MFqvM3LI6xQZRHcmGfEmHMu73vX7Bt2L3FxcwN7iGaIinaOVH9pXniOhEkShZOXFJGWQJpwm5KBmD2Qk6+Zg56lYquMrVGtkIy9kHSHhoW4ia63q7WXj4+Dks/Et8bLxLmny1fOnGeuZMDeYYPdaWHbgd2v22BY4lXkUuZf6EzqSOxF7kLgTvI3/WLWjvvU2fs29kPf6vXMBzA9OBKbjCCjBPCpGBO3jwR0MSRj7BKTNlYhb+iTEy8tMopyNGkRSHWCxZkeRGlAlB0qqQyGNKbCOZies3BGE7ne94xvM5D2g9fDjr4DPU49sNe0f0LVWa1GnUbDwkjGFxQ+gnE1qtXNAA1sIFCWE1jCVbtsLZtGbHss2w9i2Fr11jcL1a1WqYqnXXPJXaF85fqoOvFg4zVV/gmEQXn2T672Zkxy7xJpH52NU0mpr5pZHWMmRnbqKO8WKky9woZZVElw7GaNhp0q9YNUs9cLWp2r5S7Z6FO1Nv0y9/qQI+PM5x2cWV/2Ye3FRyybFeE49+Txb06dKT1ykW+3pz2shxk99uPrt21YpY525fbbO2PvJJR6qv/htllYqBjxaF4t9+nPXXWIAGFoggZAcqmKB+CzrYIIEMTghhTuxQlwFjFC7kz0UmVWYIRwOeVtAbPEFEIkz8kZgTZpetuIOI8y2Ejoky2kdVibzNKGGFuHQYYY6eXShgFokhdmQ4hymZ5DhLOtlkOS3gdddeVYaTV1ZybUDXlg3E5SUDEBQAADs=');#liveupdate-statusbar.live .state: before \
    background-size: contain; \
} \
");
