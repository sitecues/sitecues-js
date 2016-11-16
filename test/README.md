# `/test`

This folder contains automated test suites and helpers.

Note: We have many old tests from a previous version of our testing architecture located in the `legacy` folder. The intention is to migrate those to Intern.

### Get Started

See the [full documentation](https://equinox.atlassian.net/wiki/pages/viewpage.action?pageId=38666258 "Documentation for Automated Tests.").

### Run a Test

Move up one directory and use the build system to do it.

```sh
cd .. && npm install && npm test
```

### Write a Test

1. Choose a feature to test.
2. Choose a test type, unit or functional.
3. Create a new file for it in the folder appropriate for that test type.
4. Use an existing test as a template to base your test off of.
