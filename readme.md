# GraphQL Multipart Request Spec

An interoperable [multipart form](https://tools.ietf.org/html/rfc7578) field structure for GraphQL requests, used by various file upload client/server implementations.

It’s possible to implement:

- Nesting files anywhere within operations.
- Operation batching.
- File deduplication.
- File upload streams in resolvers.
- Aborting file uploads in resolvers.

## Example

```http
POST https://example.com/graphql 
content-type: multipart/form-data; boundary=--boundary

--boundary
Content-Disposition: form-data; name="operations"

{ "query": "mutation { upload(file: \"fileA\") }" }

--boundary
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--boundary--
```

![Sync vs async GraphQL multipart request middleware](sync-vs-async-graphql-multipart-request-middleware.svg)

## [Spec](./spec/GraphQLMultipartRequest.md)

## Security

GraphQL server authentication and security mechanisms are beyond the scope of this specification, which only covers a multipart form field structure for GraphQL requests.

Note that a GraphQL multipart request has the [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) `multipart/form-data`; if a browser making such a request determines it meets the criteria for a “[simple request](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)” as defined in the [Fetch specification](https://fetch.spec.whatwg.org) for the [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) (CORS) protocol, it won’t cause a [CORS preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request). GraphQL server authentication and security mechanisms must consider this to prevent [Cross-Site Request Forgery](https://developer.mozilla.org/en-US/docs/Glossary/CSRF) (CSRF) attacks.

## Implementations

Pull requests adding either experimental or mature implementations to these lists are welcome! ~~Strikethrough~~ means the project was renamed, deprecated, or no longer supports this spec out of the box (but might via an optional integration).

### Client

- [jaydenseric/graphql-react](https://github.com/jaydenseric/graphql-react) (JS: [npm](https://npm.im/graphql-react))
- [jaydenseric/apollo-upload-client](https://github.com/jaydenseric/apollo-upload-client) (JS: [npm](https://npm.im/apollo-upload-client))
- [jaydenseric/extract-files](https://github.com/jaydenseric/extract-files) (JS: [npm](https://npm.im/extract-files))
- [nearform/graphql-hooks](https://github.com/nearform/graphql-hooks) (JS: [npm](https://npm.im/graphql-hooks))
- [klis87/redux-saga-requests-graphql](https://github.com/klis87/redux-saga-requests/tree/master/packages/redux-saga-requests-graphql) (JS: [npm](https://npm.im/redux-saga-requests-graphql))
- [imolorhe/altair](https://github.com/imolorhe/altair) (JS: [npm](https://npm.im/altair-static))
- [haffdata/buoy](https://github.com/haffdata/buoy) (JS: [npm](https://npm.im/@buoy/client))
- [FormidableLabs/urql](https://github.com/FormidableLabs/urql) (JS: [npm](https://npm.im/@urql/exchange-multipart-fetch))
- [~~apollo-fetch-upload~~](https://github.com/apollographql/apollo-fetch/tree/master/packages/apollo-fetch-upload) (JS: [npm](https://npm.im/apollo-fetch-upload))
- [apollographql/apollo-ios](https://github.com/apollographql/apollo-ios) (Swift: [CocoaPods](https://cocoapods.org/pods/Apollo))
- [apollographql/apollo-android](https://github.com/apollographql/apollo-android) (Java: [Bintray](https://bintray.com/apollographql/android))
- [zino-app/graphql-flutter](https://github.com/zino-app/graphql-flutter) (Dart: [Pub](https://pub.dev/packages/graphql))
- [samirelanduk/kirjava](https://github.com/samirelanduk/kirjava) (Python: [PyPi](https://pypi.org/project/kirjava))
- [DoctorJohn/aiogqlc](https://github.com/DoctorJohn/aiogqlc) (Python: [PyPi](https://pypi.org/project/aiogqlc))
- [graphql-python/gql](https://github.com/graphql-python/gql) (Python: [PyPi](https://pypi.org/project/gql))

### Server

- [jaydenseric/graphql-upload](https://github.com/jaydenseric/graphql-upload) (JS: [npm](https://npm.im/graphql-upload))
- [koresar/graphql-upload-minimal](https://github.com/koresar/graphql-upload-minimal) (JS: [npm](https://npm.im/graphql-upload-minimal))
- [dotansimha/graphql-yoga](https://github.com/dotansimha/graphql-yoga) (JS: [npm](https://npm.im/@graphql-yoga/common))
- [~~apollographql/apollo-server~~](https://github.com/apollographql/apollo-server) (JS: [npm](https://npm.im/apollo-server))
- [~~jaydenseric/apollo-upload-server~~](https://github.com/jaydenseric/apollo-upload-server) (JS: [npm](https://npm.im/apollo-upload-server))
- [99designs/gqlgen](https://github.com/99designs/gqlgen) (Go: [GitHub](https://github.com/99designs/gqlgen))
- [jpascal/graphql-upload](https://github.com/jpascal/graphql-upload) (Go: [GitHub](https://github.com/jpascal/graphql-upload))
- [jetruby/apollo_upload_server-ruby](https://github.com/jetruby/apollo_upload_server-ruby) (Ruby: [Gem](https://rubygems.org/gems/apollo_upload_server))
- [Ecodev/graphql-upload](https://github.com/Ecodev/graphql-upload) (PHP: [Composer](https://packagist.org/packages/ecodev/graphql-upload))
- [rebing/graphql-laravel](https://github.com/rebing/graphql-laravel) (PHP: [Composer](https://packagist.org/packages/rebing/graphql-laravel))
- [nuwave/lighthouse](https://github.com/nuwave/lighthouse) (PHP: [Composer](https://packagist.org/packages/nuwave/lighthouse))
- [overblog/graphql-bundle](https://github.com/overblog/GraphQLBundle) (PHP: [Composer](https://packagist.org/packages/overblog/graphql-bundle))
- [infinityloop-dev/graphpinator](https://github.com/infinityloop-dev/graphpinator) (PHP: [Composer](https://packagist.org/packages/infinityloop-dev/graphpinator))
- [lmcgartland/graphene-file-upload](https://github.com/lmcgartland/graphene-file-upload) (Python: [PyPi](https://pypi.org/project/graphene-file-upload))
- [strawberry-graphql/strawberry](https://github.com/strawberry-graphql/strawberry) (Python: [PyPi](https://pypi.org/project/strawberry-graphql))
- [graphql-java-kickstart/graphql-java-servlet](https://github.com/graphql-java-kickstart/graphql-java-servlet) (Java: [Maven](https://mvnrepository.com/artifact/com.graphql-java/graphql-java-servlet))
- [ChilliCream/hotchocolate](https://github.com/ChilliCream/hotchocolate) (C#: [NuGet](https://www.nuget.org/packages/HotChocolate))
- [async-graphql/async-graphql](https://github.com/async-graphql/async-graphql) (Rust: [Crates](https://crates.io/crates/async-graphql))
