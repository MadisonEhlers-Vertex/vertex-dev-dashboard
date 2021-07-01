import { OAuth2Token } from "@vertexvis/api-client-node";
import { NextApiResponse } from "next";

import { ErrorRes, MethodNotAllowed, Res } from "../../lib/api";
import { getToken } from "../../lib/vertex-api";
import withSession, {
  CredsKey,
  NextIronRequest,
  OAuthCredentials,
  SessionToken,
  TokenKey,
} from "../../lib/with-session";

export interface LoginReq {
  readonly id: string;
  readonly secret: string;
}

export default withSession(async function (
  req: NextIronRequest,
  res: NextApiResponse<Res | ErrorRes>
) {
  if (req.method === "POST") {
    const b: LoginReq = JSON.parse(req.body);

    let token: OAuth2Token | undefined;
    try {
      token = await getToken(b.id, b.secret);
    } catch {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const creds: OAuthCredentials = { id: b.id, secret: b.secret };
    const sessionToken: SessionToken = {
      token,
      expiration: Date.now() + token.expires_in * 1000,
    };
    req.session.set(CredsKey, creds);
    req.session.set(TokenKey, sessionToken);

    await req.session.save();

    const r = { status: 200 };
    return res.status(r.status).json(r);
  }

  return res.status(MethodNotAllowed.status).json(MethodNotAllowed);
});
