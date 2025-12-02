import * as openidClient from "openid-client";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Request } from "express";

type Client = any;

let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;

  const issuerUrl = process.env.ISSUER_URL || "https://replit.com";
  const issuer = await (openidClient as any).Issuer.discover(issuerUrl);

  client = new issuer.Client({
    client_id: process.env.REPL_ID!,
    token_endpoint_auth_method: "none",
  });

  return client;
}

export interface AuthData {
  codeVerifier: string;
  state: string;
}

export async function getAuthUrl(callbackUrl: string): Promise<{ url: string; authData: AuthData }> {
  const authClient = await getClient();
  const { generators } = openidClient as any;
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();

  const url = authClient.authorizationUrl({
    redirect_uri: callbackUrl,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  return {
    url,
    authData: {
      codeVerifier,
      state,
    },
  };
}

export async function handleCallback(
  code: string,
  state: string,
  callbackUrl: string,
  authData: AuthData
): Promise<User> {
  // Verify state matches
  if (state !== authData.state) {
    throw new Error("Invalid state parameter");
  }

  const authClient = await getClient();

  const tokenSet = await authClient.callback(
    callbackUrl,
    { code, state },
    {
      code_verifier: authData.codeVerifier,
      state: authData.state,
    }
  );

  if (!tokenSet.access_token) {
    throw new Error("No access token received");
  }

  const userInfo = await authClient.userinfo(tokenSet.access_token);

  // Check if user exists by replitSub
  let user = await storage.getUserByReplitSub(userInfo.sub);

  if (!user) {
    // Create new user
    user = await storage.createUser({
      replitSub: userInfo.sub,
      email: userInfo.email as string,
      firstName: userInfo.given_name as string,
      lastName: userInfo.family_name as string,
      profileImageUrl: userInfo.picture as string,
      isPremium: false,
    });
  } else {
    // Update user info if changed
    await storage.updateUser(user.id, {
      email: userInfo.email as string,
      firstName: userInfo.given_name as string,
      lastName: userInfo.family_name as string,
      profileImageUrl: userInfo.picture as string,
    });
    user = await storage.getUser(user.id);
  }

  return user!;
}
