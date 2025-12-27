import * as openidClient from "openid-client";
import { storage } from "./storage";
import type { User } from "@shared/schema";

let clientConfig: openidClient.Configuration | null = null;

async function getClientConfig(): Promise<openidClient.Configuration> {
  if (clientConfig) return clientConfig;

  const issuerUrl = new URL("https://replit.com/.well-known/openid-configuration");
  
  clientConfig = await openidClient.discovery(
    issuerUrl,
    process.env.REPL_ID!,
    undefined,
    undefined,
    {
      execute: [openidClient.allowInsecureRequests],
    }
  );

  return clientConfig;
}

export interface AuthData {
  codeVerifier: string;
  state: string;
  nonce: string;
}

export async function getAuthUrl(callbackUrl: string): Promise<{ url: string; authData: AuthData }> {
  const config = await getClientConfig();
  
  const codeVerifier = openidClient.randomPKCECodeVerifier();
  const codeChallenge = await openidClient.calculatePKCECodeChallenge(codeVerifier);
  const state = openidClient.randomState();
  const nonce = openidClient.randomNonce();

  const parameters: Record<string, string> = {
    redirect_uri: callbackUrl,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
    response_type: "code",
  };

  const url = openidClient.buildAuthorizationUrl(config, parameters);

  return {
    url: url.href,
    authData: {
      codeVerifier,
      state,
      nonce,
    },
  };
}

export async function handleCallback(
  code: string,
  state: string,
  callbackUrl: string,
  authData: AuthData
): Promise<User> {
  if (state !== authData.state) {
    throw new Error("Invalid state parameter");
  }

  const config = await getClientConfig();

  const tokens = await openidClient.authorizationCodeGrant(
    config,
    new URL(`${callbackUrl}?code=${code}&state=${state}`),
    {
      pkceCodeVerifier: authData.codeVerifier,
      expectedState: authData.state,
      expectedNonce: authData.nonce,
    }
  );

  const claims = tokens.claims();
  
  if (!claims || !claims.sub) {
    throw new Error("No user claims received");
  }

  let user = await storage.getUserByReplitSub(claims.sub);

  if (!user) {
    user = await storage.createUser({
      replitSub: claims.sub,
      email: claims.email as string || null,
      firstName: claims.given_name as string || null,
      lastName: claims.family_name as string || null,
      profileImageUrl: claims.picture as string || null,
      isPremium: false,
    });
  } else {
    await storage.updateUser(user.id, {
      email: claims.email as string || null,
      firstName: claims.given_name as string || null,
      lastName: claims.family_name as string || null,
      profileImageUrl: claims.picture as string || null,
    });
    user = await storage.getUser(user.id);
  }

  return user!;
}
