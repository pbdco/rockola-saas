import { Role } from '@prisma/client';

type RoleType = (typeof Role)[keyof typeof Role];
export type Action = 'create' | 'update' | 'read' | 'delete' | 'manage';
export type Resource =
  | 'venue'
  | 'api_key'
  | 'payment'
  | 'song_request'
  | 'user'
  | 'platform';

type RolePermissions = {
  [role in RoleType]: Permission[];
};

export type Permission = {
  resource: Resource;
  actions: Action[] | '*';
};

export const availableRoles = [
  {
    id: Role.USER,
    name: 'User',
  },
  {
    id: Role.SUPERADMIN,
    name: 'Super Admin',
  },
];

export const permissions: RolePermissions = {
  SUPERADMIN: [
    {
      resource: 'venue',
      actions: '*',
    },
    {
      resource: 'api_key',
      actions: '*',
    },
    {
      resource: 'payment',
      actions: '*',
    },
    {
      resource: 'song_request',
      actions: '*',
    },
    {
      resource: 'user',
      actions: '*',
    },
    {
      resource: 'platform',
      actions: '*',
    },
  ],
  USER: [
    {
      resource: 'venue',
      actions: '*', // Users can fully manage their own venues
    },
    {
      resource: 'api_key',
      actions: '*', // Users can manage their own API keys
    },
    {
      resource: 'payment',
      actions: ['read'], // Users can read their own payments
    },
    {
      resource: 'song_request',
      actions: ['read'], // Users can read song requests for their venues
    },
  ],
};
