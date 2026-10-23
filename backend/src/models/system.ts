/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, type Sequelize } from 'sequelize';
import { idAttr, plainOptions } from './_shared';

interface Timestamps {
  created_at?: Date;
  updated_at?: Date;
}

export interface ContactSubmissionAttributes extends Timestamps {
  id: number;
  topic: string;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  subject: string | null;
  message: string;
  details: string | null;
  status: 'new' | 'read' | 'replied' | 'archived' | 'spam';
  ip_hash: string | null;
  user_agent: string | null;
  handled_by: number | null;
}
export interface ContactSubmission extends ContactSubmissionAttributes {}
export class ContactSubmission extends Model<ContactSubmissionAttributes, Partial<ContactSubmissionAttributes>> {}

export interface NewsletterSubscriberAttributes extends Timestamps {
  id: number;
  email: string;
  name: string | null;
  status: 'pending' | 'subscribed' | 'unsubscribed';
  consent_text: string;
  consented_at: Date;
  confirm_token_hash: string | null;
  confirmed_at: Date | null;
  unsubscribe_token: string;
  unsubscribed_at: Date | null;
  source: string | null;
  ip_hash: string | null;
}
export interface NewsletterSubscriber extends NewsletterSubscriberAttributes {}
export class NewsletterSubscriber extends Model<
  NewsletterSubscriberAttributes,
  Partial<NewsletterSubscriberAttributes>
> {}

export const SETTING_TYPES = ['text', 'textarea', 'url', 'email', 'boolean', 'media'] as const;

export interface SiteSettingAttributes extends Timestamps {
  id: number;
  key: string;
  value: string | null;
  group: string;
  label: string;
  type: (typeof SETTING_TYPES)[number];
  is_public: boolean;
  sort_order: number;
  updated_by: number | null;
}
export interface SiteSetting extends SiteSettingAttributes {}
export class SiteSetting extends Model<SiteSettingAttributes, Partial<SiteSettingAttributes>> {}

export interface RedirectAttributes extends Timestamps {
  id: number;
  from_path: string;
  to_path: string;
  status_code: number;
  is_enabled: boolean;
  hits: number;
  note: string | null;
}
export interface Redirect extends RedirectAttributes {}
export class Redirect extends Model<RedirectAttributes, Partial<RedirectAttributes>> {}

export interface AuditLogAttributes {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  changes: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  created_at?: Date;
}
export interface AuditLog extends AuditLogAttributes {}
export class AuditLog extends Model<AuditLogAttributes, Partial<AuditLogAttributes>> {}

export function initSystem(sequelize: Sequelize) {
  ContactSubmission.init(
    {
      id: idAttr(),
      topic: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'general' },
      name: { type: DataTypes.STRING(150), allowNull: false },
      email: { type: DataTypes.STRING(191), allowNull: false },
      phone: { type: DataTypes.STRING(40), allowNull: true },
      organisation: { type: DataTypes.STRING(200), allowNull: true },
      subject: { type: DataTypes.STRING(255), allowNull: true },
      message: { type: DataTypes.TEXT, allowNull: false },
      details: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('new', 'read', 'replied', 'archived', 'spam'),
        allowNull: false,
        defaultValue: 'new',
      },
      ip_hash: { type: DataTypes.CHAR(64), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
      handled_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    { sequelize, tableName: 'contact_submissions', ...plainOptions },
  );

  NewsletterSubscriber.init(
    {
      id: idAttr(),
      email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(150), allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'subscribed', 'unsubscribed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      consent_text: { type: DataTypes.STRING(500), allowNull: false },
      consented_at: { type: DataTypes.DATE, allowNull: false },
      confirm_token_hash: { type: DataTypes.CHAR(64), allowNull: true },
      confirmed_at: { type: DataTypes.DATE, allowNull: true },
      unsubscribe_token: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
      unsubscribed_at: { type: DataTypes.DATE, allowNull: true },
      source: { type: DataTypes.STRING(60), allowNull: true },
      ip_hash: { type: DataTypes.CHAR(64), allowNull: true },
    },
    { sequelize, tableName: 'newsletter_subscribers', ...plainOptions },
  );

  SiteSetting.init(
    {
      id: idAttr(),
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      value: { type: DataTypes.TEXT, allowNull: true },
      group: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'general' },
      label: { type: DataTypes.STRING(150), allowNull: false },
      type: { type: DataTypes.ENUM(...SETTING_TYPES), allowNull: false, defaultValue: 'text' },
      is_public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    { sequelize, tableName: 'site_settings', ...plainOptions },
  );

  Redirect.init(
    {
      id: idAttr(),
      from_path: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      to_path: { type: DataTypes.STRING(1000), allowNull: false },
      status_code: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 301 },
      is_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      hits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      note: { type: DataTypes.STRING(255), allowNull: true },
    },
    { sequelize, tableName: 'redirects', ...plainOptions },
  );

  AuditLog.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      user_email: { type: DataTypes.STRING(191), allowNull: true },
      action: { type: DataTypes.STRING(60), allowNull: false },
      entity_type: { type: DataTypes.STRING(60), allowNull: true },
      entity_id: { type: DataTypes.STRING(64), allowNull: true },
      summary: { type: DataTypes.STRING(500), allowNull: true },
      changes: { type: DataTypes.TEXT, allowNull: true },
      ip_hash: { type: DataTypes.CHAR(64), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
    },
    { sequelize, tableName: 'audit_logs', underscored: true, createdAt: 'created_at', updatedAt: false },
  );
}
