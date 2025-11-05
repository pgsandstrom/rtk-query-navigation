# RTK Query Navigation

When working with [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) it is slight annoying when you run "go to definition" on your `useGetStuffQuery` and you just find yourself at the export of the query, instead of the implementation. This extension fixes so the "go to definition" actually goes to the implementation of the API call.

The extension loads a typescript server plugin that actually patches the "go to definition" call. This should result in a performant and smooth experience.

The logic is quite simple: When "go to definition" is launched, check if target is a function that matches RKT naming. Then after the target is resolved, search the target file for a function without the `use(lazy)` and `Query/Mutation` part.

If the logic fails in some scenario, please create an issue and I'll have a look at it. PR:s are also welcome

## Development

Getting the new version of the plugin into the extension is a mess. When building we must use a tarball as dependency, and then the hash of the file is saved in the lockfile and aggressively cached.
We must use tarball since "normal" install ends up being a symlink that VSIX dont support. And currently npm10 have issues with not symlinking dependencies.
Maybe the best current hax would be to change the tarball filename on each compile, and modify the dependency in package.json. But that is also ugly.
Currently I just do some manual work, like deleting the lockfile. TODO: fix something.
Conclusion: The cache is super hard to bust. We need to do the rename thing, even if it will create a bunch of ugly git diffs.

The whole build-process feels quite fragile, and I wonder if it will break if we include other dependencies. If so, make sure to dig into the .vscodeignore file.
