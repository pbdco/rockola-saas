import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Card, Table, Button, Select } from 'react-daisyui';
import useSWR, { mutate } from 'swr';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';
import type { User, Role } from '@prisma/client';
import { Loading, Modal, ConfirmationDialog, InputWithLabel, Alert } from '@/components/shared';
import { BuildingStorefrontIcon, KeyIcon, PencilIcon, TrashIcon, LockClosedIcon, LockOpenIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SerializedVenue } from 'models/venue';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';

interface UserWithCounts extends User {
  _count: {
    venues: number;
    apiKeys: number;
  };
}

type ModalType = 'add' | 'edit' | 'delete' | 'block' | 'changePassword' | 'venues' | null;
type SelectedUser = UserWithCounts | null;

const AdminDashboard = () => {
  const { t } = useTranslation('common');
  const { data, error, isLoading } = useSWR<ApiResponse<UserWithCounts[]>>(
    '/api/admin/users',
    fetcher
  );
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser>(null);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {t('error-loading-users')}
      </div>
    );
  }

  const users = data?.data || [];

  const openModal = (type: ModalType, user?: UserWithCounts) => {
    setSelectedUser(user || null);
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  const refreshUsers = () => {
    mutate('/api/admin/users');
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-base-200">
          <Card.Body>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('total-users')}
            </h3>
            <p className="text-3xl font-bold">{users.length}</p>
          </Card.Body>
        </Card>
        <Card className="bg-base-200">
          <Card.Body>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('total-venues')}
            </h3>
            <p className="text-3xl font-bold">
              {users.reduce((sum, user) => sum + (user._count?.venues || 0), 0)}
            </p>
          </Card.Body>
        </Card>
        <Card className="bg-base-200">
          <Card.Body>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('super-admins')}
            </h3>
            <p className="text-3xl font-bold">
              {users.filter((u) => u.role === 'SUPERADMIN').length}
            </p>
          </Card.Body>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <Card.Body>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('all-users')}</h2>
            <Button
              color="primary"
              size="sm"
              onClick={() => openModal('add')}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('add-user')}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <span>{t('name')}</span>
                <span>{t('email')}</span>
                <span>{t('role')}</span>
                <span>{t('status')}</span>
                <span>{t('venues')}</span>
                <span>{t('api-keys')}</span>
                <span>{t('created')}</span>
                <span>{t('actions')}</span>
              </Table.Head>
              <Table.Body>
                {users.map((user) => (
                  <Table.Row key={user.id}>
                    <span>{user.name}</span>
                    <span>{user.email}</span>
                    <span>
                      <span
                        className={`badge ${
                          user.role === 'SUPERADMIN'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {user.role}
                      </span>
                    </span>
                    <span>
                      {user.lockedAt ? (
                        <span className="badge badge-error">{t('blocked')}</span>
                      ) : (
                        <span className="badge badge-success">{t('active')}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Button
                        size="xs"
                        color="ghost"
                        onClick={() => openModal('venues', user)}
                        className="p-0 min-h-0 h-auto"
                      >
                        <BuildingStorefrontIcon className="h-4 w-4 mr-1" />
                        {user._count?.venues || 0}
                      </Button>
                    </span>
                    <span className="flex items-center gap-1">
                      <KeyIcon className="h-4 w-4" />
                      {user._count?.apiKeys || 0}
                    </span>
                    <span>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          color="ghost"
                          onClick={() => openModal('edit', user)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="xs"
                          color={user.lockedAt ? 'success' : 'warning'}
                          onClick={() => openModal('block', user)}
                        >
                          {user.lockedAt ? (
                            <LockOpenIcon className="h-4 w-4" />
                          ) : (
                            <LockClosedIcon className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="xs"
                          color="ghost"
                          onClick={() => openModal('changePassword', user)}
                        >
                          🔑
                        </Button>
                        <Button
                          size="xs"
                          color="error"
                          onClick={() => openModal('delete', user)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </span>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modals */}
      {modalType === 'add' && (
        <AddUserModal
          open={modalType === 'add'}
          onClose={closeModal}
          onSuccess={refreshUsers}
        />
      )}

      {modalType === 'edit' && selectedUser && (
        <EditUserModal
          open={modalType === 'edit'}
          user={selectedUser}
          onClose={closeModal}
          onSuccess={refreshUsers}
        />
      )}

      {modalType === 'delete' && selectedUser && (
        <DeleteUserModal
          open={modalType === 'delete'}
          user={selectedUser}
          onClose={closeModal}
          onSuccess={refreshUsers}
        />
      )}

      {modalType === 'block' && selectedUser && (
        <BlockUserModal
          open={modalType === 'block'}
          user={selectedUser}
          onClose={closeModal}
          onSuccess={refreshUsers}
        />
      )}

      {modalType === 'changePassword' && selectedUser && (
        <ChangePasswordModal
          open={modalType === 'changePassword'}
          user={selectedUser}
          onClose={closeModal}
        />
      )}

      {modalType === 'venues' && selectedUser && (
        <ManageUserVenuesModal
          open={modalType === 'venues'}
          user={selectedUser}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

// Add User Modal
const AddUserModal = ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) => {
  const { t } = useTranslation('common');
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'USER' as Role,
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required(t('require-name')),
      email: Yup.string().email(t('invalid-email')).required(t('require-email')),
      password: Yup.string().min(8, t('password-min-length')).required(t('require-password')),
      role: Yup.string().oneOf(['USER', 'SUPERADMIN']).required(),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || t('error-creating-user'));
        }

        toast.success(t('user-created-successfully'));
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message);
      }
    },
  });

  if (!open) return null;

  return (
    <Modal open={open} close={onClose}>
      <Modal.Header>{t('add-user')}</Modal.Header>
      <Modal.Body>
        {error && <Alert status="error" className="mb-4">{error}</Alert>}
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <InputWithLabel
            label={t('name')}
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name ? formik.errors.name : undefined}
          />
          <InputWithLabel
            label={t('email')}
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email ? formik.errors.email : undefined}
          />
          <InputWithLabel
            label={t('password')}
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password ? formik.errors.password : undefined}
          />
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">{t('role')}</span>
            </label>
            <Select
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              className="w-full"
            >
              <option value="USER">{t('user')}</option>
              <option value="SUPERADMIN">{t('superadmin')}</option>
            </Select>
          </div>
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" color="primary" loading={formik.isSubmitting}>
              {t('create')}
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Body>
    </Modal>
  );
};

// Edit User Modal
const EditUserModal = ({ open, user, onClose, onSuccess }: { open: boolean; user: UserWithCounts; onClose: () => void; onSuccess: () => void }) => {
  const { t } = useTranslation('common');
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: user.name || '',
      email: user.email || '',
      role: user.role,
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required(t('require-name')),
      email: Yup.string().email(t('invalid-email')).required(t('require-email')),
      role: Yup.string().oneOf(['USER', 'SUPERADMIN']).required(),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || t('error-updating-user'));
        }

        toast.success(t('user-updated-successfully'));
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message);
      }
    },
  });

  if (!open) return null;

  return (
    <Modal open={open} close={onClose}>
      <Modal.Header>{t('edit-user')}</Modal.Header>
      <Modal.Body>
        {error && <Alert status="error" className="mb-4">{error}</Alert>}
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <InputWithLabel
            label={t('name')}
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name ? formik.errors.name : undefined}
          />
          <InputWithLabel
            label={t('email')}
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email ? formik.errors.email : undefined}
          />
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">{t('role')}</span>
            </label>
            <Select
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              className="w-full"
            >
              <option value="USER">{t('user')}</option>
              <option value="SUPERADMIN">{t('superadmin')}</option>
            </Select>
          </div>
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" color="primary" loading={formik.isSubmitting}>
              {t('save-changes')}
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Body>
    </Modal>
  );
};

// Delete User Modal
const DeleteUserModal = ({ open, user, onClose, onSuccess }: { open: boolean; user: UserWithCounts; onClose: () => void; onSuccess: () => void }) => {
  const { t } = useTranslation('common');

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || t('error-deleting-user'));
      }

      toast.success(t('user-deleted-successfully'));
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <ConfirmationDialog
      title={t('delete-user')}
      visible={open}
      onConfirm={handleDelete}
      onCancel={onClose}
      confirmText={t('delete')}
    >
      <p>
        {t('delete-user-confirmation', { name: user.name || '', email: user.email || '' })}
      </p>
    </ConfirmationDialog>
  );
};

// Block User Modal
const BlockUserModal = ({ open, user, onClose, onSuccess }: { open: boolean; user: UserWithCounts; onClose: () => void; onSuccess: () => void }) => {
  const { t } = useTranslation('common');
  const isBlocked = !!user.lockedAt;

  const handleBlock = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}?action=block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !isBlocked }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || t('error-blocking-user'));
      }

      toast.success(isBlocked ? t('user-unblocked-successfully') : t('user-blocked-successfully'));
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <ConfirmationDialog
      title={isBlocked ? t('unblock-user') : t('block-user')}
      visible={open}
      onConfirm={handleBlock}
      onCancel={onClose}
      confirmText={isBlocked ? t('unblock') : t('block')}
    >
      <p>
        {isBlocked
          ? t('unblock-user-confirmation', { name: user.name || '', email: user.email || '' })
          : t('block-user-confirmation', { name: user.name || '', email: user.email || '' })}
      </p>
    </ConfirmationDialog>
  );
};

// Change Password Modal
const ChangePasswordModal = ({ open, user, onClose }: { open: boolean; user: UserWithCounts; onClose: () => void }) => {
  const { t } = useTranslation('common');
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object().shape({
      newPassword: Yup.string().min(8, t('password-min-length')).required(t('require-password')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], t('passwords-must-match'))
        .required(t('require-confirm-password')),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        const response = await fetch(`/api/admin/users/${user.id}?action=change-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: values.newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || t('error-changing-password'));
        }

        toast.success(t('password-changed-successfully'));
        onClose();
      } catch (err: any) {
        setError(err.message);
      }
    },
  });

  if (!open) return null;

  return (
    <Modal open={open} close={onClose}>
      <Modal.Header>{t('change-password')}</Modal.Header>
      <Modal.Body>
        {error && <Alert status="error" className="mb-4">{error}</Alert>}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('change-password-for-user', { name: user.name || '', email: user.email || '' })}
        </p>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <InputWithLabel
            label={t('new-password')}
            name="newPassword"
            type="password"
            value={formik.values.newPassword}
            onChange={formik.handleChange}
            error={formik.touched.newPassword ? formik.errors.newPassword : undefined}
          />
          <InputWithLabel
            label={t('confirm-password')}
            name="confirmPassword"
            type="password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            error={formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined}
          />
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" color="primary" loading={formik.isSubmitting}>
              {t('change-password')}
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Body>
    </Modal>
  );
};

// Manage User Venues Modal
const ManageUserVenuesModal = ({ open, user, onClose }: { open: boolean; user: UserWithCounts; onClose: () => void }) => {
  const { t } = useTranslation('common');
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<SerializedVenue[]>>(
    open ? `/api/admin/users/${user.id}/venues` : null,
    fetcher
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<SerializedVenue | null>(null);
  const [deletingVenue, setDeletingVenue] = useState<SerializedVenue | null>(null);

  const venues = data?.data || [];

  const refreshVenues = () => {
    mutate();
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

  if (!open) return null;

  return (
    <Modal open={open} close={onClose}>
      <Modal.Header>
        {t('manage-venues-for-user', { name: user.name || '', email: user.email || '' })}
      </Modal.Header>
      <Modal.Body className="max-h-[70vh] overflow-y-auto">
        {error && <Alert status="error" className="mb-4">{t('error-loading-venues')}</Alert>}
        
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('venues')}</h3>
              <Button
                size="sm"
                color="primary"
                onClick={() => {
                  setShowAddForm(true);
                  setEditingVenue(null);
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('add-venue')}
              </Button>
            </div>

            {showAddForm && (
              <AddVenueForm
                userId={user.id}
                onSuccess={() => {
                  setShowAddForm(false);
                  refreshVenues();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {editingVenue && (
              <EditVenueForm
                venue={editingVenue}
                userId={user.id}
                onSuccess={() => {
                  setEditingVenue(null);
                  refreshVenues();
                }}
                onCancel={() => setEditingVenue(null)}
              />
            )}

            {!showAddForm && !editingVenue && (
              <div className="space-y-3">
                {venues.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">{t('no-venues-found')}</p>
                ) : (
                  venues.map((venue) => (
                    <div key={venue.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{venue.name}</h4>
                            <span className={`badge ${getModeBadgeColor(venue.mode)}`}>
                              {venue.mode}
                            </span>
                            <span className={`badge ${venue.isActive ? 'badge-success' : 'badge-error'}`}>
                              {venue.isActive ? t('active') : t('inactive')}
                            </span>
                          </div>
                          {venue.address && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{venue.address}</p>
                          )}
                          {venue.pricingEnabled && venue.pricePerSong && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {venue.currency} {venue.pricePerSong} {t('per-song')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            color="ghost"
                            onClick={() => {
                              setEditingVenue(venue);
                              setShowAddForm(false);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="xs"
                            color="error"
                            onClick={() => setDeletingVenue(venue)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {deletingVenue && (
          <ConfirmationDialog
            title={t('delete-venue')}
            visible={!!deletingVenue}
            onConfirm={async () => {
              try {
                const response = await fetch(`/api/admin/users/${user.id}/venues/${deletingVenue.id}`, {
                  method: 'DELETE',
                });

                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error?.message || t('error-deleting-venue'));
                }

                toast.success(t('venue-deleted'));
                refreshVenues();
                setDeletingVenue(null);
              } catch (err: any) {
                toast.error(err.message);
              }
            }}
            onCancel={() => setDeletingVenue(null)}
          >
            <p>{t('delete-venue-warning', { name: deletingVenue.name })}</p>
          </ConfirmationDialog>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>{t('close')}</Button>
      </Modal.Footer>
    </Modal>
  );
};

// Add Venue Form (simplified for admin)
const AddVenueForm = ({ userId, onSuccess, onCancel }: { userId: string; onSuccess: () => void; onCancel: () => void }) => {
  const { t } = useTranslation('common');
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      slug: '',
      address: '',
      mode: 'QUEUE' as const,
      pricingEnabled: false,
      pricePerSong: '',
      currency: 'USD',
      isActive: true,
      spotifyClientId: '',
      spotifyClientSecret: '',
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required(t('require-venue-name')),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        const payload = {
          name: values.name,
          slug: values.slug || undefined,
          address: values.address || undefined,
          mode: values.mode,
          pricingEnabled: values.pricingEnabled,
          pricePerSong: values.pricingEnabled && values.pricePerSong ? parseFloat(values.pricePerSong) : null,
          currency: values.currency,
          isActive: values.isActive,
          spotifyClientId: values.spotifyClientId || undefined,
          spotifyClientSecret: values.spotifyClientSecret || undefined,
        };

        const response = await fetch(`/api/admin/users/${userId}/venues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || t('error-creating-venue'));
        }

        toast.success(t('venue-created'));
        onSuccess();
      } catch (err: any) {
        setError(err.message);
      }
    },
  });

  return (
    <div className="border rounded-lg p-4 mb-4 bg-base-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">{t('add-venue')}</h4>
        <Button size="xs" color="ghost" onClick={onCancel}>
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </div>
      {error && <Alert status="error" className="mb-4">{error}</Alert>}
      <form onSubmit={formik.handleSubmit} className="space-y-3">
        <InputWithLabel
          label={t('venue-name')}
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name ? formik.errors.name : undefined}
          required
        />
        <InputWithLabel
          label={t('venue-slug')}
          name="slug"
          value={formik.values.slug}
          onChange={formik.handleChange}
          descriptionText={t('optional')}
        />
        <InputWithLabel
          label={t('address')}
          name="address"
          value={formik.values.address}
          onChange={formik.handleChange}
          descriptionText={t('optional')}
        />
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">{t('venue-mode')}</span>
          </label>
          <Select
            name="mode"
            value={formik.values.mode}
            onChange={formik.handleChange}
            className="w-full"
          >
            <option value="QUEUE">{t('mode-queue')}</option>
            <option value="PLAYLIST">{t('mode-playlist')}</option>
            <option value="AUTOMATION">{t('mode-automation')}</option>
          </Select>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formik.values.isActive}
              onChange={formik.handleChange}
              className="checkbox"
            />
            <span className="label-text">{t('venue-is-active')}</span>
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" color="primary" size="sm" loading={formik.isSubmitting}>
            {t('create-venue')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Edit Venue Form (simplified for admin)
const EditVenueForm = ({ venue, userId, onSuccess, onCancel }: { venue: SerializedVenue; userId: string; onSuccess: () => void; onCancel: () => void }) => {
  const { t } = useTranslation('common');
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: venue.name || '',
      slug: venue.slug || '',
      address: venue.address || '',
      mode: venue.mode || 'QUEUE',
      pricingEnabled: venue.pricingEnabled || false,
      pricePerSong: venue.pricePerSong?.toString() || '',
      currency: venue.currency || 'USD',
      isActive: venue.isActive ?? true,
      spotifyClientId: venue.spotifyClientId || '',
      spotifyClientSecret: '', // Don't show existing secret
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required(t('require-venue-name')),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        const payload: any = {
          name: values.name,
          slug: values.slug || undefined,
          address: values.address || undefined,
          mode: values.mode,
          pricingEnabled: values.pricingEnabled,
          pricePerSong: values.pricingEnabled && values.pricePerSong ? parseFloat(values.pricePerSong) : null,
          currency: values.currency,
          isActive: values.isActive,
        };

        // Only include Spotify credentials if they were changed
        if (values.spotifyClientId) {
          payload.spotifyClientId = values.spotifyClientId;
        }
        if (values.spotifyClientSecret) {
          payload.spotifyClientSecret = values.spotifyClientSecret;
        }

        const response = await fetch(`/api/admin/users/${userId}/venues/${venue.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || t('error-updating-venue'));
        }

        toast.success(t('venue-updated'));
        onSuccess();
      } catch (err: any) {
        setError(err.message);
      }
    },
  });

  return (
    <div className="border rounded-lg p-4 mb-4 bg-base-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">{t('edit-venue')}</h4>
        <Button size="xs" color="ghost" onClick={onCancel}>
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </div>
      {error && <Alert status="error" className="mb-4">{error}</Alert>}
      <form onSubmit={formik.handleSubmit} className="space-y-3">
        <InputWithLabel
          label={t('venue-name')}
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name ? formik.errors.name : undefined}
          required
        />
        <InputWithLabel
          label={t('venue-slug')}
          name="slug"
          value={formik.values.slug}
          onChange={formik.handleChange}
          descriptionText={t('optional')}
        />
        <InputWithLabel
          label={t('address')}
          name="address"
          value={formik.values.address}
          onChange={formik.handleChange}
          descriptionText={t('optional')}
        />
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">{t('venue-mode')}</span>
          </label>
          <Select
            name="mode"
            value={formik.values.mode}
            onChange={formik.handleChange}
            className="w-full"
          >
            <option value="QUEUE">{t('mode-queue')}</option>
            <option value="PLAYLIST">{t('mode-playlist')}</option>
            <option value="AUTOMATION">{t('mode-automation')}</option>
          </Select>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formik.values.isActive}
              onChange={formik.handleChange}
              className="checkbox"
            />
            <span className="label-text">{t('venue-is-active')}</span>
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" color="primary" size="sm" loading={formik.isSubmitting}>
            {t('save-changes')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminDashboard;
