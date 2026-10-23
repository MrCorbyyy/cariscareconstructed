import { DataTypes } from 'sequelize';

export const PUBLISH_STATUSES = ['draft', 'review', 'published', 'archived'] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const idAttr = () => ({ type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true });

export const statusAttrs = () => ({
  status: { type: DataTypes.ENUM(...PUBLISH_STATUSES), allowNull: false, defaultValue: 'draft' as PublishStatus },
  published_at: { type: DataTypes.DATE, allowNull: true },
});

export const seoAttrs = () => ({
  seo_title: { type: DataTypes.STRING(255), allowNull: true },
  seo_description: { type: DataTypes.STRING(500), allowNull: true },
  og_image_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
});

export const authorshipAttrs = () => ({
  review_note: { type: DataTypes.TEXT, allowNull: true },
  created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
});

/** Model options shared by soft-deletable content tables. */
const timestampNames = { createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at' } as const;
export const contentOptions = { underscored: true, timestamps: true, paranoid: true, ...timestampNames } as const;
export const plainOptions = { underscored: true, timestamps: true, paranoid: false, createdAt: 'created_at', updatedAt: 'updated_at' } as const;

export interface StatusFields {
  status: PublishStatus;
  published_at: Date | null;
}
export interface SeoFields {
  seo_title: string | null;
  seo_description: string | null;
  og_image_id: number | null;
}
export interface AuthorshipFields {
  review_note: string | null;
  created_by: number | null;
  updated_by: number | null;
}
