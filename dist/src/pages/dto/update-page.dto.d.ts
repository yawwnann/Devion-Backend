import { PageStatus } from '../enums/page-status.enum';
export declare class UpdatePageDto {
    title?: string;
    icon?: string;
    cover?: string;
    status?: PageStatus;
    publishedAt?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
}
