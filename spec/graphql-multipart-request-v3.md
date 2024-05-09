# GraphQL Multipart Request V3

# GraphQL Multipart Request

## Overview

This specification describes how a [GraphQL Over HTTP](https://graphql.github.io/graphql-over-http/draft) compliant
{Server} and {Client} can support passing additional data alongside a GraphQL request using *multipart/form-data*.

Note: The traditional usage is to upload files as part of a GraphQL request and reference the uploaded file during the
GraphQL resolution.

```http example
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

## Conformance

A conforming implementation of GraphQL Multipart Request must fulfill all normative
requirements. Conformance requirements are described in this document via both
descriptive assertions and key words with clearly defined meanings.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "
RECOMMENDED", "MAY", and "OPTIONAL" in the normative portions of this document are to be interpreted
as described in [IETF RFC 2119](https://tools.ietf.org/html/rfc2119). These key words may appear
in lowercase and still retain their meaning unless explicitly declared as non-normative.

A conforming implementation of Multipart Request may provide additional
functionality, but must not where explicitly disallowed or would otherwise
result in non-conformance.

## Non-Normative Portions

All contents of this document are normative except portions explicitly declared
as non-normative.

Examples in this document are non-normative, and are presented to aid
understanding of introduced concepts and the behavior of normative portions of
the specification. Examples are either introduced explicitly in prose (e.g. "for
example") or are set apart in example or counter-example blocks, like this:

```example
This is an example of a non-normative example.
```

```counter-example
This is an example of a non-normative counter-example.
```

Notes in this document are non-normative, and are presented to clarify intent,
draw attention to potential edge-cases and pit-falls, and answer common
questions that arise during implementation. Notes are either introduced
explicitly in prose (e.g. "Note: ") or are set apart in a note block, like this:

Note: This is an example of a non-normative note.

# multipart/form-data Format

:: *multipart/form-data* is defined by [RFC7578](https://datatracker.ietf.org/doc/html/rfc7578)

## Parts

A GraphQL {MultipartRequest} is made up of multiple {Part}s. These {Part}s MAY be arranged in any order,
however a {Client} SHOULD send the *operations part* first for optimal performance. The {Server} MUST
support receiving the parts in any order.

Note: When the *operations part* is first received the {Server} can start processing the GraphQL Request before the
entire payload has been uploaded.

### Operations Part

operations part
: A {Part} with the {Name} `operations`. This part includes the GraphQL payload as defined in **GraphQL Over HTTP**.
: There MUST be exactly one *operations part*.

```http example
POST https://example.com/graphql 
content-type: multipart/form-data; boundary=--boundary

--boundary
Content-Disposition: form-data; name="operations"

{ "query": "query { field }" }
--boundary--
```

### Embedded Parts

embedded part
: There MAY be zero or more {Part}s in our *multipart/form-data* request which include additional data.
: These {Part}s MUST not have the name `operations`.

Note: Supplying a *filename* for the *content-disposition* in an *embedded part* is optional. However, the {Server} MAY
choose to reject requests based on the presence of a *filename*.

```http example
POST https://example.com/graphql 
content-type: multipart/form-data; boundary=--boundary

--boundary
Content-Disposition: form-data; name="operations"

{ "query": "mutation { upload(file: \"fileA\") upload(file: \"fileB\") }" }

--boundary
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--boundary
Content-Disposition: form-data; name="fileB"
Content-Type: text/plain

Beta file content.

--boundary--
```

### Map Part

map part
: There MAY be a single {Part} with the name `map`.
: A server implementing only V3 of this specification MUST ignore this `map` {Part}.

Note: The *map part* is a legacy {Part} from V2 of the specification. If the {Server} only implements V3 of this
specification it ignores the *map part* so that clients can support sending
[backwards compatible](#sec-Backwards-Compatability) V2/V3 requests.

# Schema

There are no requirements on the GraphQL Schema by this specification.

Note: The {Server} MAY choose to use a GraphQL `scalar` type to reference the *embedded part*s. The {Server} MAY have
multiple different `scalar`s with different meanings in the Schema.

```graphql example
scalar Upload
scalar File
scalar Part
```

# Execution

ExecuteRequest(httpRequest) :

1. If the {Server} finds that {httpRequest} is a *multipart/form-data* request:
    * Return {ExecuteMultipartRequest(httpRequest)}
2. Else
    * Return {ExecuteGraphQLOverHTTPRequest(httpRequest)}

ExecuteMultipartRequest(multipartRequest) :

1. Let {partsMap} be the result of parsing the {multipartRequest} into a map of {Name} -> {Part}
2. Let {embeddedPartsMap} be an empty Map.
3. For each {partsMap} entry {partName} -> {partValue}
    * If {partName} is `operations`
        * Return {ProcessGraphQLRequest(partValue, embeddedPartsMap)}
    * Else If {partName} is `map`
        * If this server supports V2 via backwards compatability
            * The {Server} must handle {multipartRequest} according
              to [V2 of this spec](https://github.com/jaydenseric/graphql-multipart-request-spec)
        * Else ignore this {Part}
    * Else Store the entry {partName} -> {partValue} in {embeddedPartsMap}

ProcessGraphQLRequest(query, embeddedPartsMap) :

1. Process this according to {ExecuteGraphQLRequest(query)}
2. If the {Server} finds a piece of the GraphQL request that expects additional data it must pull this additional data
   from the {embeddedPartsMap} as referenced by the {Name} and provide it to the internal resolver.
    * If the {Server} encounters an error when looking up the additional data in the {embeddedPartsMap} it MUST bubble
      up this error from the location in the GraphQL query that requested it.

Note: {ProcessGraphQLRequest()} depends on async data being pulled from {embeddedPartsMap}. The {Server} shouldn't
fail if a required *embedded part* isn't available until the entire {multipartRequest} has been read.

Note: This specification doesn't put any specific requirements on how the server knows that additional data is required
or what key to use to look this up. However, as mentioned, the expected flow is that a special `scalar` is created where
the client can set a key to reference the {Name} of one of the *embedded part*s.

```graphql example
scalar Attachment

type Mutation {
  upload(attachment: Attachment): Boolean
}
```

```http example
POST https://example.com/graphql 
content-type: multipart/form-data; boundary=--boundary

--boundary
Content-Disposition: form-data; name="operations"

{ "query": "mutation { upload(attachment: \"fileA\") }" }

--boundary
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--boundary--
```

## Error Handling

Note: if the {Client}'s GraphQL request doesn't reference any *embedded part*s this isn't an error.

### Missing Operations Part

If the {Client} sends a *multipart/form-data* request without an *operations part*, the {Server} MUST respond according
to the GraphQL Over HTTP specification when receiving an invalid GraphQL request.

**Request**

```http counter-example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25--
```

**Response**

```json example
{
  "errors": [
    {
      "message": "Missing GraphQL Operation"
    }
  ]
}
```

### Missing Embedded Parts

The request is invalid if it is missing referenced *embedded part*s. This can happen when the {Client} sends a non
*multipart/form-data* request or sends a *multipart/form-data* request missing referenced *embedded part*s. The {Server} 
MUST handle these errors as outlined in the GraphQL Spec: {HandleFieldError()}.

**Request**

```http counter-example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation { upload(file: \"fileA\") }" }

--------------------------cec8e8123c05ba25
```

**Response**

```json example
{
  "data": {
    "upload": null
  },
  "errors": [
    {
      "message": "Missing fileA",
      "location": [
        {
          "line": 1,
          "column": 37
        }
      ],
      "path": [
        "upload"
      ]
    }
  ]
}
```

### Duplicate Embedded Parts

If the {Client} sends a *multipart/form-data* request with duplicate `name`s the {Server} MUST return an error for the
request.

Note: The {Client} MAY send multiple files with the same `filename`

**Invalid Request**

```http counter-example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation { upload(file: \"fileA\") }" }

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content Again.

--------------------------cec8e8123c05ba25--
```

**Response**

```json example
{
  "errors": [
    {
      "message": "Found duplicate parts: fileA"
    }
  ]
}
```

**Valid Request**

```http example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation { upload(file: \"fileA\") }" }

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileB"; filename="a.txt"
Content-Type: text/plain

Alpha file content Again.

--------------------------cec8e8123c05ba25--
```

# Backwards Compatability

With [V2 of this spec](https://github.com/jaydenseric/graphql-multipart-request-spec)

## Client Backwards Compatibility

V3 {Client}s MAY choose to make requests that are compatible with both V2 AND V3 of this specification.

A cross compatible request is a V2 compliant request where instead of using `null` for additional data. The *embedded
part*
name is used instead.

* V2 Servers will overwrite the *embedded part* name when processing the *map part*
* V3 Servers will ignore the *map part* and process the request like normal.

Note: This allows the V3 {Client} to not worry about the supported specification version of the {Server} as both V2 and
V3 {Server}s will be able to handle the request.

**GraphQL Request**

```graphql example
mutation($file: Upload!) {
   upload(file: $file)
}
```

**Variables**

```json example
{
  "file": "fileA"
}
```

**Map Part**

```json example
{
  "fileA": [
    "variables.file"
  ]
}
```

Note: In the above example, note that the key in the *map part* SHOULD be the same as the name of the *embedded part*
that contains the relevant additional data for clarity.

## Server Backwards Compatibility

V3 {Server}s MAY choose to support V2 requests of this specification. If a backwards compatible V3 {Server} receives
a request with a *map part* it must implement the execution flow defined
by [V2 of this spec](https://github.com/jaydenseric/graphql-multipart-request-spec). The file key's values MUST be
ignored and substituted sequentially with the contents of the *map part*. If no *map part* is present, it MUST implement
the flow described in {ExecuteMultipartRequest()}.

# Examples

**Schema**

This is the schema for all of the examples in this section.

```graphql example
scalar Upload

type Mutation {
    upload(file: Upload!): String
}

```

## Single File

**GraphQL Request**

```graphql example
mutation {
   upload(file: "fileA")
}
```

**Payload**

```http example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation { upload(file: \"fileA\") }" }

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25--
```

**cURL Request**

```shell example
curl localhost:3001/graphql \
  -F operations='{ "query": "mutation { upload(file: \"fileA\") }" }' \
  -F fileA=@a.txt
```

## Multiple Files

**GraphQL Request**

```graphql example
mutation {
   a: upload(file: "fileA")
   b: upload(file: "fileB")
}
```

**Payload**

```http example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation { a: upload(file: \"fileA\") b: upload(file: \"fileB\") }" }

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileB"; filename="b.mpg"
Content-Type: video/mpeg

Beta file content.

--------------------------cec8e8123c05ba25--
```

**cURL Request**

```shell example
curl localhost:3001/graphql \
  -F operations='{ "query": "mutation { a: upload(file: \"fileA\") b: upload(file: \"fileB\") }" }' \
  -F fileA=@a.txt \
  -F fileB=@b.mpg
```

## Variables And File Reuse

**GraphQL Request**

```graphql example
mutation($file: Upload!) {
   a: upload(file: $file)
   b: upload(file: $file)
}
```

**Variables**

```json example
{
  "file": "fileA"
}
```

**Payload**

```http example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation($file: Upload!) { a: upload(file: $file) b: upload(file: $file) }", "variables": { "file": "fileA" } }

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25--
```

**cURL Request**

```shell example
curl localhost:3001/graphql \
  -F operations='{ "query": "mutation($file: Upload!) { a: upload(file: $file) b: upload(file: $file) }", "variables": { "file": "fileA" } }' \
  -F fileA=@a.txt
```

## V2 Client -> V3 Backwards Compatible Server

The Backwards Compatible V3 {Server} will find the `map` {Part} and use it to replace the `null` value in
the `operations` json before executing the request via its standard flow.

**GraphQL Request**

```graphql example
mutation($file: Upload!) {
   upload(file: $file)
}
```

**Variables**

```json example
{
  "file": null
}
```

**Map Part**

```json example
{
  "fileA": [
    "variables.file"
  ]
}
```

**Payload**

```http example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation($file: Upload!) { upload(file: $file) }", "variables": { "file": null } }

Content-Disposition: form-data; name="map"

{ "fileA": ["variables.file"] }

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25--
```

**cURL Request**

```shell example
curl localhost:3001/graphql \
  -F operations='{ "query": "mutation($file: Upload!) { upload(file: $file) }", "variables": { "file": null } }' \
  -F map='{ "fileA": ["variables.file"] }' \
  -F fileA=@a.txt
```

## V3 Backwards Compatible Client -> V2 Server

The V3 {Client} has already filled in the value for the `file` variable in the *operations part* json. The V2
{Server} will ignore this and still pull the value from the *map part*.

**GraphQL Request**

```graphql example
mutation($file: Upload!) {
   upload(file: $file)
}
```

**Variables**

```json example
{
  "file": "fileA"
}
```

**Map Part**

```json example
{
  "fileA": [
    "variables.file"
  ]
}
```

**Payload**

```http example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation($file: Upload!) { upload(file: $file) }", "variables": { "file": "fileA" } }

Content-Disposition: form-data; name="map"

{ "fileA": ["variables.file"] }

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25--
```

**cURL Request**

```shell example
curl localhost:3001/graphql \
  -F operations='{ "query": "mutation($file: Upload!) { upload(file: $file) }", "variables": { "file": "fileA" } }' \
  -F map='{ "fileA": ["variables.file"] }' \
  -F fileA=@a.txt
```

## V3 Backwards Compatible Client -> Non Backwards Compatible V3 Server

The V3 {Server} will ignore the *map part* however the client has already filled in the `fileA` key in
the `variables` json. The V3 {Server} will use this value.

**GraphQL Request**

```graphql example
mutation($file: Upload!) {
   upload(file: $file)
}
```

**Variables**

```json example
{
  "file": "fileA"
}
```

**Map Part**

```json example
{
  "fileA": [
    "variables.file"
  ]
}
```

**Payload**

```http example
POST /graphql HTTP/1.1
Host: localhost:3001
content-type: multipart/form-data; boundary=------------------------cec8e8123c05ba25
content-length: ?

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation($file: Upload!) { upload(file: $file) }", "variables": { "file": "fileA" } }

Content-Disposition: form-data; name="map"

{ "fileA": ["variables.file"] }

--------------------------cec8e8123c05ba25
Content-Disposition: form-data; name="fileA"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

--------------------------cec8e8123c05ba25--
```

**cURL Request**

```shell example
curl localhost:3001/graphql \
  -F operations='{ "query": "mutation($file: Upload!) { upload(file: $file) }", "variables": { "file": "fileA" } }' \
  -F map='{ "fileA": ["variables.file"] }' \
  -F fileA=@a.txt
```
