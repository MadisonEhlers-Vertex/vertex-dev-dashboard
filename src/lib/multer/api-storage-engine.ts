import { head, VertexError } from '@vertexvis/api-client-node';
import { Request } from 'express';

import { getClientFromSession } from '../vertex-api';

const VertexAPIStorageEngine = {
  _handleFile: async (
    req: Request,
    file: Express.Multer.File,
    cb: (error?: Error, info?: Partial<Express.Multer.File>) => void
  ): Promise<void> => {
    // todo fix get auth0 session
    const id = req.query.f;
    const client = await getClientFromSession();
    try {
      await client.files.uploadFile({
        id: (head(id) ?? '') as string,
        body: file.stream,
      });
      cb(undefined, { path: '/files/' + id });
    } catch (err) {
      const e = err as VertexError;
      cb(e);
    }
  },

  _removeFile(): void {
    return;
  },
};

export default VertexAPIStorageEngine;
