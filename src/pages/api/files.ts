import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import {
  CreateFileRequestDataAttributes,
  FileMetadataData,
  getPage,
  head,
  logError,
  VertexError,
} from '@vertexvis/api-client-node';
import { NextApiRequest, NextApiResponse } from 'next';

import {
  BodyRequired,
  DeleteReq,
  ErrorRes,
  GetRes,
  InvalidBody,
  MethodNotAllowed,
  Res,
  ServerError,
  toErrorRes,
} from '../../lib/api';
import { getClientFromSession, makeCall } from '../../lib/vertex-api';


type CreateFileReq = CreateFileRequestDataAttributes;

export type CreateFileRes = Res & Pick<FileMetadataData, 'id'>;

export default withApiAuthRequired(async function handle(
  req: NextApiRequest,
  res: NextApiResponse<GetRes<FileMetadataData> | Res | ErrorRes>
): Promise<void> {
  if (req.method === 'GET') {
    const r = await get(req);
    return res.status(r.status).json(r);
  }

  if (req.method === 'DELETE') {
    const r = await del(req);
    return res.status(r.status).json(r);
  }

  if (req.method === 'POST') {
    const r = await create(req);
    return res.status(r.status).json(r);
  }

  return res.status(MethodNotAllowed.status).json(MethodNotAllowed);
});

async function get(
  req: NextApiRequest
): Promise<ErrorRes | GetRes<FileMetadataData>> {
  try {
    const c = await getClientFromSession();
    const ps = head(req.query.pageSize);
    const pc = head(req.query.cursor);
    const sId = head(req.query.suppliedId);

    const { cursors, page } = await getPage(() =>
      c.files.getFiles({
        pageCursor: pc,
        pageSize: ps ? parseInt(ps, 10) : 10,
        filterSuppliedId: sId,
      })
    );
    return { cursors, data: page.data, status: 200 };
  } catch (error) {
    const e = error as VertexError;
    logError(e);
    return e.vertexError?.res
      ? toErrorRes({ failure: e.vertexError?.res })
      : ServerError;
  }
}

async function del(req: NextApiRequest): Promise<ErrorRes | Res> {
  if (!req.body) return BodyRequired;

  const b: DeleteReq = JSON.parse(req.body);
  if (!b.ids) return InvalidBody;

  const c = await getClientFromSession();
  await Promise.all(
    b.ids.map((id) => makeCall(() => c.files.deleteFile({ id })))
  );
  return { status: 200 };
}

async function create(req: NextApiRequest): Promise<ErrorRes | CreateFileRes> {
  if (!req.body) return BodyRequired;

  const b: CreateFileReq = JSON.parse(req.body);
  const c = await getClientFromSession();
  const res = await c.files.createFile({
    createFileRequest: { data: { type: 'file', attributes: b } },
  });

  return { status: 200, id: res.data.data.id };
}
