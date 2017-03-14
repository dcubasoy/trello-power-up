/* global TrelloPowerUp */
var DROPLR_ICON = './images/logo.png';
var DROPLR_GRAY_ICON = './images/icn.svg';
var DROPLR_WHITE_ICON = './images/icn-white.svg';
var test_drop_regex = /^(http|https):\/\/d\.pr\/[ivf]\/\w{3,8}/
var test_drop_cover_image_regex = /^Cover image for drop /
// [1] = Protocol
// [2] = Drop Type
// [3] = Drop Code
// [4] = Drop Access Code
var capture_drop_regex = /^(http|https):\/\/d\.pr\/([ivf])\/(\w{3,8})\/?(\w*)\/?/

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
    return TrelloPowerUp.Promise.all([
		t.get('board', 'private', 'hideCoverAttachments', "hide")
	])
	.spread(function(hideCoverAttachments){
		var claimed
		if(hideCoverAttachments == "hide") {
			claimed = options.entries.filter(function(attachment){
				return test_drop_regex.test(attachment.url) || test_drop_cover_image_regex.test(attachment.name) || test_drop_cover_image_regex2.test(attachment.name);
			});
		} else {
			claimed = options.entries.filter(function(attachment){
				return test_drop_regex.test(attachment.url);
			});
		}

		if(claimed && claimed.length > 0){
			return [{
				id: 'droplr', // optional if you aren't using a function for the title
				claimed: claimed,
				icon: DROPLR_ICON,
				title: 'Drops',
				content: {
				type: 'iframe',
				url: t.signUrl('./section.html', { arg: 'you can pass your section args here' }),
					height: 230
				}
			}];
		} else {
			return [];
		}
	});
  },
  'attachment-thumbnail': function(t, options){
	var dropInfo = formatDropUrl(t, options.url);
    if(dropInfo){
      // return an object with some or all of these properties:
      // url, title, image, openText, modified (Date), created (Date), createdBy, modifiedBy
      return {
        url: options.url,
        title: options.url,
        image: {
          url: dropInfo.thumbnail,
          logo: false
        },
        openText: 'Open Drop'
      };
    } else {
      throw t.NotHandled();
    }
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
	var dropInfo = formatDropUrl(t, options.url);
	if(dropInfo){
		return TrelloPowerUp.Promise.all([
			t.get('board', 'private', 'linkBehavior', 'embed')
		])
		.spread(function(savedLinkBehavior){
			if(savedLinkBehavior === "embed") {
				return {
					name: options.url,
					desc: '![' + options.url + '](' + dropInfo.fullsize + ')'
				};
			} else {
				return {
					name: options.url,
					desc: options.url
				};
			}
		});
    } else {
		throw t.NotHandled();
    }
  },
  'format-url': function(t, options) {
	var dropInfo = formatDropUrl(t, options.url);
    if(dropInfo){
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
