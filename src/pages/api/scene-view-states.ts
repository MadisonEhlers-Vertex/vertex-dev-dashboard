import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import {
  CreateSceneViewStateRequestDataAttributes,
  getPage,
  head,
  logError,
  SceneViewRelationshipDataTypeEnum,
  SceneViewStateData,
  VertexError,
} from '@vertexvis/api-client-node';
import { NextApiRequest, NextApiResponse } from 'next';

import {
  BodyRequired,
  ErrorRes,
  GetRes,
  MethodNotAllowed,
  Res,
  ServerError,
  toErrorRes,
} from '../../lib/api';
import { getClientFromSession } from '../../lib/vertex-api';

export type CreateViewStateReq = Pick<
  CreateSceneViewStateRequestDataAttributes,
  'name'
> & {
  readonly viewId: string;
};

export type CreateViewStateRes = Pick<SceneViewStateData, 'id'> & Res;

export default withApiAuthRequired(async function handle(
  req: NextApiRequest,
  res: NextApiResponse<GetRes<SceneViewStateData> | Res | ErrorRes>
): Promise<void> {
  if (req.method === 'GET') {
    const r = await get(req);
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
): Promise<ErrorRes | GetRes<SceneViewStateData>> {
  try {
    const c = await getClientFromSession();
    const vId = head(req.query.view);
    const view = await c.sceneViews.getSceneView({ id: vId });
    const sceneId = view.data.data.relationships.scene.data.id;

    const { cursors, page } = await getPage(() =>
      c.sceneViewStates.getSceneViewStates({
        id: sceneId,
        pageSize: 50,
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

async function create(
  req: NextApiRequest
): Promise<ErrorRes | CreateViewStateRes> {
  const b: CreateViewStateReq = JSON.parse(req.body);
  if (!req.body) return BodyRequired;

  const c = await getClientFromSession();
  const view = await c.sceneViews.getSceneView({ id: b.viewId });
  const sceneId = view.data.data.relationships.scene.data.id;
  const res = await c.sceneViewStates.createSceneViewState({
    id: sceneId,
    createSceneViewStateRequest: {
      data: {
        type: 'scene-view-state',
        attributes: {
          name: b.name,
        },
        relationships: {
          source: {
            data: {
              type: SceneViewRelationshipDataTypeEnum.SceneView,
              id: b.viewId,
            },
          },
        },
      },
    },
  });

  return { status: 200, id: res.data.data.id };
}
