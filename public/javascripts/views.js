var MT = require('message').Type;
var Views = {utils: {}};
var bufferOrders = [];

Views._decorator = {sender: {}, content: {}};
//Views._decorator.sender[MT.Notice] = '';
//Views._decorator.sender[MT.Action] = '';
Views._decorator.sender[MT.Nick] = '<->';
Views._decorator.sender[MT.Mode] = '***';
Views._decorator.sender[MT.Join] = '-->';
Views._decorator.sender[MT.Part] = '<--';
Views._decorator.sender[MT.Quit] = '<--';
Views._decorator.sender[MT.Kick] = '<-*';
//Views._decorator.sender[MT.Kill] = '';
Views._decorator.sender[MT.Server] = function(nick) {
	return nick || "*";
};
//Views._decorator.sender[MT.Info] = '';
//Views._decorator.sender[MT.Error] = '';
//Views._decorator.sender[MT.DayChange] = '-';
Views._decorator.sender[MT.Topic] = '*';
Views._decorator.sender[MT.NetsplitJoin] = '=>';
Views._decorator.sender[MT.NetsplitQuit] = '<=';
//Views._decorator.sender[MT.Invite] = '';

//Views._decorator.content[MT.Notice] = '';
//Views._decorator.content[MT.Action] = '';
Views._decorator.content[MT.Nick] = function(nick, content) {
	return Views.utils.stripnick(nick) + " is now known as " + content;
};
Views._decorator.content[MT.Mode] = function(nick, content) {
	return "Mode " + content + " by " + Views.utils.stripnick(nick);
};
Views._decorator.content[MT.Join] = function(nick, content) {
	return Views.utils.stripnick(nick) + " has joined";
};
Views._decorator.content[MT.Part] = function(nick, content) {
	return Views.utils.stripnick(nick) + " has left";
};
Views._decorator.content[MT.Quit] = function(nick, content) {
	return Views.utils.stripnick(nick) + " has quit";
};
Views._decorator.content[MT.Kick] = function(nick, content) {
	var ind = content.indexOf(" ");
	return Views.utils.stripnick(nick) + " has kicked " + content.slice(0, ind) + " (" + content.slice(ind+1) + ")";
};
//Views._decorator.content[MT.Kill] = '';
//Views._decorator.content[MT.Server] = '';
//Views._decorator.content[MT.Info] = '';
//Views._decorator.content[MT.Error] = '';
//Views._decorator.content[MT.DayChange] = '-';
//Views._decorator.content[MT.Topic] = ''; // as is
//Views._decorator.content[MT.NetsplitJoin] = ''; // as is
//Views._decorator.content[MT.NetsplitQuit] = '<='; // as is
//Views._decorator.content[MT.Invite] = '';

var tagsToReplace = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#x27;',
	'/': '&#x2F;'
}, re = /[&<>]/g;

Views.utils.makeLinks = function(str) {
	if (!str) return null;
	return str.replace(re, function (tag) {
		return tagsToReplace[tag] || tag;
	});
};

Views.utils.escapetags = function(str) {
	if (!str) return null;
	return str.replace(re, function (tag) {
		return tagsToReplace[tag] || tag;
	});
};

Views.utils.stripname = function(s) {
	if (!s) return '';
	if (s[0] === '#') {
		return s.substring(1);
	}
	return s;
};

Views.utils.stripnick = function(s) {
	if (!s) return '';
	var ind = s.indexOf('!');
	if (ind !== -1) {
		return s.slice(0, ind);
	}
	return s;
};

Views.utils.HHmmss = function(d) {
	var dateObject = null;
	if (d instanceof Date) {
		dateObject = d;
	} else {
		dateObject = new Date(d);
	}
	var h = dateObject.getHours(), m = dateObject.getMinutes(), s = dateObject.getSeconds();
	if (h < 10) h = '0'+h;
	if (m < 10) m = '0'+m;
	if (s < 10) s = '0'+s;
	return [h, m, s].join(':');
};

Views.alert = function(message) {
	$(".alert").removeClass("hidden");
	$(".alert .alert-text").html(message);
};

Views._network = function(name) {
	return '<div class="network" id="network-'+name+'">' + 
		'<span class="expanded" data-target="'+name+'-channels" ></span>' +
		'<span class="network-name">'+name+'</span>' +
		'<a class="add-channel" data-network="'+name+'" data-toggle="modal" data-target="#modal-join-channel" title="Join channel"></a>' +
	'</div>' +
	'<div class="network-channels clearfix" id="'+name+'-channels"></div>';
};

Views._buffer = function(bufferId, name) {
	return '<div class="channel off" data-buffer-id="'+bufferId+'">' + 
		'<span class="channel-icon"></span>' + 
		'<span class="channel-name">'+name+'</span>' + 
	'</div>';
};

Views._bufferline = function(type, datetime, sender, content, highlight) {
	var htmlcontent = Views.utils.escapetags(content), classes = ["irc-message", "type-"+type];
	if (type == MT.Plain) {
		htmlcontent = Autolinker.link(htmlcontent, {stripPrefix: false, email: false, twitter: false});
	}
	if (highlight) classes.push("highlighted");
	return '<li class="'+classes.join(" ")+'">'+
	'<span class="timestamp"> '+Views.utils.HHmmss(datetime)+'</span>'+
	'<span class="nick">'+Views.utils.escapetags(Views.utils.stripnick(sender))+'</span>'+
	'<span class="message">'+htmlcontent+'</span></li>';
};

Views._userline = function(nick) {
	return '<div class="user" data-nick="'+nick+'">'+
	'<span class="user-icon user-icon-active"></span>'+
	'<span class="user-name">'+Views.utils.escapetags(nick)+'</span></div>';
};

Views.decorateSender = function(type, sender) {
	var dec = Views._decorator.sender[type];
	if (typeof dec === 'string') return dec;
	if (typeof dec === 'function') return dec(sender);
	return sender;
};

Views.decorateContent = function(type, sender, content) {
	var dec = Views._decorator.content[type];
	if (typeof dec === 'string') return dec;
	if (typeof dec === 'function') return dec(sender, content);
	return content;
};

Views.clearUsers = function() {
	$('#users-user, #users-voiced, #users-operator').html("");
};

Views.addUser = function(buffer, user) {
	var userline = Views._userline(user.nick);
	if (buffer.isOp(user.nick)) {
		$('#users-operator').append(userline);
	} else if (buffer.isVoiced(user.nick)) {
		$('#users-voiced').append(userline);
	} else {
		$('#users-user').append(userline);
	}
};

Views.removeUser = function(buffer, nick) {
	$('.group-users [data-nick="'+nick+'"]').remove();
};

Views.addNetwork = function(name) {
	var networkNames = $('.network'), names = [], networkIds = [], i = 0;
	var html = Views._network(name);
	var lowercaseName = name.toLowerCase(), spot = null;
	networkNames.each(function(){
		names.push($(this).children(".network-name").text().toLowerCase());
		networkIds.push($(this).attr("id"));
	});
	for (; i<names.length && spot === null; i++) {
		if (lowercaseName.localeCompare(names[i]) < 0) {
			spot = i;
		}
	}
	if (spot === null) {
		$('#buffer-pane .buffer-container').append(html);
	} else {
		$("#"+networkIds[spot]).before(html);
	}
};

Views.addBuffer = function(networkname, bufferId, name) {
	// Keep buffer ordered alphabetically
	var channels = $('#'+networkname+'-channels .channel'), names = [], bufferIds = [], i = 0;
	var html = Views._buffer(bufferId, name);
	var lowercaseName = name.toLowerCase(), spot = null;
	channels.each(function(){
		names.push($(this).text().toLowerCase());
		bufferIds.push(parseInt($(this).attr("data-buffer-id"), 10));
	});
	for (; i<names.length && spot === null; i++) {
		if (lowercaseName.localeCompare(names[i]) < 0) {
			spot = i;
		}
	}
	if (spot === null) {
		$('#'+networkname+'-channels').append(html);
	} else {
		$(".channel[data-buffer-id="+bufferIds[spot]+"]").before(html);
	}
};

Views.setStatusBuffer = function(networkname, bufferId) {
	$('#network-'+networkname+' .network-name').attr("data-buffer-id", bufferId);
};

Views.getMessage = function(message) {
	var sender = Views.decorateSender(message.type, message.sender);
	var content = Views.decorateContent(message.type, message.sender, message.content);
	return Views._bufferline(message.type, message.datetime, sender, content, message.isHighlighted());
};

Views.addMessage = function(message) {
	reviver.afterReviving(message, function(obj) {
		$(".backlog").append(Views.getMessage(obj));
	});
};

Views.isBufferShown = function(bufferId) {
	return $(".backlog").data('currentBufferId') == bufferId;
};

Views.showBuffer = function(buffer) {
	var backlogs = [];
	buffer.messages.forEach(function(val, key) {
		backlogs.push(Views.getMessage(val));
	}, function(a, b) {
		return a.id - b.id;
	});
	$(".backlog").html(backlogs.join("\n")).data('currentBufferId', buffer.id);
	if (buffer.topic) {
		$("#topic").text(buffer.topic);
	} else {
		$("#topic").html("");
	}
	Views.clearUsers();
	Views.showUsers(buffer);
};

Views.showUsers = function(buffer) {
	for (var nick in buffer.nickUserMap) {
		Views.addUser(buffer, buffer.nickUserMap[nick]);
	}
};

Views.showBuffers = function() {
	$("#show-buffers").hide();
    $("#hide-buffers").show();
    $("#buffer-pane").removeClass("col-md-0").addClass("col-md-2");
    $("#buffer-pane .buffer-container").css("opacity", "1");
};

Views.hideBuffers = function() {
	$("#show-buffers").show();
    $("#hide-buffers").hide();
    $("#buffer-pane").removeClass("col-md-2").addClass("col-md-0");
    $("#buffer-pane .buffer-container").css("opacity", "0");
};

Views.showNicks = function() {
	$("#show-nicks").hide();
    $("#hide-nicks").show();
    $("#nick-pane").removeClass("col-md-0").addClass("col-md-2");
    $("#nick-pane .buffer-container").css("opacity", "1");
};

Views.hideNicks = function() {
	$("#show-nicks").show();
    $("#hide-nicks").hide();
    $("#nick-pane").removeClass("col-md-2").addClass("col-md-0");
    $("#nick-pane .buffer-container").css("opacity", "0");
};

Views.hideBuffer = function(bufferId) {
	$(".channel[data-buffer-id="+bufferId+"]").addClass("hidden");
};

Views.activateBuffer = function(bufferId)  {
	$(".channel[data-buffer-id="+bufferId+"]").removeClass("off").addClass("on");
};

Views.deactivateBuffer = function(bufferId)  {
	$(".channel[data-buffer-id="+bufferId+"]").removeClass("on").addClass("off");
};

Views.connecting = function()  {
	$("body").removeClass("disconnected").addClass("connecting");
};

Views.connected = function()  {
	$("body").removeClass("disconnected connecting");
	$("#messagebox").removeAttr("disabled");
	$(".btn-connect").removeAttr("disabled");
};

Views.disconnected = function() {
	$("body").removeClass("connecting").addClass("disconnected");
	$("#messagebox").attr("disabled", "disabled");
	$(".btn-connect").attr("disabled", "disabled");
};

Views.clear = function() {
	$("#buffer-pane .buffer-container").html("");
	$("#backlog-container .backlog").html("");
	$("#nick-pane .group-users").html("");
};

Views.showLoginPage = function() {
	Views.clear();
	$(".login").removeClass("hidden");
	$(".logged").addClass("hidden");
};

Views.showQuassel = function() {
	$('.login-page').removeClass('login-page');
	$('.container.login').addClass('hidden');
	$('.logged').removeClass('hidden');
};

Views.scrollOnNewMessage = function() {
	var backlogDom = $('.backlog').get(0);
	var scrollBottom = backlogDom.scrollHeight - backlogDom.scrollTop - 35;
	var height = $('.backlog').height();
	if (scrollBottom <= height) {
		$(".backlog").scrollTop(backlogDom.scrollHeight);
	}
};