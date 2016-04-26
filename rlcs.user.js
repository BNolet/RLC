// ==UserScript==
// @name         RLC
// @namespace    http://tampermonkey.net/
// @version      2.16
// @description  Chat-like functionality for Reddit Live
// @author       FatherDerp, Stjerneklar, thybag, mofosyne, jhon, MrSpicyWeiner
// @include      https://www.reddit.com/live/*
// @exclude      https://www.reddit.com/live/
// @exclude      https://www.reddit.com/live
// @exclude      https://www.reddit.com/live/*/edit*
// @exclude      https://www.reddit.com/live/*/contributors*
// @exclude      https://*.reddit.com/live/create*
// @require      https://code.jquery.com/jquery-2.2.3.min.js
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==
(function() {
    /*----------------------------------------------------------GLOBAL VARIABLES -------------------------------------------------------------------*/

    // set default states for options
    if (!GM_getValue("rlc-NoSmileys")) {      
        GM_setValue("rlc-NoSmileys", 'false');
    }
    if (!GM_getValue("rlc-SimpleTimestamps")) {      
        GM_setValue("rlc-SimpleTimestamps", 'true');
    }
    if (!GM_getValue("rlc-ChannelColors")) {      
        GM_setValue("rlc-ChannelColors", 'true');
    }
    if (!GM_getValue("rlc-EasyMultilineText")) {      
        GM_setValue("rlc-EasyMultilineText", 'true');
    }
    if (!GM_getValue("rlc-AutoScroll")) {      
        GM_setValue("rlc-AutoScroll", 'true');
    }  

    // Grab users username + play nice with RES
    var robin_user = $("#header-bottom-right .user a").first().text().toLowerCase();
    // Channel Colours
    var colors = [
        'rgba(255,0,0,0.1)','rgba(0,255,0,0.1)','rgba(0,0,255,0.1)','rgba(0,255,255,0.1)','rgba(255,0,255,0.1)','rgba(255,255,0,0.1)','rgba(211,211,211, .1)','rgba(0,100,0, .1)','rgba(255,20,147, .1)','rgba(184,134,11, .1)'
    ];

    // msg history
    var messageHistory = [];
    var messageHistoryIndex = -1;
    var lastTyped="";
    // Active user arrays
    var activeUserArray = [];
    var activeUserTimes = [];
    var updateArray = [];
    // muted user list
    var bannamearray = [];
    // message background alternation via js
    var rowalternator = 0;

    // notification sound in base64 encoding
    var base64sound ="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QECBtFxREzTNkMyfLLVlM9UgS6aQnkPEo3DJRYkUyVQacP6j+5rqMc4TaCiVCxzSEDIKUTvMec6D7tk0aS4CEYQqahfEu6jh/We1NrVrQzhbTKZBgYbi8YbecRuLTMpTvUoAIIlynCMCimNNtBMWwDOcZIMABFMmDZPSCQgzPrLBYvUyQFMUd6UR1kbzgIGfWKw/SrqKgg5coZaKgUBQzOtyEaucSrOTBlGOqpGMNYXtGwYFhwTdfZ/nmjb0QUrCKicsj8alcPp0y7KmpuOEVAQSvUg25SKDofWuZEBtKidNLZhQJ0oGpdfVeGhJgUUEjARAINH4cGP3olbJAcdDR4gdl/onWtSmuw1xa2WVPSOy6CJ4qHBgSoO8r9UmcZiT4P+YkAhcKf+BJTTY44/cYFV5vLKV2XeYQShgODRoQoL8Kv/7ksTXgBhp4TbVygAE2sIlAzuwAJ5JQRVudDXlr7DoQRA6LbSquF6tu7RZb5t9nGr1bOOvx+64QknJBvtR///////////////6R48LQFE////////////////2AwDFdBkACAVhVSstnYaa015ymstdiCPRbJK5R0zROkwvcAhgeoNiRyAwEGJhpENIsbJLJknUCBC5jw5QzRuQEc0uCEwauFwjqEFhBYXEVxjQyKGKSXFmigRmTxeLx0mUjEumrUkklJJLLpqogQ5x4mhziLGyJdRatHrRLrooskk6Jq6Jqj1o/qSSqS/60UZkXmUkk9FFGtFH/9aPRRZRkXmSLyT0W/0UaLKSSWYl1zFMQU1FMy45OC4yqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy45OC4yqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+5LEoQPVgaL0XYiAAAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
    var snd = new Audio("data:audio/wav;base64," + base64sound);
    // chrome notice img in bass64
    var chromenoticeimg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAADgSURBVFhH7ZdRbsMwDENzgt7/Sj2VG0eEKxGUmgJOUKR5eMNgiRH3u6U5lgPA6Q08sHg+povL1mJNlJiu9Z1bdkKT2Zv+rAyL7/8OfFbcFKOID2QiGhEBMYr4QCaiERHgt2JkpAgpOMNvxchIEVJwht+KkZEipODMeL9HER/IRDQiAmIU8YFMRCMi4EcmFvtqvPisuEnTg7zLpniXTfGXyopVZn2tQ9Nhscqsr3VoOixWmfW1Dk299Zb8eKpDUxKhHdCH5K7QLK9ddt3/YtYf6zuoEpetxX4ZtpgLTq+09gIQTX1K/dS/IgAAAABJRU5ErkJggg==";

    // emoji trigger list. supports multiple triggers for one emote(eg meh) and automaticly matches both upper and lower case letters(eg :o/:O)
    var emojiList={ ":)":"smile", ":((":"angry", ":(":"frown", ":s":"silly", ":I":"meh", ":|":"meh", ":/":"meh", ":o":"shocked",
                   ":D":"happy","D:":"sad",";_;":"crying",";)":"wink","-_-":"zen","X|":"annoyed","X)":"xsmile","X(":"xsad","XD":"xhappy",":P":"tongue"};

    // Html for injection, inserted at doc.ready
    var htmlPayload = '  \
<div id="rlc-sidebar"> \
<div id="rlc-main-sidebar"></div> \
<div id="rlc-readmebar"> \
<div class="md">\
<strong style="font-size:1.2em">RLC Feature Guide</strong><br> \
<small>click version number again to restore sidebar</small> \
<hr> \
</div> \
</div> \
<div id="rlc-guidebar"> \
<div class="md"> \
<strong style="font-size:1.2em">RLC New User Intro</strong><br> \
<hr> \
</div> \
</div> \
<div id="rlc-settings"> \
<div class="md"> \
<strong style="font-size:1.2em">RLC Options</strong><br> \
<hr> \
</div> \
</div> \
</div> \
<div id="rlc-main">   \
<div id="rlc-chat"></div> \
</div> \
<div id="rlc-messagebox"><select id="rlc-channel-dropdown"><option></option><option>%general</option><option>%offtopic</option><option>%dev</option></select></div>\
<div id="rlc-settingsbar"> \
<div id="rlc-togglesidebar" title="Toggle Sidebar" class="noselect">Sidebar</div> \
<div id="rlc-toggleoptions" title="Show Options" class="noselect">Options</div> \
<div id="rlc-toggleguide" title="Show Guide" class="noselect">Readme</div> \
</div> \
';
    /*---------------------------------------------------------- Functions -------------------------------------------------------------------*/

    //timeconverter for active user list
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

    // user muting 
    function updatebannednames() {
        // reset by removing css and userlist
        $('#mystyle').remove();
        $('#bannedlist').empty();

        // iterate over the muted users
        var selectors = [];
        for(i=0; i <= bannamearray.length; i++){
            if (bannamearray[i] !== undefined) {    //avoid the undefined one i cant figure out why im puttin in
                selectors.push(".u_"+bannamearray[i]+"{display:none;}");      //generate css display none rule for user in list
                $('#bannedlist').append("<p>"+bannamearray[i]+"</p>");        //generate interface element for disabling muting
            }
        };
        $('body').append("<style id='mystyle'>"+selectors.join(" ")+"</style>"); //inject style tag with user rules

        // handle clicking in muted user list
        $("#bannedlist p").click(function(){ 
            var thisguy = $(this).text();
            var hisposition = bannamearray.indexOf(thisguy);
            $(this).remove();  //remove this element from the muted list
            bannamearray.splice(hisposition, 1);  //remove this guy from the muted array
            updatebannednames(); 
            _scroll_to_bottom();
        });
    }

    // Scroll chat back to bottom
    var _scroll_to_bottom = function(){
        $("#rlc-chat").scrollTop($("#rlc-chat")[0].scrollHeight);
        
   };

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

    //convert string to hex (for user colors)
    function toHex(str) {
        var result = '';
        for (var i=0; i<str.length; i++) {
            result += str.charCodeAt(i).toString(16);
        }
        return result;
    }
    function LightenDarkenColor2(col, amt) {
        var r=col.slice(0,2);
        var g=col.slice(2,4);
        var b=col.slice(4,6);
		if(rowalternator)amt+=10;
		var randR = (Math.seededRandom(r*100,120,175));
		var randG = (Math.seededRandom(g*100,120,175));
		var randB = (Math.seededRandom(b*100,120,175));
		
		var suppress=(Math.seededRandom(col*r*10,0,6));
		//console.log(suppress);
		var modAmt=2;
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
		} 
	
        var hexR = (parseInt(randR) + parseInt(amt)).toString(16);
        var hexG = (parseInt(randG) + parseInt(amt)).toString(16);
        var hexB = (parseInt(randB) + parseInt(amt)).toString(16);

        return hexR+hexG+hexB;
    }

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
    }

    // create persistant option
    function createOption(name, click_action, default_state){
        var checked_markup;
        var key = "rlc-" + name.replace(/\W/g, '');
        //console.log(key);
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
	
	 
	// in order to work 'seed' must NOT be undefined,
	// so in any case, you HAVE to provide a Math.seed
	Math.seededRandom = function(seed, max, min) {
		max = max || 1;
		min = min || 0;
	 
		seed = (seed * 9301 + 49297) % 233280;
		var rnd = seed / 233280;
	 
		return parseInt(min + rnd * (max - min));
	}
	
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

        //alternating background color    
        if(rowalternator === 0) {
            $ele.addClass("alt-bgcolor");
            rowalternator = 1;
        }
        else { rowalternator = 0; }

        // /me support
        if(line.indexOf("/me") === 0){
            $ele.addClass("user-narration");
            first_line.html(first_line.html().replace("/me", " " + $usr.text().replace("/u/", "")));
        }

        // emote support
        if(GM_getValue("rlc-NoSmileys") === 'false'){            
            $.each(emojiList,function(emoji,replace){
                if(line.toLowerCase().indexOf(emoji.toLowerCase()) != -1 && line.indexOf("http") == -1){
                    if($msg.has("h1").length==0 && $msg.has("li").length==0 && $msg.has("code").length==0 && $msg.has("table").length==0){
                        first_line.html(first_line.html().split(emoji.toUpperCase()).join(emoji.toLowerCase()));
                        first_line.html(first_line.html().split(emoji.toLowerCase()).join("<span class='mrPumpkin mp_"+replace+"'></span>"));
                    }
                }
            });
        }

        // prevent embedly iframe link handling
        first_line.html(first_line.html()+" ");

        if(GM_getValue("rlc-EasyMultilineText") === 'true'){
            $msg.html($msg.html().split('\n').join('<br>'));
            $msg.html($msg.html().replace('<br><br>','<br>'));
        }
        // insert time
        $usr.before($ele.find("time"));

        //remove the /u/
        $usr.text($usr.text().replace("/u/", ""));

        // tag message with user identifier for muting
        $ele.addClass("u_"+$usr.text());

        var hexName=toHex($usr.text()).split('');
        var adder=1;
        $.each(hexName,function(ind,num){
            num = (parseInt(num)+1)
            if(num!=0 && !isNaN(num)){
                adder = adder * num;
            }
        });
        adder=adder.toString().replace(".","").split("0").join("");
        start = adder.length-10;
        end = adder.length-4;
        var firstThree=adder.toString().substring(start,end);
		
		
        if( GM_getValue("rlc-DarkMode") === 'true'){
            var lightercolor = LightenDarkenColor2(firstThree, 60);
            $usr.css("color","#"+lightercolor);
        }
        else {
            var darkercolor = LightenDarkenColor2(firstThree,0);
            $usr.css("color","#"+darkercolor);
        }

        // Track channels
        tabbedChannels.proccessLine(line, $ele, rescan);

        //remove seperator 
        $(".liveupdate-listing .separator").remove();

        // Active Channels Monitoring
        updateMostActiveChannels(line);    
    };

    /* Basic usage - tabbedChannels.init( dom_node_to_add_tabs_to );
     * and hook up tabbedChannels.proccessLine(lower_case_text, jquery_of_line_container); to each line detected by the system */
    var tabbedChannels = new function(){
        var _self = this;

        // Default options
        this.channels = ["%general", "%offtopic"];
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
            GM_setValue("rlc-channels", channels);
        };

        // Change chat mode
        this.changeChannelMode = function(e){
            _self.mode = $(this).data("type");

            // swicth bolding
            $(this).parent().find("span").css("font-weight","normal");
            $(this).css("font-weight","bold");
            _self.disable_all_channels();

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
        this.proccessLine = function(text, $element, rescan){
            var i, idx, channel;
            var  shorttime = $element.find(".body time").attr( "title" ).split(" ");
            var amPm = shorttime[4].toLowerCase();
            
            var $usr = $element.find(".body .author");
            
            if (amPm === "am" || amPm === "pm" ) {
                var shortimefull = shorttime[3] + " " + amPm;
            }
            else {
                amPm = " ";
            }

            var militarytime = convertTo24Hour(shorttime[3] + " " + amPm);

            activeUserArray.push($usr.text());
            activeUserTimes.push(militarytime);

            // moved here to add user activity from any time rather than only once each 10 secs.(was in tab tick function, place it back there if performance suffers)
            processActiveUsersList();           
            
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

                

                $usr.attr("target","_blank");                

                //mention sound effect player
                if(text.indexOf(robin_user) !== -1){
                    if ($("body").hasClass("rlc-notificationsound")) {
                        snd.play();
                    }
                    if ($("body").hasClass("rlc-notificationchrome")) {
                        var n = new Notification('Robin Live Chat',{
                            icon: chromenoticeimg,
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
            // else read from dropdown populated by channels
            else { 
                var channel_key = $("#rlc-channel-dropdown option:selected" ).text();
		if (channel_key !== "") {
                if($("#new-update-form textarea").val().indexOf("/me") === 0){
                    $("#new-update-form textarea").val("/me " + channel_key + " " + $("#new-update-form textarea").val().substr(3));
                }else if($("#new-update-form textarea").val().indexOf("/") !== 0){
                    // if its not a "/" command, add channel
                    $("#new-update-form textarea").val(channel_key + " " + $("#new-update-form textarea").val());
                }
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
            
        };

        // Init tab zone
        this.init = function($el){
            // Load channels
            if(GM_getValue("rlc-channels")){
                this.channels = GM_getValue("rlc-channels");
            }
            if(GM_getValue("rlc-mode")){
                this.mode = GM_getValue("rlc-mode");
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

    // boot
    $(document).ready(function() {
        $("body").append(htmlPayload); 

        // move default elements into custom containers defined in htmlPayload
        $('.liveupdate-listing').prependTo('#rlc-chat');
        $('#new-update-form').appendTo('#rlc-messagebox');
        $('#new-update-form').append('<div id="rlc-sendmessage">Send Message</div>');
        $('#liveupdate-header').appendTo('#rlc-sidebar #rlc-main-sidebar');
        $('.main-content aside.sidebar').appendTo('#rlc-sidebar #rlc-main-sidebar');

        // put anything after -RLC-README- in the sidebar into the readme
        var str = $('#liveupdate-resources .md').html();
        var res = str.split("<p>--RLC-SIDEBAR-GUIDE--</p>");     
        $('#liveupdate-resources .md').html(res[0]);
        $('#rlc-readmebar .md').append(res[1]);

        // put anything before -RLC-MAIN- in the sidebar into the guide
        var str = $('#liveupdate-resources .md').html();
        var res = str.split("<p>--RLC-SIDEBAR-MAIN--</p>");     
        $('#liveupdate-resources .md').html(res[1]);
        $('#rlc-guidebar .md').append(res[0]);

        // add placeholder text and focus messagebox
        $(".usertext-edit textarea").attr("placeholder", "Type here to chat");
        $(".usertext-edit textarea").focus();

        // remove iframes
        $("#rlc-main iframe").remove();

        // make links external
        $("#rlc-main a").attr("target","_blank");
        $("#rlc-sidebar a").attr("target","_blank");
        $("#rlc-readmebar a").attr("target","_blank");
        $("#rlc-guidebar a").attr("target","_blank");

        // show hint about invites if there is no messagebox
        if($(".usertext-edit textarea").length) { }
        else { $("#rlc-main").append("<p style='width:100%;text-align:center;'>If you can see this you need an invite to send messages, check the sidebar.</p>"); }

        $("<div id='channelsTable'> \
<div>Most Active Channels</div><br/> \
<div id='activeChannelsTable'></div><br/> \
</div>").appendTo("#rlc-main-sidebar"); // Active Channel Discovery Table

        tabbedChannels.init($('<div id="filter_tabs"></div>').insertBefore("#rlc-settingsbar"));

        $("#rlc-main-sidebar").append("<div id='rlc-activeusers'><strong>Recent User Activity</strong><br><ul></ul></div>");
        $('#rlc-main-sidebar').append("<div id='banlistcontainer'><strong>Muted Users</strong><div id='bannedlist'></div></div>");
        $('#liveupdate-statusbar').prepend("<div id='versionnumber'>v." + GM_info.script.version + "</div>");
        
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
                if ($(document.body).hasClass("AutoScroll")) {
                    _scroll_to_bottom();
                }
                
            }
        });

        //$(".usertext-edit.md-container textarea").attr("tabindex","0"); //fixes autocomplete
        var text_area = $(".usertext-edit.md-container textarea");       

        //right click author names in chat to copy to messagebox
        $('body').on('contextmenu', ".liveupdate .author", function (event) {
            if (!$("body").hasClass("rlc-altauthorclick")) { 
                event.preventDefault();
                var username = String($(this).text()).trim();
                var source = String($(".usertext-edit.md-container textarea").val());
                // Focus textarea and set the value of textarea
                $(".usertext-edit.md-container textarea").focus().val("").val(source + " " + username + " ");
            }
        });    

        $('body').on('click', ".liveupdate .author", function (event) {
            event.preventDefault();
            var banusername = String($(this).text()).trim();
            bannamearray.push(banusername);
            updatebannednames();
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

        $("#rlc-togglesidebar").click(function(){      $("body").toggleClass("rlc-hidesidebar");});
        $("#rlc-toggleoptions").click(function(){   $("body").removeClass("rlc-showreadmebar");     $("body").toggleClass("rlc-showoptions");});
        $("#rlc-toggleguide").click(function(){      $("body").removeClass("rlc-showoptions");        $("body").toggleClass("rlc-showreadmebar");});
        $("#rlc-sendmessage").click(function(){$(".save-button .btn").click();});

        /*$('.usertext-edit textarea').autocomplete({
            source: updateArray,
            autoFocus: true,
            delay: 0,
            minLength: 2
        });*/
 
        //tab autocomplete
        text_area.on('keydown', function(e) {
            if (e.keyCode == 9) { //Stole my old code from Parrot
				processActiveUsersList();
				e.preventDefault();
				var sourceAlt=$('.usertext-edit textarea').val();
				//console.log(sourceAlt+" 1");
				var namePart = "";	
				var space=sourceAlt.lastIndexOf(" ");
				namePart = sourceAlt.substring(space).trim();
				//console.log(namePart+" 2");
				sourceAlt = sourceAlt.substring(0, sourceAlt.lastIndexOf(" "));
				var found=false;
				$.each(updateArray,function(ind,Lname){
					if(Lname.indexOf(namePart) == 0){
						namePart=Lname;
						if(space!=-1)namePart=" "+namePart;
						//console.log(namePart+" 3");
						found=true;
						return true;
					}else if(Lname.toLowerCase().indexOf(namePart.toLowerCase()) == 0){ // This is in an else because it should give priority to case Sensitive tab completion
						namePart=Lname;
						if(space!=-1)namePart=" "+namePart;
						//console.log(namePart+" 3");
						found=true;
						return true;
					}
				});
				if(found){
					$('.usertext-edit textarea').val(sourceAlt+namePart);
				}
			}
            // enter message send
            if (e.keyCode == 13) {
                if (e.shiftKey) { /* exit enter handling to allow shift+enter newline */  }
                else if (text_area.val() === "" ) { e.preventDefault();  }
                else {
                    if(text_area.val().indexOf("/version") === 0){ 
                        $(this).val("RLC v."+GM_info.script.version+" has been released. Use the link in the sidebar to update.");
                    }
                    e.preventDefault();
                    $(".save-button .btn").click();
                }
            }
            else if(e.keyCode == 38) {
                e.preventDefault();
                if(messageHistoryIndex>0)
                    messageHistoryIndex--;
                if(messageHistoryIndex == messageHistory.length-1){
                    lastTyped=$(this).val();
                }
                if(messageHistoryIndex > -1){
                    $(this).val(messageHistory[messageHistoryIndex]);
                }
            }
            else if(e.keyCode == 40){
                e.preventDefault();
                if(messageHistoryIndex < messageHistory.length){
                    messageHistoryIndex++;
                    $(this).val(messageHistory[messageHistoryIndex]);
                }
                if(messageHistoryIndex == messageHistory.length){
                    $(this).val(lastTyped);
                }
            }
        });

        // Options 
        /* createOption("Active Channel Discovery [BETA]", function(checked, ele){
            if(checked){
                startChannels();
                $("#channelsTable").show();
            }else{
                stopChannels();
                $("#channelsTable").hide();
            }
            _scroll_to_bottom();
        },false);*/
        createOption("AutoScroll", function(checked, ele){
            if(checked){
                $("body").addClass("AutoScroll");
            }else{
                $("body").removeClass("AutoScroll");
            }
        },false);
        createOption("Channel Colors", function(checked, ele){
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
        },false);
        createOption("Easy Multiline Text", function(checked, ele){
            if(checked){
                $("body").addClass("rlc-MultiLine");
            }else{
                $("body").removeClass("rlc-MultiLine");
            }
        },false);
    });

    var color;
    var styles = [];
    for(var c=0;c<35;c++){
        color = colors[(c % (colors.length))];

        GM_addStyle("#rlc-main.show-colors #rlc-chat li.liveupdate.rlc-filter-"+c+" { background: "+color+";}", 0);
        GM_addStyle("#rlc-chat.rlc-filter.rlc-filter-"+c+" li.liveupdate.rlc-filter-"+c+" { display:block;}", 0);
    }    
})();

GM_addStyle(" /* base 64 encoded emote spritesheet */ \
#liveupdate-statusbar.reconnecting .state:before, #liveupdate-statusbar.live .state:before, .mrPumpkin { \
background-image: url('data:image/png;base64,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'); \
} \
.alt-bgcolor {background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGM6Uw8AAiABTnvshQUAAAAASUVORK5CYII=')!important;} \
.dark-background .alt-bgcolor {background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGM6YwwAAdQBAooJK6AAAAAASUVORK5CYII=')!important;} \
");

GM_addStyle("/*-------------------------------- Standalone Stuff ------------------------------------- */ \
/* narration */ \
#rlc-main #rlc-chat li.liveupdate.user-narration .body .md { \
font-style: italic; \
} \
\
/* MISC */ \
body { \
min-width: 0; \
overflow: hidden; \
} /* \
body.allowHistoryScroll { \
height: 105%; \
overflow: auto; \
} */ \
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
.mrPumpkin { \
height: 24px; \
width: 24px; \
display: inline-block; \
border-radius: 3px; \
background-size: 144px; \
margin-top: 0px!important; \
margin-bottom: -6px!important; \
} \
\
.dark-background .mrPumpkin { \
border-radius: 5px; \
} \
\
.mp_frown { \
background-position: -24px 0; \
} \
\
.mp_silly { \
background-position: -48px 0; \
} \
\
.mp_meh { \
background-position: 0 -24px; \
} \
\
.mp_angry { \
background-position: -48px -24px; \
} \
\
.mp_shocked { \
background-position: -24px -24px; \
} \
\
.mp_happy { \
background-position: -72px 120px; \
} \
\
.mp_sad { \
background-position: -72px 96px; \
} \
\
.mp_crying { \
background-position: 0px 72px; \
} \
\
.mp_tongue { \
background-position: 0px 24px; \
} \
\
.mp_xhappy { \
background-position: -48px 48px; \
} \
\
.mp_xsad { \
background-position: -24px 48px; \
} \
\
.mp_xsmile { \
background-position: 0px 48px; \
} \
\
.mp_annoyed { \
background-position: -72px 72px; \
} \
\
.mp_zen { \
background-position: -48px 72px; \
} \
\
.mp_wink { \
background-position: -24px 72px; \
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
/* option classes */ \
\
/* hard removal */ \
#rlc-main #rlc-chat li.liveupdate.user-narration > a, #rlc-main #rlc-chat li.liveupdate.user-narration .body a, #rlc-main iframe, #hsts_pixel, .debuginfo, .simpleTimestamps #rlc-main .liveupdate-listing .liveupdate time, #rlc-main .liveupdate-listing .liveupdate .simpletime, .save-button, #rlc-chat.rlc-filter li.liveupdate, #discussions, .reddiquette, #contributors, #liveupdate-resources > h2, .rlc-hidesidebar #rlc-sidebar, #rlc-settings, #rlc-readmebar, .ui-helper-hidden-accessible, .rlc-filter .channelname, .rlc-compact div#header, .help-toggle, #rlc-main .liveupdate-listing li.liveupdate time:before, #rlc-main .liveupdate-listing li.liveupdate ul.buttonrow, #rlc-main .liveupdate-listing .separator, #liveupdate-options, .footer-parent, body > .content { \
display: none; \
} \
\
#rlc-guidebar { \
display: none; \
} \
\
.rlc-showoptions #rlc-main-sidebar { \
display: none; \
} \
.dark-background select#rlc-channel-dropdown option { \
    color: black; \
} \
\
.rlc-showreadmebar #rlc-main-sidebar { \
display: none; \
} \
");

GM_addStyle("* { \
    box-sizing: border-box; \
} \
 \
#rlc-main p { \
    line-height: 24px!important; \
    font-size: 12px; \
} \
 \
#rlc-main { \
    width: 80%; \
    height: calc(100vh - 112px); \
    box-sizing: border-box; \
    float: left; \
    position: relative; \
} \
 \
#rlc-sidebar { \
    width: 20%; \
    float: right; \
    height: calc(100vh - 87px); \
    box-sizing: border-box; \
    overflow-y: auto; \
    overflow-x: hidden; \
    padding: 0px 0px 0px 5px; \
    position: relative; \
} \
 \
#rlc-topmenu { \
    box-sizing: border-box; \
    border-bottom: 1px solid grey; \
} \
 \
/*-------------------------------- Message Input ------------------------------------- */ \
/* message input and send button */ \
div#rlc-messagebox { \
    position: relative; \
    float: left; \
    width: 80%; \
    border-left: 1px solid grey; \
} \
 \
.rlc-hidesidebar div#rlc-messagebox { \
    position: relative; \
    float: left; \
    width: 100%; \
    border-left: 1px solid grey; \
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
    height: 25px; \
} \
 \
div#new-update-form textarea { \
    height: 25px; \
    overflow: auto; \
    border-bottom: 0; \
    resize: none; \
    border-left: 0; \
} \
 \
div#new-update-form { \
    width: 90%; \
    margin: 0; \
    float: right; \
} \
 \
.usertext-edit.md-container { \
    max-width: 100%; \
    margin: 0; \
    position: relative; \
} \
 \
/*-------------------------------- Send button ------------------------------------- */ \
#new-update-form .save-button .btn { \
    width: 100%; \
    text-transform: capitalize; \
} \
 \
div#rlc-sendmessage { \
    width: 15%; \
    height: 25px; \
    text-align: center; \
    float: right; \
    display: inline-block; \
    padding-top: 5px; \
    box-sizing: border-box; \
    margin-top: 0px; \
    font-size: 1.3em; \
    cursor: pointer; \
    border: 1px solid #A9A9A9; \
    border-left: 0; \
    border-bottom: 0; \
} \
 \
/*------------------------------------ Main Chat -----------------------------------------------------*/ \
#rlc-main time.live-timestamp { \
    text-indent: 0; \
    width: 100px; \
    color: inherit; \
    padding: 0; \
    padding-left: 10px; \
    margin: 0; \
    padding-top: 6px; \
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
    height: calc(100vh - 112px); \
} \
 \
#rlc-main .liveupdate-listing .liveupdate .body { \
    max-width: none; \
    margin-bottom: 0; \
    padding: 0px; \
    font-size: 12px; \
    display: block; \
    box-sizing: border-box; \
} \
 \
#rlc-main .liveupdate-listing .liveupdate { \
    height: auto!important; \
    padding: 4px; \
} \
 \
#rlc-main .liveupdate-listing a.author { \
    width: 180px; \
    float: left; \
    text-align: right; \
    padding: 0; \
    color: initial; \
    margin: 0; \
    padding-top: 4px; \
} \
 \
#rlc-main .liveupdate-listing .liveupdate .body div.md { \
    float: right; \
    width: calc(100% - 320px); \
    max-width: none; \
} \
 \
#rlc-main #rlc-chat li.liveupdate.user-mention .body .md { \
    font-weight: bold; \
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
/*-------------------------filter tabs------------------------------------*/ \
#filter_tabs { \
    table-layout: fixed; \
    border: 1px solid #A9A9A9; \
    width: 80%; \
    border-bottom: 0; \
    box-sizing: border-box; \
    height: 25px; \
    float: left; \
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
    height: 24px; \
} \
 \
#filter_tabs .rlc-filters > span { \
    padding: 5px 2px; \
    text-align: center; \
    display: table-cell; \
    cursor: pointer; \
    vertical-align: middle; \
    font-size: 1.1em; \
    border-right: 1px solid grey; \
} \
 \
#filter_tabs .rlc-filters > span > span { \
    pointer-events: none; \
} \
 \
#filter_tabs > span.all { \
    padding: 0px 30px; \
    height: 25px; \
    border-right: 1px solid grey; \
} \
 \
#filter_tabs > span.more { \
    padding: 0px 30px 0px 30px; \
} \
 \
/* add channels interface */ \
.rlc-channel-add input { \
    border: 0; \
    padding: 0; \
    height: 24px; \
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
    display: none; \
    position: absolute; \
    bottom: 0px; \
    height: 24px; \
    background: #FCFCFC; \
    left: 0px; \
    width: calc(80% - 116px); \
    z-index: 1000; \
    border-right: 1px solid grey; \
} \
 \
/*------------------------------------ Sidebar -----------------------------------------------------*/ \
aside.sidebar.side.md-container { \
    width: 100%; \
    opacity: 1; \
    margin: 0; \
    padding: 0; \
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
/*hide sidebar toggle class*/ \
.rlc-hidesidebar #rlc-main { \
    width: 100%!important; \
} \
 \
#rlc-togglesidebar { \
    display: table-cell; \
    cursor: pointer; \
    border-right: 1px solid #A9A9A9; \
} \
 \
div#versionnumber { \
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
 \
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
.rlc-showoptions #rlc-settings { \
    display: block; \
    padding-top: 30px; \
} \
 \
.rlc-showreadmebar #rlc-readmebar { \
    display: block; \
    padding: 2px 5px 40px 0px; \
    box-sizing: border-box; \
    font-size: 1.18em; \
} \
 \
#rlc-settingsbar { \
    height: 25px; \
    box-sizing: border-box; \
    display: table; \
    border-top: 1px solid #A9A9A9; \
    table-layout: fixed; \
    width: 20%; \
    z-index: 100; \
    float: right; \
    background: #FCFCFC; \
} \
 \
div#rlc-toggleoptions { \
    display: table-cell; \
    cursor: pointer; \
} \
 \
div#rlc-settingsbar div { \
    padding-top: 6px; \
    text-align: center; \
    cursor: pointer; \
} \
 \
/* Autocomplete */ \
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
/* active users */ \
#rlc-activeusers, #banlistcontainer { \
    display: inline-block; \
    width: 100%; \
    padding: 10px; \
    font-size: 1.2em; \
} \
 \
#banlistcontainer p { \
    cursor: pointer; \
} \
 \
#rlc-activeusers li { \
    width: 100%; \
    font-size: 1.2em; \
} \
 \
/* Compact mode */ \
.rlc-compact div#rlc-chat { \
    height: calc(100vh - 49px); \
} \
 \
/* misc fixes */ \
.simpleTimestamps #rlc-main .liveupdate-listing .liveupdate .simpletime { \
    display: block; \
    float: left; \
    width: 70px; \
    padding-left: 10px; \
    padding-top: 5px; \
} \
 \
#rlc-sidebar .sidebar .md h3, #rlc-sidebar aside.sidebar .md h4, #rlc-sidebar aside.sidebar .md h5, #rlc-sidebar aside.sidebar .md h6 { \
    color: inherit; \
} \
 \
div#rlc-toggleguide { \
    border-left: 1px solid #A9A9A9; \
    padding-bottom: 6px; \
    border-right: 1px solid grey; \
} \
 \
div#rlc-main-sidebar { \
    display: block; \
    overflow-x: hidden; \
    padding-right: 5px; \
    box-sizing: border-box; \
} \
 \
/* Dark Mode */ \
.dark-background ul.ui-autocomplete a { \
    color: white!important; \
} \
 \
.dark-background pre { \
    background: transparent; \
} \
 \
.dark-background.rlc-showreadmebar #rlc-readmebar .md { \
    color: white; \
} \
 \
.dark-background #rlc-settingsbar, .dark-background div#rlc-settings { \
    background: #404040; \
} \
 \
.dark-background .rlc-channel-add { \
    background: #404040; \
} \
 \
.dark-background .rlc-channel-add input { \
    background: #F3FFF9; \
    color: white; \
} \
 \
.dark-background .liveupdate-listing li.liveupdate .body div.md, .dark-background aside.sidebar .md, .dark-background #liveupdate-description .md, .dark-background .md blockquote p { \
    color: white!important; \
} \
 \
.dark-background div#header-bottom-left { \
    background: grey; \
} \
 \
.dark-background { \
    background: #404040; \
    color: white; \
} \
 \
.dark-background .side, .dark-background textarea, .dark-background #rlc-main .liveupdate-listing a.author { \
    background: transparent; \
    color: white; \
} \
 \
#rlc-settings label { \
    width: 100%; \
    display: block; \
    font-size: 1.5em; \
} \
 \
#rlc-settings input { \
    margin: 4px; \
    position: relative; \
    top: 2px; \
} \
 \
.rlc-compact div#rlc-sidebar { \
    height: calc(100vh - 24px); \
} \
 \
.dark-background #rlc-settings strong { \
    color: white; \
} \
 \
.rlc-compact div#rlc-main { \
    height: calc(100vh - 49px); \
} \
 \
div#versionnumber { \
    padding-right: 20px; \
    font-size: 0.8em; \
} \
 \
.usertext-edit .bottom-area { \
    position: absolute; \
    top: 5px; \
    left: 50%; \
} \
select#rlc-channel-dropdown { \
    float: left; \
    height: 25px; \
    width: 10%; \
    border-bottom: 0; \
    background: transparent; \
    border-left: 0; \
} \
 \
.dark-background select#rlc-channel-dropdown { \
    color: white; \
} \
");
