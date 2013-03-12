# Equinox

## Build & Run

For building you require **node.js** with **npm** to be installed on your machine. Check [nodejs.org](http://nodejs.org/download/) to get needed binaries for you system.

To **build** project, execute following command in terminal/console: `make`. This will load all dependencies.

To **run** project, execute following command in terminal/console: `make run`. This will run HTTP server to serve project files. The default port is 8000, but you can specify any port (port numbers below 1024 will require **sudo**). For example `make run port=7070` will start HTTP server on port *7070*, so you can reach it at [localhost:7070](http://localhost:7070/). If you try to start server on already used port, you'll get **listen EACCES** error.