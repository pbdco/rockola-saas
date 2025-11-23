import { useTranslation } from 'next-i18next';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';
import { useState } from 'react';
import type { SerializedVenue } from 'models/venue';
import { AccessControl } from '../shared';
import { defaultHeaders } from 'lib/common';
import useVenues from 'hooks/useVenues';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

interface SpotifyConnectProps {
  venue: SerializedVenue;
}

const SpotifyConnect = ({ venue }: SpotifyConnectProps) => {
  const { t } = useTranslation('common');
  const { mutate } = useVenues();
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = Boolean(venue.spotifyUserId);
  const hasCredentials = Boolean(venue.spotifyClientId && venue.spotifyClientSecret);

  const handleConnect = () => {
    if (!hasCredentials) {
      toast.error(t('spotify-credentials-missing'));
      return;
    }
    // Redirect to Spotify OAuth flow
    window.location.href = `/api/venues/${venue.id}/spotify/connect`;
  };

  const handleDisconnect = async () => {
    if (!confirm(t('spotify-disconnect-confirm'))) {
      return;
    }

    setDisconnecting(true);

    try {
      const response = await fetch(
        `/api/venues/${venue.id}/spotify/disconnect`,
        {
          method: 'POST',
          headers: defaultHeaders,
        }
      );

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error.message);
      }

      toast.success(t('spotify-disconnected'));
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDisconnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <MusicalNoteIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                {t('spotify-connected')}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {venue.spotifyDisplayName || venue.spotifyUserId}
              </p>
            </div>
          </div>
          <AccessControl resource="venue" actions={['update']}>
            <Button
              size="sm"
              color="error"
              variant="outline"
              onClick={handleDisconnect}
              loading={disconnecting}
              disabled={disconnecting}
            >
              {t('disconnect')}
            </Button>
          </AccessControl>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <MusicalNoteIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="font-medium text-yellow-900 dark:text-yellow-100">
              {t('spotify-not-connected')}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {hasCredentials
                ? t('spotify-connect-description')
                : t('spotify-credentials-missing')}
            </p>
          </div>
        </div>
        <AccessControl resource="venue" actions={['update']}>
          <Button
            size="sm"
            color="primary"
            onClick={handleConnect}
            disabled={!hasCredentials}
          >
            <MusicalNoteIcon className="h-4 w-4 mr-2" />
            {t('connect-spotify')}
          </Button>
        </AccessControl>
      </div>
    </div>
  );
};

export default SpotifyConnect;

