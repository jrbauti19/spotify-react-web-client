import { default as Axios, default as axios } from 'axios';
import {
  getFromLocalStorageWithExpiry,
  setLocalStorageWithExpiry,
} from '../localstorage';

/* eslint-disable import/no-anonymous-default-export */
const client_id = process.env.REACT_APP_SPOTIFY_CLIENT_ID as string;
const redirect_uri = process.env.REACT_APP_SPOTIFY_REDIRECT_URL as string;

const authUrl = new URL('https://accounts.spotify.com/authorize');

const SCOPES = [
  'ugc-image-upload',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-collaborative',
  'user-follow-modify',
  'user-follow-read',
  'user-read-playback-position',
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'user-library-modify',
] as const;

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
  // @ts-ignore
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const generateRandomString = (length: number) => {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const logInWithSpotify = async (anonymous?: boolean) => {
  const codeVerifier = generateRandomString(64);
  localStorage.setItem('code_verifier', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  // Use 'code' for both anonymous and authenticated flows
  authUrl.search = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type: 'code',
    scope: anonymous ? '' : SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  }).toString();

  window.location.href = authUrl.toString();
};

const requestToken = async (code: string) => {
  const code_verifier = localStorage.getItem('code_verifier') as string;

  const body = new URLSearchParams({
    code,
    client_id,
    redirect_uri,
    code_verifier,
    grant_type: 'authorization_code',
  });

  const { data: response } = await Axios.post<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
  }>('https://accounts.spotify.com/api/token', body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (response.access_token) {
    // MINIMAL FIX: Fix expiry calculation (was multiplying by 3600 incorrectly)
    setLocalStorageWithExpiry(
      'access_token',
      response.access_token,
      response.expires_in * 1000, // Convert seconds to milliseconds
    );
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + response.access_token;
    localStorage.setItem('refresh_token', response.refresh_token);

    // MINIMAL FIX: Clean up code_verifier after successful exchange
    localStorage.removeItem('code_verifier');
  }

  return response.access_token;
};

const getToken = async () => {
  const token = getFromLocalStorageWithExpiry('access_token');
  if (token) return [token, true];

  const urlParams = new URLSearchParams(window.location.search);

  let code = urlParams.get('code') as string;
  if (code) {
    // MINIMAL FIX: Clear URL after processing to prevent loops
    window.history.replaceState({}, document.title, window.location.pathname);
    return [await requestToken(code), true];
  }

  const publicToken = getFromLocalStorageWithExpiry('public_access_token');
  if (publicToken) return [publicToken, false];

  // MINIMAL FIX: Safer hash parsing
  const hash = window.location.hash;
  if (hash && hash.includes('access_token=')) {
    const access_token = hash.split('&')[0].split('=')[1];
    if (access_token) {
      setLocalStorageWithExpiry(
        'public_access_token',
        access_token,
        3600 * 1000,
      ); // Fix: multiply by 1000
      window.location.hash = '';
      return [access_token, false];
    }
  }

  return [null, false];
};

export const getRefreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token') as string;

  if (!refreshToken) {
    console.log('No refresh token available');
    return null;
  }

  const url = 'https://accounts.spotify.com/api/token';

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  };

  try {
    const body = await fetch(url, payload);
    const response = await body.json();

    if (!response.access_token) {
      console.log('Refresh token failed, clearing stored tokens');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('access_token');
      return null;
    }

    setLocalStorageWithExpiry(
      'access_token',
      response.access_token,
      response.expires_in * 1000,
    );
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + response.access_token;

    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }

    return response.access_token;
  } catch (error) {
    console.error('Refresh token error:', error);
    return null;
  }
};

export default { logInWithSpotify, getToken, getRefreshToken };
