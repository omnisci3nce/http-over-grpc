import 'source-map-support/register';
import { Server, ServerCredentials } from '@grpc/grpc-js';

import { ByteProxy, ByteProxyService } from './services/ByteProxy';
// import { HTTPProxy, HTTPProxyService } from './services/HTTPProxy';
import { logger } from './utils';

// Do not use @grpc/proto-loader
const server = new Server({
  'grpc.max_receive_message_length': -1,
  'grpc.max_send_message_length': -1,
});

server.addService(ByteProxyService, new ByteProxy());
// server.addService(HTTPProxyService, new HTTPProxy());
server.bindAsync('0.0.0.0:50051', ServerCredentials.createInsecure(), (err: Error | null, bindPort: number) => {
  if (err) {
    throw err;
  }

  logger.info(`gRPC:Server:${bindPort}`, new Date().toLocaleString());
  server.start();
});
