/**
 * JS Interface for Google App Script
 * interaction
 *
 * NOTE: Before loading, `gapi` should be in scope and authenticated
 *
 * NOTE: This is a CLIENT-side script!
 */
"use strict";
function createGAppsAPI(clientId, apiKey, immediate, scriptId) {
  var API_FUNCS = ['countSheets'];
  var script;
  gapi.client.setApiKey(apiKey);
  var drive;
  var SCOPE = "https://www.googleapis.com/auth/drive.file "
      + "https://www.googleapis.com/auth/drive "
      + "https://spreadsheets.google.com/feeds "
      + "https://www.googleapis.com/auth/drive.install";
  var FOLDER_MIME = "application/vnd.google-apps.folder";
  var BACKREF_KEY = "originalProgram";
  var PUBLIC_LINK = "pubLink";

  function DriveError(err) {
    this.err = err;
  }
  DriveError.prototype = Error.prototype;

  function failCheck(p) {
    return p.then(function(result) {
      // Network error
      if(result && result.error) {
        console.error("Error fetching file from gdrive: ", result);
        throw new DriveError(result);
      }
      if(result && (typeof result.code === "number") && (result.code >= 400)) {
        console.error("40X Error fetching file from gdrive: ", result);
        throw new DriveError(result);
      }
      return result;
    });
  }

  var refresh = function(immediate) {
    return reauth(true);
  };

  var reauth = function(immediate) {
    var d = Q.defer();
    if(!immediate) {
      // Need to do a login to get a cookie for this user; do it in a popup
      var w = window.open("/login?redirect=" + encodeURIComponent("/close.html"));
      window.addEventListener('message', function(e) {
        if (e.domain === document.location.origin) {
          d.resolve(reauth(true));
        } else {
          d.resolve(null);
        }
      });
    }
    else {
      // The user is logged in, but needs an access token from our server
      var newToken = $.ajax("/getAccessToken", { method: "get", datatype: "json" });
      newToken.then(function(t) {
        gapi.auth.setToken({access_token: t.access_token});
        d.resolve({access_token: t.access_token});
      });
      newToken.fail(function(t) {
        d.resolve(null);
      });
    }
    return d.promise;
  };
  var initialAuth = reauth(immediate);

  function authCheck(f) {
    function isAuthFailure(result) {
      return result &&
        (result.error && result.error.code && result.error.code === 401) ||
        (result.code && result.code === 401);
    }
    var retry = f().then(function(result) {
      if(isAuthFailure(result)) {
        return refresh().then(function(authResult) {
          if(!authResult || authResult.error) {
            return {error: { code: 401, message: "Couldn't re-authorize" }};
          }
          else {
            return f();
          }
        });
      } else {
        return result;
      }
    });
    return retry.then(function(result) {
      if(isAuthFailure(result)) {
        throw new Error("Authentication failure");
      }
      return result;
    });
  }

  function gQ(request, skipAuth) {
    var oldAccess = gapi.auth.getToken();
    if(skipAuth) { gapi.auth.setToken({access_token: null}); }
    var ret = failCheck(authCheck(function() {
      var d = Q.defer();
      request.execute(function(result) {
        d.resolve(result);
      });
      return d.promise;
    }));
    if(skipAuth) {
      ret.fin(function() {
        gapi.auth.setToken({access_token: oldAccess});
      });
    }
    return ret;
  }

  function callScriptFunction(func, params) {
    var request = {
      'function': func
    }
    if (params && params.length > 0) {
      request['parameters'] = params;
    }

    var op = gQ(script.scripts.run({
      scriptId: scriptId,
      resource: request
    }));

    return op;
  }

  function initialize() {
    script = gapi.client.script;
    return new Proxy({}, {
      get: function(target, name) {
        if (API_FUNCS.includes(name)) {
          return (function(){
            return callScriptFunction(name, Array.prototype.slice(arguments));
          });
        } else {
          return target.name;
        }
      }
    });
  }

  var initialAuth = reauth(immediate);
  return initialAuth.then(function(_) {
    var d = Q.defer();
    gapi.client.load('script', 'v1', function() {
      d.resolve(initialize());
    })
    return d.promise;
  });
}
