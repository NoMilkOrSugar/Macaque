Macaque
========

**Macaque** is a to-do/list app made with [Node](http://nodejs.org/) and [Ember](http://emberjs.com/). This is a learning experiment and under heavy development so don't expect anything good or stable right away!

![Macaque Screenshot](https://raw.github.com/dbushell/Macaque/master/public/img/screenshot.png)

## Running Macaque

Macaque requires [Node](http://nodejs.org/) and [MongoDB](http://www.mongodb.org/).

* run `npm install`
* install and run `mongod` (if not already running)
* configure options in `app.js` and run `node app`
* visit: `http://localhost:3000/`
* Macaque!

### Loading Data

Macaque can export and backup data as JSON via the API and to disk (in the `.macaque/` directory by default). To load the most recent backup run Macaque with `node app --backup`. The backup files in this repository include the development to-do lists — Macaque is now self-aware!

To reset Macaque with test data visit: `http://localhost:3000/api/import/fixtures`

* * *

Copyright (c) [David Bushell](http://dbushell.com) | [@dbushell](http://twitter.com/dbushell)
