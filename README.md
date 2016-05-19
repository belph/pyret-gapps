# Pyret Google Apps Scripts

This repository contains [Google Apps Scripts][GAS] which 
[`code.pyret.org`][CPO] can use to interface with Google Apps. 

## Rationale

The Google Apps Script interface is sufficiently versatile that
it would be useful to have in the Pyret toolkit, but the framework
is not very admissible to version control systems. Google provides
a [rudimentary NPM package][node-gas] which provides a jumping off
point for workflow integration. As such, here is the way in which
this repository is used:

- The `master` branch contains the scripts which are in production.
  The `code.pyret.org` deployment process pushes these scripts to the
  appropriate Google server for use on CPO
- Other branches are working branches.

## TODO

- Add a flag to CPO build pipeline to allow non-master branches to be used
  for testing
- Look into removing Gulp Dependency
- Remove cruft from `node-google-apps-script` demo
- Migrate from Proxy to preprocesser-generated class (`mustache`-generated?)
- Finish hammering out CPO build process integration


[CPO]: https://github.com/brownplt/code.pyret.org
[GAS]: https://developers.google.com/apps-script/
[node-gas]: https://www.npmjs.com/package/node-google-apps-script
