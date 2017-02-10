/* global TrelloPowerUp */
var DROPLR_ICON = './images/logo.png';
var DROPL_GRAY_ICON = './images/logo-gray.png';
var test_drop_regex = /^(http|https):\/\/d\.pr\/[ivf]\/\w{3,8}/
// [1] = Protocol
// [2] = Drop Type
// [3] = Drop Code
// [4] = Drop Access Code
var capture_drop_regex = /^(http|https):\/\/d\.pr\/([ivf])\/(\w{3,8})\/?(\w*)\/?/

var getBadges = function(t){
  return t.card('name')
  .get('name')
  .then(function(cardName){
    if(cardName.indexOf('http://d.pr/i') > -1) {
		return [{
			title: 'Detail Badge', // for detail badges only
			text: '2543',
			icon: DROPL_GRAY_ICON, // for card front badges only
			color: ''
		}];
    } else {
      return [];
	}
  })
};

var formatDropUrl = function(t, url){
  if(!test_drop_regex.test(url)){
    return null;
  }
  capture_results = capture_drop_regex.exec(url);
  if(capture_results != null) {
	  var dropParameters = {
		protocol: capture_results[1],
		type: capture_results[2],
		code: capture_results[3],
		accessCode: capture_results[4],
		thumbnail: ''
	};
  
	if(dropParameters.accessCode == 'small' || 
		dropParameters.accessCode == 'medium' || 
		dropParameters.accessCode == 'thumbnail')
	{
		dropParameters.accessCode = '';
	}
  
	if(dropParameters.accessCode.length > 0) {
	  dropParameters.thumbnail = 'https://d.pr/' + dropParameters.code + '/' + dropParameters.accessCode + '/thumbnail';
	} else {
	  dropParameters.thumbnail = 'https://d.pr/' + dropParameters.code + '/thumbnail';
	}
  
	return dropParameters;
  } else {
	  console.log("This url passed the test but failed to capture: " + url);
	  return null;
  }
  
};


TrelloPowerUp.initialize({
  'attachment-sections': function(t, options){
    var claimed = options.entries.filter(function(attachment){
	  //Partially working, will build this out after kick off
      //return attachment.url.indexOf('http://d.pr') == 0;
	  return false;
    });

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
  'card-badges': function(t, options){
    return getBadges(t);
  },
  'card-detail-badges': function(t, options) {
    return getBadges(t);
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
      title: 'Settings',
      url: './settings.html',
      height: 184
    });
  }
});
