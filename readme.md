# SiteCues.

It is required that **Node** and **NPM** be installed on your machine. Check [http://nodejs.org](http://nodejs.org/download/) to get the needed binaries for you system.

Execute `make clean` to prepare for the build.

Execute `make` to set up all the NPM dependencies.

Execute `make build` to launch the build process.

Execute `make run` to launch the server for interaction.

## `make build` flags.

<table>
    <tr>
        <th>Name</th>
        <th>Options</th>
        <th>Default</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>dev</code></td>
        <td><code>true</code>&nbsp;|&nbsp;<code>false</code></td>

        <td><code>false</code></td>
        <td>If <code>true</code>, development mode will be turned on.</td>
    </tr>
    <tr>
        <td><code>lint</code></td>
        <td><code>true</code>&nbsp;|&nbsp;<code>false</code></td>

        <td><code>false</code></td>
        <td>If <code>true</code>, the linting process will launch when the build process is started.</td>
    </tr>
    <tr>
        <td><code>min</code></td>
        <td><code>true</code>&nbsp;|&nbsp;<code>false</code></td>
        <td><code>true</code></td>
        <td>&nbsp;</td>
    </tr>
</table>

## `make run` flags.

<table>
    <tr>
        <th>Name</th>
        <th>Options</th>
        <th>Default</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>https</code></td>
        <td><code>on</code>&nbsp;|&nbsp;<code>off</code></td>
        <td><code>off</code></td>
        <td>If <code>on</code>, HTTPS will be turned on. HTTPS listens on port <code>443</code>. Note: <em>Requires <u><strong>root</strong></u> permissions</em>.</td>
    </tr>
    <tr>
        <td><code>port</code></td>
        <td>{number}</td>
        <td><code>8000</code></td>
        <td>TCP port number the server should listen on. Note: <em>Any TCP port number lower than <code>1024</code> requires <u><strong>root</strong></u> permissions</em>.</td>
    </tr>
</table>