// ==UserScript==
// @name         FukBird
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Chat-like functionality for Reddit Live
// @author       FatherDerp, Stjerneklar, thybag
// @include      https://www.reddit.com/live/*
// @exclude      https://www.reddit.com/live/
// @exclude      https://www.reddit.com/live
// @exclude      https://www.reddit.com/live/*/edit*
// @exclude      https://www.reddit.com/live/*/contributors*
// @exclude      https://*.reddit.com/live/create*
// @require      http://code.jquery.com/jquery-latest.js
// @grant   GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==
(function() {
    // Grab users username + play nice with RES
    var robin_user = $("#header-bottom-right .user a").first().text().toLowerCase();
    // Channel Colours
    var colors = [
        'rgba(255,0,0,0.1)',
        'rgba(0,255,0,0.1)',
        'rgba(0,0,255,0.1)',
        'rgba(0,255,255,0.1)',
        'rgba(255,0,255,0.1)',
        'rgba(255,255,0,0.1)',
        'rgba(211,211,211, .1)',
        'rgba(0,100,0, .1)',
        'rgba(255,20,147, .1)',
        'rgba(184,134,11, .1)',
    ];

    // msg history
    var messageHistory = [];
    var messageHistoryIndex = -1;

     /**
     * Quickly hacked to play nice with RLCS
     *
     * Pull tabber out in to semi-stand alone module
     * Big thanks to netnerd01 for his pre-work on this
     *
     * Basic usage - tabbedChannels.init( dom_node_to_add_tabs_to );
     * and hook up tabbedChannels.proccessLine(lower_case_text, jquery_of_line_container); to each line detected by the system
     */
    var tabbedChannels = new function(){
        var _self = this;

        // Default options
        this.channels = [":chat",":trivia",":pol",":rpg"];
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
            if(this.currentRooms == 0){
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
        }

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
            var channels = this.channels.filter(function (item) { return item != undefined });
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
        }

        // Procces each chat line to create text
        this.proccessLine = function(text, $element, rescan){
            var i, idx, channel;

            // If rescanning, clear any existing "channel" classes
            if(typeof rescan !== 'undefined' && rescan === true){
                $element.removeClass("in-channel");

                for(i=0; i <= this.channels.length; i++){
                    $element.removeClass("rlc-filter-" + i);
                }
            }

            // Scann for channel identifiers
            for(i=0; i< this.channelMatchingCache.length; i++){ // sorted so longer get picked out before shorter ones (sub channel matching)
                idx = this.channelMatchingCache[i];
                channel = this.channels[idx];

                if(typeof channel === 'undefined') continue;

                if(text.indexOf(channel) === 0){
                    $element.addClass("rlc-filter-" + idx +" in-channel");
                    this.unread_counts[idx]++;
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
            this.$el.html("<span class='all selected'>Everything</span><span><div class='rlc-filters'></div></span><span class='more'>[Options]</span>");
            this.$opt = $("<div class='rlc-channel-add' style='display:none'><input name='add-channel'><button>Add channel</button> <span class='channel-mode'>Channel Mode: <span title='View one channel at a time' data-type='single'>Single</span> | <span title='View many channels at once' data-type='multi'>Multi</span></span></div>").insertAfter(this.$el);

            // Attach events
            this.$el.find(".rlc-filters").click(this.toggle_channel);
            this.$el.find("span.all").click(this.disable_all_channels);
            this.$el.find("span.more").click(function(){ $(".rlc-channel-add").slideToggle(); });
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
                if(new_chan != '') _self.addChannel(new_chan);
                _self.$opt.find("input[name='add-channel']").val('');
            });
            

            $(".save-button .btn").click(this.submit_helper);
            
            // store default room class
            this.defaultRoomClasses = $("#rlc-chat").attr("class") ? $("#rlc-chat").attr("class") : '';

            // redraw tabs
            this.drawTabs();

            // start ticker
            setInterval(this.tick, 1000);
        }
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
        click_action(state, $option)
    };


    // Scroll chat back to bottom
    var _scroll_to_bottom = function(){
        $(".liveupdate-listing").scrollTop($(".liveupdate-listing")[0].scrollHeight);
    };

    var handle_new_message = function($ele){
        // add any proccessing for new messages in here
        var $msg = $ele.find(".body .md");
        var $usr = $ele.find(".body .author");
        var line = $msg.text().toLowerCase();

        // Spam fuilter

        // Highlight mentions
        if(line.indexOf(robin_user) !== -1){
            $ele.addClass("user-mention");
        }

        // /me support
        if(line.indexOf("/me") === 0){
            $ele.addClass("user-narration");
            var first_line = $msg.find("p").first();
            console.log(first_line);
            first_line.html(first_line.html().replace("/me", " " + $usr.text().replace("/u/", "")));
        }

        // Track channels
        tabbedChannels.proccessLine(line, $ele);
    }

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
    }

    // boot
    $(document).ready(function() {
        $("body").append('<div id="rlc-main"><div id="rlc-chat"></div><div id="rlc-messagebox"></div></div><div id="rlc-sidebar"></div>');
        $('.liveupdate-listing').appendTo('#rlc-chat');
        $('#new-update-form').appendTo('#rlc-messagebox');
        $('#liveupdate-header').prependTo('#rlc-sidebar');
        $('#liveupdate-options').prependTo('#rlc-sidebar');
        $('.main-content aside.sidebar').appendTo('#rlc-sidebar');
        $("#rlc-main iframe").remove();

        //right click author names in chat to copy to messagebox
        $('body').on('contextmenu', ".liveupdate .author", function (event) {
            event.preventDefault();
            var username = String($(this).text()).trim();
            var source = String($(".usertext-edit.md-container textarea").val());
            // Focus textarea and set the value of textarea
            $(".usertext-edit.md-container textarea").focus().val("").val(source + " " + username + " ");
        });

        // make settings container
        $("<div id='rlc-settings'><strong>Options</strong></div>").insertAfter($("#liveupdate-statusbar"));
        
        // rescan existing chat for messages
        $("#rlc-chat").find("li.liveupdate").each(function(idx,item){
            handle_new_message($(item));
        });


        // Detect new content being added
        $(".liveupdate-listing").on('DOMNodeInserted', function(e) {
            if ($(e.target).is('li.liveupdate')) {
                // Apply changes to line
                handle_new_message($(e.target));
            }
        });

        tabbedChannels.init($('<div id="filter_tabs"></div>').insertBefore(".liveupdate-listing"));

        // Colours on or off

        createOption("Use channel colors", function(checked, ele){
            if(checked){
                $("#rlc-main").addClass("show-colors");
            }else{
                $("#rlc-main").removeClass("show-colors");
            }
            // correct scroll after spam filter change
            _scroll_to_bottom();
        },false);

         createOption("Use dark background", function(checked, ele){
                if(checked){
                    $("body").addClass("dark-background");
                }else{
                    $("body").removeClass("dark-background");
                }
            },false);


        var text_area = $(".usertext-edit.md-container textarea");


        // On post message, add it to historu
        $(".save-button .btn").click(function(){
            var user_last_message = text_area.val();

            // if message history is to long, clear it out
            if(messageHistory.length === 25){
                messageHistory.shift();
            } 
            messageHistory.push(remove_channel_key_from_message(user_last_message));
            messageHistoryIndex = messageHistory.length;
        });

        // up for last message send, down for prev (if moving between em)
        text_area.on('keydown', function(e) {
            if (e.keyCode == 13) {
                if (e.shiftKey) {  }
                else {
                e.preventDefault();
                  $(this).val($(".usertext-edit textarea").val() + ' ');
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

    });

    // Styles for filter tabs
    GM_addStyle("body {overflow:hidden;}",0);
    GM_addStyle("#filter_tabs {width:100%; display: table; table-layout: fixed; background:black;color:white; border-bottom:1px solid #efefed;}",0);
    GM_addStyle("#filter_tabs > span {width:90%; display: table-cell;}",0);
    GM_addStyle("#filter_tabs > span.all, #filter_tabs > span.more {width:60px; text-align:center; vertical-align:middle; cursor:pointer;background:black;color:white;}",0);
    GM_addStyle("#filter_tabs > span.all.selected, #filter_tabs > span.all.selected:hover {background:#40403f;color:white;}", 0);
    GM_addStyle("#filter_tabs .rlc-filters { display: table; width:100%;table-layout: fixed; '}", 0);
    GM_addStyle("#filter_tabs .rlc-filters > span { padding: 5px 2px;text-align: center; display: table-cell; cursor: pointer;width:2%; vertical-align: middle; font-size: 1.1em;}", 0);
    GM_addStyle("#filter_tabs .rlc-filters > span.selected, #filter_tabs .rlc-filters > span:hover { background: grey;}", 0);
    GM_addStyle("#filter_tabs .rlc-filters > span > span {pointer-events: none;}", 0);
    // nightmode
    GM_addStyle(".res-nightmode #filter_tabs {background: rgb(51, 51, 51);}", 0);
    GM_addStyle(".res-nightmode #filter_tabs  .rlc-filters > span.selected,.res-nightmode #filter_tabs .rlc-filters > span:hover,.res-nightmode #filter_tabs > span.all.selected,.res-nightmode #filter_tabs > span.all:hover {background: rgb(34, 34, 34)}", 0);

    GM_addStyle("#rlc-settings {padding: 20px 10px; text-align: left;}", 0);
    GM_addStyle("#rlc-settings strong {display:block;font-weight:bold;padding-bottom:5px;font-size: 1.2em;}", 0);
    GM_addStyle("#rlc-settings label {display: block; padding-bottom:5px}", 0);
    GM_addStyle("#rlc-settings label input {margin-right:5px; vertical-align: middle;}", 0);
    GM_addStyle(".rlc-channel-add  {padding:5px; display:none;}", 0);
    GM_addStyle(".rlc-channel-add input {padding: 2.5px; }", 0);
    GM_addStyle(".rlc-channel-add .channel-mode {float:right; font-size:1.2em;padding:5px;}", 0);
    GM_addStyle(".rlc-channel-add .channel-mode span {cursor:pointer}", 0);
    GM_addStyle(".rlc-channel-add  {padding:5px; display:none;}", 0);

    // /me styles
    GM_addStyle("#rlc-main #rlc-chat li.liveupdate.user-narration > a { display:none; }", 0);
    GM_addStyle("#rlc-main #rlc-chat li.liveupdate.user-narration .body .md { font-style: italic; }", 0);
    GM_addStyle("#rlc-main #rlc-chat li.liveupdate.user-narration .body a { display:none; }", 0);

    // filter for channel
    GM_addStyle("#rlc-chat.rlc-filter li.liveupdate { display:none; }", 0);
    var color;
    for(var c=0;c<35;c++){
        color = colors[(c % (colors.length))];

        GM_addStyle("#rlc-main.show-colors #rlc-chat li.liveupdate.rlc-filter-"+c+" { background: "+color+";}", 0);
        GM_addStyle("#rlc-chat.rlc-filter.rlc-filter-"+c+" li.liveupdate.rlc-filter-"+c+" { display:block;}", 0);
    }
    // mention highlight
    GM_addStyle("#rlc-main #rlc-chat li.liveupdate.user-mention { display:block; }", 0);
    GM_addStyle("#rlc-main #rlc-chat li.liveupdate.user-mention .body .md { font-weight:bold; }", 0);

})();
/*add css styles, every line must end with \  */
      GM_addStyle(" \
/* Custom elements */\
#rlc-main { \
    width: 80%; \
    height: 100%; \
    position: fixed; \
    top: 70px;\
    left: 0px;\
    padding-left: 3px;\
    box-sizing: border-box;\
    padding-right: 3px;\
} \
#rlc-sidebar { \
    width: 20%; \
    height: 100%; \
    position: fixed; \
    top: 63px; \
    right:0; \
    padding: 0px 10px;\
    box-sizing: border-box;\
    overflow-y: auto;;\
} \
/*general modifications*/\
#liveupdate-options {\
    position: absolute;\
    top:116px;\
    left: 5px;\
} \
.res-nightmode #liveupdate-options {color:white;}\
/* hard removal */\
#discussions, \
#contributors, \
.footer-parent,\
#liveupdate-options, \
#rlc-main .liveupdate-listing .separator,\
#rlc-main .liveupdate-listing li.liveupdate ul.buttonrow,\
#rlc-main .liveupdate-listing li.liveupdate time:before,\
.help-toggle, \
.reddiquette,\
body > .content { display: none!important; }\
/*chat window*/\
#rlc-main .liveupdate-listing { \
    max-width: 100%; \
    overflow-y: auto;;  \
    height: calc(100vh - 170px); \
    padding:5px;\
    box-sizing:border-box;\
    display: flex; \
    flex-direction: column-reverse; \
} \
#rlc-main .liveupdate-listing .liveupdate .body {\
    max-width: none!important;\
    margin-bottom: 0!important;\
    padding:2px!important;\
}  \
#rlc-main .liveupdate-listing .liveupdate {  \
    border-top:1px solid grey;\
    padding-top:2px; \
    height: auto!important; \
    overflow:visible!important;\
} \
#rlc-main .liveupdate-listing a.author {\
    display: block;\
    width: 12%;\
    float: left;\
    margin: 0;\
    text-align: right;\
    color:#0079d3;\
    } \
#rlc-main .liveupdate-listing .liveupdate time {\
    padding: 0;\
    width: 12%;\
    float:left;\
    margin: 0;\
    text-align: right;\
} \
#rlc-main .liveupdate-listing .liveupdate .body div.md {\
    width: 86%;\
    display: block;\
    float: right;\
    margin-bottom:0;\
    max-width: none;\
} \
/*message input and send button*/\
#new-update-form .usertext {\
    max-width: 100%;\
    float: left;\
    width: 100%;\
} \
.usertext-edit .md {min-width: 100%!important;} \
div#new-update-form textarea { \
    height:45px;\
    overflow:auto;  \
    resize: none; \
} \
div#new-update-form { \
    width: 100%; \
    margin: 0; \
} \
.usertext-edit.md-container { \
    max-width: 100%; \
    margin: 0; \
} \
.usertext-edit.md-container {  position: relative;}  \
#new-update-form .bottom-area { \
    position: absolute; \
    top: 4px; \
    right: 15px; \
    left: 15px; \
    text-align: center; \
    letter-spacing: 1px; \
} \
#new-update-form .save-button .btn { \
    width: 100%; \
    text-transform: capitalize; \
} \
.usertext-edit.md-container { \
    margin-top: 3px; \
} \
.usertext-edit.md-container textarea { \
    padding:2px; \
} \
/*sidebar*/\
aside.sidebar.side.md-container { \
    max-width:100%;\
    width:98%;\
    opacity:1; \
} \
#liveupdate-header {\
    width: 100%;\
    margin:0!important;\
    padding:0!important;\
    text-align:center;\
    max-width: none;\
} \
#rlc-main iframe { display:none!important;}\
.dark-background aside.sidebar #discussions li {background:#404040;} \
.dark-background .md a {color:#5ED7FF!important;} \
.dark-background .sidebar a {color:#5ED7FF!important;} \
.dark-background.loggedin.liveupdate-app {background:#404040;color:white;} \
.dark-background div.content{background:#404040;color:white;} \
.dark-background div.md{color:white;} \
.dark-background aside.sidebar {background:#404040!important;} \
.dark-background blockquote, .dark-background h2{color:white!important} \
.dark-background code {color:black;} \
@media only screen and (max-width: 1300px)  { \
    #rlc-main {width:75%} \
    #rlc-sidebar {width:25%} \
    #rlc-main .liveupdate-listing .liveupdate time { \
        width:15% \
    } \
    #rlc-main .liveupdate-listing .liveupdate .author { \
        width:15% \
    } \
    #rlc-main .liveupdate-listing .liveupdate .body div.md { \
        width:85%; \
    } \
} \
");