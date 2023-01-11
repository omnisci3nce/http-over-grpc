import 'source-map-support/register';
import { credentials, Metadata, ServiceError } from '@grpc/grpc-js';
import net from 'net';

//import { clientService } from './clientService';
import { ByteChunk, ByteProxyClient } from './models/byteproxy';
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


//async function example(): Promise<void> {
//  /**
//   * rpc sayHello with callback
//   * https://github.com/grpc/grpc-node/issues/54
//   */
//  client.sayHello(param, (err: ServiceError | null, res: HelloResponse) => {
//    if (err) {
//      return logger.error('sayBasic:', err.message);
//    }
//
//    logger.info('sayBasic:', res.message);
//  });
//
//  /**
//   * rpc sayHello with Promise
//   */
//  const sayHello = await clientService.sayHello(param);
//  logger.info('sayHello:', sayHello.message);
//  logger.info('sayHelloStruct:', sayHello.paramStruct);
//  logger.info('sayHelloListValue:', sayHello.paramListValue);
//  logger.info('sayHelloValue:', sayHello.paramValue);
//
//  /**
//   * rpc sayHello with Metadata
//   */
//  const sayHelloMetadata = await clientService.sayHello(param, metadata);
//  logger.info('sayHelloMetadata:', sayHelloMetadata.message);
//}
//
//function exampleStream(): void {
//  /**
//   * rpc sayHelloStreamRequest
//   */
//  const streamRequest = client.sayHelloStreamRequest((err: ServiceError | null, res: HelloResponse) => {
//    if (err) {
//      return logger.error('sayHelloStreamRequest:', err);
//    }
//
//    logger.info('sayHelloStreamRequest:', res.message);
//  });
//
//  for (let i = 1; i <= 10; i += 1) {
//    streamRequest.write({
//      name: `${argv}.${i}`,
//    });
//  }
//  streamRequest.end();
//
//  /**
//   * rpc sayHelloStreamResponse
//   */
//  const streamResponse = client.sayHelloStreamResponse(param);
//
//  const data: string[] = [];
//  streamResponse.on('data', (res: HelloResponse) => {
//    data.push(res.message);
//  }).on('end', () => {
//    logger.info('sayHelloStreamResponse:', data.join('\n'));
//  }).on('error', (err: Error) => {
//    logger.error('sayHelloStreamResponse:', err);
//  });
//
//  /**
//   * rpc sayHelloStream
//   */
//  const stream = client.sayHelloStream();
//  stream
//    .on('data', (res: HelloResponse) => logger.info('sayHelloStream:', res.message))
//    .on('end', () => logger.info('sayHelloStream: End'))
//    .on('error', (err: Error) => logger.error('sayHelloStream:', err));
//
//  for (let i = 1; i <= 10; i += 1) {
//    stream.write({
//      name: `${argv}.${i}`,
//    });
//  }
//  stream.end();
//}

/*

Browser
   |
   | HTTP Request
   \
    -> Client

*/

//function openProxy(): void {
//  /**
//   * rpc ByteProxy
//   */
//  const duplexStream = client.byteProxy();
//  duplexStream
//    .on('data', (res: ByteChunk) => logger.info(`ByteProxy: received ${res.n} bytes`))
//    .on('end', () => logger.info('ByteProxy: End'))
//    .on('error', (err: Error) => logger.error('ByteProxy:', err));
//}

(async (): Promise<void> => {
  try {
    //await example();
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
