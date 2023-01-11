# node-grpc-typescript

Based on node+grpc+typescript boilerplate from here! https://github.com/CatsMiaow/node-grpc-typescript

Node.js gRPC structure with [google.protobuf](https://developers.google.com/protocol-buffers/docs/reference/google.protobuf) for TypeScript example

- This example uses [ts-proto](https://github.com/stephenh/ts-proto) as the TypeScript plugin.
- For an example using the [grpc_tools_node_protoc_ts](https://github.com/agreatfool/grpc_tools_node_protoc_ts) plugin, see the following [branch](https://github.com/CatsMiaow/node-grpc-typescript/tree/grpc_tools_node_protoc_ts) source.

## Installation

```sh
npm ci
```

## Build

```sh
npm run build # *.proto, *.ts
npm run lint
```

## Server (start relay)

```sh
npm start #= node dist/server
```

## Client (start proxy)

```sh
npm run client #= node dist/client
```

now make a request to localhost:8800 and it will be proxied over gRPC to the Server
which will try and forward the request to port 8080. It will return the response
back via gRPC and to the client, and ultimately to whoever initiated the request
against client's http server on port `8800`.
