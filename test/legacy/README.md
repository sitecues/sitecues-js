# `/tests`
This folder contains old, valuable but broken automated test cases and helpers.

These files were from an era before sitecues made the switch to using AMD modules. They make heavy use of a fake DOM via jsdom, lots of mocking, and are targeted at the mocha testing framework. These should be ported over to our newer Intern testing framework as soon as possible and run in real browsers.

### Get Started
See the [full documentation](https://equinox.atlassian.net/wiki/pages/viewpage.action?pageId=38666258 "Documentation for Automated Tests.").

### Run a Test
Move up two directories and use the build system to do it.
````bash
cd ../../ && npm install && grunt test
````

### Write a Test
1. Choose a feature to test.
2. Choose a test type, unit or functional.
3. Create a new file for it in the folder appropriate for that test type.
4. Use a smoke test as a template to base your test off of.
5. Add your new test file to the configuration.
