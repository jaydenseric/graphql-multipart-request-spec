# GraphQL Multipart Request Spec

This specification describes how to attach additional files to a GraphQL request using `multipart/form-data`. The intent
is to be the continuation of https://github.com/jaydenseric/graphql-multipart-request-spec starting at Version 3 and to
support backwards compatibility with Version 2 for both clients and servers.

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
