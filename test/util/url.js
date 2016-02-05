define(
    [
        'intern/dojo/node!url'
    ],
    function (url) {

        'use strict';

        const
            base =
                'http://tools.qa.sitecues.com:9000/site/';

        function testUrl(to, localPort) {

            const loaderOptions =
                    '?scjsurl=//' +
                    (localPort
                        ?
                            'localhost:' + localPort + '/js/sitecues.js'
                        :
                            'js.dev.sitecues.com/l/s;id=s-00000005/dev/latest/js/sitecues.js'
                    ) +
                    '&scwsid=s-00000005' +
                    '&scuimode=badge';

            return url.resolve(base, to + loaderOptions);
        }

        return testUrl;
    }
);
