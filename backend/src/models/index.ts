import type { Model, ModelStatic } from 'sequelize';
import { sequelize } from '../config/database';
import { initIdentity, Role, Permission, User, Session, PasswordResetToken } from './identity';
import {
  initContent,
  MediaAsset,
  Page,
  Menu,
  MenuItem,
  HomepageSlide,
  Category,
  Article,
  ResearchTheme,
  ResearchProject,
  Publication,
  LmiReport,
  LmiIndicatorValue,
  StaffGroup,
  StaffProfile,
  Partner,
  CpdProgramme,
  CpdSession,
  CpdRegistration,
  Event,
  EventAttachment,
  Newsletter,
  Gallery,
  GalleryItem,
} from './content';
import { initSystem, ContactSubmission, NewsletterSubscriber, SiteSetting, Redirect, AuditLog } from './system';

initIdentity(sequelize);
initContent(sequelize);
initSystem(sequelize);

// ----------------------------------------------------------------- identity
Role.belongsToMany(Permission, { through: 'role_permissions', as: 'permissions', timestamps: false });
Permission.belongsToMany(Role, { through: 'role_permissions', as: 'roles', timestamps: false });
User.belongsToMany(Role, { through: 'user_roles', as: 'roles', timestamps: false });
Role.belongsToMany(User, { through: 'user_roles', as: 'users', timestamps: false });
Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
MediaAsset.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// ----------------------------------------------------------------- media references
// Every image/document reference is a nullable FK to media_assets with ON DELETE SET NULL.
const media = (model: ModelStatic<Model>, foreignKey: string, as: string) =>
  model.belongsTo(MediaAsset, { foreignKey, as, constraints: false });

media(Page, 'hero_image_id', 'heroImage');
media(Page, 'og_image_id', 'ogImage');
media(HomepageSlide, 'image_id', 'image');
media(Article, 'featured_image_id', 'featuredImage');
media(Article, 'attachment_id', 'attachment');
media(Article, 'og_image_id', 'ogImage');
media(ResearchTheme, 'image_id', 'image');
media(ResearchProject, 'image_id', 'image');
media(ResearchProject, 'og_image_id', 'ogImage');
media(Publication, 'cover_image_id', 'coverImage');
media(Publication, 'file_id', 'file');
media(Publication, 'og_image_id', 'ogImage');
media(LmiReport, 'file_id', 'file');
media(LmiReport, 'cover_image_id', 'coverImage');
media(StaffProfile, 'photo_id', 'photo');
media(Partner, 'logo_id', 'logo');
media(CpdProgramme, 'image_id', 'image');
media(CpdProgramme, 'og_image_id', 'ogImage');
media(Event, 'image_id', 'image');
media(Event, 'og_image_id', 'ogImage');
media(Newsletter, 'cover_image_id', 'coverImage');
media(Newsletter, 'file_id', 'file');
media(Gallery, 'cover_image_id', 'coverImage');

// ----------------------------------------------------------------- structure
Page.belongsTo(Page, { foreignKey: 'parent_id', as: 'parent' });
Page.hasMany(Page, { foreignKey: 'parent_id', as: 'children' });

Menu.hasMany(MenuItem, { foreignKey: 'menu_id', as: 'items' });
MenuItem.belongsTo(Menu, { foreignKey: 'menu_id', as: 'menu' });
MenuItem.belongsTo(MenuItem, { foreignKey: 'parent_id', as: 'parent' });
MenuItem.hasMany(MenuItem, { foreignKey: 'parent_id', as: 'children' });
MenuItem.belongsTo(Page, { foreignKey: 'page_id', as: 'page' });

Article.belongsToMany(Category, {
  through: 'article_categories',
  as: 'categories',
  foreignKey: 'article_id',
  otherKey: 'category_id',
  timestamps: false,
});
Category.belongsToMany(Article, {
  through: 'article_categories',
  as: 'articles',
  foreignKey: 'category_id',
  otherKey: 'article_id',
  timestamps: false,
});

ResearchTheme.hasMany(ResearchProject, { foreignKey: 'theme_id', as: 'projects' });
ResearchProject.belongsTo(ResearchTheme, { foreignKey: 'theme_id', as: 'theme' });
ResearchProject.hasMany(Publication, { foreignKey: 'research_project_id', as: 'publications' });
Publication.belongsTo(ResearchProject, { foreignKey: 'research_project_id', as: 'researchProject' });

LmiReport.hasMany(LmiIndicatorValue, { foreignKey: 'report_id', as: 'indicators' });
LmiIndicatorValue.belongsTo(LmiReport, { foreignKey: 'report_id', as: 'report' });

StaffGroup.hasMany(StaffProfile, { foreignKey: 'group_id', as: 'members' });
StaffProfile.belongsTo(StaffGroup, { foreignKey: 'group_id', as: 'group' });

CpdProgramme.hasMany(CpdSession, { foreignKey: 'programme_id', as: 'sessions' });
CpdSession.belongsTo(CpdProgramme, { foreignKey: 'programme_id', as: 'programme' });
CpdSession.hasMany(CpdRegistration, { foreignKey: 'session_id', as: 'registrations' });
CpdRegistration.belongsTo(CpdSession, { foreignKey: 'session_id', as: 'session' });

Event.belongsTo(Gallery, { foreignKey: 'gallery_id', as: 'gallery' });
Event.hasMany(EventAttachment, { foreignKey: 'event_id', as: 'attachments' });
EventAttachment.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
EventAttachment.belongsTo(MediaAsset, { foreignKey: 'media_id', as: 'media' });

Gallery.hasMany(GalleryItem, { foreignKey: 'gallery_id', as: 'items' });
GalleryItem.belongsTo(Gallery, { foreignKey: 'gallery_id', as: 'gallery' });
GalleryItem.belongsTo(MediaAsset, { foreignKey: 'media_id', as: 'media' });

ContactSubmission.belongsTo(User, { foreignKey: 'handled_by', as: 'handler' });

export {
  sequelize,
  Role,
  Permission,
  User,
  Session,
  PasswordResetToken,
  MediaAsset,
  Page,
  Menu,
  MenuItem,
  HomepageSlide,
  Category,
  Article,
  ResearchTheme,
  ResearchProject,
  Publication,
  LmiReport,
  LmiIndicatorValue,
  StaffGroup,
  StaffProfile,
  Partner,
  CpdProgramme,
  CpdSession,
  CpdRegistration,
  Event,
  EventAttachment,
  Newsletter,
  Gallery,
  GalleryItem,
  ContactSubmission,
  NewsletterSubscriber,
  SiteSetting,
  Redirect,
  AuditLog,
};
