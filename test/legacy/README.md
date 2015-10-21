# `/test/legacy`
This folder contains old, valuable but broken test cases and helpers.

These files were from an era before sitecues made the switch to using AMD modules. They make heavy use of a fake DOM via jsdom, lots of mocking, and are targeted at the mocha testing framework. These should be ported over to our newer Intern testing framework as soon as possible and run in real browsers.

See `/test/README.md` for more information on the current testing system.
