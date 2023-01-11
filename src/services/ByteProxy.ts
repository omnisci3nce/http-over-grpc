import {
  sendUnaryData, ServerDuplexStream, ServerUnaryCall,
  status, UntypedHandleCall,
} from '@grpc/grpc-js';
import { randomBytes } from 'crypto';
import net from 'net';

import { ByteChunk, ByteProxyServer, ByteProxyService, Ping, Pong } from '../models/byteproxy';
import { logger, ServiceError } from '../utils';

class ByteProxy implements ByteProxyServer {
  [method: string]: UntypedHandleCall;

  /**
   * Implements the SendPing RPC method.
   */
  public sendPing(call: ServerUnaryCall<Ping, Pong>, callback: sendUnaryData<Pong>): void {
    logger.info('received ping', Date.now());

    const { message } = call.request;
    logger.info('pong:', message);

    callback(null, Pong.fromJSON({ message: message }));
  }

  public registerByteStream(call: ServerDuplexStream<ByteChunk, ByteChunk>): void {
    logger.info('ByteProxy:', call.getPeer());

    //  forward request and then send response back via gRPC
    call.on('data', (req: ByteChunk) => {
      logger.info('received req');

      const host = '127.0.0.1';
      const port = 8080;
      const socket = net.connect(port, host, () => {
        const request = req.bytes;
        let rawResponse = '';

        // send http request:
        socket.end(request);

        // assume utf-8 encoding:
        socket.setEncoding('utf-8');

        // collect raw http message:
        socket.on('data', (chunk) => {
          rawResponse += chunk;
        });
        socket.on('end', () => {
          logger.info(rawResponse);
          const b = Buffer.from(rawResponse);
          call.write({ n: b.byteLength, bytes: b });
        });
      });
    }).on('end', () => {
      call.end();
    }).on('error', (err: Error) => {
      logger.error('ByteProxy:', err);
    });
  }
}

export {
  ByteProxy,
  ByteProxyService,
};
