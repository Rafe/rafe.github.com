title: 'Unlock React.js Success: Avoid those 6 Antipatterns'
date: 2023-11-24 14:54:23
tags: react
---

![cover image](cover.png)

After working on React for a while, it has been through a paradigm shift from class components to functions and hooks, the best practice is constantly changing. However, after research based on my learning from the community and my experience, here are the antipatterns that people are often not aware of but hinder the success of the project:

### 1. Use JSON data to render components

By default, the React component is a declarative XML structure with a sprinkle of javascript. However, often we see people try to separate data and React components, for example rendering a menu with links:

{%codeblock lang:javascript%}

const links = [{
  title: "Posts",
  url: "/posts"
}, {
  title: "Search",
  url: "/search",
  onClick: (e) => {
    e.preventDefault()
    console.log("searching...")
  }
}]

const Menu = () => (
  <>
    {links.map(link =>
      <a href={link.url} onClick={link.onClick}>{link.title}</a>
    )}
  </>
)

{%endcodeblock%}

Looks like the data is separated from render logic, but the React JSX, which is XML, is a data structure too. If we write:

{%codeblock lang:javascript%}

const Menu = () => (
  <>
    <a href="/posts">Posts</a>
    <a href="#" onClick={() => console.log("searching...")}>Search</a>
  </>
)

{%endcodeblock%}

This is equivalent to the previous code, but is less abstract and more flexible since we can add optional logic to the JSX itself, rather than forcing the data to map from same JSON format. With large components, those json mapping can easily be getting out of control.

Another example is the Table header, for example:

{%codeblock lang:javascript%}

const headers = ["ID", "NAME", "PRICE"]
const Table = () => (
  <table>
    <thead>
      {headers.map(header => <th>{header}</th>)}
    </thead>
    <tbody>...</tbody>
  </table>
)

{%endcodeblock%}

It's completely okay to just use pure `<th>ID</th>` instead since it's just a data structure. Unless for some edge cases you need to access the index by header value.

### 2. Remap data from GraphQL/API

One of the advantages of GraphQL is its flexibility to fetch the data we need, however, the field name and the inherited query structure might not 100% match what we want, for example:

{%codeblock lang:javascript%}

const Product = ({ id }) => {
  const { data, loading, error } = useQuery(gql`
    query findProduct($id: ID!) {
      find_product(id: $id) {
        id
        name
        original_price
        discount_price
        category {
          id
          name
        }
      }
    }
  `, { variables: { id }})

  if (loading || error) {
    return null;
  }

  const product = parseProduct(data.find_product)

  return (
    <ProductItem 
      name={product.name}
      price={product.currentPrice}
      category={product.categoryType}
    />
  )
}

function parseProduct(data) {
  return {
    ...data,
    currentPrice: data.discount_price,
    originalPrice: data.original_price,
    categoryType: data.category.name
  }
}

{%endcodeblock%}

Here, because we don't like the structure of GraphQL results, we map the nested fields to flat values and rename the field names to camel case.
Looks okay right? It looks more consistent and more descriptive. However when we want to track where the attributes from, it will inevitably hit the `parseProduct` function and it serves as an obfuscator in this case. Rename variable is good and it's refactor 101, but changing the data structure from API will make it hard to track the flow of data and make the program harder to understand, isn't worth the trade-off.

### 3. Nesting components

React is a component base library, which makes it easy to extract logic into components and use it in another component to separate the logic, however, it creates a problem that sometimes the business logic is nested deep inside the component tree, and makes it hard to understand, for example:

{%codeblock lang:javascript %}

const Query = ({ children }) => {
  const { data, loading, error } = useQuery(POSTS_QUERY);

  if (loading || error) {
    return null
  }

  return children(data.posts)
}

const Page = () => (
  <Query>
    {posts => <Content posts={posts} />}
  </Query>
)

const Content = ({ posts }) => {
  const [page, setPage] = useState(1);

  return (
    <div>
      <Header />
      <Posts posts={posts} page={page} setPage={setPage}>
      <Footer page={page} />
    </div>
  )
} 

const Posts = ({ posts, page, setPage }) => (
  <div>
    {posts.slice(page * 10, 10).map(post => (
      <Post post={post} />
    ))}
    <Pagination page={page} setPage={setPage} />
  </div>
)

const Post = ({ post }) => <div>{post.id}: {post.title}</div>

{%endcodeblock%}

It's a simple component to fetch and show the ID and title of posts, but the nested structure creates layers that need to jump up and down to understand the context, also nested components introduce the problem of props drilling, which is the props need to pass down from parent container, the more level of components, the more props we need to pass down. Compare to a more flattened version:

{%codeblock lang:javascript %}

const Page = () => {
  const { data, loading, error } = useQuery(POSTS_QUERY);
  const [page, setPage] = useState(1);

  if (loading || error) {
    return null
  }

  return (
    <div>
      <Header />
      <div>
        {data.posts.slice(page * 10, 10).map(post => (
          <div>{post.id}: {post.title}</div>
        ))}
        <Pagination page={page} setPage={setPage} />
      </div>
      <Posts posts={posts} page={page} setPage={setPage} />
      <Footer page={page} />
    </div>
  )
}

{%endcodeblock%}

It is more straightforward to understand. When extracting components, we should prefer composition over nesting, extract logic to hooks first, and avoid nesting the component. Also, don't define a child component inside another function component, it might trigger a render issue since each render creates a new function component reference.

### 4. Clean code in the test

Having code without duplication is not a bad thing, but it comes with a cost. In terms of testing, having clean code means the test will be harder to understand and maintain because the test is a part of the code serves as documentation about how to use a component, it is better to keep the test more readable rather than clean, for example:

{%codeblock lang:javascript %}

describe("Component", () => {
  let getByText, getByRole, queryByText, getByAltText
  const data = { post: { id: 1, title: "Post", description: "Test" } }

  beforeEach(async () => {
    { getByText, getByRole, queryByText, getByAltText } = render(<Component data={data}>)

    await waitFor(() => {
      expect(queryByText("Loading")).not.toBeInTheDocument()
    })
  })

  it("display description", () => {
    expect(getByText("Post"))
  })

  it("display button", () => {
    expect(getByRole("button", { name: "Submit" }))
  })
})

{%endcodeblock%}

It looks good that the duplicated render and wait part is in the `beforeEach` block and shared through variables, however, the variable will cause the component to leak into the other tests. And the test itself no longer descriptive, since the majority of the action is happening before the test. A test that follows the steps of setup, action, and assert should be like:

{%codeblock lang:javascript %}

describe("Component", () => {
  const data = { post: { id: 1, title: "Post", description: "Test" } }

  const renderComponent = async (data) => {
    const result = render(<Component data={data}>)

    await waitFor(() => {
      expect(result.queryByText("Loading")).not.toBeInTheDocument()
    })

    return result
  }

  it("display description", () => {
    const { getByText } = renderComponent(data)

    expect(getByText("Post"))
  })

  it("display button", () => {
    const { getByRole } = renderComponent(data)

    expect(getByRole("button", { name: "Submit" }))
  })
})

{%endcodeblock%}

It looks subtle but having the main action part inside the test can avoid variable leaking and make the test more readable and maintainable, especially when working on the long nested tests.

### 5. useEffect

`useEffect` is a hook that was first introduced to replace the original `componentDidMount` and other lifecycle methods, it's a straightforward replacement. However, after people get more familiar with hooks, it turns out that the majority of the `useEffect` usage is a code smell. There are a couple of types of the hook:

1. Transforming data

Lots of usage of useEffect hook is transforming data from API or props into another state, for example:

{%codeblock lang:javascript %}

const Post = ({ id, user }) => {
  const [isAuthor, setIsAuthor] = useState(false)
  const { data, loading, error } = useQuery(QUERY, {
    variables: { id }
  })

  useEffect(() => {
    if (data) {
      setIsAuthor(data.post.author === user.name)
    }
  }, [data])

  if (loading || error) {
    return null;
  }

  const post = data.post

  return (
    <div>
      <h3>{post.title}</h3>
      <p>{post.description}<p>
      {isAuthor && <EditLink id={post.id} />}
    </div>
  )
}

{%endcodeblock%}

This will cause a double render since the use effect will be run after the render. And it turns out most of those states can just reduce from data in render:

{%codeblock lang:javascript %}

const Post = ({ id, user }) => {
  const { data, loading, error } = useQuery(QUERY, {
    variables: { id }
  })

  if (loading || error) {
    return null;
  }

  const post = data.post
  const isAuthor = post.author === user.name

  return (
    <div>
      <h3>{post.title}</h3>
      <p>{post.description}</p>
      {isAuthor && <EditLink id={post.id} />}
    </div>
  )
}

{%endcodeblock%}

Those also include filter and sorting, which is derivative data from filter/sorting params, and the data, we can use `useMemo` hook to replace costly calculations.

2. Handling events

One usage of `useEffect` is the side effect of handling events, for example:

{%codeblock lang:javascript %}

const Page = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      console.log("modal is opened by user")
    }
  }, [isOpen])

  return (
    <div>
      <h1>Title</h1>
      <div>
        Content
      </div>
      <button onClick={() => setIsOpen(true) }>Open Modal</button>
      <Modal isOpen={isOpen} />
    </div>
  )
}

{%endcodeblock%}

Which would be easier to track by triggering the event in the callback itself:

{%codeblock lang:javascript %}

const Page = () => {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => {
    setIsOpen(true)
    console.log("modal is opened by user")
  }

  return (
    <div>
      <h1>Title</h1>
      <div>
        Content
      </div>
      <button onClick={() => openModal() }>Open Modal</button>
      <Modal isOpen={isOpen} />
    </div>
  )
}

{%endcodeblock%}

3. Fetching data

{%codeblock lang:javascript %}

const Post = ({ id }) => {
  const [post, setPost] = useState(null)

  useEffect(() => {
    fetchPost(id).then((data) => setPost(data.post))
  }, [id])

  if (!post) { return null }

  return (
    <div>{post.id}</div>
  )
}

{%endcodeblock %}

This might be the one legit use case for `useEffect` hooks, however, the recent promise compatible hooks like `useSWR` and `useQuery` in React Query or Apollo Client can better represent the data fetching by hiding the effect and handle the cache inside the hook.

{%codeblock lang:javascript %}

const Post = ({ id }) => {
  const { data, isError, isLoading } = useSWR(
    id,
    id => fetchPost(id).then((data) => data)
  )

  if (isLoading || isError) { return null }

  return (
    <div>{data.post.id}</div>
  )
}

{%endcodeblock %}

### 6. State management

Application state management is the main complexity in most of the React apps. The good part of React is the component-based structure, meaning every component can have its state and manage it. However, when the service becomes complex, the component tree becomes bigger, and we unavoidably need to share the state with other components, creating the problem of prop drilling. Making components having lots of props and hard to maintain.

{%codeblock lang:javascript%}

const PostsPage = () => {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPosts().then(response => setPosts(response))
  }, [])

  return (
    <div>
      <div>{error}</div>
      {posts.map(post => <Post post={post} setError={setError} setPosts={setPosts} />)}
    </div>
  )
}

const Post = ({ post, setError, setPosts }) => {
  const [ isEditing, setIsEditing ] = useState(false)

  if (isEditing) {
    return <EditPost post={post} setError={setError} setPosts={setPosts} setIsEditing={setIsEditing}/>
  }

  return (
    <div>
      <h3>{post.title}</h3>
      <p>{post.description}</p>
      <p>{post.author}</p>
      <p>{post.createdAt}</p>
      <button onClick={() => setIsEditing(true) }>Edit</button>
    </div>
  )
} 

const EditPost = ({ post, setError, setPosts, setIsEditing }) => {
  const [title, setTitle] = useState(post.title)
  const [description, setDescription] = useState(post.description)

  const onSubmit = async () => {
    try {
      await updatePost({ id: post.id, title, description })

      setPosts(posts => 
        posts.map(p => {
          if (p.id !== post.id) {
            return p
          }

          return {
            ...p,
            title,
            description
          }
        })
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input 
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value) }
      />
      <input 
        name="description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value) }
      />
      <input type="submit" value="Submit" />
    </form>
  )
}

{%endcodeblock%}

When Facebook realized this issue in their development team, they came up with a solution called Flux, which means single-direction data flow, and it borrowed the concept of reducer from functional programming, becoming the Redux framework right now. The idea of Redux is managing the application state in a centralized store, and defining the event that changes the state as "action", therefore every state can be equally accessed by every component. Therefore no more props drilling and state-sharing issues, every React developer lives happily ever after.

But no, Redux is a solution to solve that one problem but introduces a couple of the new problems, in the example using `react-redux` and `redux-toolkit`:

{%codeblock lang:javascript%}

const fetchPostsThunk = createAsyncThunk(
  "fetchPosts",
  async () => {
    const posts = await fetchPosts()
    return posts
  }
)

const updatePostThunk = createAsyncThunk(
  "updatePost",
  async ({ id, title, description }, { rejectWithValue }) => {
    try {
      const post = await updatePost({ id, title, description })
      return post
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const postsPageSlice = createSlice({
  name: "postsPage",
  initialState: {
    posts: [],
    error: null
  },
  reducers: {
    editPost: (state, action) => {
      const index = state.posts.findIndex(post => post.id === action.payload)
      if (index >= 0) {
        state.posts[index].isEditing = true
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPostsThunk.fulfilled, (state, action) => {
      state.posts = state.posts.concat(action.payload)
    })
    builder.addCase(updatePostThunk.fulfilled, (state, action) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id)
      if (index >= 0) {
        state.posts[index] = action.payload
      }
    })
    builder.addCase(updatePostThunk.rejected, (state, action) => {
      state.error = action.payload
    })
  }
})

const actions = postsPageSlice.actions

const store = configureStore({
  reducer: {
    postsPage: postsPageSlice.reducer
  }
})

const App = () => (
  <Provider store={store}>
    <PostsPage />
  </Provider>
)

const PostsPage = () => {
  const dispatch = useDispatch()
  const { posts, error } = useSelector(state => state.postsPage)

  useEffect(() => {
    dispatch(fetchPostsThunk())
  }, [dispatch])

  return (
    <div>
      <div>{error}</div>
      {posts.map(post => <Post post={post} />)}
    </div>
  )
}

const Post = ({ post }) => {
  const dispatch = useDispatch()

  if (post.isEditing) {
    return <EditPost post={post} />
  }

  return (
    <div>
      <h3>{post.title}</h3>
      <p>{post.description}</p>
      <p>{post.author}</p>
      <p>{post.createdAt}</p>
      <button
        onClick={() => dispatch(actions.editPost(post.id)) }
      >
        Edit
      </button>
    </div>
  )
} 

const EditPost = ({ post }) => {
  const dispatch = useDispatch()
  const [title, setTitle] = useState(post.title)
  const [description, setDescription] = useState(post.description)

  const onSubmit = async () => {
    dispatch(updatePostThunk({ id: post.id, title, description }))
  }

  return (
    <form onSubmit={onSubmit}>
      <input 
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value) }
      />
      <input 
        name="description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value) }
      />
      <input type="submit" value="Submit" />
    </form>
  )
}

{%endcodeblock%}

It introduces the following issues:

1. Boilerplate: Using Redux will introduce multiple layers including actions and reducers, which make the application more complicated and even a simple UI state mutation become hard.

2. The complexity of the centralized state: In Redux's ideology, every state needs to be stored in the Redux store, which forces the local state that is not shared between components to become global. In example, we have a list of posts, which have their own form and isEditing state. If completely follow the centralized state, we will have to move those state to Redux and manage them, rather to let component manage them locally.

3. Use Thunk to store remote data in Redux. In Redux, every state needs to be stored in a single store, including data from API, but essentially the API data is not controlled by the application. If we just store the result as it is, it is okay. But if the result needs to mutate to reflect the application change, for example, fetch a list when the user types things into search input, the user will need to handle those state disposal, mutation, and merge, which is hard to do it correctly. Also, thunk gives too much power to the developer, it could hide complex logic with multiple dispatch transitions that back and forth from the reducer and thunk itself, making it hard to understand compared to normal API calls.

Overall, if we follow the ideology of Redux, which is a centralized state, it will have those extra complexities. If we don't follow the ideology, and make shortcuts by maintaining local state and remote state separately, we are losing the benefit of a centralized state. Redux has a couple of benefits that are good when applying middleware like persists, but in other cases it is hard to use it correctly, it's like Communism, if you fail that must be because you are not following Communism, but if you are successful that also means you are not following the Communism.

Alternatively, I would suggests:

1. Flatten nested components: Consider restructuring the component hierarchy to reduce the need for state sharing and prop drilling. This can help simplify the component tree and make it easier to manage state locally within each component.

2. Explore alternative state management libraries: Instead of jumping straight to Redux, consider using alternative state management libraries like Jotai or Recoil. These libraries offer global state management capabilities while providing a simpler and more flexible API compared to Redux.

3. Consider Zustand for centralized store: If a centralized store is necessary for state management, consider using Zustand. Zustand is a lightweight state management library that provides a centralized store-like structure without the boilerplate and complexity associated with Redux.

4. Evaluate the need for Redux: Carefully assess whether Redux is truly necessary for the specific requirements of your application. While Redux has benefits like middleware support, it may introduce additional complexity and boilerplate for simpler UI state mutations.