title: React Suspense and Error Boundary
tags: react
date: 2021-01-12 08:50:00
---

![cover image](cover.png)

TLDR: Suspend can catch Promise from children and render fallback until the promise is resolved.

In React 16.6, React is adding the `Suspense` component that it can render fallback while the app is loading javascript or fetching API. You can see the demonstration from Dan Abramov's [presentation](https://www.youtube.com/watch?v=nLF0n9SACd4) in React conf.

From the [documentation](https://reactjs.org/docs/concurrent-mode-suspense.html) on Reactjs webside, the example below:

{% gist c8bf4007cbd2d09c24efed8059aa3ee0 ProfilePage.js %}

Can render "Loading profile..." while `ProfileDetails` is loading, and "Loading posts..." while `ProfileTimeline` is loading. It can control the timing of render components, skip the children while loading, and avoid race conditions in children. However, it doesn't just work like magic as the document described. Because for the Suspense component to work, the API needs to follow certain criteria.

How Suspense work is similar to the ErrorBoundary in React, for example:

{% gist c8bf4007cbd2d09c24efed8059aa3ee0 ErrorBoundary.js %}

Can catch any errors thrown in the children and skip the render in children. Suspense is similar to ErrorBoundary, But instead of catching the error, it is catching Promise that is thrown from the children, render fallback while the promise is pending, and unblock the children when the promise is resolved.

To understand how it works, we can take a look at the source code of [`React.Lazy`](https://github.com/facebook/react/blob/master/packages/react/src/ReactLazy.js), `React.Lazy` can work with Suspense, wrapping javascript `import` and trigger Suspense fallback while loading the component:

{% gist c8bf4007cbd2d09c24efed8059aa3ee0 LazyComponent.js %}

A simplified version of `React.lazy` source code looks like this:

{% gist c8bf4007cbd2d09c24efed8059aa3ee0 React.lazy.js %}

Therefore for Suspense to work, the API needs to:

1. Trigger `Promise` that loads the data
2. Throw the `Promise` while loading
3. Cache the result and return the result when the `Promise` is resolved.

## Data Fetching 

Let's try to implement data fetching to support Suspense. We can reuse the concept in `React.lazy` and replace the `import` with `fetch` 

{% gist c8bf4007cbd2d09c24efed8059aa3ee0 SuspenseFetch.js %}

With the `suspenseFetch` function above, we can convert fetch into a suspense compatible API.

[use-async-resource](https://github.com/andreiduca/use-async-resource) is a package that can turns fetch into suspense compatible API too, with support for params and fetching the new result. It is a good resource if you want to implement the API with Suspense.

## Conclusion

Suspense is an interesting concept that makes errors and async handling declarative, and it is supported on React level so it will be more stable and easy to handle in the future. However, the Apollo graphql client will not support Suspense API due to the usage of `useRef` does not support throwing promises and errors. But we will see more libraries in React world support Suspense in the future.

## Reference

- https://itnext.io/what-the-heck-is-this-in-react-suspense-c5e641e487a
- https://github.com/andreiduca/use-async-resource
- https://dev.to/andreiduca/practical-implementation-of-data-fetching-with-react-suspense-that-you-can-use-today-273m