import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthOptions, getServerSession, TokenSet, User } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

import { isLocal } from "../utils/env";
import { raise } from "../utils/ts-utils";

import { fakeToken } from "./fake-token";
import { getMembersOf } from "./ms-graph";
import { fetch, ProxyAgent } from "undici";

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_APP_CLIENT_ID,
      clientSecret: process.env.AZURE_APP_CLIENT_SECRET,
      tenantId: process.env.AZURE_APP_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email offline_access .default",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
    async session({ session, user, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, user, account, profile }) {
      console.log("JWT")
      if (account && user) {
        token.accessToken = account.access_token;
        token.expires_at = account.expires_at;
        token.refreshToken = account.refresh_token;
      }
      if (Date.now() < token.expires_at * 1000) {
        return token;
      } else {
        try {
          // https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration
          // We need the `token_endpoint`.
          const response = await fetch(`https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/token`, {
            dispatcher: new ProxyAgent(process.env.HTTP_PROXY),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              client_id: process.env.AZURE_APP_CLIENT_ID,
              client_secret: encodeURIComponent(process.env.AZURE_APP_CLIENT_SECRET),
              refresh_token: token.refreshToken,
            }),
            method: "POST",
          })

          const tokens: TokenSet = (await response.json()) as TokenSet

          if (!response.ok) throw tokens
          

          return {
            ...token, // Keep the previous token properties
            access_token: tokens.access_token,
            expires_at: tokens.expires_at,
            // Fall back to old refresh token, but note that
            // many providers may only allow using a refresh token once.
            refresh_token: tokens.refresh_token ?? token.refresh_token,
          }
        } catch (error) {
          console.error("Error refreshing access token", error)
          // The error property will be used client-side to handle the refresh token error
          return { ...token, error: "RefreshAccessTokenError" as const }
        }

      }
    },
  },
  debug: true,
};

export async function validateToken(redirectPath: string): Promise<void> {
  const requestHeaders = headers();

  if (isLocal) {
    console.warn("Is running locally, skipping RSC auth");
    return;
  }
  const session = await getServerSession(authOptions);

  const bearerToken: string | null | undefined = session?.accessToken;
  if (!bearerToken) {
    console.info("Found no token, redirecting to login");
    redirect(`/api/auth/signin/azure-ad`);
  }
}

export async function getToken(): Promise<string> {
  if (isLocal) return fakeToken;
  const session = await getServerSession(authOptions);
  return session.accessToken;
}

export async function getUser(): Promise<{
  name: string;
  email: string;
}> {
  const token = await getToken();
  const jwt = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString("utf8")
  );

  return {
    name: jwt.name,
    email: jwt.preferred_username,
  };
}

export async function getUsersGroups(): Promise<string[]> {
  const membersOf = await getMembersOf();

  if ("error" in membersOf) {
    throw new Error(
      `Failed to get groups for user, MS responded with ${membersOf.status} ${membersOf.statusText}`,
      {
        cause: membersOf.error,
      }
    );
  }

  return membersOf.value.map((group) => group.id);
}

export function isUserLoggedIn(): boolean {
  try {
    getUser();
    return true;
  } catch (e) {
    return false;
  }
}

export async function userHasAdGroup(groupId: string): Promise<boolean> {
  const membersOf = await getMembersOf();

  if ("error" in membersOf) {
    throw new Error(
      `Failed to get groups for user, MS responded with ${membersOf.status} ${membersOf.statusText}`,
      {
        cause: membersOf.error,
      }
    );
  }

  return membersOf.value.some((group) => group.id === groupId);
}
