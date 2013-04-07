
              ,,
              db    mm
                    MM
    ,pP"Ybd `7MM  mmMMmm   .gP"Ya   ,p6"bo  `7MM  `7MM   .gP"Ya  ,pP"Ybd
    8I   `"   MM    MM    ,M'   Yb 6M'  OO    MM    MM  ,M'   Yb 8I   `"
    `YMMMa.   MM    MM    8M"""""" 8M         MM    MM  8M"""""" `YMMMa.
    L.   I8   MM    MM    YM.    , YM.    ,   MM    MM  YM.    , L.   I8
    M9mmmP' .JMML.  `Mbmo  `Mbmmd'  YMbmd'    `Mbod"YML. `Mbmmd' M9mmmP'

              o8o      .
              `"'    .o8
     .oooo.o oooo  .o888oo  .ooooo.   .ooooo.  oooo  oooo   .ooooo.   .oooo.o
    d88(  "8 `888    888   d88' `88b d88' `"Y8 `888  `888  d88' `88b d88(  "8
    `"Y88b.   888    888   888ooo888 888        888   888  888ooo888 `"Y88b.
    o.  )88b  888    888 . 888    .o 888   .o8  888   888  888    .o o.  )88b
    8""888P' o888o   "888" `Y8bod8P' `Y8bod8P'  `V88V"V8P' `Y8bod8P' 8""888P'

                       I8
                       I8
                gg  88888888
                ""     I8
       ,g,      gg     I8     ,ggg,     ,gggg,  gg      gg   ,ggg,     ,g,
      ,8'8,     88     I8    i8" "8i   dP"  "Yb I8      8I  i8" "8i   ,8'8,
     ,8'  Yb    88    ,I8,   I8, ,8I  i8'       I8,    ,8I  I8, ,8I  ,8'  Yb
    ,8'_   8) _,88,_ ,d88b,  `YbadP' ,d8,_    _,d8b,  ,d8b, `YbadP' ,8'_   8)
    P' "YY8P8P8P""Y888P""Y88888P"Y888P""Y8888PP8P'"Y88P"`Y8888P"Y888P' "YY8P8P

                _    __
       _____   (_)  / /_  ___   _____  __  __  ___    _____
      / ___/  / /  / __/ / _ \ / ___/ / / / / / _ \  / ___/
     (__  )  / /  / /_  /  __// /__  / /_/ / /  __/ (__  )
    /____/  /_/   \__/  \___/ \___/  \__,_/  \___/ /____/

    +---+ +---+ +---+ +---+ +---+ +---+ +---+ +---+
    | s | | i | | t | | e | | c | | u | | e | | s |
    +---+ +---+ +---+ +---+ +---+ +---+ +---+ +---+

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