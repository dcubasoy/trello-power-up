var Promise = TrelloPowerUp.Promise;var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();
var trelloApiKey = "d4555b9abf43f890715d5a12c07dea09";
var authReturnUrl = "https://power-up.droplr.com/confirm-auth.html"

t.render(function () {
    return t.sizeTo('#content')
                .done();
});

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var oauthUrl = "https://trello.com/1/authorize?expiration=never" +
  "&name=Droplr&scope=read,write&key=" + trelloApiKey + "&callback_method=popup" +
  "&return_url=" + authReturnUrl;

var tokenLooksValid = function(token) {
  return /^[0-9a-f]{64}$/.test(token);
}

var authorizeOpts = {
  height: 680,
  width: 580,
  validToken: tokenLooksValid
};

var authBtn = document.getElementById('authorize');
authBtn.addEventListener('click', function() {
  t.authorize(oauthUrl, authorizeOpts)
  .then(function(token) {
	return t.set('organization', 'private', 'token', token)
	.catch(t.NotHandled, function() {
	// fall back to storing at board level
		return t.set('board', 'private', 'token', token)
	});
  })
  .then(function() {
    // now that the token is stored, we can close this popup
    // you might alternatively choose to open a new popup
    return t.closePopup();
  })
  .catch(function(reason) {
	  console.log("Failed to authorize. Reason:\n" + JSON.stringify(reason));
  });
});

