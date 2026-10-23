/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, type Sequelize } from 'sequelize';
import { idAttr, plainOptions } from './_shared';

export interface RoleAttributes {
  id: number;
  name: string;
  label: string;
  description: string | null;
  is_system: boolean;
  created_at?: Date;
  updated_at?: Date;
}
export interface Role extends RoleAttributes {}
export class Role extends Model<RoleAttributes, Partial<RoleAttributes>> {
  declare permissions?: Permission[];
}

export interface PermissionAttributes {
  id: number;
  key: string;
  label: string;
  group: string;
  created_at?: Date;
  updated_at?: Date;
}
export interface Permission extends PermissionAttributes {}
export class Permission extends Model<PermissionAttributes, Partial<PermissionAttributes>> {}

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  status: 'active' | 'disabled';
  failed_login_count: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  password_changed_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
export interface User extends UserAttributes {}
export class User extends Model<UserAttributes, Partial<UserAttributes>> {
  declare roles?: Role[];

  /** Safe representation for API responses (never includes the password hash). */
  toSafeJSON() {
    const { password_hash: _hash, ...rest } = this.get({ plain: true }) as UserAttributes & { roles?: unknown };
    return rest;
  }
}

export interface SessionAttributes {
  id: string;
  user_id: number;
  csrf_token: string;
  ip: string | null;
  user_agent: string | null;
  expires_at: Date;
  last_seen_at: Date;
  created_at?: Date;
}
export interface Session extends SessionAttributes {}
export class Session extends Model<SessionAttributes, Partial<SessionAttributes>> {
  declare user?: User;
}

export interface PasswordResetTokenAttributes {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at?: Date;
}
export interface PasswordResetToken extends PasswordResetTokenAttributes {}
export class PasswordResetToken extends Model<PasswordResetTokenAttributes, Partial<PasswordResetTokenAttributes>> {}

export function initIdentity(sequelize: Sequelize) {
  Role.init(
    {
      id: idAttr(),
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      label: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.STRING(500), allowNull: true },
      is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, tableName: 'roles', ...plainOptions },
  );

  Permission.init(
    {
      id: idAttr(),
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      label: { type: DataTypes.STRING(150), allowNull: false },
      group: { type: DataTypes.STRING(60), allowNull: false },
    },
    { sequelize, tableName: 'permissions', ...plainOptions },
  );

  User.init(
    {
      id: idAttr(),
      name: { type: DataTypes.STRING(150), allowNull: false },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true,
        set(value: string) {
          this.setDataValue('email', String(value).trim().toLowerCase());
        },
      },
      password_hash: { type: DataTypes.STRING(100), allowNull: false },
      status: { type: DataTypes.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
      failed_login_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      locked_until: { type: DataTypes.DATE, allowNull: true },
      last_login_at: { type: DataTypes.DATE, allowNull: true },
      password_changed_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'users',
      underscored: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      defaultScope: { attributes: { exclude: ['password_hash'] } },
      scopes: { withPassword: { attributes: { include: ['password_hash'] } } },
    },
  );

  Session.init(
    {
      id: { type: DataTypes.CHAR(64), primaryKey: true },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      csrf_token: { type: DataTypes.CHAR(64), allowNull: false },
      ip: { type: DataTypes.STRING(64), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      last_seen_at: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, tableName: 'sessions', underscored: true, createdAt: 'created_at', updatedAt: false },
  );

  PasswordResetToken.init(
    {
      id: idAttr(),
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: 'password_reset_tokens', underscored: true, createdAt: 'created_at', updatedAt: false },
  );
}
