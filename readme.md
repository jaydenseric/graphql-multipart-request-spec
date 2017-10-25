# GraphQL multipart request specification

[![GitHub release](https://img.shields.io/github/release/qubyte/graphql-multipart-request-spec.svg)](https://github.com/jaydenseric/graphql-multipart-request-spec/releases)

An interoperable [multipart form](https://tools.ietf.org/html/rfc7578) field structure for GraphQL requests, used by various file upload client/server implementations.

It’s possible to implement:

- Batched operations.
- Files nested anywhere within each operation (often in variables).
- File upload streams in resolvers.
- Aborting file uploads in resolvers.

## Multipart form field structure

An “operations object” is an [Apollo GraphQL POST request](http://dev.apollodata.com/tools/graphql-server/requests.html#postRequests) (or array of requests if batching). An “operations path” is an [`object-path`](https://npm.im/object-path) string to locate a file within an operations object.

### 1. `files` field

A JSON encoded operations path array.

### 2. `operations` field

A JSON encoded operations object with files replaced with `null`.

### 3. File fields

Each file extracted from the operations object with the operations path as the field name. File fields must follow `files` and `operations` to so that operations can be resolved while the files are still uploading.

## Examples

### Avatar mutation

#### Operations

```js
{
  query: '…',
  operationName: 'updateAvatar',
  variables: {
    userId: '…',
    image: File
  }
}
```

#### Multipart form fields

1. `files`: `["variables.image"]`
2. `operations`: `{"query": "…", "operationName": "updateAvatar", "variables": {"userId": "…", image: null}}`
3. `variables.image`

### Gallery mutation

#### Operations

```js
{
  query: '…',
  operationName: 'addToGallery',
  variables: {
    galleryId: '…',
    images: [File, File, File]
  }
}
```

#### Multipart form fields

1. `files`: `["variables.images.0", "variables.images.1", "variables.images.2"]`
2. `operations`: `{"query": "…", "operationName": "addToGallery", "variables": {"galleryId": "…", images: [null, null, null]}}`
3. `variables.images.0`
4. `variables.images.1`
5. `variables.images.2`

### Batched mutations

#### Operations

```js
[
  {
    query: '…',
    operationName: 'updateAvatar',
    variables: {
      userId: '…',
      image: File
    }
  },
  {
    query: '…',
    operationName: 'addToGallery',
    variables: {
      galleryId: '…',
      images: [File, File, File]
    }
  }
]
```

#### Multipart form fields

1. `files`: `["0.variables.image", "1.variables.images.0", "1.variables.images.1", "1.variables.images.2"]`
2. `operations`: `[{"query": "…", "operationName": "updateAvatar", "variables": {"userId": "…", image: null}}, {"query": "…", "operationName": "addToGallery", "variables": {"galleryId": "…", images: [null, null, null]}}]`
1. `0.variables.image`
2. `1.variables.images.0`
3. `1.variables.images.1`
4. `1.variables.images.2`

## Relevant projects

- [apollo-upload-server](https://npm.im/apollo-upload-server)
- [apollo-upload-client](https://npm.im/apollo-upload-client)
- [apollo-fetch-upload](https://npm.im/apollo-fetch-upload)
