/* global TrelloPowerUp */
var DROPLR_ICON = './images/logo.png';
var DROPLR_GRAY_ICON = './images/icn.svg';
var DROPLR_WHITE_ICON = './images/icn-white.svg';
// [1] = Protocol
// [2] = Drop Type
// [3] = Drop Code
// [4] = Drop Access Code

var cardButtonCallback = function(t){
  return t.popup({
    title: 'Droplr',
	url: './card-button.html',
    height: 200
  });
};

var boardButtonCallback = function(t){
  return t.popup({
    title: 'Droplr',
	url: './board-button.html',
	
    height: 250
  });
};

TrelloPowerUp.initialize({
  'attachment-sections': function(t, options){
    var isBasicDrop;
	var needsMoreAnalysis = [];
	var unknownAttachments = [];
	var claimed = [];
	var covers = [];
	var dropMap = new Map();
	var capture_results;
	var hideCoverImages = true;
	var extractedCode = "";
	return TrelloPowerUp.Promise.all([
		t.get('board', 'private', 'hideCoverAttachments', "hide", true)
	])
	.then(function(settings){
		hideCoverImages = settings[0];
		console.log("hideCoverImages: " + hideCoverImages);
		claimed = options.entries.filter(function(attachment){
			isBasicDrop = test_drop_regex.test(attachment.url);
			if(isBasicDrop) {
				capture_results = capture_drop_regex.exec(attachment.url);
				if(capture_results != null) {
					dropMap.set(captureResults[3], true);
					console.log("Drop map updated for code " + captureResults[3]);
				}
				return true;
			} else if(couldBeDrop(attachment.url)) {
				needsMoreAnalysis.push(getEmbedInfo(attachment.url));
				unknownAttachments.push(attachment);
				return false;
			} else {
				return false;
			}
		});
		
		return TrelloPowerUp.Promise.all(needsMoreAnalysis);
	})
	.then(function(results) {
		for(var i = 0; i < results.length; i++) {
			embedInfo = JSON.parse(results[i]);
			if(embedInfo.hasOwnProperty("shortLink")) {
				dropMap.set(embedInfo.code, true);
				console.log("Drop map updated for code" + embedInfo.code);
				claimed.push(unknownAttachments[i]);
			}
		}
	})
	.then(function() {
		if(hideCoverImages) {
			console.log("The user has hidden cover images, time to evaluate all of the covers found");
			covers = options.entries.filter(function(attachment){
				console.log("Testing attachment " + attachment.name);
				extractedCode = extractDropCodeFromCover(null, attachment.name);
				console.log("Extracted code: " + extractedCode);
				if(extractedCode) {
					console.log("The cover image looks like it is for a drop");
					console.log("Do we have a drop with the same code? " + dropMap.has(extractedCode));
					return dropMap.has(extractedCode);
				} else {
					return false;
				}
			});
			
			for(i = 0; i < covers.length; i++) {
				claimed.push(covers[i]);
			}
		}
	})
	.then(function() {
		if(claimed && claimed.length > 0){
			return [{
				id: 'droplr', // optional if you aren't using a function for the title
				claimed: claimed,
				icon: DROPLR_ICON,
				title: 'Drops',
				content: {
					type: 'iframe',
					url: t.signUrl('./section.html'),
					height: 230
				}
			}];
		} else {
			return [];
		}
	});
  },
  'board-buttons': function(t, options) {
    return [{
      icon: DROPLR_WHITE_ICON,
      text: 'Droplr',
      callback: boardButtonCallback
    }];
  },
  'card-buttons': function(t, options) {
    return [{
      icon: DROPLR_GRAY_ICON,
      text: 'Droplr',
      callback: cardButtonCallback
    }];
  },
  'card-from-url': function(t, options) {
	return formatDropUrl(t, options.url)
	.then(function(dropInfo) {
		if(dropInfo){
			return TrelloPowerUp.Promise.all([
				t.get('board', 'private', 'linkBehavior', 'embed')
			])
			.spread(function(savedLinkBehavior){
				if(savedLinkBehavior === "embed") {
					return {
						name: dropInfo.title,
						desc: '![' + dropInfo.url + '](' + dropInfo.fullsize + ')'
					};
				} else {
					return {
						name: dropInfo.title,
						desc: options.url
					};
				}
			});
		} else {
			throw t.NotHandled();
		}
	})
  },
  'format-url': function(t, options) {
	//var dropInfo = formatDropUrl(t, options.url, options.url
	var isBasicDrop = test_drop_regex.test(options.url);
    if(isBasicDrop){
	  return {
        icon: DROPLR_ICON,
        text: options.url
      };
    } else {
      throw t.NotHandled();
    }
  },
  'show-settings': function(t, options){
    return t.popup({
      title: 'Droplr Settings',
      url: './settings.html',
      height: 184
    });
  },
  'authorization-status': (function (t) {
	 return new TrelloPowerUp.Promise(function (resolve) {
		return t.get('organization', 'private', 'token', null)
		.then(function(orgToken) {
			if(orgToken === null) {
				return t.get('board', 'private', 'token', null)
				.then(function(boardToken) {
					
					if(boardToken === null) {
						return resolve({ authorized: false });
					} else {
						return resolve({ authorized: true });
					}
				})
				.catch(function() {
					return resolve({ authorized: false });
				})
			} else {
				return resolve({ authorized: true });
			}
		})
		.catch(t.NotHandled, function() {
			return resolve({ authorized: false });
		})
    });
  }),
  'show-authorization': function(t) {
    return t.popup({
      title: 'Get More Droplr Features',
      url: 'authorize.html',
      height: 140,
    })
  }
});
