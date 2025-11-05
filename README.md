# rtk-go-to-definition

When working with [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) it is slight annoying when you run "go to definition" on your `useGetStuffQuery` and you just find yourself at the export of the query, instead of the implementation. This extension fixes so the "go to definition" actually goes to the implementation of the APi call.

The extension loads a typescript server plugin that actually patches the "go to definition" call. This should result in a performant and smooth experience.

The logic is quite simple: When "go to definition" is launched, check if target is a function that matches RKT naming. Then after the target is resolved, search the target file for a function without the `use(lazy)` and `Query/Mutation` part.

If the logic fails in some scenario, please create an issue and I'll have a look at it. PR:s are also welcome

## development

Best is to start a `npm watch` in the typescript server plugin folder, currently called `my-plugin`. It is necessary to have that part in a separate project, that is why we have that design.
