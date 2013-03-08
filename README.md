burrower
========

Tool to manage toggling tunnelling to remote services

Requirements
------------

* node.js with npm
* ssh

Usage
-----

Download onto machine and install dependencies

    git clone git://github.com/glenjamin/burrower.git
    cd burrower
    npm install

Edit `data.js` to define your desired SSH tunnels, see `data.js.template` for an
example.

Start the server:

    node app.js

Point your web browser at http://localhost:2222

TODO
----

* Refactor tunnels into a model
* Hearbeat SSH tunnels
* Store log output
* Manage host file hijack
* Run as root on startup, setuid on children?