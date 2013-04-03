# SiteCues

It is required that **Node** and **NPM** be installed on your machine. Check [http://nodejs.org](http://nodejs.org/download/) to get the needed binaries for you system.

Execute `make deps` to set up all the NPM dependencies.

Execute `make clean` to prepare for the build.

Execute `make build` to launch the build process.

Execute `make run` to launch the server for interaction.

It is also possible to execute just `make` & the full command `make clean deps build` will be executed automatically, then just execute `make run` as usual. _It is still possible to pass in the flags. They will work as expected._

## `make build` flags:

Name | Options | Default | Description
--- | --- | --- | ---
`dev` | `true`,`false` | `false` | If `true`, development mode will be turned on.
`lint` | `true`,`false` | `false` | If `true`, the linting process will launch when the build process is started.
`min` | `true`,`false` | `true` |

## `make run` flags:

Name | Options | Default | Description
--- | --- | --- | ---
`https` | `on`,`off` | `off` | If `on`, HTTPS will be turned on. HTTPS listens on port `443`. _This requires **root** permissions._
`port` | {number} | `8000` | TCP port number the server should listen on. _Any TCP port number lower than `1024` requires **root** permissions._