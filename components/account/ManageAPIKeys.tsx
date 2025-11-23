import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, Card, Table, Input } from 'react-daisyui';
import { Modal } from '@/components/shared';
import useAPIKeys from 'hooks/useAPIKeys';
import { Loading, ConfirmationDialog, InputWithLabel } from '@/components/shared';
import { defaultHeaders } from 'lib/common';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const ManageAPIKeys = () => {
  const { t } = useTranslation('common');
  const { data, isLoading, error, mutate } = useAPIKeys();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const apiKeys = data?.data || [];

  const handleCreate = async (name: string) => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ name }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message || t('error-creating-api-key'));
      }

      toast.success(t('api-key-created'));
      setNewApiKey(json.data.apiKey);
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (apiKeyId: string) => {
    try {
      const response = await fetch(`/api/api-keys/${apiKeyId}`, {
        method: 'DELETE',
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error?.message || t('error-deleting-api-key'));
      }

      toast.success(t('api-key-deleted'));
      mutate();
      setDeletingKeyId(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    toast.success(t('copied-to-clipboard'));
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {t('error-loading-api-keys')}
      </div>
    );
  }

  return (
    <Card>
      <Card.Body>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{t('api-keys')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('api-key-description')}
            </p>
          </div>
          <Button
            color="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('create-api-key')}
          </Button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('no-api-key-title')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <span>{t('name')}</span>
                <span>{t('created')}</span>
                <span>{t('last-used')}</span>
                <span>{t('actions')}</span>
              </Table.Head>
              <Table.Body>
                {apiKeys.map((key) => (
                  <Table.Row key={key.id}>
                    <span>{key.name}</span>
                    <span>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : t('never')}
                    </span>
                    <span>
                      <Button
                        size="xs"
                        color="error"
                        onClick={() => setDeletingKeyId(key.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </span>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        {/* Create API Key Modal */}
        <Modal open={showCreateModal} close={() => {
          setShowCreateModal(false);
          setNewApiKey(null);
        }}>
          <Modal.Header>{t('create-api-key')}</Modal.Header>
          <Modal.Body>
            {newApiKey ? (
              <div className="space-y-4">
                <div className="alert alert-warning">
                  {t('new-api-warning')}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('api-key')}</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newApiKey}
                      readOnly
                      className="font-mono flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(newApiKey, 'new')}
                    >
                      {copiedKeyId === 'new' ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <ClipboardIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Modal.Footer>
                  <Button onClick={() => {
                    setShowCreateModal(false);
                    setNewApiKey(null);
                  }}>
                    {t('close')}
                  </Button>
                </Modal.Footer>
              </div>
            ) : (
              <CreateAPIKeyForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreateModal(false)}
              />
            )}
          </Modal.Body>
        </Modal>

        {/* Delete Confirmation */}
        {deletingKeyId && (
          <ConfirmationDialog
            title={t('revoke-api-key')}
            visible={!!deletingKeyId}
            onConfirm={() => handleDelete(deletingKeyId)}
            onCancel={() => setDeletingKeyId(null)}
          >
            <p>{t('revoke-api-key-confirm')}</p>
          </ConfirmationDialog>
        )}
      </Card.Body>
    </Card>
  );
};

const CreateAPIKeyForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation('common');

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required(t('require-api-key-name')),
    }),
    onSubmit: async (values) => {
      onSubmit(values.name);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <InputWithLabel
        label={t('name')}
        name="name"
        placeholder={t('my-api-key')}
        value={formik.values.name}
        onChange={formik.handleChange}
        error={formik.touched.name ? formik.errors.name : undefined}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          color="primary"
          loading={formik.isSubmitting}
          disabled={formik.isSubmitting}
        >
          {t('create-api-key')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
};

export default ManageAPIKeys;
