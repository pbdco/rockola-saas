import { useTranslation } from 'next-i18next';
import { Button } from 'react-daisyui';
import { useState } from 'react';
import type { SerializedVenue } from 'models/venue';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import { AccessControl } from '../shared';
import { defaultHeaders } from 'lib/common';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import useVenues from 'hooks/useVenues';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import SpotifyConnect from './SpotifyConnect';

interface VenueListProps {
  venues: SerializedVenue[];
}

const VenueList = ({ venues }: VenueListProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { mutate } = useVenues();

  const [selectedVenue, setSelectedVenue] = useState<SerializedVenue | null>(
    null
  );
  const [confirmationDialogVisible, setConfirmationDialogVisible] =
    useState(false);

  const handleDelete = async () => {
    if (!selectedVenue) return;

    try {
      const response = await fetch(
        `/api/venues/${selectedVenue.id}`,
        {
          method: 'DELETE',
          headers: defaultHeaders,
        }
      );

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error.message);
      }

      toast.success(t('venue-deleted'));
      mutate();
      setConfirmationDialogVisible(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openDeleteDialog = (venue: SerializedVenue) => {
    setSelectedVenue(venue);
    setConfirmationDialogVisible(true);
  };

  const getModeBadgeColor = (mode: string) => {
    switch (mode) {
      case 'QUEUE':
        return 'badge-primary';
      case 'PLAYLIST':
        return 'badge-secondary';
      case 'AUTOMATION':
        return 'badge-accent';
      default:
        return 'badge-ghost';
    }
  };

  return (
    <>
      <div className="space-y-4">
        {venues.map((venue) => (
          <div key={venue.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{venue.name}</h3>
                  <span className={`badge ${getModeBadgeColor(venue.mode)}`}>
                    {venue.mode}
                  </span>
                  <span
                    className={`badge ${venue.isActive ? 'badge-success' : 'badge-error'}`}
                  >
                    {venue.isActive ? t('active') : t('inactive')}
                  </span>
                </div>
                {venue.address && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {venue.address}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {venue.pricingEnabled && venue.pricePerSong && (
                    <span>
                      💰 {venue.currency} {venue.pricePerSong} {t('per-song')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <AccessControl resource="venue" actions={['update']}>
                  <Button
                    size="sm"
                    color="ghost"
                    onClick={() => router.push(`/venues/${venue.id}/edit`)}
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    {t('edit')}
                  </Button>
                </AccessControl>
                <AccessControl resource="venue" actions={['delete']}>
                  <Button
                    size="sm"
                    color="error"
                    variant="outline"
                    onClick={() => openDeleteDialog(venue)}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {t('delete')}
                  </Button>
                </AccessControl>
              </div>
            </div>

            {/* Spotify Connection Status */}
            <div className="mt-4">
              <SpotifyConnect venue={venue} />
            </div>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        visible={confirmationDialogVisible}
        title={t('confirm-delete-venue')}
        onCancel={() => setConfirmationDialogVisible(false)}
        onConfirm={handleDelete}
        confirmText={t('delete')}
        cancelText={t('cancel')}
      >
        {t('delete-venue-warning', { name: selectedVenue?.name || '' })}
      </ConfirmationDialog>
    </>
  );
};

export default VenueList;



