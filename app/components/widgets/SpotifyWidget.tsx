'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, AlertCircle, LogOut } from 'lucide-react';
import { useWorkerInterval } from '../../hooks/useWorkerInterval';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface SpotifyWidgetProps {
    blur?: number;
    isEditing?: boolean;
    isHidden?: boolean;
    settings?: {
        clientId?: string;
    };
    onSettingsChange?: (settings: { clientId?: string }) => void;
}

interface PlaybackItem {
    name: string;
    artist: string;
    albumArt: string;
    uri: string;
    type: 'track' | 'episode' | 'ad' | 'unknown';
}

const DEFAULT_CLIENT_ID = "87354428e5064686a566255e774dbc93";
const SCOPES = [
    "streaming", 
    "user-read-email", 
    "user-read-private", 
    "user-read-playback-state", 
    "user-modify-playback-state"
];

export default function SpotifyWidget({ blur = 0, isEditing = false, isHidden = false,settings, onSettingsChange }: SpotifyWidgetProps) {
    const [token, setToken] = useState<string | null>(null);
    const [clientId, setClientId] = useState(settings?.clientId || DEFAULT_CLIENT_ID);
    const [isPremium, setIsPremium] = useState<boolean | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [paused, setPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<PlaybackItem | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debugRef = useRef<boolean>(false);

    // Sync settings
    useEffect(() => {
        if (settings?.clientId) setClientId(settings.clientId);
    }, [settings?.clientId]);

    const handleClientIdChange = (id: string) => {
        setClientId(id);
        if (onSettingsChange) onSettingsChange({ clientId: id });
    };

    // 1. Auth & Token Management (PKCE)
    
    // PKCE Helpers
    const generateRandomString = (length: number) => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }

    const sha256 = async (plain: string) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        return window.crypto.subtle.digest('SHA-256', data)
    }

    const base64encode = (input: ArrayBuffer) => {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    useEffect(() => {
        const args = new URLSearchParams(window.location.search);
        const code = args.get('code');

        // Check local storage for existing token
        const storedToken = localStorage.getItem('spotify_access_token');
        const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
        const storedExpiry = localStorage.getItem('spotify_token_expiry');

        if (code) {
            // If we have a code, exchange it
            const verifier = localStorage.getItem('spotify_verifier');
            if (verifier) {
                getToken(code, verifier);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } else if (storedToken && storedExpiry) {
            // Check expiry
            if (Date.now() > parseInt(storedExpiry)) {
                if (storedRefreshToken) {
                    refreshToken(storedRefreshToken);
                } else {
                    logout();
                }
            } else {
                setToken(storedToken);
                fetchUserProfile(storedToken);
            }
        }
    }, [clientId]);

    const getToken = async (code: string, verifier: string) => {
        if (!clientId) return;
        const redirectUri = window.location.origin + '/';

        try {
            const payload = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                    code_verifier: verifier,
                }),
            };

            const body = await fetch("https://accounts.spotify.com/api/token", payload);
            const response = await body.json();

            if (response.access_token) {
                storeToken(response);
            } else {
                setError("Failed to get token");
                console.error(response);
            }
        } catch (e) {
            console.error(e);
            setError("Error exchanging token");
        }
    };

    const refreshToken = async (refreshToken: string) => {
         if (!clientId) return;
         try {
            const payload = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            };
            const body = await fetch("https://accounts.spotify.com/api/token", payload);
            const response = await body.json();

            if (response.access_token) {
                storeToken(response);
            } else {
                logout(); // Refresh failed
            }
         } catch (e) {
             console.error(e);
             logout();
         }
    };

    const storeToken = (response: any) => {
        const { access_token, refresh_token, expires_in } = response;
        localStorage.setItem('spotify_access_token', access_token);
        if (refresh_token) {
            localStorage.setItem('spotify_refresh_token', refresh_token);
        }
        localStorage.setItem('spotify_token_expiry', (Date.now() + expires_in * 1000).toString());
        
        setToken(access_token);
        fetchUserProfile(access_token);
    };

    const fetchUserProfile = async (authToken: string) => {
        try {
            const res = await fetch('https://api.spotify.com/v1/me', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.status === 401) {
                // Token invalid/expired during use
                const rToken = localStorage.getItem('spotify_refresh_token');
                if (rToken) refreshToken(rToken);
                else logout();
                return;
            }
            const data = await res.json();
            setIsPremium(data.product === 'premium');
        } catch (e) {
            console.error("Profile fetch error", e);
            setError("Failed to load profile");
        }
    };

    const login = async () => {
        if (!clientId) return;
        const redirectUri = window.location.origin + '/'; 
        
        const verifier = generateRandomString(128);
        const hashed = await sha256(verifier);
        const codeChallenge = base64encode(hashed);

        localStorage.setItem('spotify_verifier', verifier);

        const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES.join(' '))}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
        window.location.href = authUrl;
    };

    const logout = () => {
        setToken(null);
        setIsPremium(null);
        setPlayer(null);
        setCurrentTrack(null);
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        localStorage.removeItem('spotify_verifier');
    };

    // 2. Web Playback SDK (Premium Only)
    useEffect(() => {
        if (!token || isPremium !== true) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'WidgetHub Player',
                getOAuthToken: (cb: any) => { cb(token); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }: any) => {
                console.log('Ready with Device ID', device_id);
                // Optional: Auto-transfer playback? 
                // For now, user must select device in Spotify Connect or we can try to transfer
            });

            player.addListener('not_ready', ({ device_id }: any) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', (state: any) => {
                if (!state) return;
                
                const track = state.track_window.current_track;
                let artistName = "Unknown Artist";
                let albumArt = "";

                if (track.artists && track.artists.length > 0) {
                     artistName = track.artists.map((a:any) => a.name).join(', ');
                } else if (track.album && track.album.name) {
                     // Sometimes show name might be in album name for episodes in SDK
                     artistName = track.album.name;
                }
                
                if (track.album && track.album.images && track.album.images.length > 0) {
                     albumArt = track.album.images[0].url;
                }

                setCurrentTrack({
                    name: track.name,
                    artist: artistName,
                    albumArt: albumArt,
                    uri: track.uri,
                    type: track.type === 'episode' ? 'episode' : 'track'
                });
                
                setPaused(state.paused);
                setIsActive(true);
            });

            player.connect();
        };

        return () => {
            // Cleanup tricky with external script, but disconnect player
            if (player) player.disconnect();
        };
    }, [token, isPremium]);

    // 3. Polling / Fallback (Free Users or Non-Active SDK)
    const pollSpotify = async () => {
        if (!token) return;
        const shouldPoll = isPremium === false || (isPremium === true && !isActive);
        if (!shouldPoll) return;

        try {
            // Modified to request episode data
            const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 204 || res.status > 400) {
                return; // No content or error
            }

            const data = await res.json();
            if (data && data.item) {
                 let artistName = "";
                 let albumArt = "";
                 
                 if (data.item.type === 'episode') {
                     artistName = data.item.show?.name || "Podcast";
                     albumArt = data.item.images?.[0]?.url || data.item.show?.images?.[0]?.url;
                 } else {
                     artistName = data.item.artists?.map((a:any) => a.name).join(', ');
                     albumArt = data.item.album?.images?.[0]?.url;
                 }

                 setCurrentTrack({
                    name: data.item.name,
                    artist: artistName,
                    albumArt: albumArt,
                    uri: data.item.uri,
                    type: data.item.type || 'unknown'
                });
                setPaused(!data.is_playing);
            }
        } catch (e) {
            console.error("Polling error", e);
        }
    };

    useEffect(() => {
        const shouldPoll = token && (isPremium === false || (isPremium === true && !isActive));
        if (shouldPoll) {
            pollSpotify();
        }
    }, [token, isPremium, isActive]);

    useWorkerInterval(() => {
        pollSpotify();
    }, (token && (isPremium === false || (isPremium === true && !isActive))) ? 5000 : null);


    // Controls
    const handlePlayPause = async () => {
        if (!token) return;
        if (isPremium && player && isActive) {
             player.togglePlay();
        } else {
            // API Fallback (Premium only usually, but let's try)
            // Note: API /player/play requires premium too usually.
            if (isPremium) {
                try {
                     const endpoint = paused ? 'play' : 'pause';
                     await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                     });
                     setPaused(!paused); // Optimistic update
                } catch (e) { console.error(e); }
            }
        }
    };

    const handleNext = async () => {
        if (isPremium && player && isActive) {
            player.nextTrack();
        } else if (isPremium) {
             await fetch(`https://api.spotify.com/v1/me/player/next`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
             });
        }
    };

    const handlePrev = async () => {
        if (isPremium && player && isActive) {
            player.previousTrack();
        } else if (isPremium) {
             await fetch(`https://api.spotify.com/v1/me/player/previous`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
             });
        }
    };

    // Render
    const renderContent = () => {
        if (!token) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
                    <Music className="w-12 h-12 text-green-500" />
                    <button 
                        onClick={login}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-all transform hover:scale-105"
                    >
                        Connect Spotify
                    </button>
                    {isEditing && (
                        <div className="text-xs text-white/50 w-full">
                            <label>Client ID</label>
                            <input 
                                type="text" 
                                value={clientId} 
                                onChange={(e) => handleClientIdChange(e.target.value)}
                                className="w-full bg-white/10 rounded px-2 py-1 mt-1"
                            />
                        </div>
                    )}
                </div>
            );
        }

        if (error) {
            return <div className="flex items-center justify-center h-full text-red-400">{error}</div>;
        }

        if (!currentTrack) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Music className="w-10 h-10 text-white/20 mb-2" />
                    <p className="text-white/60 text-sm">Not playing anything</p>
                    <button onClick={logout} className="text-xs text-white/30 mt-4 hover:text-white">Logout</button>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full w-full relative group">
                {/* Background Image Blur */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 scale-110 pointer-events-none transition-all duration-700" 
                    style={{ backgroundImage: `url(${currentTrack.albumArt})` }} 
                />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-4">
                    {!isHidden ? (
                        <div className="flex items-start space-x-3 flex-1 overflow-hidden">
                            <img 
                                src={currentTrack.albumArt} 
                                alt="Album Art" 
                                className={`w-16 h-16 rounded-lg  ${!paused ? 'animate-pulse-subtle' : ''}`} 
                            />
                            <div className="flex-1 min-w-0 flex flex-col justify-center h-16">
                                <h3 className="font-bold text-white truncate text-base leading-tight">
                                    {currentTrack.name}
                                </h3>
                                <p className="text-white/70 text-sm truncate">{currentTrack.artist}</p>
                            </div>
                        </div>
                    ) : null}

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                        <button onClick={logout} className="text-white/30 hover:text-white/80 transition p-1">
                             <LogOut size={14} />
                        </button>

                        <div className="flex items-center space-x-4">
                             {/* Only show controls if Premium */}
                             {isPremium ? (
                                <>
                                    <button onClick={handlePrev} className="text-white hover:text-green-400 transition transform hover:scale-110">
                                        <SkipBack size={20} />
                                    </button>
                                    <button 
                                        onClick={handlePlayPause} 
                                        className="bg-white text-black rounded-full p-2 hover:bg-green-400 transition transform hover:scale-105 shadow-xl"
                                    >
                                        {paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                                    </button>
                                    <button onClick={handleNext} className="text-white hover:text-green-400 transition transform hover:scale-110">
                                        <SkipForward size={20} />
                                    </button>
                                </>
                             ) : (
                                 <span className="text-xs text-white/50 tracking-wider font-medium px-2 py-1 bg-white/5 rounded">PREVIEW ONLY</span>
                             )}
                        </div>

                         <div className="w-5"></div>{/* Spacer for centering */}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div 
            className="flex flex-col w-full h-full rounded-2xl text-white  overflow-hidden relative transition-colors duration-300"
            style={{ 
                backdropFilter: `blur(${blur}px)`,
                backgroundColor: `rgba(0, 0, 0, 0)`
            }}
        >
            {renderContent()}
        </div>
    );
}
