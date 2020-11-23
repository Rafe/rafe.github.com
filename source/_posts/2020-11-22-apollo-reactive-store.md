title: Announce apollo-reactive-store
tags: programming
date: 2020-11-22 22:58:03
---

![cover image](top.png)

State management in frontend is always a problem. Unlike backend, the state in frontend world is pretty fragmented. Not only the local state at each component, the remote state from API, also the global state that is shared in multiple components. There is always a dilemma in react that, we want to make the component as simple as pure function and only rely on props, but passing every prop down several levels makes the props list pretty big and complicated. Another problem is how to manage data from API, do we need to put data into the global state? or we only use it locally for a component? For solving those problems, state management libraries try to pushing for different solutions:

- [Redux](https://redux.js.org/)
Redux is the most popular approach that follows a single directional data flow and pure functional solution. But in the tradeoff, it brings multiple concepts to include actions, reducers, dispatch, and selectors into the app. Can often make creating simple interaction complicate, if the user wants to manage every state into Redux as the framework suggested.
- [Mobx](https://mobx.js.org/)
Mobx is on another side of the spectrum, which follow object-oriented and not opinionated. Users are free to create objects and subscribe to them in the react component. But the trade-off is no single data flow, and hard to understand because the code has less structure.
- [Recoil](https://recoiljs.org/)
Recoil is an experimental framework for managing the global state, but a promising one. It acts as an extension of useState but depends on the atom key to share it globally. And provide a selector to create derived and handle remote state. It will be a good fit for smaller applications compare to Redux.
- [Zustand](https://zustand.surge.sh/)
Zustand is a pretty elegant and simple state management library. It provides a single store combine with methods to modify, set state, and hooks for react, without complicated settings like redux and also highly efficient.

## Apollo and Reactive var

Recently in Apollo client 3, it introduces another option for state management, which is to manage the state in Apollo cache and read by graphql query. It's called ["Reactive Var"](https://www.apollographql.com/docs/react/local-state/reactive-variables/). There are several reasons to manage state in apollo cache:

- It makes Graphql query the source of truth, so the app only needs to rely on `useQuery` as the endpoint of the external state.
- Graphql already caches the query response in Apollo cache, so it unifies remote and global states together.

However, before Apollo 3, users have to use `writeQuery` API with the graphql query to write state into Apollo cache, which is pretty complicated. Reactive Var simplifies how to integrate state into Apollo cache.

About how ReactiveVar works, we can check the [source code](https://github.com/apollographql/apollo-client/blob/a975320528d314a1b7eba131b97d045d940596d7/src/cache/inmemory/reactiveVars.ts) for more details. When we read a reactive var from the query, it read the current value in reactiveVar and store the current cache slot. And when the value is updated, it will broadcast caches that the value has been updated, and the cache will notify the subscriber to update.

## Apollo Reactive Store

ReactiveVar provides a way to manage the state in apollo cache. But it still has a couple of problems that it is hard to use, update, and manage those vars. Therefore I created a package to manage reactiveVar with a simple and easy to use API:

```js
// create store
const store = create({
  counter: 1,
});

// initialize in apollo client
const client = new ApolloClient({
  uri: "API_URL",
  cache: new InMemoryCache({
    typePolicies: store.getTypePolicies()
  })
});

// use it in component
function App() {
  const { loading, error, data } = useQuery(gql`
    query {
      counter
    }
  `, { client });

  if (loading || error) { return null }

  const { counter } = data;

  return (
    <div>
      <h1>{counter}</h1>
      <button onClick={() => store.update("counter", counter + 1)}>+1</button>
      <button onClick={() => store.update("counter", counter - 1)}>-1</button>
    </div>
  );
}
```

With this interface, we can see the state and query with Graphql. When updating we can use the store instead of reactiveVar, so it's possible to manage multiple reactive var at the same time.

Using reactive var can make managing state the same as query data from API. However, it also brings some confusion about how the state is managed:

- No type and schema declarations for reactive var.
- On testing, it will confuse with `MockedProvider`, since the updating store will not reflect on MockedProvider in this case.
- For applications with a large amount of states, it might be hard to manage everything in one store.

Those problems will be tackled in the future versions, and welcome any pull request to improve the library:

[Apollo Reactive Store](https://github.com/rafe/apollo-reactive-store)