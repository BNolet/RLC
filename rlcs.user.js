// ==UserScript==
// @name         FukBird
// @namespace    http://tampermonkey.net/
// @version      1.48
// @description  Chat-like functionality for Reddit Live
// @author       FatherDerp, Stjerneklar, thybag
// @include      https://www.reddit.com/live/*
// @exclude      https://www.reddit.com/live/
// @exclude      https://www.reddit.com/live
// @exclude      https://www.reddit.com/live/*/edit*
// @exclude      https://www.reddit.com/live/*/contributors*
// @exclude      https://*.reddit.com/live/create*
// @require      http://code.jquery.com/jquery-latest.js
// @grant       GM_addStyle
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
     * Quickly hacked to play nice with fuk
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

            if(!$("#fuk-chat").hasClass("fuk-filter-" + channel)){
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

            $("#fuk-chat").addClass("fuk-filter fuk-filter-" + channel_id);
            $("#fuk-chat").attr("data-channel-key", this.channels[channel_id]);
            this.currentRooms++;
            // unselect show all 
            _self.$el.find("span.all").removeClass("selected");
        };

        // disable a channel
        this.disable_channel = function(channel_id){    
            $("#fuk-chat").removeClass("fuk-filter-" + channel_id);
            this.currentRooms--;

            // no rooms selcted, run "show all"
            if(this.currentRooms == 0){
                this.disable_all_channels();
            }else{
                // Grab next channel name if u leave a room in multi mode
                $("#fuk-chat").attr("data-channel-key", $(".fuk-filters span.selected").first().data("filter-name"));
            }
        };

        // turn all channels off
        this.disable_all_channels = function(e){
            $("#fuk-chat").attr("class", _self.defaultRoomClasses).attr("data-channel-key","");
            _self.$el.find(".fuk-filters > span").removeClass("selected");
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
            this.$el.find(".fuk-filters").html(html);
        };

        // After creation of a new channel, go find if any content (not matched by a channel already) is relevant
        this.reScanChannels = function(){
            $("#fuk-chat").find("li.liveupdate").each(function(idx,item){
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
            GM_setValue("fuk-enhance-channels", channels);
        };

        // Change chat mode
        this.changeChannelMode = function(e){
            _self.mode = $(this).data("type");

            // swicth bolding
            $(this).parent().find("span").css("font-weight","normal");
            $(this).css("font-weight","bold");
            _self.disable_all_channels();

            // Update mode setting
            GM_setValue("fuk-enhance-mode", _self.mode);
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
                    $element.removeClass("fuk-filter-" + i);
                }
            }

            // Scann for channel identifiers
            for(i=0; i< this.channelMatchingCache.length; i++){ // sorted so longer get picked out before shorter ones (sub channel matching)
                idx = this.channelMatchingCache[i];
                channel = this.channels[idx];

                if(typeof channel === 'undefined') continue;

                if(text.indexOf(channel) === 0){
                    $element.find("a").append("<div class='channelname'>"+channel+"</div>");
                    $element.addClass("fuk-filter-" + idx +" in-channel");
                    this.unread_counts[idx]++;
                    return;
                }
            }
        };

        // If in one channel, auto add channel keys
        this.submit_helper = function(){
            if($("#fuk-chat").hasClass("fuk-filter")){
                // auto add channel key
                var channel_key = $("#fuk-chat").attr("data-channel-key");

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
            _self.$el.find(".fuk-filters span").each(function(){
                if($(this).hasClass("selected")) return;
                $(this).find("span").text(_self.unread_counts[$(this).data("filter")]);
            });
        };

        // Init tab zone
        this.init = function($el){
            // Load channels
            if(GM_getValue("fuk-enhance-channels")){
                this.channels = GM_getValue("fuk-enhance-channels");
            }
            if(GM_getValue("fuk-enhance-mode")){
                this.mode = GM_getValue("fuk-enhance-mode");
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
            this.$el.html("<span class='all selected'>Everything</span><span><div class='fuk-filters'></div></span><span class='more'>[Options]</span>");
            this.$opt = $("<div class='fuk-channel-add' style='display:none'><input name='add-channel'><button>Add channel</button> <span class='channel-mode'>Channel Mode: <span title='View one channel at a time' data-type='single'>Single</span> | <span title='View many channels at once' data-type='multi'>Multi</span></span></div>").insertAfter(this.$el);

            // Attach events
            this.$el.find(".fuk-filters").click(this.toggle_channel);
            this.$el.find("span.all").click(this.disable_all_channels);
            this.$el.find("span.more").click(function(){ $(".fuk-channel-add").slideToggle(); });
            this.$el.find(".fuk-filters").bind("contextmenu", function(e){
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
            this.defaultRoomClasses = $("#fuk-chat").attr("class") ? $("#fuk-chat").attr("class") : '';

            // redraw tabs
            this.drawTabs();

            // start ticker
            setInterval(this.tick, 1000);
        }
    };
    // create persistant option
    function createOption(name, click_action, default_state){
        var checked_markup;
        var key = "fuk-enhance-" + name.replace(/\W/g, '');
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
        $("#fuk-settings").append($option);
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
        var first_line = $msg.find("p").first();

        // Highlight mentions
        if(line.indexOf(robin_user) !== -1){
            $ele.addClass("user-mention");
        }

        // /me support
        if(line.indexOf("/me") === 0){
            $ele.addClass("user-narration");
            //console.log(first_line);
            first_line.html(first_line.html().replace("/me", " " + $usr.text().replace("/u/", "")));
        }            

        // Track channels
        tabbedChannels.proccessLine(line, $ele);

        $usr.after($ele.find("time"))
        $ele.find(".author, time").wrapAll("<div class='msginfo'>");
     // channel removal support
      //  console.log(remove_channel_key_from_message(first_line.text()));
       // $msg.html(remove_channel_key_from_message(first_line.text()));

    }

    // remove channel key from message
    var remove_channel_key_from_message = function(message){
        if($("#fuk-chat").attr("data-channel-key")){
            var offset = $("#fuk-chat").attr("data-channel-key").length;
            if(offset === 0) return message;

            if(message.indexOf("/me") === 0){
                return "/me "+ message.slice(offset+5);
            }else{
                console.log("slice: " + offset);
                return message.slice(offset+1);
            }
        }
        return message;
    }

    // boot
    $(document).ready(function() {
        $("body").append('  \
                    <div id="fuk-main">   \
                            <div id="fuk-chat"></div> \
                            <div id="fuk-messagebox"> \
                                <div id="mousesubmitblocker"></div> \
                            </div> \
                    </div> \
                    <div id="fuk-sidebar"></div> \
                    <div id="fuk-settingsbar"> \
                            <div id="fuk-togglesidebar" class="noselect">Toggle Sidebar</div> \
                            <div id="fuk-toggleoptions" class="noselect">Toggle Options</div> \
                    </div> \
        '); 

        $('.liveupdate-listing').appendTo('#fuk-chat');
        $('#new-update-form').appendTo('#fuk-messagebox');
        $('#liveupdate-header').prependTo('#fuk-sidebar');
        $('#liveupdate-options').prependTo('#fuk-sidebar');
        $('.main-content aside.sidebar').appendTo('#fuk-sidebar');
        $("#fuk-main iframe").remove();

        //right click author names in chat to copy to messagebox
        $('body').on('contextmenu', ".liveupdate .author", function (event) {
            event.preventDefault();
            var username = String($(this).text()).trim();
            var source = String($(".usertext-edit.md-container textarea").val());
            // Focus textarea and set the value of textarea
            $(".usertext-edit.md-container textarea").focus().val("").val(source + " " + username + " ");
        });

        // make settings container
        $("<div id='fuk-settings' class='noselect'><strong>Options</strong></div>").appendTo($("#fuk-sidebar"));
        
        // rescan existing chat for messages
        $("#fuk-chat").find("li.liveupdate").each(function(idx,item){
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
                $("#fuk-main").addClass("show-colors");
            }else{
                $("#fuk-main").removeClass("show-colors");
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

        $("#fuk-togglesidebar").click(function(){
            $("body").toggleClass("fuk-hidesidebar");
        });
        
        $("#fuk-toggleoptions").click(function(){
            $("body").toggleClass("fuk-showoptions");
        });

        // up for last message send, down for prev (if moving between em)
        text_area.on('keydown', function(e) {
            if (e.keyCode == 13) {
                if (e.shiftKey) {  }
                else if (text_area.val() === "" ) { e.preventDefault();  }
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

    // filter for channel
    GM_addStyle("#fuk-chat.fuk-filter li.liveupdate { display:none; }", 0);
    var color;
    for(var c=0;c<35;c++){
        color = colors[(c % (colors.length))];

        GM_addStyle("#fuk-main.show-colors #fuk-chat li.liveupdate.fuk-filter-"+c+" { background: "+color+";}", 0);
        GM_addStyle("#fuk-chat.fuk-filter.fuk-filter-"+c+" li.liveupdate.fuk-filter-"+c+" { display:block;}", 0);
    }
})();
/*add css styles, every line must end with \  */
      GM_addStyle(" \
/*prevent body scroll to avoid loading history*/ \
body { \
    overflow: hidden; \
} \
 \
/* custom containers  */ \
#fuk-main { \
    width: 80%; \
    height: 100%; \
    position: fixed; \
    top: 63px; \
    left: 0px; \
    box-sizing: border-box; \
} \
 \
#fuk-sidebar { \
    width: 20%; \
    height: calc(100vh - 63px); \
    position: fixed; \
    top: 63px; \
    right: 0; \
    box-sizing: border-box; \
    overflow-y: auto; \
    padding-top: 20px; \
    overflow-x: hidden; \
} \
 \
/* hard removal */ \
body > .content { \
    display: none!important; \
} \
 \
.footer-parent { \
    display: none!important; \
} \
 \
.fuk-showoptions #fuk-settings { \
    display: block; \
} \
 \
#fuk-settings { \
    display: none; \
} \
 \
#liveupdate-options { \
    display: none!important; \
} \
 \
#fuk-main .liveupdate-listing .separator { \
    display: none!important; \
} \
 \
#fuk-main .liveupdate-listing li.liveupdate ul.buttonrow { \
    display: none!important; \
} \
 \
#fuk-main .liveupdate-listing li.liveupdate time:before { \
    display: none!important; \
} \
 \
.help-toggle { \
    display: none!important; \
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
#fuk-main iframe { \
    display: none!important; \
} \
 \
#liveupdate-resources > h2 { \
    display: none; \
} \
 \
.channelname { \
    display: none; \
} \
 \
.fuk-filter .channelname { \
    display: none!important; \
} \
 \
/*chat window*/ \
#fuk-main .liveupdate-listing { \
    max-width: 100%; \
    overflow-y: auto; \
    height: calc(100vh - 160px); \
    padding: 0px; \
    box-sizing: border-box; \
    display: flex; \
    flex-direction: column-reverse; \
} \
 \
#fuk-main .liveupdate-listing .liveupdate .body a { \
    font-size: 13px!important; \
} \
 \
#fuk-main .liveupdate-listing .liveupdate .body { \
    max-width: none!important; \
    margin-bottom: 0!important; \
    padding: 3px 0px!important; \
    font-size: 12px!important; \
    /* vertical-align: middle; */ \
} \
 \
#fuk-main .liveupdate-listing .liveupdate { \
    border-top: 1px solid grey; \
    padding-top: 0px; \
    height: auto!important; \
    overflow: visible!important; \
} \
 \
#fuk-main .liveupdate-listing a.author { \
    display: block; \
    float: left; \
    width: 100%; \
    margin: 0; \
    text-align: right; \
    color: #0079d3; \
} \
 \
#fuk-main .liveupdate-listing .liveupdate time { \
    padding: 0; \
    float: left; \
    width: 100%; \
    margin: 0; \
    text-align: right; \
} \
 \
#fuk-main .liveupdate-listing .liveupdate .body div.md { \
    width: 82%; \
    display: block; \
    float: right; \
    margin-bottom: 0; \
    max-width: none; \
} \
 \
#fuk-main #fuk-chat li.liveupdate.user-mention .body .md { \
    font-weight: bold; \
} \
 \
.liveupdate .msginfo { \
    width: 15%; \
} \
 \
/* narration */ \
#fuk-main #fuk-chat li.liveupdate.user-narration > a { \
    display: none; \
} \
 \
#fuk-main #fuk-chat li.liveupdate.user-narration .body a { \
    display: none; \
} \
 \
#fuk-main #fuk-chat li.liveupdate.user-narration .body .md { \
    font-style: italic; \
} \
 \
div#fuk-messagebox { \
    position: relative; \
} \
 \
/*prevent users from actually pressing the submit button*/ \
div#mousesubmitblocker { \
    position: absolute; \
    top: 49px; \
    width: 100%; \
    height: 24px; \
    background: transparent; \
    z-index: 1; \
    cursor: not-allowed; \
} \
 \
/*message input and send button*/ \
#new-update-form .usertext { \
    max-width: 100%; \
    float: left; \
    width: 100%; \
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
.usertext-edit.md-container { \
    margin-top: 3px; \
} \
 \
.usertext-edit.md-container textarea { \
    padding: 2px; \
} \
 \
/*sidebar*/ \
aside.sidebar.side.md-container { \
    max-width: 100%; \
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
} \
 \
/*togglesidebar*/ \
.fuk-hidesidebar #fuk-sidebar { \
    display: none!important; \
} \
 \
/*hide sidebar toggle class*/ \
.fuk-hidesidebar #fuk-main { \
    width: 100%!important; \
} \
 \
#fuk-togglesidebar {float: right;} \
 \
#fuk-settingsbar { \
    right: 0px; \
    top: 44px; \
    position: absolute; \
    width: 20%; \
    height: 17px; \
    z-index: 100; \
    border-radius: 3px; \
    padding: 2px 8px; \
    cursor: pointer; \
    box-sizing: border-box; \
   background: white; \
    } \
 \
.res-nightmode #fuk-togglesidebar, .res-nightmode #fuk-settingsbar { \
    background: #262626; color:white;\
} \
 \
/*settings*/ \
#fuk-settings { \
    position: absolute; \
    top: 0; \
    right: 0; \
    height: 100%; \
    z-index: 100; \
    width: 100%; \
    box-sizing: border-box; \
    padding-top: 45px; \
    cursor: pointer; \
    background:white; \
} \
 \
.res-nightmode #fuk-settings { \
    color: white; \
    background: #262626; \
} \
 \
#fuk-settings strong { \
    float: left; \
    font-weight: bold; \
    font-size: 1.2em; \
    display: none; \
} \
 \
#fuk-settings label { \
    float: left; \
    padding-left: 5px \
} \
 \
#fuk-settings label input { \
    vertical-align: middle; \
} \
 \
body:not(.res) div#header-bottom-right { \
    bottom: initial; \
    top: 21px; \
    border-radius: 7px; \
    right: 1px; \
} \
 \
body:not(.res) div#header-bottom-right:after {  \
    content:'Redit Enhancement Suite recommended'; \
    position:fixed; \
    top:25px; \
    right:280px; \
} \
/*filter tabs*/ \
#filter_tabs { \
    width: 100%; \
    display: table; \
    table-layout: fixed; \
    border-bottom: 1px solid #5f99cf; \
} \
 \
.res-nightmode #filter_tabs { \
    color: white; \
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
.res-nightmode #filter_tabs > span.all, .res-nightmode #filter_tabs > span.more { \
    color: white; \
} \
 \
#filter_tabs > span.all.selected:hover { \
    background: #40403f; \
    color: white; \
} \
 \
.res-nightmode #filter_tabs > span.all:hover, .res-nightmode #filter_tabs > span.more:hover { \
    background: white ; \
    color: #40403f; \
} \
 \
#filter_tabs .fuk-filters { \
    display: table; \
    width: 100%; \
    table-layout: fixed; \
} \
 \
#filter_tabs .fuk-filters > span { \
    padding: 5px 2px; \
    text-align: center; \
    display: table-cell; \
    cursor: pointer; \
    width: 2%; \
    vertical-align: middle; \
    font-size: 1.1em; \
} \
 \
#filter_tabs .fuk-filters > span.selected, #filter_tabs .fuk-filters > span:hover { \
    background: grey; \
} \
 \
#filter_tabs .fuk-filters > span > span { \
    pointer-events: none; \
} \
 \
.res-nightmode #filter_tabs { \
    background: rgb(51, 51, 51); \
} \
 \
#filter_tabs span div > span:nth-child(odd) { \
    background: rgba(128,128,128,0.3); \
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
.fuk-channel-add { \
    padding: 5px; \
    display: none; \
} \
 \
.fuk-channel-add input { \
    padding: 2.5px; \
} \
 \
.fuk-channel-add .channel-mode { \
    float: right; \
    font-size: 1.2em; \
    padding: 5px; \
} \
 \
.fuk-channel-add .channel-mode span { \
    cursor: pointer \
} \
 \
.fuk-channel-add { \
    padding: 5px; \
    display: none; \
} \
 \
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
.dark-background aside.sidebar #discussions li { \
    background: #404040; \
} \
.dark-background .md a { \
    color: #5ED7FF!important; \
} \
.dark-background .sidebar a { \
    color: #5ED7FF!important; \
} \
.dark-background.liveupdate-app { \
    background: #404040; \
    color: white; \
} \
.dark-background div.content { \
    background: #404040; \
    color: white; \
} \
.dark-background div.md { \
    color: white; \
} \
.dark-background aside.sidebar { \
    background: #404040!important; \
} \
.dark-background blockquote, .dark-background h2 { \
    color: white!important \
} \
.dark-background code { \
    color: black; \
} \
");
