import 'source-map-support/register';
import { credentials, Metadata, ServiceError } from '@grpc/grpc-js';
import net from 'net';

import { ByteChunk, ByteProxyClient, Ping, Pong } from './models/byteproxy';
import { logger } from './utils';

// https://github.com/grpc/grpc/blob/master/doc/keepalive.md
// https://cloud.ibm.com/docs/blockchain-multicloud?topic=blockchain-multicloud-best-practices-app#best-practices-app-connections
const client = new ByteProxyClient('localhost:50051', credentials.createInsecure(), {
  'grpc.keepalive_time_ms': 120000,
  'grpc.http2.min_time_between_pings_ms': 120000,
  'grpc.keepalive_timeout_ms': 20000,
  'grpc.http2.max_pings_without_data': 0,
  'grpc.keepalive_permit_without_calls': 1,
});
logger.info('gRPC:ByteProxyClient', new Date().toLocaleString());

let argv = 'world';
if (process.argv.length >= 3) {
  [, , argv] = process.argv;
}

async function ping(): Promise<void> {
  client.sendPing(Ping.fromJSON({ message: 'test message' }), (err: ServiceError | null, res: Pong) => {
    if (err) {
      return logger.error('sendPing:', err.message);
    }

    logger.info('pong:', res.message);
  });
}
(async (): Promise<void> => {
  try {
    await ping();
  } catch (err) {
    logger.error(err);
  }
})();
const server = net.createServer((socket) => {
  // create grpc bidi stream
  const duplexStream = client.registerByteStream();
  duplexStream
    .on('data', (res: ByteChunk) => {
      logger.info(`ByteProxy: received ${res.n} bytes`);
      console.log(res.bytes.toString());
      socket.end(res.bytes);
      duplexStream.end()
    })
    .on('end', () => logger.info('ByteProxy: End'))
    .on('error', (err: Error) => logger.error('ByteProxy:', err));

  socket.on('data', (data) => {
    console.log('CLIENT:', data);
    duplexStream.write({
      n: data.byteLength,
      bytes: data,
    });
  });
});
server.listen(8800);
